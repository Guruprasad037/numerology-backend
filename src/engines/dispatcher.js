// ============================================================
//  src/engines/dispatcher.js  v4
//
//  CHANGE (v3 → v4):
//    settings.resolveSettings() is now async (it reads from the
//    database instead of a file). Added `await` to the call.
//
//    That is the ONLY change — one word added.
//    All engine logic, fallback behaviour, and tagResult()
//    are identical to v3.
// ============================================================

const path     = require('path');
const settings = require('../../reading.settings');

const FILE = 'dispatcher';

function log(msg, data) {
  if (data !== undefined) {
    console.log(`[${FILE}] ${msg}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  } else {
    console.log(`[${FILE}] ${msg}`);
  }
}

// ── Engine cache ─────────────────────────────────────────────
const engineCache = {};

function loadEngine(name) {
  log(`loadEngine: "${name}"`);
  if (engineCache[name]) return engineCache[name];
  const engine = require(path.join(__dirname, `${name}.js`));
  engineCache[name] = engine;
  return engine;
}

// ── Prompt loader ────────────────────────────────────────────
function loadPrompt(service, version) {
  const promptFile = `${service}_${version}.js`;
  log(`loadPrompt: "${promptFile}"`);
  return require(path.join(__dirname, '../prompts', promptFile));
}

// ── Tag helper ───────────────────────────────────────────────
// Attaches metadata so callers know what actually ran.
// _engine_config = what was configured
// _engine_used   = what actually ran (may differ if fallback fired)
function tagResult(result, engineConfig, engineUsed) {
  if (result && typeof result === 'object') {
    result._engine_config = engineConfig;
    result._engine_used   = engineUsed;
  }
  // If result is a plain string (HTML from hardcoded paid reading),
  // wrap it so tags can still be attached and callers get a consistent object.
  if (typeof result === 'string') {
    return {
      _html:          result,       // paid-reading.js reads this
      _engine_config: engineConfig,
      _engine_used:   engineUsed,
    };
  }
  return result;
}

// ── Main dispatch ────────────────────────────────────────────
async function dispatch(serviceType, profile) {
  log(`dispatch — serviceType: "${serviceType}"`);

  // ── CHANGE v4: resolveSettings() is now async — must await ──
  // Previously it read runtime-config.json synchronously.
  // Now it queries the settings table in the DB.
  // Everything after this line is identical to v3.
  const { engine: engineConfig, promptVersion } = await settings.resolveSettings(serviceType);

  const isFree = serviceType === 'free_reading';

  log(`resolved: engine="${engineConfig}" promptVersion="${promptVersion}" isFree=${isFree}`);

  // ── Hardcoded engine ─────────────────────────────────────
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

    // For paid readings, the prompt file is keyed as 'paid_reading'
    const promptKey = isFree ? serviceType : 'paid_reading';
    const buildPrompt = loadPrompt(promptKey, promptVersion);
    const prompt = buildPrompt(profile);
    log(`prompt built for "${promptKey}", length=${prompt.length}`);

    const result = await engine.run(prompt);
    log(`AI engine "${engineConfig}" succeeded`);
    return tagResult(result, engineConfig, engineConfig);

  } catch (err) {
    // AI failed — fall back to hardcoded
    log(`AI engine "${engineConfig}" failed — falling back to hardcoded. ${err.message}`);

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