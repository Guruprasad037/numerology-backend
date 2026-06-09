// ============================================================
//  src/services/paid-reading.js  v6
//
//  CHANGES from v5:
//    - Added report_ref_id generation and storage.
//
//  WHAT CHANGED (3 additions only, everything else identical):
//
//  1. generateRefId() helper added at top of file (after imports).
//     Takes reading.id (UUID), returns "OP-RD-{LAST_SEGMENT_UPPERCASE}".
//     Example: reading id "237dabbb-b2dc-4b11-84c4-dc76f0687b7a"
//              → "OP-RD-DC76F0687B7A"
//
//  2. In handlePaidReading(), after readingId is returned from
//     the INSERT RETURNING, we immediately UPDATE the row to
//     set report_ref_id. Fire-and-forget — if it fails it logs
//     but does not break the reading flow.
//
//  3. In buildPaidHTMLFromClaudeJSON(), the footer now includes
//     the ref ID, and the cover page shows it. The ref ID is
//     passed in via a new optional parameter.
//     All other HTML builders (buildHTMLFromCards, buildFallbackHTML)
//     also receive and display it.
//
//  BACKWARD COMPATIBLE: if report_ref_id column doesn't exist yet
//  (migration not run), the UPDATE fails silently. Run the migration
//  before deploying this file.
//
//  REQUIRES:
//    ALTER TABLE readings ADD COLUMN IF NOT EXISTS report_ref_id VARCHAR(30);
//    CREATE UNIQUE INDEX IF NOT EXISTS idx_readings_ref_id
//      ON readings (report_ref_id) WHERE report_ref_id IS NOT NULL;
// ============================================================

const settings   = require('../reading.settings');
const dispatcher = require('../engines/dispatcher');
const { dbRun }  = require('../config/db');

const FILE = 'src/services/paid-reading.js';

function log(step, message, data = null) {
  console.log(`[${FILE}] STEP ${step} ${message}`, data ? JSON.stringify(data, null, 2) : '');
}
function error(step, message, data = null) {
  console.error(`[${FILE}] ❌ STEP ${step} ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// ────────────────────────────────────────────────────────────
// ADDITION 1 of 3 — generateRefId()
//
// Takes the readings.id UUID and returns a human-readable
// reference ID for use in PDF footers and support emails.
//
// Format:  OP-RD-{LAST_SEGMENT_UPPERCASE}
// Example: "237dabbb-b2dc-4b11-84c4-dc76f0687b7a"
//        → "OP-RD-DC76F0687B7A"
//
// The last UUID segment (12 hex chars) is unique enough for
// our volume and short enough to fit in a PDF footer.
// ────────────────────────────────────────────────────────────
function generateRefId(readingId) {
  const lastSegment = (readingId || '').split('-').pop().toUpperCase();
  return `OP-RD-${lastSegment}`;
}

// ────────────────────────────────────────────────────────────
// Main entry point — only the ref ID additions are new
// ────────────────────────────────────────────────────────────
async function handlePaidReading(order, profile, profileId) {
  log(1, 'handlePaidReading() called', {
    orderId:     order.id,
    subjectName: order.subject_name,
    productSlug: order.product_slug,
    engine:      settings.PAID_READING_ENGINE,
  });

  let htmlReport   = null;
  let engineConfig = settings.PAID_READING_ENGINE;
  let engineUsed   = 'unknown';

  // ── Step 1: Generate HTML via dispatcher ─────────────────
  try {
    log(2, `Dispatching "${order.product_slug}" to engine="${engineConfig}"`);
    const dispatchResult = await dispatcher.dispatch(order.product_slug, profile);

    engineConfig = dispatchResult._engine_config || settings.PAID_READING_ENGINE;
    engineUsed   = dispatchResult._engine_used   || 'unknown';

    // ── Shape A: hardcoded engine → _html field ───────────
    if (dispatchResult._html) {
      htmlReport = dispatchResult._html;
      log(3, 'HTML from hardcoded engine', { length: htmlReport.length });

    // ── Shape B: Claude v2.0 / v3.0 → JSON object ────────
    } else if (dispatchResult.sections || dispatchResult.opening_portrait) {
      const claudeData = dispatchResult.sections || dispatchResult;
      htmlReport = buildPaidHTMLFromClaudeJSON(claudeData, profile);
      log(3, 'HTML built from Claude JSON', {
        hasSections:    !!claudeData.opening_portrait,
        hasRedThread:   !!claudeData.red_thread,
        hasLifeDomains: !!claudeData.psychic?.life_domains,
        length:         htmlReport.length,
      });

    // ── Shape C: legacy cards array ───────────────────────
    } else if (dispatchResult.cards && dispatchResult.cards.length > 0) {
      htmlReport = buildHTMLFromCards(dispatchResult, profile);
      log(3, 'HTML built from legacy Claude cards', {
        cardCount: dispatchResult.cards.length,
        length:    htmlReport.length,
      });

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
    htmlReport = buildFallbackHTML(profile);
    engineUsed = 'hardcoded';
  }

  log(5, 'HTML ready', { length: htmlReport.length, engineConfig, engineUsed });

  // ── Step 3: Save to database ─────────────────────────────
  log(6, 'Saving reading to database');

  const subjectName  = order.subject_name || order.customer_name || 'Report';
  const cleanName    = subjectName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 30);
  const dateStr      = new Date().toISOString().split('T')[0];
  const htmlFileName = `Reading_${cleanName}_${dateStr}.html`;

  const reportContent = {
    type:          'html',
    html:          htmlReport,
    html_filename: htmlFileName,
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
  log(7, 'Reading saved successfully', { readingId, engineConfig, engineUsed });

  // ── ADDITION 2 of 3 — store report_ref_id ────────────────
  // Generate the human-readable ref ID from the reading UUID
  // and write it back to the row. Fire-and-forget — a failure
  // here does not affect the reading or delivery.
  //
  // Requires DB migration:
  //   ALTER TABLE readings ADD COLUMN IF NOT EXISTS report_ref_id VARCHAR(30);
  //   CREATE UNIQUE INDEX IF NOT EXISTS idx_readings_ref_id
  //     ON readings (report_ref_id) WHERE report_ref_id IS NOT NULL;
  const refId = generateRefId(readingId);
  dbRun(
    `UPDATE readings SET report_ref_id = $1 WHERE id = $2`,
    [refId, readingId]
  ).then(() => {
    log(7.1, 'report_ref_id stored', { readingId, refId });
  }).catch(err => {
    // Silently log — most likely cause is migration not yet run
    console.warn(`[${FILE}] report_ref_id update failed (run DB migration if not done): ${err.message}`);
  });

  // ── Inject ref ID into the stored HTML ───────────────────
  // Now that we have the ref ID, patch it into the HTML that's
  // already been generated and stored. This replaces the
  // placeholder we left in the HTML builders below.
  // Also update report_content.html so the downloaded file has it.
  const patchedHtml = htmlReport.replace(/\{\{REPORT_REF_ID\}\}/g, refId);
  if (patchedHtml !== htmlReport) {
    const patchedContent = {
      ...reportContent,
      html: patchedHtml,
    };
    dbRun(
      `UPDATE readings SET report_content = $1 WHERE id = $2`,
      [JSON.stringify(patchedContent), readingId]
    ).then(() => {
      log(7.2, 'HTML patched with ref ID', { refId });
    }).catch(err => {
      console.warn(`[${FILE}] HTML ref ID patch failed: ${err.message}`);
    });
  }

  return {
    success:      true,
    readingId,
    refId,
    status:       'generated',
    engineConfig,
    engineUsed,
    htmlFileName,
    message:      'Report generated and ready for review',
  };
}

// ────────────────────────────────────────────────────────────
// COLOUR PALETTE — UNCHANGED
// ────────────────────────────────────────────────────────────
const C = {
  dark:     '#2c3e50',
  blue:     '#2980b9',
  gold:     '#b7860b',
  goldlt:   '#fdf6e3',
  teal:     '#1a7a6e',
  tealt:    '#e8f5f3',
  header:   '#1a252f',
  alt:      '#f4f6f7',
  white:    '#ffffff',
  border:   '#d5d8dc',
  text:     '#2c3e50',
  muted:    '#717d7e',
  rose:     '#922b21',
  roselt:   '#fdedec',
  ink:      '#1a1a2e',
};

// ────────────────────────────────────────────────────────────
// SHARED CSS — UNCHANGED
// ────────────────────────────────────────────────────────────
function sharedCSS() {
  return `
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.75;
      color: ${C.text};
      background: ${C.white};
      margin: 0;
      padding: 0;
    }
    .cover {
      background-color: ${C.ink};
      color: ${C.white};
      padding: 52px 48px 44px;
      text-align: center;
      page-break-after: always;
    }
    .cover-brand {
      font-family: Georgia, serif;
      font-size: 11pt;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: ${C.gold};
      margin-bottom: 32px;
    }
    .cover-title {
      font-family: Georgia, serif;
      font-size: 26pt;
      font-weight: normal;
      color: ${C.white};
      line-height: 1.3;
      margin-bottom: 8px;
    }
    .cover-subtitle {
      font-family: Georgia, serif;
      font-size: 13pt;
      color: rgba(255,255,255,0.65);
      margin-bottom: 36px;
      font-style: italic;
    }
    .cover-divider {
      border: none;
      border-top: 1px solid rgba(255,255,255,0.2);
      width: 60px;
      margin: 0 auto 32px;
    }
    .cover-meta-table {
      width: auto;
      margin: 0 auto;
      border-collapse: collapse;
    }
    .cover-meta-table td {
      padding: 4px 16px;
      font-size: 10pt;
      color: rgba(255,255,255,0.7);
      text-align: left;
    }
    .cover-meta-table td.lbl {
      color: ${C.gold};
      font-size: 8pt;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      text-align: right;
      padding-right: 12px;
    }
    .cover-disclaimer {
      margin-top: 40px;
      font-size: 7.5pt;
      color: rgba(255,255,255,0.3);
      line-height: 1.5;
      font-style: italic;
    }
    .cover-ref {
      margin-top: 16px;
      font-size: 8pt;
      letter-spacing: 0.12em;
      color: rgba(183,134,11,0.5);
    }
    .page { padding: 44px 52px; max-width: 800px; margin: 0 auto; }
    .toc-title {
      font-family: Georgia, serif;
      font-size: 14pt;
      color: ${C.dark};
      border-bottom: 2px solid ${C.gold};
      padding-bottom: 8px;
      margin-bottom: 20px;
    }
    .toc-table { width: 100%; border-collapse: collapse; }
    .toc-table td { padding: 5px 0; font-size: 10pt; }
    .toc-table td.toc-num { color: ${C.gold}; font-size: 9pt; width: 28px; }
    .toc-table td.toc-dots { color: ${C.border}; padding: 0 4px; }
    .section-header {
      background-color: ${C.dark};
      color: ${C.white};
      padding: 12px 20px;
      margin-top: 36px;
      margin-bottom: 0;
      page-break-after: avoid;
    }
    .section-header-num {
      font-size: 8pt;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: ${C.gold};
      display: block;
      margin-bottom: 2px;
    }
    .section-header-title {
      font-family: Georgia, serif;
      font-size: 15pt;
      font-weight: normal;
      color: ${C.white};
    }
    .subsection {
      font-family: Georgia, serif;
      font-size: 12pt;
      color: ${C.blue};
      border-left: 3px solid ${C.gold};
      padding-left: 10px;
      margin-top: 24px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }
    .prose p {
      margin-bottom: 14px;
      font-size: 11pt;
      line-height: 1.8;
      color: ${C.text};
      text-align: justify;
    }
    .prose p:last-child { margin-bottom: 0; }
    .num-table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0 24px;
      font-size: 10pt;
    }
    .num-table th {
      background-color: ${C.header};
      color: ${C.white};
      padding: 9px 14px;
      text-align: left;
      font-size: 8.5pt;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-weight: bold;
    }
    .num-table td {
      padding: 9px 14px;
      border-bottom: 1px solid ${C.border};
      vertical-align: top;
    }
    .num-table tr:nth-child(even) td { background-color: ${C.alt}; }
    .num-table tr:last-child td { border-bottom: none; }
    .num-badge {
      background-color: ${C.gold};
      color: ${C.white};
      font-size: 11pt;
      font-weight: bold;
      padding: 2px 9px;
      display: inline-block;
    }
    .num-table td.num-col { text-align: center; }
    .insight {
      background-color: ${C.goldlt};
      border-left: 4px solid ${C.gold};
      padding: 14px 18px;
      margin: 18px 0;
    }
    .insight-title {
      font-size: 8pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: ${C.gold};
      margin-bottom: 6px;
    }
    .insight p {
      font-size: 10.5pt;
      line-height: 1.7;
      color: ${C.text};
      margin-bottom: 8px;
    }
    .insight p:last-child { margin-bottom: 0; }
    .red-thread {
      background-color: ${C.ink};
      border-left: 4px solid ${C.gold};
      padding: 14px 18px;
      margin: 0 0 24px 0;
    }
    .red-thread-title {
      font-size: 8pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: ${C.gold};
      margin-bottom: 6px;
    }
    .red-thread p {
      font-size: 11pt;
      line-height: 1.7;
      color: rgba(255,255,255,0.9);
      font-style: italic;
      margin-bottom: 0;
    }
    .callout {
      background-color: ${C.roselt};
      border-left: 4px solid ${C.rose};
      padding: 14px 18px;
      margin: 18px 0;
    }
    .callout-title {
      font-size: 8pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: ${C.rose};
      margin-bottom: 6px;
    }
    .callout p {
      font-size: 10.5pt;
      line-height: 1.7;
      color: ${C.text};
      margin-bottom: 8px;
    }
    .callout p:last-child { margin-bottom: 0; }
    .callout-teal {
      background-color: ${C.tealt};
      border-left: 4px solid ${C.teal};
      padding: 14px 18px;
      margin: 18px 0;
    }
    .callout-teal-title {
      font-size: 8pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: ${C.teal};
      margin-bottom: 6px;
    }
    .callout-teal p {
      font-size: 10.5pt;
      line-height: 1.7;
      color: ${C.text};
      margin-bottom: 8px;
    }
    .callout-teal p:last-child { margin-bottom: 0; }
    .closing {
      background-color: ${C.ink};
      color: ${C.white};
      padding: 36px 40px;
      margin-top: 40px;
      page-break-before: always;
    }
    .closing-title {
      font-family: Georgia, serif;
      font-size: 14pt;
      color: ${C.gold};
      margin-bottom: 20px;
      letter-spacing: 0.06em;
    }
    .closing p {
      font-size: 11pt;
      line-height: 1.85;
      color: rgba(255,255,255,0.85);
      margin-bottom: 16px;
      text-align: justify;
    }
    .closing p:last-child {
      color: ${C.white};
      font-style: italic;
      font-size: 11.5pt;
      margin-bottom: 0;
    }
    .footer {
      text-align: center;
      padding: 24px;
      border-top: 1px solid ${C.border};
      margin-top: 32px;
      font-size: 8pt;
      color: ${C.muted};
      line-height: 1.6;
    }
    .footer-ref {
      margin-top: 6px;
      font-size: 7.5pt;
      letter-spacing: 0.1em;
      color: ${C.gold};
      opacity: 0.7;
    }
    .page-break { page-break-before: always; }
    .avoid-break { page-break-inside: avoid; }
  `;
}

// ────────────────────────────────────────────────────────────
// PROSE HELPER — UNCHANGED
// ────────────────────────────────────────────────────────────
function prose(text, className = 'prose') {
  if (!text) return '';
  const paragraphs = String(text)
    .split(/\n\n+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => `<p>${s.replace(/\n/g, ' ')}</p>`)
    .join('\n');
  return `<div class="${className}">${paragraphs}</div>`;
}

// ────────────────────────────────────────────────────────────
// HOW-TO-CLOSE HELPER — UNCHANGED
// ────────────────────────────────────────────────────────────
function renderHowToClose(howToClose) {
  if (!howToClose) return '';

  if (typeof howToClose === 'string') {
    return `
      <div class="subsection">How to Begin Closing These Gaps</div>
      ${prose(howToClose)}
    `;
  }

  const parts = [];

  if (howToClose.rational_thought) {
    parts.push(`
      <div class="subsection">Your Rational Thought Number — How You Process</div>
      ${prose(howToClose.rational_thought)}
    `);
  }

  if (howToClose.balance) {
    parts.push(`
      <div class="subsection">Your Balance Number — How You Restore Equilibrium</div>
      ${prose(howToClose.balance)}
    `);
  }

  if (howToClose.practice) {
    parts.push(`
      <div class="subsection">Practical Steps — Closing the Gaps</div>
      ${prose(howToClose.practice)}
    `);
  }

  return parts.join('');
}

// ────────────────────────────────────────────────────────────
// BUILD HTML FROM CLAUDE JSON
// ADDITION 3 of 3 — ref ID injected into cover + footer
// The ref ID is written as {{REPORT_REF_ID}} placeholder here.
// handlePaidReading() patches it after the reading ID is known.
// ────────────────────────────────────────────────────────────
function buildPaidHTMLFromClaudeJSON(d, profile) {
  const name      = profile.name_used || profile.name || 'Client';
  const dobFmt    = profile.dob_fmt   || profile.dob_used || '';
const nameParts = (name).trim().split(/\s+/);
const firstName = nameParts.find(p => p.length > 1) || nameParts[0];  const currentYear = new Date().getFullYear();
  const genDate   = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });

  const p = profile;

  const p1Label = p.pinnacle_1_end_age ? `birth – age ${p.pinnacle_1_end_age}` : 'first phase';
  const p2Label = p.pinnacle_2_start_age && p.pinnacle_2_end_age ? `age ${p.pinnacle_2_start_age}–${p.pinnacle_2_end_age}` : 'second phase';
  const p3Label = p.pinnacle_3_start_age && p.pinnacle_3_end_age ? `age ${p.pinnacle_3_start_age}–${p.pinnacle_3_end_age}` : 'third phase';
  const p4Label = p.pinnacle_4_start_age ? `age ${p.pinnacle_4_start_age}+` : 'final phase';

  const masterList  = Array.isArray(p.master_numbers_found) && p.master_numbers_found.length ? p.master_numbers_found : [];
  const karmicList  = Array.isArray(p.karmic_debt_numbers)  && p.karmic_debt_numbers.length  ? p.karmic_debt_numbers  : [];
  const hiddenList  = Array.isArray(p.hidden_passions)  && p.hidden_passions.length  ? p.hidden_passions.join(', ')  : 'None';
  const missingList = Array.isArray(p.missing_numbers)  && p.missing_numbers.length  ? p.missing_numbers.join(', ')  : 'None';
  const lessonList  = Array.isArray(p.karmic_lessons)   && p.karmic_lessons.length   ? p.karmic_lessons.join(', ')   : 'None';

  const totalLetters = (p.plane_mental_count||0)+(p.plane_physical_count||0)+(p.plane_emotional_count||0)+(p.plane_intuitive_count||0);
  const pct = n => totalLetters ? Math.round((n||0)/totalLetters*100) : 0;

  function sectionHeader(num, title) {
    return `
    <div class="section-header avoid-break">
      <span class="section-header-num">Section ${num}</span>
      <span class="section-header-title">${title}</span>
    </div>
    <div class="page" style="padding-top:24px;">`;
  }
  function closeSectionDiv() { return `</div>`; }

  const tocEntries = [
    { num:'1',  title:'Your Numerological Portrait' },
    { num:'2',  title:`Psychic Number ${p.psychic_number} — The Instinctive Self` },
    { num:'3',  title:`Destiny Number ${p.destiny_number} — The Life Direction` },
    { num:'4',  title:`The ${p.pd_combination || `${p.psychic_number}-${p.destiny_number}`} Combination` },
    { num:'5',  title:`Name & Soul Urge — Outer Talent Meets Inner Hunger` },
    { num:'6',  title:`Personality Number ${p.personality_number} — How the World Sees You` },
    { num:'7',  title:`The Letters of Your Name` },
    { num:'8',  title:`Planes of Expression` },
    { num:'9',  title:`Hidden Passions & Karmic Lessons` },
    ...(p.has_karmic_debt && karmicList.length ? [{ num:'10', title:`Karmic Debt — The Soul's Accelerated Curriculum` }] : []),
    ...(masterList.length ? [{ num: p.has_karmic_debt && karmicList.length ? '11' : '10', title:`Master Number${masterList.length>1?'s':''} ${masterList.join(' & ')}` }] : []),
    { num:'12', title:`Life Cycles — Pinnacles & Challenges` },
    { num:'13', title:`Current Timing — ${currentYear} and Beyond` },
    { num:'14', title:`Active Letter Transits` },
    { num:'15', title:`Bridge Numbers — Closing the Gaps` },
    { num:'16', title:`Maturity & Power — Who You Are Becoming` },
    { num:'17', title:`Closing Synthesis` },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Numerology Reading — ${name}</title>
<style>${sharedCSS()}</style>
</head>
<body>

<div class="cover">
  <div class="cover-brand">✦ Occult Pulse ✦</div>
  <div class="cover-title">Complete Chaldean<br>Numerology Reading</div>
  <div class="cover-subtitle">A personal blueprint in numbers</div>
  <hr class="cover-divider"/>
  <table class="cover-meta-table">
    <tr><td class="lbl">Prepared for</td><td>${name}</td></tr>
    <tr><td class="lbl">Date of Birth</td><td>${dobFmt}</td></tr>
    <tr><td class="lbl">Ruling Planet</td><td>${p.ruling_planet || '—'}</td></tr>
    <tr><td class="lbl">PD Combination</td><td>${p.pd_combination || `${p.psychic_number}-${p.destiny_number}`}</td></tr>
    <tr><td class="lbl">Numerology System</td><td>Chaldean</td></tr>
    <tr><td class="lbl">Generated on</td><td>${genDate}</td></tr>
  </table>
  ${masterList.length ? `<div style="margin-top:28px;display:inline-block;background:rgba(183,134,11,0.2);border:1px solid rgba(183,134,11,0.5);padding:8px 20px;">
    <span style="color:${C.gold};font-size:9pt;letter-spacing:0.18em;text-transform:uppercase;">⭐ Master Number ${masterList.join(' & ')} Detected</span>
  </div>` : ''}
  ${karmicList.length ? `<div style="margin-top:12px;display:inline-block;background:rgba(146,43,33,0.2);border:1px solid rgba(146,43,33,0.4);padding:8px 20px;">
    <span style="color:#e8a89c;font-size:9pt;letter-spacing:0.18em;text-transform:uppercase;">Karmic Compound ${karmicList.join(', ')} Present</span>
  </div>` : ''}
  <div class="cover-disclaimer">
    This reading is prepared for personal reflection, self-understanding, and growth.<br>
    It is not a prediction of future events and does not constitute medical, legal, or financial advice.<br>
    Numerology is a symbolic system — interpret it with openness and your own discernment.
  </div>
  <div class="cover-ref">{{REPORT_REF_ID}}</div>
</div>

<div class="page" style="padding-top:40px;page-break-after:always;">
  <div class="toc-title">Contents</div>
  <table class="toc-table">
    ${tocEntries.map(e => `
    <tr>
      <td class="toc-num">${e.num}</td>
      <td>${e.title}</td>
    </tr>`).join('')}
  </table>
</div>

<div class="page" style="padding-top:32px;page-break-after:always;">
  <div style="font-family:Georgia,serif;font-size:16pt;color:${C.dark};border-bottom:2px solid ${C.gold};padding-bottom:10px;margin-bottom:20px;">
    Your Core Numbers at a Glance
  </div>
  <table class="num-table">
    <thead>
      <tr>
        <th>Number Type</th>
        <th style="text-align:center;">Value</th>
        <th>Compound</th>
        <th>Ruling Influence</th>
        <th>What It Governs</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Psychic Number</td>
        <td class="num-col"><span class="num-badge">${p.psychic_number}</span></td>
        <td>${p.psychic_compound && p.psychic_compound !== p.psychic_number ? p.psychic_compound : '—'}</td>
        <td>${p.ruling_planet || '—'}</td>
        <td>Instinctive self — who you are before the world shaped you</td>
      </tr>
      <tr>
        <td>Destiny Number</td>
        <td class="num-col"><span class="num-badge">${p.destiny_number}</span></td>
        <td>${p.destiny_compound && p.destiny_compound !== p.destiny_number ? p.destiny_compound : '—'}</td>
        <td>—</td>
        <td>Life direction — who you are becoming across your entire life</td>
      </tr>
      <tr>
        <td>Name Number</td>
        <td class="num-col"><span class="num-badge">${p.name_number}</span></td>
        <td>${p.name_compound && p.name_compound !== p.name_number ? p.name_compound : '—'}</td>
        <td>—</td>
        <td>Outer talent — what your name projects into the world</td>
      </tr>
      <tr>
        <td>Soul Urge</td>
        <td class="num-col"><span class="num-badge">${p.soul_urge_number}</span></td>
        <td>${p.soul_urge_compound && p.soul_urge_compound !== p.soul_urge_number ? p.soul_urge_compound : '—'}</td>
        <td>—</td>
        <td>Inner hunger — what the soul privately craves</td>
      </tr>
      <tr>
        <td>Personality</td>
        <td class="num-col"><span class="num-badge">${p.personality_number}</span></td>
        <td>${p.personality_compound && p.personality_compound !== p.personality_number ? p.personality_compound : '—'}</td>
        <td>—</td>
        <td>First impression — how the world perceives you before knowing you</td>
      </tr>
      <tr>
        <td>Life Path</td>
        <td class="num-col"><span class="num-badge">${p.life_path_number || p.destiny_number}</span></td>
        <td>${p.life_path_compound && p.life_path_compound !== p.life_path_number ? p.life_path_compound : '—'}</td>
        <td>—</td>
        <td>Soul's journey — the path the soul chose for this lifetime</td>
      </tr>
      <tr>
        <td>Maturity</td>
        <td class="num-col"><span class="num-badge">${p.maturity_number}</span></td>
        <td>${p.maturity_compound && p.maturity_compound !== p.maturity_number ? p.maturity_compound : '—'}</td>
        <td>—</td>
        <td>Emerging self — who you are growing into after your mid-30s</td>
      </tr>
      <tr>
        <td>Power Number</td>
        <td class="num-col"><span class="num-badge">${p.power_number}</span></td>
        <td>${p.power_compound && p.power_compound !== p.power_number ? p.power_compound : '—'}</td>
        <td>—</td>
        <td>Full potential — what becomes available at your highest functioning</td>
      </tr>
    </tbody>
  </table>

  <table class="num-table" style="margin-top:28px;">
    <thead>
      <tr><th colspan="4">Additional Reference Numbers</th></tr>
      <tr>
        <th>Number</th><th style="text-align:center;">Value</th>
        <th>Number</th><th style="text-align:center;">Value</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Personal Year (${currentYear})</td><td class="num-col"><span class="num-badge">${p.personal_year_number}</span></td>
        <td>Universal Year (${currentYear})</td><td class="num-col"><span class="num-badge">${p.universal_year_number}</span></td>
      </tr>
      <tr>
        <td>Current Pinnacle</td><td class="num-col"><span class="num-badge">${p.current_pinnacle}</span></td>
        <td>Current Challenge</td><td class="num-col"><span class="num-badge">${p.current_challenge}</span></td>
      </tr>
      <tr>
        <td>Essence Number</td><td class="num-col"><span class="num-badge">${p.essence_number || '—'}</span></td>
        <td>Subconscious Self</td><td class="num-col"><span class="num-badge">${p.subconscious_self ?? '—'}/8</span></td>
      </tr>
      <tr>
        <td>Rational Thought</td><td class="num-col"><span class="num-badge">${p.rational_thought_number ?? '—'}</span></td>
        <td>Balance Number</td><td class="num-col"><span class="num-badge">${p.balance_number ?? '—'}</span></td>
      </tr>
      <tr>
        <td>Soul–Expression Bridge</td><td class="num-col"><span class="num-badge">${p.soul_expression_bridge ?? '—'}</span></td>
        <td>Life–Personality Bridge</td><td class="num-col"><span class="num-badge">${p.life_personality_bridge ?? '—'}</span></td>
      </tr>
    </tbody>
  </table>

  <div class="insight avoid-break">
    <div class="insight-title">Name Letter Analysis</div>
    <table style="width:100%;border-collapse:collapse;font-size:10pt;">
      <tr>
        <td style="padding:4px 12px 4px 0;"><strong>Cornerstone</strong> (first letter)</td>
        <td style="padding:4px 8px;"><span class="num-badge" style="font-size:12pt;">${p.cornerstone || '?'}</span></td>
        <td style="padding:4px;color:${C.muted};">value ${p.cornerstone_value || '?'} — how you begin</td>
      </tr>
      <tr>
        <td style="padding:4px 12px 4px 0;"><strong>Capstone</strong> (last letter)</td>
        <td style="padding:4px 8px;"><span class="num-badge" style="font-size:12pt;">${p.capstone || '?'}</span></td>
        <td style="padding:4px;color:${C.muted};">value ${p.capstone_value || '?'} — how you complete</td>
      </tr>
      <tr>
        <td style="padding:4px 12px 4px 0;"><strong>First Vowel</strong></td>
        <td style="padding:4px 8px;"><span class="num-badge" style="font-size:12pt;">${p.first_vowel || '?'}</span></td>
        <td style="padding:4px;color:${C.muted};">value ${p.first_vowel_value || '?'} — instinctive emotional response</td>
      </tr>
    </table>
  </div>

  <div class="insight avoid-break" style="margin-top:16px;">
    <div class="insight-title">Planes of Expression</div>
    <table style="width:100%;border-collapse:collapse;font-size:10pt;">
      <tr>
        <td style="padding:3px 0;width:110px;">Mental</td>
        <td style="padding:3px 8px;width:40px;text-align:center;font-weight:bold;">${p.plane_mental_count || 0}</td>
        <td style="padding:3px 0;color:${C.muted};">${pct(p.plane_mental_count)}% of name letters</td>
      </tr>
      <tr>
        <td style="padding:3px 0;">Physical</td>
        <td style="padding:3px 8px;text-align:center;font-weight:bold;">${p.plane_physical_count || 0}</td>
        <td style="padding:3px 0;color:${C.muted};">${pct(p.plane_physical_count)}% of name letters</td>
      </tr>
      <tr>
        <td style="padding:3px 0;">Emotional</td>
        <td style="padding:3px 8px;text-align:center;font-weight:bold;">${p.plane_emotional_count || 0}</td>
        <td style="padding:3px 0;color:${C.muted};">${pct(p.plane_emotional_count)}% of name letters</td>
      </tr>
      <tr>
        <td style="padding:3px 0;">Intuitive</td>
        <td style="padding:3px 8px;text-align:center;font-weight:bold;">${p.plane_intuitive_count || 0}</td>
        <td style="padding:3px 0;color:${C.muted};">${pct(p.plane_intuitive_count)}% of name letters</td>
      </tr>
    </table>
    <div style="margin-top:8px;font-size:10pt;">
      <strong>Dominant Plane:</strong> ${(p.dominant_plane||'').charAt(0).toUpperCase()+(p.dominant_plane||'').slice(1)} &nbsp;·&nbsp;
      <strong>Hidden Passions:</strong> ${hiddenList} &nbsp;·&nbsp;
      <strong>Karmic Lessons:</strong> ${lessonList}
    </div>
  </div>
</div>

${sectionHeader('1', 'Your Numerological Portrait')}
  ${d.red_thread ? `
  <div class="red-thread avoid-break">
    <div class="red-thread-title">The Central Thread</div>
    ${prose(d.red_thread, 'red-thread')}
  </div>` : ''}
  ${prose(d.opening_portrait)}
${closeSectionDiv()}

${sectionHeader('2', `Psychic Number ${p.psychic_number} — The Instinctive Self`)}
  <div class="insight avoid-break">
    <div class="insight-title">At a Glance</div>
    <p><strong>Number:</strong> ${p.psychic_number}${p.psychic_compound && p.psychic_compound !== p.psychic_number ? ` (compound ${p.psychic_compound})` : ''} &nbsp;·&nbsp; <strong>Ruling Planet:</strong> ${p.ruling_planet || '—'} &nbsp;·&nbsp; <strong>Born on day:</strong> ${p.birth_day_number}</p>
  </div>
  <div class="subsection">Interpretation</div>
  ${prose(d.psychic?.interpretation)}
  <div class="subsection">Your Gift</div>
  ${prose(d.psychic?.gift)}
  <div class="subsection">The Shadow Side</div>
  ${prose(d.psychic?.shadow)}
  <div class="subsection">Vedic Planetary Context</div>
  ${prose(d.psychic?.vedic_context)}
  ${d.psychic?.life_domains ? `
  <div class="subsection">In Daily Life — Career &amp; Relationships</div>
  ${prose(d.psychic.life_domains)}` : ''}
${closeSectionDiv()}

${sectionHeader('3', `Destiny Number ${p.destiny_number} — The Life Direction`)}
  <div class="insight avoid-break">
    <div class="insight-title">At a Glance</div>
    <p><strong>Number:</strong> ${p.destiny_number}${p.destiny_compound && p.destiny_compound !== p.destiny_number ? ` (compound ${p.destiny_compound})` : ''} &nbsp;·&nbsp; <strong>Life Path:</strong> ${p.life_path_number || p.destiny_number}</p>
  </div>
  <div class="subsection">Interpretation</div>
  ${prose(d.destiny?.interpretation)}
  <div class="subsection">The Compound's Meaning</div>
  ${prose(d.destiny?.compound_meaning)}
  <div class="subsection">Soul Direction</div>
  ${prose(d.destiny?.soul_direction)}
  ${d.destiny?.life_domains ? `
  <div class="subsection">In Daily Life — Vocation &amp; Relationships</div>
  ${prose(d.destiny.life_domains)}` : ''}
${closeSectionDiv()}

${sectionHeader('4', `The ${p.pd_combination || `${p.psychic_number}-${p.destiny_number}`} Combination`)}
  <div class="subsection">How These Two Energies Meet</div>
  ${prose(d.pd_combination?.interpretation)}
  <div class="subsection">The Daily Dynamic</div>
  ${prose(d.pd_combination?.tension_or_flow)}
${closeSectionDiv()}

${sectionHeader('5', `Name & Soul Urge — Outer Talent Meets Inner Hunger`)}
  <div class="insight avoid-break">
    <div class="insight-title">At a Glance</div>
    <p><strong>Name Number ${p.name_number}</strong>${p.name_compound && p.name_compound !== p.name_number ? ` (compound ${p.name_compound})` : ''} — what your name projects outward &nbsp;·&nbsp; <strong>Soul Urge ${p.soul_urge_number}</strong>${p.soul_urge_compound && p.soul_urge_compound !== p.soul_urge_number ? ` (compound ${p.soul_urge_compound})` : ''} — what the soul privately craves</p>
  </div>
  <div class="subsection">Name Number ${p.name_number}</div>
  ${prose(d.name_soul_urge?.name_interpretation)}
  <div class="subsection">Soul Urge ${p.soul_urge_number}</div>
  ${prose(d.name_soul_urge?.soul_urge_interpretation)}
  <div class="subsection">The Gap Between Them</div>
  ${prose(d.name_soul_urge?.gap_analysis)}
  ${d.name_soul_urge?.life_domains ? `
  <div class="subsection">In Daily Life — Work &amp; Creative Expression</div>
  ${prose(d.name_soul_urge.life_domains)}` : ''}
${closeSectionDiv()}

${sectionHeader('6', `Personality Number ${p.personality_number} — How the World Sees You`)}
  <div class="insight avoid-break">
    <div class="insight-title">At a Glance</div>
    <p><strong>Personality Number ${p.personality_number}</strong>${p.personality_compound && p.personality_compound !== p.personality_number ? ` (compound ${p.personality_compound})` : ''} — the face you show before you are known &nbsp;·&nbsp; <strong>Psychic Number ${p.psychic_number}</strong> — who you actually are inside</p>
  </div>
  <div class="subsection">First Impressions</div>
  ${prose(d.personality?.interpretation)}
  <div class="subsection">The Mask and the Self</div>
  ${prose(d.personality?.mask_vs_self)}
${closeSectionDiv()}

${sectionHeader('7', `The Letters of Your Name`)}
  <div class="subsection">Cornerstone — ${p.cornerstone || '?'} (value ${p.cornerstone_value || '?'}) — How You Begin</div>
  ${prose(d.name_letters?.cornerstone)}
  <div class="subsection">Capstone — ${p.capstone || '?'} (value ${p.capstone_value || '?'}) — How You Complete</div>
  ${prose(d.name_letters?.capstone)}
  <div class="subsection">First Vowel — ${p.first_vowel || '?'} (value ${p.first_vowel_value || '?'}) — Your Emotional Temperature</div>
  ${prose(d.name_letters?.first_vowel)}
  <div class="subsection">What These Three Letters Together Reveal</div>
  ${prose(d.name_letters?.synthesis)}
${closeSectionDiv()}

${sectionHeader('8', `Planes of Expression`)}
  <table class="num-table avoid-break">
    <thead>
      <tr><th>Plane</th><th style="text-align:center;">Letters</th><th style="text-align:center;">%</th><th>How This Plane Operates</th></tr>
    </thead>
    <tbody>
      <tr><td>Mental</td><td style="text-align:center;font-weight:bold;">${p.plane_mental_count || 0}</td><td style="text-align:center;">${pct(p.plane_mental_count)}%</td><td>Analysis, ideas, intellectual understanding</td></tr>
      <tr><td>Physical</td><td style="text-align:center;font-weight:bold;">${p.plane_physical_count || 0}</td><td style="text-align:center;">${pct(p.plane_physical_count)}%</td><td>Action, results, tangible output</td></tr>
      <tr><td>Emotional</td><td style="text-align:center;font-weight:bold;">${p.plane_emotional_count || 0}</td><td style="text-align:center;">${pct(p.plane_emotional_count)}%</td><td>Feeling, empathy, relational intelligence</td></tr>
      <tr><td>Intuitive</td><td style="text-align:center;font-weight:bold;">${p.plane_intuitive_count || 0}</td><td style="text-align:center;">${pct(p.plane_intuitive_count)}%</td><td>Inner knowing, sensing before thinking</td></tr>
    </tbody>
  </table>
  <div class="subsection">How You Process the World</div>
  ${prose(d.planes?.interpretation)}
  <div class="subsection">Your Dominant Plane: ${(p.dominant_plane||'').charAt(0).toUpperCase()+(p.dominant_plane||'').slice(1)}</div>
  ${prose(d.planes?.dominant_meaning)}
  <div class="subsection">Subconscious Self — ${p.subconscious_self ?? '?'}/8</div>
  ${prose(d.planes?.subconscious_self)}
${closeSectionDiv()}

${sectionHeader('9', `Hidden Passions & Karmic Lessons`)}
  <div class="insight avoid-break">
    <div class="insight-title">Pattern Summary</div>
    <p><strong>Hidden Passions:</strong> ${hiddenList} &nbsp;·&nbsp; <strong>Karmic Lessons (Missing):</strong> ${lessonList} &nbsp;·&nbsp; <strong>Missing Numbers:</strong> ${missingList}</p>
  </div>
  <div class="subsection">Hidden Passions</div>
  ${prose(d.hidden_patterns?.hidden_passions)}
  <div class="subsection">Karmic Lessons</div>
  ${prose(d.hidden_patterns?.karmic_lessons)}
  <div class="subsection">The Deeper Pattern</div>
  ${prose(d.hidden_patterns?.synthesis)}
${closeSectionDiv()}

${p.has_karmic_debt && karmicList.length && d.karmic_debt ? `
${sectionHeader('10', `Karmic Debt — The Soul's Accelerated Curriculum`)}
  <div class="callout avoid-break">
    <div class="callout-title">Karmic Compound${karmicList.length > 1 ? 's' : ''} Detected</div>
    <p>Your chart carries the karmic compound${karmicList.length > 1 ? 's' : ''} <strong>${karmicList.join(' and ')}</strong>, located in your <strong>${(Array.isArray(p.karmic_debt_locations) ? p.karmic_debt_locations : []).join(' and ')}</strong>. This is a significant soul-level pattern — not a punishment, but an accelerated curriculum the soul chose.</p>
  </div>
  ${prose(d.karmic_debt)}
${closeSectionDiv()}` : ''}

${masterList.length && d.master_numbers ? `
${sectionHeader('11', `Master Number${masterList.length > 1 ? 's' : ''} ${masterList.join(' & ')}`)}
  <div class="callout avoid-break">
    <div class="callout-title">Master Number Detected ⭐</div>
    <p>Your chart carries Master Number${masterList.length > 1 ? 's' : ''} <strong>${masterList.join(' and ')}</strong>. This appears in fewer than ${masterList.includes(22) ? '3%' : '8%'} of charts. Master Numbers carry both heightened gifts and heightened responsibility.</p>
  </div>
  ${prose(d.master_numbers)}
${closeSectionDiv()}` : ''}

${sectionHeader('12', `Life Cycles — Pinnacles & Challenges`)}
  <table class="num-table avoid-break">
    <thead>
      <tr><th>Pinnacle</th><th style="text-align:center;">Number</th><th>Period</th><th>Active?</th></tr>
    </thead>
    <tbody>
      <tr><td>Pinnacle 1</td><td class="num-col"><span class="num-badge">${p.pinnacle_1 || '—'}</span></td><td>${p1Label}</td><td>${p.current_pinnacle === p.pinnacle_1 && !p.pinnacle_2_start_age ? '✓ Active now' : ''}</td></tr>
      <tr><td>Pinnacle 2</td><td class="num-col"><span class="num-badge">${p.pinnacle_2 || '—'}</span></td><td>${p2Label}</td><td>${p.current_pinnacle === p.pinnacle_2 ? '✓ Active now' : ''}</td></tr>
      <tr><td>Pinnacle 3</td><td class="num-col"><span class="num-badge">${p.pinnacle_3 || '—'}</span></td><td>${p3Label}</td><td>${p.current_pinnacle === p.pinnacle_3 ? '✓ Active now' : ''}</td></tr>
      <tr><td>Pinnacle 4</td><td class="num-col"><span class="num-badge">${p.pinnacle_4 || '—'}</span></td><td>${p4Label}</td><td>${p.current_pinnacle === p.pinnacle_4 ? '✓ Active now' : ''}</td></tr>
    </tbody>
  </table>
  <table class="num-table avoid-break" style="margin-top:20px;">
    <thead>
      <tr><th>Challenge</th><th style="text-align:center;">Number</th><th>Life Phase</th></tr>
    </thead>
    <tbody>
      <tr><td>Challenge 1</td><td class="num-col"><span class="num-badge">${p.challenge_1 ?? '—'}</span></td><td>Youth and early life</td></tr>
      <tr><td>Challenge 2</td><td class="num-col"><span class="num-badge">${p.challenge_2 ?? '—'}</span></td><td>Young adulthood</td></tr>
      <tr><td>Challenge 3</td><td class="num-col"><span class="num-badge">${p.challenge_3 ?? '—'}</span></td><td>Mid-life</td></tr>
      <tr><td>Challenge 4</td><td class="num-col"><span class="num-badge">${p.challenge_4 ?? '—'}</span></td><td>Later life — the lifelong theme</td></tr>
    </tbody>
  </table>
  <div class="subsection">The Arc of Your Four Pinnacles</div>
  ${prose(d.life_cycles?.pinnacle_map)}
  <div class="subsection">Your Current Pinnacle — Pinnacle ${p.current_pinnacle}</div>
  ${prose(d.life_cycles?.current_pinnacle)}
  ${d.life_cycles?.current_pinnacle_life_domains ? `
  <div class="subsection">What This Pinnacle Means Right Now</div>
  ${prose(d.life_cycles.current_pinnacle_life_domains)}` : ''}
  <div class="subsection">The Four Challenges</div>
  ${prose(d.life_cycles?.challenge_map)}
  <div class="subsection">Your Current Challenge — Challenge ${p.current_challenge}</div>
  ${prose(d.life_cycles?.current_challenge)}
  ${d.life_cycles?.life_period ? `
  <div class="subsection">Your Current Life Period</div>
  ${prose(d.life_cycles.life_period)}` : ''}
${closeSectionDiv()}

${sectionHeader('13', `Current Timing — ${currentYear} and Beyond`)}
  <div class="callout-teal avoid-break">
    <div class="callout-teal-title">Your Numbers Right Now</div>
    <p>
      <strong>Personal Year ${p.personal_year_number}</strong> (${currentYear}) &nbsp;·&nbsp;
      <strong>Personal Month ${p.personal_month_number || '—'}</strong> &nbsp;·&nbsp;
      <strong>Universal Year ${p.universal_year_number}</strong>
    </p>
  </div>
  <div class="subsection">Personal Year ${p.personal_year_number} in ${currentYear}</div>
  ${prose(d.timing?.personal_year)}
  ${d.timing?.personal_month ? `
  <div class="subsection">Personal Month ${p.personal_month_number || ''} — Right Now</div>
  ${prose(d.timing.personal_month)}` : ''}
  <div class="subsection">Universal Year ${p.universal_year_number} — The Collective Current</div>
  ${prose(d.timing?.universal_year)}
  <div class="subsection">How These Years Work Together for You</div>
  ${prose(d.timing?.year_synthesis)}
${closeSectionDiv()}

${sectionHeader('14', `Active Letter Transits`)}
  <div class="callout-teal avoid-break">
    <div class="callout-teal-title">Your Active Letters Right Now</div>
    <p>Three letters from your name are simultaneously active — one from each name segment. This specific combination applies only to you in this exact period.</p>
    <table style="width:auto;border-collapse:collapse;margin-top:8px;font-size:10pt;">
      <tr>
        <td style="padding:4px 14px 4px 0;font-weight:bold;">Physical Transit</td>
        <td style="padding:4px 8px;"><span class="num-badge" style="font-size:13pt;">${p.physical_transit || '?'}</span></td>
        <td style="padding:4px;color:${C.muted};">value ${p.physical_transit_value || '?'} — outer world &amp; circumstances</td>
      </tr>
      <tr>
        <td style="padding:4px 14px 4px 0;font-weight:bold;">Mental Transit</td>
        <td style="padding:4px 8px;"><span class="num-badge" style="font-size:13pt;">${p.mental_transit || '?'}</span></td>
        <td style="padding:4px;color:${C.muted};">value ${p.mental_transit_value || '?'} — inner life &amp; thinking</td>
      </tr>
      <tr>
        <td style="padding:4px 14px 4px 0;font-weight:bold;">Spiritual Transit</td>
        <td style="padding:4px 8px;"><span class="num-badge" style="font-size:13pt;">${p.spiritual_transit || '?'}</span></td>
        <td style="padding:4px;color:${C.muted};">value ${p.spiritual_transit_value || '?'} — karmic &amp; spiritual layer</td>
      </tr>
      <tr style="border-top:1px solid ${C.border};">
        <td style="padding:8px 14px 4px 0;font-weight:bold;">Essence Number</td>
        <td style="padding:8px 8px 4px;"><span class="num-badge" style="font-size:13pt;">${p.essence_number || '?'}</span></td>
        <td style="padding:8px 0 4px;color:${C.muted};">sum of all three — overarching karmic theme</td>
      </tr>
    </table>
  </div>
  <div class="subsection">Physical Transit — Letter ${p.physical_transit || '?'}</div>
  ${prose(d.transits?.physical)}
  <div class="subsection">Mental Transit — Letter ${p.mental_transit || '?'}</div>
  ${prose(d.transits?.mental)}
  <div class="subsection">Spiritual Transit — Letter ${p.spiritual_transit || '?'}</div>
  ${prose(d.transits?.spiritual)}
  <div class="subsection">Essence Number ${p.essence_number || '?'}</div>
  ${prose(d.transits?.essence)}
  <div class="subsection">This Period in Full</div>
  ${prose(d.transits?.period_synthesis)}
${closeSectionDiv()}

${sectionHeader('15', `Bridge Numbers — Closing the Gaps`)}
  <div class="insight avoid-break">
    <div class="insight-title">Your Bridge Numbers</div>
    <p>
      <strong>Soul–Expression Bridge: ${p.soul_expression_bridge ?? '—'}</strong> — gap between Soul Urge ${p.soul_urge_number} and Name ${p.name_number} &nbsp;·&nbsp;
      <strong>Life–Personality Bridge: ${p.life_personality_bridge ?? '—'}</strong> — gap between Destiny ${p.destiny_number} and Personality ${p.personality_number}
    </p>
    <p>
      <strong>Rational Thought Number: ${p.rational_thought_number ?? '—'}</strong> — how you think and process &nbsp;·&nbsp;
      <strong>Balance Number: ${p.balance_number ?? '—'}</strong> — how you restore equilibrium under stress
    </p>
  </div>
  <div class="subsection">Soul–Expression Bridge</div>
  ${prose(d.bridge_numbers?.soul_expression)}
  <div class="subsection">Life–Personality Bridge</div>
  ${prose(d.bridge_numbers?.life_personality)}
  ${renderHowToClose(d.bridge_numbers?.how_to_close)}
${closeSectionDiv()}

${sectionHeader('16', `Maturity & Power — Who You Are Becoming`)}
  <div class="insight avoid-break">
    <div class="insight-title">Looking Ahead</div>
    <p>
      <strong>Maturity Number: ${p.maturity_number}${p.maturity_compound && p.maturity_compound !== p.maturity_number ? ` (compound ${p.maturity_compound})` : ''}</strong> — the energy emerging fully after your mid-30s &nbsp;·&nbsp;
      <strong>Power Number: ${p.power_number}${p.power_compound && p.power_compound !== p.power_number ? ` (compound ${p.power_compound})` : ''}</strong> — your highest functioning potential
    </p>
  </div>
  <div class="subsection">Maturity Number ${p.maturity_number} — Who You Are Growing Into</div>
  ${prose(d.maturity_power?.maturity)}
  <div class="subsection">Power Number ${p.power_number} — What You Are Capable Of</div>
  ${prose(d.maturity_power?.power)}
  <div class="subsection">The Arc of Becoming</div>
  ${prose(d.maturity_power?.synthesis)}
${closeSectionDiv()}

<div class="closing">
  <div class="closing-title">✦ A Final Word for ${firstName}</div>
  ${prose(d.closing_synthesis, 'closing')}
</div>

<div class="footer">
  <strong>Occult Pulse</strong> &nbsp;·&nbsp; Complete Chaldean Numerology Reading &nbsp;·&nbsp; Prepared for ${name} &nbsp;·&nbsp; ${genDate}<br>
  This reading is for personal reflection and self-understanding. It does not constitute medical, legal, or financial advice.<br>
  Numerology is a symbolic system of self-inquiry. All interpretations are tendencies, not fixed fates.
  <div class="footer-ref">Report Reference: {{REPORT_REF_ID}}</div>
</div>

</body>
</html>`;
}

// ────────────────────────────────────────────────────────────
// BUILD HTML FROM CARDS — ref ID placeholder added to footer
// ────────────────────────────────────────────────────────────
function buildHTMLFromCards(dispatchResult, profile) {
  const name = profile.name_used || profile.name || 'Client';
  const genDate = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
  const cardRows = (dispatchResult.cards || []).map(card => `
    <div style="margin-bottom:24px;page-break-inside:avoid;">
      <div style="background:${C.dark};color:#fff;padding:10px 16px;font-weight:bold;font-size:13pt;border-left:5px solid ${C.gold};">
        ${card.title || `Card ${card.card_number}`}
        ${card.subtitle ? `<span style="font-weight:normal;font-size:10pt;opacity:0.8;margin-left:12px;">${card.subtitle}</span>` : ''}
      </div>
      <div style="padding:16px;line-height:1.75;font-size:11pt;background:#fff;border:1px solid ${C.border};border-top:none;">
        ${(card.body || '').split('\n\n').filter(Boolean).map(p => `<p style="margin:0 0 12px 0;">${p}</p>`).join('')}
      </div>
    </div>
  `).join('');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<style>${sharedCSS()}</style>
</head><body>
<div class="cover">
  <div class="cover-brand">✦ Occult Pulse ✦</div>
  <div class="cover-title">Numerology Reading</div>
  <div class="cover-subtitle">${name}</div>
  <hr class="cover-divider"/>
  <div style="color:rgba(255,255,255,0.6);font-size:10pt;">${profile.dob_fmt || ''} &nbsp;·&nbsp; ${genDate}</div>
  <div class="cover-ref">{{REPORT_REF_ID}}</div>
</div>
<div class="page">${cardRows}</div>
<div class="footer">
  Occult Pulse &nbsp;·&nbsp; ${genDate} &nbsp;·&nbsp; Chaldean Numerology System
  <div class="footer-ref">Report Reference: {{REPORT_REF_ID}}</div>
</div>
</body></html>`;
}

// ────────────────────────────────────────────────────────────
// FALLBACK HTML — ref ID placeholder added to footer
// ────────────────────────────────────────────────────────────
function buildFallbackHTML(profile) {
  const name    = profile.name_used || profile.name || 'Client';
  const genDate = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>${sharedCSS()}</style>
</head><body>
<div class="cover">
  <div class="cover-brand">✦ Occult Pulse ✦</div>
  <div class="cover-title">Numerology Reading</div>
  <div class="cover-subtitle">${name}</div>
  <div class="cover-ref">{{REPORT_REF_ID}}</div>
</div>
<div class="page">
  <table class="num-table">
    <thead><tr><th>Number Type</th><th>Value</th></tr></thead>
    <tbody>
      <tr><td>Psychic</td>     <td><span class="num-badge">${profile.psychic_number || '—'}</span></td></tr>
      <tr><td>Destiny</td>     <td><span class="num-badge">${profile.destiny_number || '—'}</span></td></tr>
      <tr><td>Name</td>        <td><span class="num-badge">${profile.name_number || '—'}</span></td></tr>
      <tr><td>Soul Urge</td>   <td><span class="num-badge">${profile.soul_urge_number || '—'}</span></td></tr>
      <tr><td>Personality</td> <td><span class="num-badge">${profile.personality_number || '—'}</span></td></tr>
      <tr><td>Life Path</td>   <td><span class="num-badge">${profile.life_path_number || profile.destiny_number || '—'}</span></td></tr>
      <tr><td>Maturity</td>    <td><span class="num-badge">${profile.maturity_number || '—'}</span></td></tr>
      <tr><td>Power</td>       <td><span class="num-badge">${profile.power_number || '—'}</span></td></tr>
      <tr><td>Personal Year</td><td><span class="num-badge">${profile.personal_year_number || '—'}</span></td></tr>
    </tbody>
  </table>
</div>
<div class="footer">
  Occult Pulse &nbsp;·&nbsp; ${genDate} &nbsp;·&nbsp; Chaldean Numerology System
  <div class="footer-ref">Report Reference: {{REPORT_REF_ID}}</div>
</div>
</body></html>`;
}

module.exports = { handlePaidReading };