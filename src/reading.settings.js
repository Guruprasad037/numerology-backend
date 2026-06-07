// ============================================================
//  reading.settings.js  v5
//
//  ENGINE SWITCHING — no git push needed anymore!
//
//  Priority order (highest → lowest):
//    1. runtime-config.json  ← set via /admin "Engine Config" tab
//    2. Environment variables (FREE_READING_ENGINE, PAID_READING_ENGINE)
//    3. Hardcoded defaults below ('hardcoded')
//
//  To switch engines: log into your admin panel → Engine Config tab
//  Changes take effect IMMEDIATELY — no restart, no git push.
// ============================================================

const FILE = 'reading.settings.js';

// ── Required to read runtime-config.json ─────────────────────
const fs   = require('fs');
const path = require('path');

// runtime-config.json sits in the project root (same folder as this file)
const _ENGINE_CONFIG_FILE = path.join(__dirname, 'runtime-config.json');

// Read the config file — returns {} if file doesn't exist yet
function _loadEngineConfig() {
  try {
    return JSON.parse(fs.readFileSync(_ENGINE_CONFIG_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// ── Load config once at startup (for module-level constants) ──
const _cfg = _loadEngineConfig();

// ── Engine constants (used as fallback, real value comes from resolveSettings) ──
const FREE_READING_ENGINE =
  _cfg.FREE_READING_ENGINE ||          // 1. runtime-config.json
  process.env.FREE_READING_ENGINE ||   // 2. environment variable
  'hardcoded';                         // 3. default

const PAID_READING_ENGINE =
  _cfg.PAID_READING_ENGINE ||          // 1. runtime-config.json
  process.env.PAID_READING_ENGINE ||   // 2. environment variable
  'hardcoded';                         // 3. default

console.log(`[${FILE}] FREE_READING_ENGINE="${FREE_READING_ENGINE}" PAID_READING_ENGINE="${PAID_READING_ENGINE}"`);

// ── Prompt versions — only used when engine = 'claude' ───────
const PROMPT_VERSIONS = {
  free_reading: 'v1.0',
  paid_reading: 'minimal_v1.0',
};

// ────────────────────────────────────────────────────────────
// COLOUR PALETTE
// Used by Claude prompts and the hardcoded HTML generator
// ────────────────────────────────────────────────────────────
const REPORT_COLORS = {
  primary_dark:   '#2c3e50',
  primary_blue:   '#3498db',
  accent_gold:    '#f39c12',
  text_dark:      '#2c3e50',
  text_light:     '#ecf0f1',
  table_header:   '#34495e',
  table_alt_row:  '#ecf0f1',
  table_border:   '#bdc3c7',
  insight_bg:     '#e8f4f8',
  insight_border: '#3498db',
};

// ────────────────────────────────────────────────────────────
// RESOLVER
// Called by dispatcher — returns engine + prompt version.
//
// IMPORTANT: re-reads runtime-config.json on EVERY call so
// that admin panel changes take effect immediately without
// restarting the server.
// ────────────────────────────────────────────────────────────
function resolveSettings(serviceType) {
  // Re-read the file every time so live changes are picked up instantly
  const live = _loadEngineConfig();

  const isFree = serviceType === 'free_reading';

  // Use live config first, fall back to startup value
  const engine = isFree
    ? (live.FREE_READING_ENGINE || FREE_READING_ENGINE)
    : (live.PAID_READING_ENGINE || PAID_READING_ENGINE);

  const promptVersion = isFree
    ? PROMPT_VERSIONS.free_reading
    : PROMPT_VERSIONS.paid_reading;

  console.log(`[${FILE}] resolveSettings("${serviceType}") → engine="${engine}" promptVersion="${promptVersion}"`);
  return { engine, promptVersion };
}

module.exports = {
  FREE_READING_ENGINE,
  PAID_READING_ENGINE,
  PROMPT_VERSIONS,
  REPORT_COLORS,
  resolveSettings,
};