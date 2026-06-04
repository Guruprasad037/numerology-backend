// src/reading.settings.js
const FILE = "src/reading.settings.js";

function log(step, message, data) {
  const timestamp = new Date().toISOString();
  const border = "═".repeat(60);
  console.log(`\n${border}`);
  console.log(`  🔧 [${FILE}]`);
  console.log(`  📍 STEP ${step}  |  ${message}`);
  console.log(`  🕐 ${timestamp}`);
  if (data) {
    console.log(`  📦 Data: ${JSON.stringify(data, null, 2)}`);
  }
  console.log(`${border}\n`);
}

function logResolved(result) {
  const border = "★".repeat(60);
  console.log(`\n${border}`);
  console.log(`  ✅ [${FILE}] RESOLVED SETTINGS`);
  console.log(`  🔑 Service      : ${result.serviceName}`);
  console.log(`  ⚙️  Engine       : ${result.engine}`);
  console.log(`  📋 PromptVersion: ${result.promptVersion}`);
  console.log(`${border}\n`);
}

log(1, "Module loaded");

// ---------------- CONFIG ----------------
const config = {
  defaultEngine: "hardcoded",
  fallbackEngine: "hardcoded",
  engineOverrides: {
    // free_reading: 'claude',
  },
  promptVersions: {
    free_reading: "v1.0",
    career:       "v1.0",
    love:         "v1.0",
    health:       "v1.0",
    blueprint:    "v1.0",
  },
};
log(2, "Base config initialized", config);

// ---------------- RESOLVER (THIS IS THE IMPORTANT PART) ----------------
function resolveSettings(serviceName) {
  log(3, "Resolving settings for service", { serviceName });

  const engine =
    config.engineOverrides[serviceName] ||
    config.defaultEngine;

  const promptVersion =
    config.promptVersions[serviceName] || "v1.0";

  const result = {
    serviceName,
    engine,
    promptVersion,
  };

  logResolved(result);
  return result;
}

log(5, "Settings module ready — resolveSettings() is available");

module.exports = {
  ...config,
  resolveSettings,
};