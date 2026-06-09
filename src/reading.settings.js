// ============================================================
//  reading.settings.js  v6
//
//  CHANGE (v5 → v6):
//    Engine config now stored in the database (settings table)
//    instead of runtime-config.json.
//
//  WHY:
//    Render's filesystem is ephemeral — any file written to disk
//    is wiped on every deploy or restart. This meant the engine
//    setting set via the admin UI would silently revert to the
//    env var default every time the server restarted.
//
//    The settings table persists forever, just like orders and
//    readings. Engine changes now survive restarts and deploys.
//
//  HOW resolveSettings() works now:
//    1. Queries settings table for FREE_READING_ENGINE /
//       PAID_READING_ENGINE (whichever is relevant)
//    2. Falls back to environment variable if row is missing
//    3. Falls back to 'hardcoded' if env var also missing
//
//  IMPORTANT — resolveSettings() is now ASYNC.
//    Callers must await it:
//      const { engine, promptVersion } = await settings.resolveSettings(serviceType);
//    This only affects dispatcher.js (already updated).
//
//  The module-level FREE_READING_ENGINE / PAID_READING_ENGINE
//  constants are kept for backwards compatibility but they now
//  only reflect the env var / hardcoded default at startup time.
//  Always use resolveSettings() for the live value.
//
//  runtime-config.json is no longer read or written anywhere.
//  fs and path imports have been removed.
// ============================================================

const FILE = 'reading.settings.js';

// ── DB helper — same pool used everywhere else ────────────────
// We import db lazily inside resolveSettings() to avoid any
// circular-require issues during module initialisation.
// ─────────────────────────────────────────────────────────────

// ── Module-level constants (startup defaults only) ────────────
// These reflect env vars / hardcoded defaults at boot time.
// They are NOT updated when admin changes the engine via the UI.
// Use resolveSettings() for the live, DB-backed value.
const FREE_READING_ENGINE =
  process.env.FREE_READING_ENGINE || 'hardcoded';

const PAID_READING_ENGINE =
  process.env.PAID_READING_ENGINE || 'hardcoded';

console.log(`[${FILE}] startup defaults — FREE_READING_ENGINE="${FREE_READING_ENGINE}" PAID_READING_ENGINE="${PAID_READING_ENGINE}"`);
console.log(`[${FILE}] live values will be read from DB on every resolveSettings() call`);

// ── Prompt versions — only used when engine = 'claude' ───────
const PROMPT_VERSIONS = {
  free_reading: 'v1.0',
paid_reading: 'paid_reading_v3.0.js',
//  paid_reading: 'paid_reading_test_v2.0.js',
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
// RESOLVER  (now async)
//
// Called by dispatcher on every reading request.
// Reads the live engine value from the settings table so that
// admin UI changes take effect immediately — no restart needed.
//
// Priority order:
//   1. settings table in DB   ← set via /admin Engine Config tab
//   2. Environment variable   ← FREE_READING_ENGINE / PAID_READING_ENGINE
//   3. 'hardcoded'            ← safe default, zero API cost
// ────────────────────────────────────────────────────────────
async function resolveSettings(serviceType) {
  const isFree  = serviceType === 'free_reading';
  const dbKey   = isFree ? 'FREE_READING_ENGINE' : 'PAID_READING_ENGINE';
  const envFallback = isFree ? FREE_READING_ENGINE : PAID_READING_ENGINE;
  const promptVersion = isFree
    ? PROMPT_VERSIONS.free_reading
    : PROMPT_VERSIONS.paid_reading;

  let engine = envFallback; // will be overridden by DB value if found

  try {
    // Lazy-require db to avoid circular dependency during module init.
    // On first call this loads the module; on subsequent calls Node
    // returns the cached module — no performance cost.
    
    const { dbGet } = require('./config/db');

    const row = await dbGet(
      `SELECT value FROM settings WHERE key = $1`,
      [dbKey]
    );

    if (row && row.value) {
      engine = row.value;
      console.log(`[${FILE}] resolveSettings("${serviceType}") → engine="${engine}" (from DB)`);
    } else {
      // Row missing — this shouldn't happen after migration, but
      // falling back gracefully is better than crashing.
      console.warn(`[${FILE}] resolveSettings: key "${dbKey}" not found in settings table — using fallback "${engine}"`);
    }
  } catch (err) {
    // DB unavailable — use env var / hardcoded default.
    // This keeps the site running even if DB is temporarily down.
    console.error(`[${FILE}] resolveSettings: DB read failed — using fallback "${engine}". Error: ${err.message}`);
  }

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