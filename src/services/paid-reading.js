// ============================================================
//  src/services/paid-reading.js  v2
//
//  CHANGES from v1:
//    - PAID_REPORT_DELIVERY_MODE removed entirely
//    - Always generates a report (engine controls cost, not mode)
//    - Handles both result shapes from dispatcher:
//        { _html, _engine_config, _engine_used }  ← hardcoded paid
//        { cards, cta, ... }                       ← claude (JSON)
//    - If dispatcher fails entirely, falls back to buildFallbackHTML()
// ============================================================

const settings                  = require('../reading.settings');
const dispatcher                = require('../engines/dispatcher');
const { htmlToDocx, generateFileName } = require('../engines/docx-generator');
const { dbRun }                 = require('../config/db');

const FILE = 'src/services/paid-reading.js';

function log(step, message, data = null) {
  console.log(`[${FILE}] STEP ${step} ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

function error(step, message, data = null) {
  console.error(`[${FILE}] ❌ STEP ${step} ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// ────────────────────────────────────────────────────────────
// Main entry point
// ────────────────────────────────────────────────────────────
async function handlePaidReading(order, profile, profileId) {
  log(1, 'handlePaidReading() called', {
    orderId:     order.id,
    subjectName: order.subject_name,
    productSlug: order.product_slug,
    engine:      settings.PAID_READING_ENGINE,
  });

  let htmlReport    = null;
  let engineConfig  = settings.PAID_READING_ENGINE;
  let engineUsed    = 'unknown';

  // ── Step 1: Generate HTML via dispatcher ─────────────────
  try {
    log(2, `Dispatching "${order.product_slug}" to engine="${engineConfig}"`);

    const dispatchResult = await dispatcher.dispatch(order.product_slug, profile);

    // Read metadata tags
    engineConfig = dispatchResult._engine_config || settings.PAID_READING_ENGINE;
    engineUsed   = dispatchResult._engine_used   || 'unknown';

    // ── Extract HTML from result ──────────────────────────
    // Shape A: hardcoded paid reading wraps HTML in _html field
    // Shape B: claude returns JSON with cards array
    if (dispatchResult._html) {
      // Hardcoded engine — HTML is ready
      htmlReport = dispatchResult._html;
      log(3, 'HTML from hardcoded engine', { length: htmlReport.length });

    } else if (dispatchResult.cards && dispatchResult.cards.length > 0) {
      // Claude returned structured JSON — build HTML from cards
      htmlReport = buildHTMLFromCards(dispatchResult, profile);
      log(3, 'HTML built from Claude cards', { cardCount: dispatchResult.cards.length, length: htmlReport.length });

    } else {
      log(3, 'Dispatcher returned unexpected shape — will use fallback', {
        keys: Object.keys(dispatchResult).filter(k => !k.startsWith('_')),
      });
    }

  } catch (dispatchErr) {
    error(2, 'Dispatcher failed — will use fallback HTML', { message: dispatchErr.message });
    engineUsed = 'hardcoded';
  }

  // ── Step 2: Fallback if still no HTML ────────────────────
  if (!htmlReport) {
    log(4, 'Using emergency fallback HTML');
    htmlReport   = buildFallbackHTML(profile);
    engineUsed   = 'hardcoded';
  }

  // ── Step 3: Convert HTML → DOCX ──────────────────────────
  log(5, 'Converting HTML → DOCX');
  const fileName  = generateFileName(order.subject_name || order.customer_name);
  const docxResult = await htmlToDocx(htmlReport, fileName);

  log(6, 'DOCX generated', { fileName: docxResult.fileName, size: docxResult.size });

  // ── Step 4: Save to database ─────────────────────────────
  log(7, 'Saving reading to database');

  const reportContent = {
    type:          'docx',
    html_source:   htmlReport.slice(0, 5000),  // first 5000 chars for reference
    docx_base64:   docxResult.base64,
    docx_filename: docxResult.fileName,
    docx_size:     docxResult.size,
    generated_at:  new Date().toISOString(),
    engine_config: engineConfig,
    engine_used:   engineUsed,
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

  log(8, 'Reading saved', {
    readingId,
    status:      'generated',
    engineConfig,
    engineUsed,
    docxFilename: docxResult.fileName,
    docxSize:     docxResult.size,
  });

  console.log(`[${FILE}] >>> SUCCESS | readingId=${readingId} | engine_config=${engineConfig} | engine_used=${engineUsed} | docx_ready_for_download`);

  return {
    success:      true,
    readingId,
    status:       'generated',
    engineConfig,
    engineUsed,
    docxFileName: docxResult.fileName,
    docxSize:     docxResult.size,
    message:      'Report generated and ready for review',
  };
}

// ────────────────────────────────────────────────────────────
// Build HTML from Claude's card JSON response
// Used when PAID_READING_ENGINE=claude and Claude returns cards
// ────────────────────────────────────────────────────────────
function buildHTMLFromCards(dispatchResult, profile) {
  const name = profile.name_used || profile.name || 'Client';
  const C = {
    dark: '#2c3e50', blue: '#3498db', gold: '#f39c12',
    header: '#34495e', alt: '#ecf0f1', insight: '#e8f4f8',
  };

  const cardRows = (dispatchResult.cards || []).map(card => `
    <div style="margin-bottom:24px;">
      <div style="background:${C.blue};color:#fff;padding:10px 16px;font-weight:bold;font-size:15px;border-left:5px solid ${C.dark};">
        ${card.title || `Card ${card.card_number}`}
        ${card.subtitle ? `<span style="font-weight:normal;font-size:12px;opacity:0.85;margin-left:10px;">${card.subtitle}</span>` : ''}
      </div>
      <div style="padding:14px 16px;line-height:1.7;font-size:13px;background:#fff;border:1px solid #ddd;border-top:none;">
        ${(card.body || '').replace(/\n\n/g,'</p><p style="margin:0 0 10px 0;">').replace(/\n/g,' ')}
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8">
<style>
  body { font-family:'Segoe UI',sans-serif; margin:0; padding:20px; color:${C.dark}; font-size:14px; }
  .cover { background:${C.dark};color:#fff;padding:30px;text-align:center;margin-bottom:20px; }
  .cover h1 { margin:0 0 8px 0; font-size:26px; }
  .footer { text-align:center;color:#999;font-size:11px;margin-top:30px;padding-top:15px;border-top:1px solid #ddd; }
</style>
</head>
<body>
<div class="cover">
  <h1>✨ Numerology Reading for ${name} ✨</h1>
  <p>Date of Birth: ${profile.dob_fmt || profile.dob_used || ''} &nbsp;|&nbsp; Chaldean System</p>
</div>
${cardRows}
<div class="footer">
  Generated by NumeroSoul &nbsp;·&nbsp;
  ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
</div>
</body>
</html>`;
}

// ────────────────────────────────────────────────────────────
// Emergency fallback — minimal table if everything else fails
// ────────────────────────────────────────────────────────────
function buildFallbackHTML(profile) {
  const name = profile.name_used || profile.name || 'Client';
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body { font-family:'Segoe UI',sans-serif; margin:20px; color:#2c3e50; }
  h1   { background:#2c3e50; color:#fff; padding:20px; text-align:center; }
  table{ width:100%; border-collapse:collapse; margin:15px 0; }
  th   { background:#34495e; color:#fff; padding:10px; text-align:left; }
  td   { padding:10px; border-bottom:1px solid #ddd; }
  tr:nth-child(even) td { background:#ecf0f1; }
  .num { background:#f39c12; color:#fff; padding:2px 8px; border-radius:3px; font-weight:bold; }
</style>
</head>
<body>
<h1>✨ Numerology Reading for ${name} ✨</h1>
<p><strong>Date of Birth:</strong> ${profile.dob_fmt || profile.dob_used || ''}</p>
<table>
  <tr><th>Number Type</th><th>Value</th></tr>
  <tr><td>Psychic</td>     <td><span class="num">${profile.psychic_number || '—'}</span></td></tr>
  <tr><td>Destiny</td>     <td><span class="num">${profile.destiny_number || '—'}</span></td></tr>
  <tr><td>Name</td>        <td><span class="num">${profile.name_number || '—'}</span></td></tr>
  <tr><td>Soul Urge</td>   <td><span class="num">${profile.soul_urge_number || '—'}</span></td></tr>
  <tr><td>Personality</td> <td><span class="num">${profile.personality_number || '—'}</span></td></tr>
  <tr><td>Life Path</td>   <td><span class="num">${profile.life_path_number || profile.destiny_number || '—'}</span></td></tr>
  <tr><td>Maturity</td>    <td><span class="num">${profile.maturity_number || '—'}</span></td></tr>
  <tr><td>Power</td>       <td><span class="num">${profile.power_number || '—'}</span></td></tr>
  <tr><td>Personal Year</td><td><span class="num">${profile.personal_year_number || '—'}</span></td></tr>
</table>
<p style="color:#999;font-size:12px;text-align:center;">
  Generated by NumeroSoul · ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
</p>
</body>
</html>`;
}

module.exports = { handlePaidReading };