// ============================================================
//  src/reading.settings.js
//  v3 — Added PAID_REPORT_DELIVERY_MODE
//
//  CHANGE from v2:
//    - Added PAID_REPORT_DELIVERY_MODE (1=manual, 2=auto-claude)
//    - Added paidReadingEngine and promptVersion for paid flows
//    - Added color palette ref for Claude to use in HTML
// ============================================================

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

// ────────────────────────────────────────────────────────────
// CONFIGURATION
// ────────────────────────────────────────────────────────────
const config = {
  // ── FREE READING ──────────────────────────────────────────
  defaultEngine: "hardcoded",
  fallbackEngine: "hardcoded",
  engineOverrides: {
    // free_reading: 'claude',  // Uncomment to use Claude for free readings
  },
  promptVersions: {
    free_reading: "v1.0",
    career: "v1.0",
    love: "v1.0",
    health: "v1.0",
    blueprint: "v1.0",
  },

  // ── PAID READING ──────────────────────────────────────────
  // MODE 1: Manual — no report generation, admin creates manually
  // MODE 2: Auto — backend calls Claude to generate HTML → DOCX
  PAID_REPORT_DELIVERY_MODE: 2,
  paidReadingEngine: "claude",
  paidReadingPromptVersion: "minimal_v1.0",

  // ── COLOR PALETTE FOR REPORTS ─────────────────────────────
  // Claude uses these colors when generating HTML
  reportColors: {
    primary_dark: "#2c3e50",      // Main heading background
    primary_blue: "#3498db",      // Section headings
    accent_gold: "#f39c12",       // Number highlights
    text_dark: "#2c3e50",         // Body text
    text_light: "#ecf0f1",        // Light backgrounds
    table_header: "#34495e",      // Table header background
    table_alt_row: "#ecf0f1",     // Alternating table rows
    table_border: "#bdc3c7",      // Table borders
    insight_bg: "#e8f4f8",        // Insight box background
    insight_border: "#3498db",    // Insight box left border
  },
};

log(2, "Base config initialized", {
  PAID_REPORT_DELIVERY_MODE: config.PAID_REPORT_DELIVERY_MODE,
  paidReadingEngine: config.paidReadingEngine,
  paidReadingPromptVersion: config.paidReadingPromptVersion,
});

// ────────────────────────────────────────────────────────────
// RESOLVER
// ────────────────────────────────────────────────────────────
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