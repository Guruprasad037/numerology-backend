// ============================================================
//  src/services/paid-reading.js
//  v1 — Paid reading delivery orchestrator
//
//  MODE 1: Manual — skip generation, insert pending
//  MODE 2: Auto   — generate HTML via Claude → convert to DOCX
//
//  Input:  Order, Subject, Product slug
//  Output: Reading record inserted, DOCX generated if MODE 2
// ============================================================

const settings = require("../reading.settings");
const dispatcher = require("../engines/dispatcher");
const { htmlToDocx, generateFileName } = require("../engines/docx-generator");
const { buildNumerologyProfile } = require("../utils/calculator");
const { dbRun, dbGet } = require("../config/db");

const FILE = "src/services/paid-reading.js";

function log(step, message, data = null) {
  console.log(
    `[${FILE}] STEP ${step} ${message}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
}

function error(step, message, data = null) {
  console.error(
    `[${FILE}] ❌ STEP ${step} ${message}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
}

// ────────────────────────────────────────────────────────────
// Main handler for paid readings
// ────────────────────────────────────────────────────────────
async function handlePaidReading(order, profile, profileId) {
  log(1, "handlePaidReading() called", {
    orderId: order.id,
    subjectName: order.subject_name,
    productSlug: order.product_slug,
    mode: settings.PAID_REPORT_DELIVERY_MODE,
  });

  const mode = settings.PAID_REPORT_DELIVERY_MODE;

  if (mode === 1) {
    log(2, "MODE 1 detected: Manual delivery");
    return handleModeManual(order, profile, profileId);
  } else if (mode === 2) {
    log(2, "MODE 2 detected: Auto-generate with Claude");
    return handleModeAuto(order, profile, profileId);
  } else {
    throw new Error(`Unknown PAID_REPORT_DELIVERY_MODE: ${mode}`);
  }
}

// ────────────────────────────────────────────────────────────
// MODE 1: Manual Delivery
// ────────────────────────────────────────────────────────────
async function handleModeManual(order, profile, profileId) {
  log(3, "MODE 1: Inserting reading as PENDING (manual delivery)");

  try {
    const readingResult = await dbRun(
      `INSERT INTO readings
         (user_id, profile_id, order_id,
          product_slug, status,
          report_content, engine_config, engine_used,
          language, delivered_to, generated_at)
       VALUES ($1,$2,$3,$4,'pending',$5,$6,$7,'en',$8,NOW())
       RETURNING id`,
      [
        order.user_id,
        profileId,
        order.id,
        order.product_slug,
        JSON.stringify({
          type: "manual",
          mode: 1,
          note: "Manual delivery — admin will generate report",
          profile_summary: {
            psychic: profile.psychic_number,
            destiny: profile.destiny_number,
            name: profile.name_number,
            life_path: profile.life_path_number,
          },
        }),
        "manual",
        "manual",
        order.customer_email,
      ]
    );

    const readingId = readingResult.rows[0].id;

    log(4, "MODE 1 complete", {
      readingId,
      status: "pending",
      action: "Admin will manually create report",
    });

    console.log(
      `[${FILE}] >>> MODE 1 SUCCESS | readingId=${readingId} | status=pending | waiting for manual creation`
    );

    return {
      success: true,
      mode: 1,
      readingId,
      status: "pending",
      message: "Awaiting manual report generation",
    };
  } catch (err) {
    error(99, "MODE 1 failed", { message: err.message });
    throw err;
  }
}

// ────────────────────────────────────────────────────────────
// MODE 2: Auto-Generate with Claude
// ────────────────────────────────────────────────────────────
async function handleModeAuto(order, profile, profileId) {
  log(5, "MODE 2: Auto-generating report with Claude");

  let htmlReport = null;
  let docxResult = null;
  let engineUsed = "unknown";
  let engineConfig = settings.paidReadingEngine;

  try {
    // ── Step 1: Generate HTML via dispatcher ─────────────────
    log(6, "Dispatching to Claude to generate HTML");
    console.log(`[${FILE}] >>> STEP 6 START: dispatcher.dispatch() for product="${order.product_slug}"`);

    try {
      const dispatchResult = await dispatcher.dispatch(
        order.product_slug,
        profile
      );

      // Read engine metadata from dispatcher
      engineConfig = dispatchResult._engine_config || settings.paidReadingEngine;
      engineUsed = dispatchResult._engine_used || "unknown";

      // The result should be HTML text (from Claude)
      htmlReport = dispatchResult.cards?.[0]?.body || dispatchResult.birth?.text || null;

      log(7, "Dispatcher returned result", {
        htmlLength: htmlReport ? htmlReport.length : 0,
        engineConfig,
        engineUsed,
        htmlPreview: htmlReport ? htmlReport.slice(0, 200) : null,
      });

      console.log(
        `[${FILE}] >>> STEP 6 DONE: HTML received | length=${htmlReport ? htmlReport.length : 0}`
      );
    } catch (dispatchErr) {
      error(6.1, "Dispatcher failed — continuing without HTML", {
        message: dispatchErr.message,
      });
      htmlReport = null;
    }

    // ── Step 2: Convert HTML → DOCX ──────────────────────────
    if (!htmlReport) {
      log(8, "No HTML report from Claude — creating fallback");
      htmlReport = buildFallbackHTML(profile);
    }

    log(9, "Converting HTML → DOCX");
    console.log(`[${FILE}] >>> STEP 9 START: htmlToDocx() conversion`);

    const fileName = generateFileName(order.subject_name || order.customer_name);
    docxResult = await htmlToDocx(htmlReport, fileName);

    log(10, "DOCX generated successfully", {
      fileName: docxResult.fileName,
      size: docxResult.size,
      base64Length: docxResult.base64.length,
    });

    console.log(`[${FILE}] >>> STEP 9 DONE: DOCX ready | size=${docxResult.size} bytes`);

    // ── Step 3: Save to database ─────────────────────────────
    log(11, "Saving reading with DOCX to database");
    console.log(
      `[${FILE}] >>> STEP 11 START: dbRun() — inserting reading with DOCX`
    );

    const reportContent = {
      type: "docx",
      mode: 2,
      html_source: htmlReport.slice(0, 5000), // Store first 5000 chars of HTML
      docx_base64: docxResult.base64,
      docx_filename: docxResult.fileName,
      docx_size: docxResult.size,
      generated_at: new Date().toISOString(),
      engine_config: engineConfig,
      engine_used: engineUsed,
    };

    const readingResult = await dbRun(
      `INSERT INTO readings
         (user_id, profile_id, order_id,
          product_slug, status,
          report_content, engine_config, engine_used,
          language, delivered_to, generated_at)
       VALUES ($1,$2,$3,$4,'generated',$5,$6,$7,'en',$8,NOW())
       RETURNING id`,
      [
        order.user_id,
        profileId,
        order.id,
        order.product_slug,
        JSON.stringify(reportContent),
        engineConfig,
        engineUsed,
        order.customer_email,
      ]
    );

    const readingId = readingResult.rows[0].id;

    log(12, "MODE 2 complete", {
      readingId,
      status: "generated",
      docxFilename: docxResult.fileName,
      docxSize: docxResult.size,
      action: "Admin can now download and review",
    });

    console.log(
      `[${FILE}] >>> STEP 11 DONE: reading inserted with DOCX | readingId=${readingId}`
    );
    console.log(
      `[${FILE}] >>> MODE 2 SUCCESS | readingId=${readingId} | status=generated | docx_ready_for_download`
    );

    return {
      success: true,
      mode: 2,
      readingId,
      status: "generated",
      docxFileName: docxResult.fileName,
      docxSize: docxResult.size,
      message: "Report generated and ready for review",
    };
  } catch (err) {
    error(99, "MODE 2 failed", { message: err.message, stack: err.stack });
    throw err;
  }
}

// ────────────────────────────────────────────────────────────
// Fallback HTML if Claude fails
// ────────────────────────────────────────────────────────────
function buildFallbackHTML(profile) {
  log("build-fallback", "Creating fallback HTML");

  const colors = {
    primary_dark: "#2c3e50",
    primary_blue: "#3498db",
    accent_gold: "#f39c12",
    table_header: "#34495e",
    table_alt_row: "#ecf0f1",
  };

  return `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; color: ${colors.primary_dark}; }
  .report-title { background-color: ${colors.primary_dark}; color: white; padding: 25px; text-align: center; font-size: 32px; font-weight: bold; margin-bottom: 20px; }
  .section-heading { background-color: ${colors.primary_blue}; color: white; padding: 12px 15px; font-size: 18px; font-weight: bold; margin-top: 25px; margin-bottom: 15px; border-left: 5px solid ${colors.primary_dark}; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  th { background-color: ${colors.table_header}; color: white; padding: 12px; text-align: left; }
  td { padding: 12px; border-bottom: 1px solid #ddd; }
  tr:nth-child(even) { background-color: ${colors.table_alt_row}; }
  .number { background-color: ${colors.accent_gold}; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold; }
</style>
</head>
<body>
<div class="report-title">✨ Numerology Reading for ${profile.name} ✨</div>
<p><strong>Date of Birth:</strong> ${profile.dob_fmt}</p>

<div class="section-heading">Core Numbers</div>
<table>
  <tr><th>Number Type</th><th>Value</th><th>Meaning</th></tr>
  <tr><td>Psychic Number</td><td><span class="number">${profile.psychic_number}</span></td><td>Innate nature and character</td></tr>
  <tr><td>Destiny Number</td><td><span class="number">${profile.destiny_number}</span></td><td>Life purpose and direction</td></tr>
  <tr><td>Name Number</td><td><span class="number">${profile.name_number}</span></td><td>Expression and communication</td></tr>
  <tr><td>Life Path Number</td><td><span class="number">${profile.life_path_number}</span></td><td>Soul's journey</td></tr>
  <tr><td>Soul Urge Number</td><td><span class="number">${profile.soul_urge_number}</span></td><td>Heart's desire</td></tr>
</table>

<div class="section-heading">Your Numerology</div>
<p>This reading is based on the Chaldean Numerology system and provides insights into your personality, life path, and inner motivations. The numbers above represent key aspects of your numerological profile.</p>

<p><em>Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</em></p>
</body>
</html>
  `;
}

module.exports = { handlePaidReading };