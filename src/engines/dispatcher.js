// ============================================================
//  src/engines/dispatcher.js  v5
//
//  CHANGES from v4:
//    - engine.run() now receives the full prompt object as
//      returned by buildPrompt(). Previously it always received
//      a plain string. Now it may receive:
//        (a) a plain string  — legacy prompts (free_reading,
//            paid_reading_minimal_v1.0, hardcoded) unchanged
//        (b) { system, user } — new shape from paid_reading_v2.0+
//
//    - claude.js v2 handles both shapes transparently, so no
//      special-casing is needed here. dispatcher just passes
//      whatever buildPrompt() returns straight through.
//
//    - Everything else (resolveSettings, loadEngine, tagResult,
//      fallback logic) is identical to v4.
// ============================================================

const path     = require('path');
const settings = require('../reading.settings');

const FILE = 'dispatcher';

function log(msg, data) {
  if (data !== undefined) {
    console.log(
      `[${FILE}] ${msg}`,
      typeof data === 'object' ? JSON.stringify(data, null, 2) : data
    );
  } else {
    console.log(`[${FILE}] ${msg}`);
  }
}

// ── Engine cache ─────────────────────────────────────────────
// Engines are required once and cached for the lifetime of the
// process. Avoids repeated require() calls on every reading.
const engineCache = {};

function loadEngine(name) {
  log(`loadEngine: "${name}"`);
  if (engineCache[name]) return engineCache[name];
  const engine = require(path.join(__dirname, `${name}.js`));
  engineCache[name] = engine;
  return engine;
}

// ── Prompt loader ────────────────────────────────────────────
// Loads the prompt builder function from src/prompts/.
// File name convention: {service}_{version}.js
// e.g. paid_reading_v2.0.js, free_reading_v1.0.js
function loadPrompt(service, version) {
  const promptFile = `${service}_${version}.js`;
  log(`loadPrompt: "${promptFile}"`);
  return require(path.join(__dirname, '../prompts', promptFile));
}

// ── Tag helper ───────────────────────────────────────────────
// Attaches metadata so callers know what actually ran.
//   _engine_config = what was configured in settings
//   _engine_used   = what actually ran (may differ if fallback fired)
//
// IMPORTANT: tagResult must handle three result shapes:
//   1. plain string  (hardcoded engine returns HTML string for paid)
//   2. object        (AI engines return parsed JSON)
//   3. anything else (future-proofing)
function tagResult(result, engineConfig, engineUsed) {
  // Shape 1: plain string from hardcoded engine
  // Wrap it so callers always get a consistent object shape.
  if (typeof result === 'string') {
    return {
      _html:          result,
      _engine_config: engineConfig,
      _engine_used:   engineUsed,
    };
  }

  // Shape 2: object from AI engine (parsed JSON)
  if (result && typeof result === 'object') {
    result._engine_config = engineConfig;
    result._engine_used   = engineUsed;
    return result;
  }

  // Shape 3: unexpected — return as-is with tags
  return {
    _raw:           result,
    _engine_config: engineConfig,
    _engine_used:   engineUsed,
  };
}

// ── Main dispatch ────────────────────────────────────────────
async function dispatch(serviceType, profile) {
  log(`dispatch — serviceType: "${serviceType}"`);

  // resolveSettings() is async (reads from the DB settings table).
  // Returns { engine, promptVersion } for the given serviceType.
  const { engine: engineConfig, promptVersion } = await settings.resolveSettings(serviceType);

  const isFree = serviceType === 'free_reading';

  log(`resolved: engine="${engineConfig}" promptVersion="${promptVersion}" isFree=${isFree}`);

  // ── Hardcoded engine ─────────────────────────────────────
  // Runs a pre-written template — no AI call, no prompt needed.
  if (engineConfig === 'hardcoded') {
    try {
      const hardcoded = loadEngine('hardcoded');
      const result = isFree
        ? hardcoded.runFreeReading(profile)
        : hardcoded.runPaidReading(profile);
      log(`hardcoded engine ran as configured (${isFree ? 'free' : 'paid'})`);
      return tagResult(result, 'hardcoded', 'hardcoded');
    } catch (err) {
      log(`hardcoded engine failed: ${err.message}`);
      throw err;
    }
  }

  // ── AI engine (claude / openai) ──────────────────────────
  try {
    log(`loading AI engine: "${engineConfig}"`);
    const engine = loadEngine(engineConfig);

    // For paid readings the prompt file is keyed as 'paid_reading',
    // not the product slug — keeps prompt files generic.
    const promptKey   = isFree ? serviceType : 'paid_reading';
    const buildPrompt = loadPrompt(promptKey, promptVersion);

    // buildPrompt() returns either:
    //   - a plain string (legacy / free reading / minimal prompts)
    //   - { system, user } object (paid_reading v2.0+)
    //
    // We pass whatever it returns directly to engine.run().
    // claude.js v2 handles both shapes. openai.js should be
    // updated similarly if/when it needs to support v2.0 prompts.
    const promptResult = buildPrompt(profile);

    log(`prompt built for "${promptKey}"`, {
      shape:  typeof promptResult === 'object' && promptResult.user ? 'system+user' : 'string',
      length: typeof promptResult === 'string'
        ? promptResult.length
        : (promptResult.user?.length ?? 0) + (promptResult.system?.length ?? 0),
    });

    const result = await engine.run(promptResult);
    log(`AI engine "${engineConfig}" succeeded`);
    return tagResult(result, engineConfig, engineConfig);

  } catch (err) {
    // AI failed — fall back to hardcoded template so the customer
    // always receives something rather than a blank error page.
    log(`AI engine "${engineConfig}" failed — falling back to hardcoded. Error: ${err.message}`);

    try {
      const hardcoded = loadEngine('hardcoded');
      const result = isFree
        ? hardcoded.runFreeReading(profile)
        : hardcoded.runPaidReading(profile);
      log(`hardcoded fallback succeeded — engine_config="${engineConfig}" engine_used="hardcoded"`);
      return tagResult(result, engineConfig, 'hardcoded');
    } catch (fallbackErr) {
      log(`hardcoded fallback also failed: ${fallbackErr.message}`);
      throw fallbackErr;
    }
  }
}

module.exports = { dispatch };