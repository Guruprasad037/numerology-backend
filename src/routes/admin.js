// ============================================================
//  src/routes/admin.js  v7
//
//  CHANGES from v6:
//    - /admin/fulfilment  new endpoint — full join of all 4
//      tables, all readings (free + paid, all statuses)
//      used by the new Fulfilment table view
//    - All other endpoints unchanged
// ============================================================

const express = require("express");
const router  = express.Router();
const { dbAll, dbGet, dbRun } = require("../config/db");
const { requireAdmin }        = require("../middleware/auth");

let htmlDocx;
try {
  htmlDocx = require("html-docx-js");
} catch (e) {
  console.warn("[admin.js] html-docx-js not available:", e.message);
}

router.use(requireAdmin);

// ────────────────────────────────────────────────────────────
// Helper: safely parse report_content regardless of whether
// pg returns it as a jsonb object or a JSON string
// ────────────────────────────────────────────────────────────
function parseReportContent(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return null;
}

// ────────────────────────────────────────────────────────────
// DASHBOARD
// ────────────────────────────────────────────────────────────
router.get("/dashboard", async (req, res) => {
  try {
    const [customerStats, orderStats, readingStats, recentOrders, pendingReadings] =
      await Promise.all([
        dbAll(`SELECT tier, COUNT(*) AS count FROM customers WHERE deleted_at IS NULL GROUP BY tier`),
        dbAll(`SELECT status, COUNT(*) AS count, COALESCE(SUM(final_amount),0) AS total FROM orders GROUP BY status`),
        dbAll(`SELECT status, COUNT(*) AS count FROM readings GROUP BY status`),
        dbAll(
          `SELECT o.id, c.full_name AS customer_full_name, c.email,
                  o.customer_name, o.subject_name, o.subject_dob, o.is_self,
                  o.product_name, o.final_amount, o.currency, o.status, o.created_at
           FROM orders o
           JOIN customers c ON c.id = o.user_id
           WHERE o.status = 'paid'
           ORDER BY o.created_at DESC LIMIT 5`
        ),
        dbGet(
          `SELECT COUNT(*) AS count FROM readings
           WHERE status IN ('pending','generated') AND order_id IS NOT NULL`
        ),
      ]);
    const paid = orderStats.find(r => r.status === "paid");
    res.json({
      customers: customerStats, orders: orderStats, readings: readingStats,
      recent_orders: recentOrders,
      pending_count: parseInt(pendingReadings?.count || 0),
      total_revenue_inr: paid ? Math.round(parseInt(paid.total) / 100) : 0,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch dashboard." }); }
});

// ────────────────────────────────────────────────────────────
// FULFILMENT — full join, ALL readings, ALL statuses
// One row per reading with every relevant field from all tables
// ────────────────────────────────────────────────────────────
router.get("/fulfilment", async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT
        -- readings (all 19 columns)
        r.id                AS reading_id,
        r.user_id,
        r.profile_id,
        r.order_id,
        r.product_slug,
        r.status            AS reading_status,
        r.engine_used,
        r.engine_model,
        r.engine_config,
        r.language,
        r.delivered_to,
        r.generated_at,
        r.delivered_at,
        r.created_at        AS reading_created_at,
        r.report_sent_at,
        r.sent_by,
        r.admin_notes,
        -- does a report exist? (avoids sending huge jsonb to frontend)
        CASE
          WHEN r.report_content IS NOT NULL
           AND (r.report_content->>'html' IS NOT NULL
             OR r.report_content->>'html_source' IS NOT NULL)
          THEN true
          ELSE false
        END                 AS has_report,

        -- customers
        c.full_name         AS customer_full_name,
        c.email,
        c.phone,
        c.dob               AS customer_dob,
        c.gender            AS customer_gender,
        c.tier,

        -- orders (nullable — free readings have no order)
        o.id                AS order_id_ref,
        o.product_name,
        o.amount,
        o.currency,
        o.coupon_code,
        o.discount_amount,
        o.final_amount,
        o.status            AS order_status,
        o.failure_reason,
        o.is_self,
        o.customer_name,
        o.subject_name,
        o.subject_dob,
        o.subject_gender,
        o.paid_at

       FROM readings r
       JOIN customers c ON c.id = r.user_id
       LEFT JOIN orders o ON o.id = r.order_id
       ORDER BY r.created_at DESC`
    );
    res.json({ count: rows.length, readings: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch fulfilment data." });
  }
});

// ────────────────────────────────────────────────────────────
// CUSTOMERS
// ────────────────────────────────────────────────────────────
router.get("/customers", async (req, res) => {
  try {
    const { tier } = req.query;
    const rows = tier && tier !== "all"
      ? await dbAll(
          `SELECT id, full_name, dob, email, phone, gender, tier, locale,
                  timezone, created_at, updated_at, deleted_at
           FROM customers WHERE tier = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
          [tier]
        )
      : await dbAll(
          `SELECT id, full_name, dob, email, phone, gender, tier, locale,
                  timezone, created_at, updated_at, deleted_at
           FROM customers WHERE deleted_at IS NULL ORDER BY created_at DESC`
        );
    res.json({ count: rows.length, customers: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch customers." }); }
});

router.get("/users", async (req, res) => { req.url = "/customers"; router.handle(req, res); });

// ────────────────────────────────────────────────────────────
// NUMEROLOGY PROFILES
// ────────────────────────────────────────────────────────────
router.get("/profiles", async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT
        np.id, np.user_id, c.full_name, np.name_used, np.dob_used, np.is_primary,
        np.psychic_number, np.psychic_compound, np.destiny_number, np.destiny_compound,
        np.name_number, np.name_compound, np.soul_urge_number, np.soul_urge_compound,
        np.personality_number, np.personality_compound, np.maturity_number, np.maturity_compound,
        np.power_number, np.power_compound, np.ruling_planet, np.pd_combination,
        np.life_path_number, np.life_path_compound,
        np.birth_day_number, np.birth_month_number, np.birth_year_number,
        np.personal_year_number, np.personal_month_number, np.personal_day_number,
        np.universal_year_number, np.universal_month_number,
        np.pinnacle_1, np.pinnacle_1_start_age, np.pinnacle_1_end_age,
        np.pinnacle_2, np.pinnacle_2_start_age, np.pinnacle_2_end_age,
        np.pinnacle_3, np.pinnacle_3_start_age, np.pinnacle_3_end_age,
        np.pinnacle_4, np.pinnacle_4_start_age, np.current_pinnacle,
        np.challenge_1, np.challenge_2, np.challenge_3, np.challenge_4, np.current_challenge,
        np.life_period_1, np.life_period_1_end_age,
        np.life_period_2, np.life_period_2_end_age,
        np.life_period_3, np.current_life_period,
        np.cornerstone, np.cornerstone_value, np.capstone, np.capstone_value,
        np.first_vowel, np.first_vowel_value, np.subconscious_self,
        np.hidden_passions, np.karmic_lessons, np.missing_numbers,
        np.has_karmic_debt, np.karmic_debt_numbers, np.karmic_debt_locations,
        np.has_master_11, np.has_master_22, np.has_master_33, np.master_numbers_found,
        np.plane_mental_count, np.plane_mental_number,
        np.plane_physical_count, np.plane_physical_number,
        np.plane_emotional_count, np.plane_emotional_number,
        np.plane_intuitive_count, np.plane_intuitive_number, np.dominant_plane,
        np.soul_expression_bridge, np.life_personality_bridge,
        np.rational_thought_number, np.balance_number,
        np.physical_transit, np.physical_transit_value,
        np.mental_transit, np.mental_transit_value,
        np.spiritual_transit, np.spiritual_transit_value,
        np.essence_number, np.schema_version, np.calculated_at, np.created_at
       FROM numerology_profiles np
       JOIN customers c ON c.id = np.user_id
       WHERE np.is_primary = TRUE
       ORDER BY np.calculated_at DESC`
    );
    res.json({ count: rows.length, profiles: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch profiles." }); }
});

// ────────────────────────────────────────────────────────────
// ORDERS
// ────────────────────────────────────────────────────────────
router.get("/orders", async (req, res) => {
  try {
    const { status } = req.query;
    const rows = status && status !== "all"
      ? await dbAll(
          `SELECT o.id, o.user_id, o.product_slug, o.product_name,
                  o.amount, o.currency, o.coupon_code, o.discount_amount,
                  o.final_amount, o.status, o.gateway, o.gateway_order_id,
                  o.gateway_payment_id, o.gateway_metadata, o.failure_reason,
                  o.ip_address, o.country_code, o.notes,
                  o.is_self, o.customer_name, o.subject_name, o.subject_dob, o.subject_gender,
                  o.created_at, o.paid_at, o.refunded_at,
                  c.full_name AS customer_full_name, c.email, c.phone
           FROM orders o JOIN customers c ON c.id = o.user_id
           WHERE o.status = $1 ORDER BY o.created_at DESC`,
          [status]
        )
      : await dbAll(
          `SELECT o.id, o.user_id, o.product_slug, o.product_name,
                  o.amount, o.currency, o.coupon_code, o.discount_amount,
                  o.final_amount, o.status, o.gateway, o.gateway_order_id,
                  o.gateway_payment_id, o.gateway_metadata, o.failure_reason,
                  o.ip_address, o.country_code, o.notes,
                  o.is_self, o.customer_name, o.subject_name, o.subject_dob, o.subject_gender,
                  o.created_at, o.paid_at, o.refunded_at,
                  c.full_name AS customer_full_name, c.email, c.phone
           FROM orders o JOIN customers c ON c.id = o.user_id
           ORDER BY o.created_at DESC`
        );
    res.json({ count: rows.length, orders: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch orders." }); }
});

// ────────────────────────────────────────────────────────────
// READINGS  — all 19 columns
// ────────────────────────────────────────────────────────────
router.get("/readings", async (req, res) => {
  try {
    const { status } = req.query;
    const rows = status && status !== "all"
      ? await dbAll(
          `SELECT r.id, r.user_id, r.profile_id, r.order_id,
                  r.product_slug, r.status,
                  r.report_content, r.report_text,
                  r.engine_used, r.engine_model, r.engine_config,
                  r.language, r.delivered_to,
                  r.generated_at, r.delivered_at, r.created_at,
                  r.report_sent_at, r.sent_by, r.admin_notes,
                  c.full_name AS customer_full_name, c.email,
                  o.customer_name, o.subject_name, o.subject_dob, o.is_self
           FROM readings r
           JOIN customers c ON c.id = r.user_id
           LEFT JOIN orders o ON o.id = r.order_id
           WHERE r.status = $1 ORDER BY r.created_at DESC`,
          [status]
        )
      : await dbAll(
          `SELECT r.id, r.user_id, r.profile_id, r.order_id,
                  r.product_slug, r.status,
                  r.report_content, r.report_text,
                  r.engine_used, r.engine_model, r.engine_config,
                  r.language, r.delivered_to,
                  r.generated_at, r.delivered_at, r.created_at,
                  r.report_sent_at, r.sent_by, r.admin_notes,
                  c.full_name AS customer_full_name, c.email,
                  o.customer_name, o.subject_name, o.subject_dob, o.is_self
           FROM readings r
           JOIN customers c ON c.id = r.user_id
           LEFT JOIN orders o ON o.id = r.order_id
           ORDER BY r.created_at DESC`
        );
    res.json({ count: rows.length, readings: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch readings." }); }
});

// ────────────────────────────────────────────────────────────
// PENDING PAID (kept for backward compat — unused by new UI)
// ────────────────────────────────────────────────────────────
router.get("/pending-paid", async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT r.id AS reading_id, r.status, r.product_slug,
              r.created_at AS reading_created_at, r.admin_notes,
              c.full_name AS customer_full_name, c.email, c.phone,
              o.id AS order_id, o.customer_name, o.subject_name,
              o.subject_dob, o.subject_gender, o.is_self, o.final_amount, o.paid_at,
              np.name_used, np.dob_used,
              np.psychic_number, np.psychic_compound,
              np.destiny_number, np.destiny_compound,
              np.name_number, np.name_compound,
              np.soul_urge_number, np.soul_urge_compound,
              np.personality_number, np.personality_compound,
              np.maturity_number, np.maturity_compound,
              np.power_number, np.personal_year_number,
              np.ruling_planet, np.pd_combination,
              np.has_karmic_debt, np.karmic_debt_numbers,
              np.has_master_11, np.has_master_22, np.has_master_33,
              np.current_pinnacle, np.current_challenge,
              np.essence_number, np.dominant_plane,
              np.missing_numbers, np.hidden_passions
       FROM readings r
       JOIN customers c ON c.id = r.user_id
       LEFT JOIN orders o ON o.id = r.order_id
       LEFT JOIN numerology_profiles np ON np.id = r.profile_id
       WHERE r.order_id IS NOT NULL
         AND r.status IN ('pending','generated')
         AND r.report_sent_at IS NULL
       ORDER BY o.paid_at ASC NULLS LAST, r.created_at ASC`
    );
    res.json({ count: rows.length, pending: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch pending paid readings." }); }
});

// ────────────────────────────────────────────────────────────
// DOWNLOAD HTML
// ────────────────────────────────────────────────────────────
router.get("/readings/:id/report-html", async (req, res) => {
  try {
    const reading = await dbGet(
      `SELECT id, report_content, status FROM readings WHERE id = $1`,
      [req.params.id]
    );
    if (!reading) return res.status(404).json({ error: "Reading not found." });
    const rc = parseReportContent(reading.report_content);
    if (!rc) return res.status(400).json({ error: "No report content stored for this reading." });
    const html = rc.html || rc.html_source || null;
    if (!html) return res.status(400).json({ error: "No HTML found in report." });
    const fileName = rc.html_filename || `reading-${req.params.id}.html`;
    console.log(`[admin.js] >>> HTML download | readingId=${req.params.id} | size=${html.length}`);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(html);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to download: " + err.message }); }
});

// ────────────────────────────────────────────────────────────
// DOWNLOAD DOCX
// ────────────────────────────────────────────────────────────
router.get("/readings/:id/report-docx", async (req, res) => {
  try {
    if (!htmlDocx) return res.status(500).json({ error: "html-docx-js not installed." });
    const reading = await dbGet(
      `SELECT id, report_content, status FROM readings WHERE id = $1`,
      [req.params.id]
    );
    if (!reading) return res.status(404).json({ error: "Reading not found." });
    const rc = parseReportContent(reading.report_content);
    if (!rc) return res.status(400).json({ error: "No report content stored for this reading." });
    const htmlContent = rc.html || rc.html_source || null;
    if (!htmlContent) return res.status(400).json({ error: "No HTML found in report." });
    let fullHtml = htmlContent;
    if (!htmlContent.trim().toLowerCase().startsWith("<!doctype") &&
        !htmlContent.trim().toLowerCase().startsWith("<html")) {
      fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${htmlContent}</body></html>`;
    }
    console.log(`[admin.js] >>> HTML→DOCX | readingId=${req.params.id} | size=${fullHtml.length}`);
    const docxResult = htmlDocx.asBlob(fullHtml);
    let buffer;
    if (Buffer.isBuffer(docxResult)) { buffer = docxResult; }
    else if (docxResult && typeof docxResult.arrayBuffer === "function") { buffer = Buffer.from(await docxResult.arrayBuffer()); }
    else { buffer = Buffer.from(docxResult); }
    const baseName = (rc.html_filename || `reading-${req.params.id}`).replace(/\.html?$/i, "");
    const fileName = `${baseName}.docx`;
    console.log(`[admin.js] >>> DOCX | readingId=${req.params.id} | file="${fileName}" | size=${buffer.length}`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (err) { console.error("[admin.js] DOCX error:", err); res.status(500).json({ error: "DOCX conversion failed: " + err.message }); }
});

// ────────────────────────────────────────────────────────────
// UPDATE STATUS + NOTES
// ────────────────────────────────────────────────────────────
router.post("/readings/:id/status", async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const allowed = ["generated","delivered","pending","failed"];
    if (!status || !allowed.includes(status)) return res.status(400).json({ error: `Invalid status. Allowed: ${allowed.join(", ")}` });
    if (status === "delivered") {
      await dbRun(
        `UPDATE readings SET status='delivered', delivered_at=COALESCE(delivered_at,NOW()),
         report_sent_at=COALESCE(report_sent_at,NOW()), admin_notes=COALESCE(NULLIF($1,''),admin_notes)
         WHERE id=$2`,
        [admin_notes || "", req.params.id]
      );
      await dbRun(
        `UPDATE customers SET tier='paid_reading', updated_at=NOW()
         WHERE id=(SELECT user_id FROM readings WHERE id=$1) AND tier='free_reading'`,
        [req.params.id]
      );
    } else {
      await dbRun(
        `UPDATE readings SET status=$1, admin_notes=COALESCE(NULLIF($2,''),admin_notes) WHERE id=$3`,
        [status, admin_notes || "", req.params.id]
      );
    }
    console.log(`[admin.js] >>> Status updated | readingId=${req.params.id} | status=${status}`);
    res.json({ success: true, status });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update status." }); }
});

// ────────────────────────────────────────────────────────────
// MARK SENT (used by Fulfilment for paid readings)
// ────────────────────────────────────────────────────────────
router.post("/readings/:id/mark-sent", async (req, res) => {
  try {
    const { sent_to, sent_by = "admin", admin_notes = "" } = req.body;
    if (!sent_to) return res.status(400).json({ error: "sent_to (email) is required." });
    await dbRun(
      `UPDATE readings SET status='delivered', delivered_to=$1, report_sent_at=NOW(),
       delivered_at=NOW(), generated_at=COALESCE(generated_at,NOW()), sent_by=$2, admin_notes=NULLIF($3,'')
       WHERE id=$4`,
      [sent_to, sent_by, admin_notes, req.params.id]
    );
    await dbRun(
      `UPDATE customers SET tier='paid_reading', updated_at=NOW()
       WHERE id=(SELECT user_id FROM readings WHERE id=$1) AND tier='free_reading'`,
      [req.params.id]
    );
    console.log(`[admin.js] >>> Marked delivered | readingId=${req.params.id}`);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to mark as sent." }); }
});

// ────────────────────────────────────────────────────────────
// SAVE NOTES ONLY
// ────────────────────────────────────────────────────────────
router.post("/readings/:id/notes", async (req, res) => {
  try {
    const { admin_notes = "" } = req.body;
    await dbRun(`UPDATE readings SET admin_notes=$1 WHERE id=$2`, [admin_notes, req.params.id]);
    console.log(`[admin.js] >>> Notes saved | readingId=${req.params.id}`);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to save notes." }); }
});

// ────────────────────────────────────────────────────────────
// CSV EXPORT
// ────────────────────────────────────────────────────────────
router.get("/leads/export", async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT c.id, c.created_at, c.full_name, c.email, c.phone, c.dob, c.gender, c.tier,
              np.psychic_number, np.psychic_compound, np.destiny_number, np.destiny_compound,
              np.name_number, np.name_compound, np.soul_urge_number, np.personality_number,
              np.maturity_number, np.power_number, np.personal_year_number,
              np.ruling_planet, np.pd_combination,
              np.has_karmic_debt, np.karmic_debt_numbers,
              np.has_master_11, np.has_master_22, np.has_master_33,
              np.current_pinnacle, np.current_challenge, np.dominant_plane,
              np.missing_numbers, np.essence_number
       FROM customers c
       LEFT JOIN numerology_profiles np ON np.user_id = c.id AND np.is_primary = TRUE
       WHERE c.deleted_at IS NULL ORDER BY c.created_at DESC`
    );
    const header = ["ID","Created At","Name","Email","Phone","DOB","Gender","Tier",
      "Psychic","Psychic Compound","Destiny","Destiny Compound","Name Number","Name Compound",
      "Soul Urge","Personality","Maturity","Power","Personal Year","Ruling Planet","PD Combo",
      "Karmic Debt?","Karmic Debt Numbers","Master 11?","Master 22?","Master 33?",
      "Current Pinnacle","Current Challenge","Dominant Plane","Missing Numbers","Essence Number",
    ].join(",");
    const csv = [header, ...rows.map(r => [
      r.id, r.created_at,
      `"${(r.full_name||"").replace(/"/g,'""')}"`,
      r.email||"", r.phone||"", r.dob||"", r.gender||"", r.tier,
      r.psychic_number??"", r.psychic_compound??"",
      r.destiny_number??"", r.destiny_compound??"",
      r.name_number??"", r.name_compound??"",
      r.soul_urge_number??"", r.personality_number??"",
      r.maturity_number??"", r.power_number??"",
      r.personal_year_number??"", r.ruling_planet||"", r.pd_combination||"",
      r.has_karmic_debt??"",
      Array.isArray(r.karmic_debt_numbers)?`"${r.karmic_debt_numbers.join(",")}"` : "",
      r.has_master_11??"", r.has_master_22??"", r.has_master_33??"",
      r.current_pinnacle??"", r.current_challenge??"",
      r.dominant_plane||"",
      Array.isArray(r.missing_numbers)?`"${r.missing_numbers.join(",")}"` : "",
      r.essence_number??"",
    ].join(","))].join("\n");
    res.setHeader("Content-Type","text/csv");
    res.setHeader("Content-Disposition",'attachment; filename="knowselfnow-leads.csv"');
    res.send(csv);
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to export." }); }
});

module.exports = router;