// ============================================================
//  src/engines/dispatcher.js
//  v2 — tags result with _engine_config and _engine_used
//
//  CHANGE from v1:
//    - After running an engine (or falling back), attaches two
//      metadata fields to the result object:
//        result._engine_config = what reading.settings.js requested
//        result._engine_used   = what actually ran and produced content
//    - free-reading.js reads these tags and passes both to saveReading()
//    - This fixes the bug where fallback readings were labelled "claude"
// ============================================================

const path    = require('path');
const settings = require('../reading.settings');

const FILE = 'dispatcher';

function log(msg, data) {
  if (data !== undefined) {
    console.log(`[${FILE}] ${msg}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  } else {
    console.log(`[${FILE}] ${msg}`);
  }
}

// Cache loaded engines
const engineCache = {};

function loadEngine(name) {
  log(`loadEngine called with name: "${name}"`);
  if (engineCache[name]) return engineCache[name];
  try {
    const engine = require(path.join(__dirname, `${name}.js`));
    engineCache[name] = engine;
    log(`engine "${name}" loaded and cached`);
    return engine;
  } catch (err) {
    log(`failed to load engine "${name}": ${err.message}`);
    throw err;
  }
}

function loadPrompt(service, version) {
  const promptFile = `${service}_${version}.js`;
  log(`loading prompt file: ${promptFile}`);
  try {
    const buildPrompt = require(path.join(__dirname, '../prompts', promptFile));
    log(`prompt file loaded successfully: ${promptFile}`);
    return buildPrompt;
  } catch (err) {
    log(`failed to load prompt file "${promptFile}": ${err.message}`);
    throw err;
  }
}

// ── Tag helper ───────────────────────────────────────────────
// Attaches _engine_config and _engine_used to the result.
// These are internal metadata fields — prefixed with _ so they
// are clearly not numerology data. They are read by free-reading.js
// and passed to saveReading() for accurate DB recording.
function tagResult(result, engineConfig, engineUsed) {
  if (result && typeof result === 'object') {
    result._engine_config = engineConfig;
    result._engine_used   = engineUsed;
  }
  return result;
}

// ── Main dispatch ────────────────────────────────────────────
async function dispatch(service, profile) {
  log(`dispatch called — service: "${service}", profile: `, profile);

  const { engine: engineConfig, promptVersion } = settings.resolveSettings(service);
  log(`resolved engine: "${engineConfig}", prompt version: "${promptVersion}"`);

  // ── Try the configured engine ────────────────────────────
  if (engineConfig !== 'hardcoded') {
    try {
      log(`loading engine: "${engineConfig}"`);
      const engine = loadEngine(engineConfig);

      // Build prompt for AI engines
      const buildPrompt = loadPrompt(service, promptVersion);
      const prompt = buildPrompt(profile);
      log(`prompt built for service: "${service}": ${prompt.slice(0, 300)}`);

      log(`running engine: "${engineConfig}"`);
      const result = await engine.run(prompt);

      // ✓ Success — tag with actual engine used
      log(`engine "${engineConfig}" succeeded`);
      return tagResult(result, engineConfig, engineConfig);

    } catch (err) {
      // ✗ Failed — log and fall through to fallback
      log(
        `${engineConfig} failed — falling back to hardcoded. ${err.message}`
      );
    }
  }

  // ── Fallback: hardcoded engine ───────────────────────────
  try {
    log(`loading engine: "hardcoded"`);
    const hardcoded = loadEngine('hardcoded');

    log(`running engine: "hardcoded"`);
    const result = hardcoded.run(service, profile);

    // Tag: config = what was requested, used = hardcoded (fallback)
    log(
      engineConfig === 'hardcoded'
        ? `hardcoded engine ran as configured`
        : `hardcoded fallback succeeded — engine_config="${engineConfig}", engine_used="hardcoded"`
    );
    return tagResult(result, engineConfig, 'hardcoded');

  } catch (fallbackErr) {
    log(`hardcoded fallback also failed: ${fallbackErr.message}`);
    throw fallbackErr;
  }
}

module.exports = { dispatch };