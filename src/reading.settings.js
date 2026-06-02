// ============================================================
//  src/reading.settings.js
//  Single control panel for all reading behaviour.
//  Change engine or prompt version here — nowhere else.
// ============================================================

module.exports = {

  // 'claude' | 'openai' | 'hardcoded'
  defaultEngine:  'hardcoded',
  fallbackEngine: 'hardcoded',

  // Per-service engine overrides (uncomment to override one service)
  engineOverrides: {
    // free_reading: 'claude',
  },

  // Active prompt version per service
  // Must match a filename in src/prompts/ — e.g. 'v1.0' → free_reading_v1.0.js
  promptVersions: {
    free_reading: 'v1.0',
    career:       'v1.0',
    love:         'v1.0',
    health:       'v1.0',
    blueprint:    'v1.0',
  },

};