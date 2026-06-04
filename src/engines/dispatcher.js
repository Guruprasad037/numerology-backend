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
  console.log(`[dispatcher] loadEngine called with name: "${name}"`);
  switch (name) {
    case 'claude':     return require('./claude');
    case 'openai':     return require('./openai');
    case 'hardcoded':  return hardcoded;
    default:
      throw new Error(`Unknown engine: "${name}". Must be claude | openai | hardcoded.`);
  }
}
async function dispatch(service, profile) {
  console.log(`[dispatcher] dispatch called — service: "${service}", profile:`, profile);
  const engineName = settings.engineOverrides[service] || settings.defaultEngine;
  const version    = settings.promptVersions[service];
  console.log(`[dispatcher] resolved engine: "${engineName}", prompt version: "${version}"`);
  // hardcoded engine does not use prompt files — it has its own lookup tables
  if (engineName === 'hardcoded') {
    console.log(`[dispatcher] routing to hardcoded engine for service: "${service}"`);
    return hardcoded.run(service, profile);
  }
  // For AI engines, load the versioned prompt file
  let buildPrompt;
  try {
    console.log(`[dispatcher] loading prompt file: ${service}_${version}.js`);
    buildPrompt = require(`../prompts/${service}_${version}`);
    console.log(`[dispatcher] prompt file loaded successfully: ${service}_${version}.js`);
  } catch (err) {
    console.warn(`[dispatcher] Prompt file not found: ${service}_${version}.js — falling back`);
    return hardcoded.run(service, profile);
  }
  const prompt = buildPrompt(profile);
  console.log(`[dispatcher] prompt built for service: "${service}":`, prompt);
  try {
    console.log(`[dispatcher] loading engine: "${engineName}"`);
    const engine = loadEngine(engineName);
    console.log(`[dispatcher] running engine: "${engineName}"`);
    const result = await engine.run(prompt);
    console.log(`[dispatcher] engine "${engineName}" returned result:`, result);
    return result;
  } catch (err) {
    console.warn(`[dispatcher] ${engineName} failed — falling back to hardcoded. ${err.message}`);
    return hardcoded.run(service, profile);
  }
}
module.exports = { dispatch };