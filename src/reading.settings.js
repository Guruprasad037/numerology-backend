// src/reading.settings.js

const FILE = "src/reading.settings.js";

function log(step, message, data) {
  console.log(
    `[${FILE}] STEP ${step} ${message}`,
    data ? JSON.stringify(data) : ""
  );
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
    career: "v1.0",
    love: "v1.0",
    health: "v1.0",
    blueprint: "v1.0",
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

  log(4, "Resolved settings", result);

  return result;
}

log(5, "Settings module ready");

module.exports = {
  ...config,
  resolveSettings,
};