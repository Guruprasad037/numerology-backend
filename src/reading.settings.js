// ============================================================
//  src/reading.settings.js  v4
//
//  Two knobs only:
//    FREE_READING_ENGINE  — engine for free readings
//    PAID_READING_ENGINE  — engine for paid readings
//
//  Both accept: "claude" | "hardcoded"
//
//  Any combination is valid:
//    free_reading=hardcoded + paid_reading=hardcoded  → zero API cost
//    free_reading=hardcoded + paid_reading=claude     → API cost only on paid
//    free_reading=claude    + paid_reading=claude     → full AI on both
// ============================================================

const FILE = 'src/reading.settings.js';

console.log(`[${FILE}] loaded`);

// ────────────────────────────────────────────────────────────
// ENGINE CONFIGURATION
// ────────────────────────────────────────────────────────────
const FREE_READING_ENGINE = 'hardcoded';  // 'claude' or 'hardcoded'
const PAID_READING_ENGINE = 'hardcoded';  // 'claude' or 'hardcoded'

// Prompt versions — only used when engine = 'claude'
const PROMPT_VERSIONS = {
  free_reading: 'v1.0',
  paid_reading: 'minimal_v1.0',
};

console.log(`[${FILE}] FREE_READING_ENGINE="${FREE_READING_ENGINE}" PAID_READING_ENGINE="${PAID_READING_ENGINE}"`);

// ────────────────────────────────────────────────────────────
// COLOUR PALETTE
// Used by Claude prompts and the hardcoded HTML generator
// ────────────────────────────────────────────────────────────
const REPORT_COLORS = {
  primary_dark:  '#2c3e50',
  primary_blue:  '#3498db',
  accent_gold:   '#f39c12',
  text_dark:     '#2c3e50',
  text_light:    '#ecf0f1',
  table_header:  '#34495e',
  table_alt_row: '#ecf0f1',
  table_border:  '#bdc3c7',
  insight_bg:    '#e8f4f8',
  insight_border:'#3498db',
};

// ────────────────────────────────────────────────────────────
// RESOLVER
// Called by dispatcher — returns engine + prompt version
// for the given service type ('free_reading' or paid slug)
// ────────────────────────────────────────────────────────────
function resolveSettings(serviceType) {
  // serviceType = 'free_reading' → use FREE_READING_ENGINE
  // anything else (paid slugs)  → use PAID_READING_ENGINE
  const isFree  = serviceType === 'free_reading';
  const engine  = isFree ? FREE_READING_ENGINE : PAID_READING_ENGINE;
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