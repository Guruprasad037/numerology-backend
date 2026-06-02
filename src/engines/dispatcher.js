// ============================================================
//  src/engines/dispatcher.js
//  Reads reading.settings.js and routes to the right engine.
//  Automatically falls back if the primary engine throws.
// ============================================================
const settings   = require('../reading.settings');
const hardcoded  = require('./hardcoded');

// Lazy-load AI engines only if actually configured —
// avoids crashing on startup if SDK packages aren't installed yet.
function loadEngine(name) {
  switch (name) {
    case 'claude':     return require('./claude');
    case 'openai':     return require('./openai');
    case 'hardcoded':  return hardcoded;
    default:
      throw new Error(`Unknown engine: "${name}". Must be claude | openai | hardcoded.`);
  }
}

async function dispatch(service, profile) {
  const engineName = settings.engineOverrides[service] || settings.defaultEngine;
  const version    = settings.promptVersions[service];

  // hardcoded engine does not use prompt files — it has its own lookup tables
  if (engineName === 'hardcoded') {
    return hardcoded.run(service, profile);
  }

  // For AI engines, load the versioned prompt file
  let buildPrompt;
  try {
    buildPrompt = require(`../prompts/${service}_${version}`);
  } catch (err) {
    console.warn(`[dispatcher] Prompt file not found: ${service}_${version}.js — falling back`);
    return hardcoded.run(service, profile);
  }

  const prompt = buildPrompt(profile);

  try {
    const engine = loadEngine(engineName);
    return await engine.run(prompt);
  } catch (err) {
    console.warn(`[dispatcher] ${engineName} failed — falling back to hardcoded. ${err.message}`);
    return hardcoded.run(service, profile);
  }
}

module.exports = { dispatch };