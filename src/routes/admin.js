// ============================================================
//  src/routes/admin.js  v4
//
//  CHANGES from v3:
//    - /readings/:id/report-docx  replaced with
//      /readings/:id/report-html  — downloads .html file
//    - mark-sent, notes, all other endpoints unchanged
// ============================================================

const express = require("express");
const router = express.Router();
const { dbAll, dbGet, dbRun } = require("../config/db");
const { requireAdmin } = require("../middleware/auth");

router.use(requireAdmin);

// ────────────────────────────────────────────────────────────
// DASHBOARD
// ────────────────────────────────────────────────────────────
router.get("/dashboard", async (req, res) => {
  try {
    const [customerStats, orderStats, readingStats, recentOrders, pendingReadings] =
      await Promise.all([
        dbAll(
          `SELECT tier, COUNT(*) AS count
           FROM customers
           WHERE deleted_at IS NULL
           GROUP BY tier`
        ),
        dbAll(
          `SELECT status,
                  COUNT(*) AS count,
                  COALESCE(SUM(final_amount), 0) AS total
           FROM orders
           GROUP BY status`
        ),
        dbAll(
          `SELECT status, COUNT(*) AS count
           FROM readings
           GROUP BY status`
        ),
        dbAll(
          `SELECT o.id,
                  c.full_name AS customer_full_name, c.email,
                  o.customer_name, o.subject_name, o.subject_dob,
                  o.is_self,
                  o.product_name, o.final_amount,
                  o.currency, o.status, o.created_at
           FROM orders o
           JOIN customers c ON c.id = o.user_id
           WHERE o.status = 'paid'
           ORDER BY o.created_at DESC
           LIMIT 5`
        ),
        dbGet(
          `SELECT COUNT(*) AS count
           FROM readings
           WHERE status IN ('pending', 'generated')
             AND order_id IS NOT NULL`
        ),
      ]);

    const paid = orderStats.find((r) => r.status === "paid");

    res.json({
      customers: customerStats,
      orders: orderStats,
      readings: readingStats,
      recent_orders: recentOrders,
      pending_count: parseInt(pendingReadings?.count || 0),
      total_revenue_inr: paid ? Math.round(parseInt(paid.total) / 100) : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard." });
  }
});

// ────────────────────────────────────────────────────────────
// CUSTOMERS
// ────────────────────────────────────────────────────────────
router.get("/customers", async (req, res) => {
  try {
    const { tier } = req.query;
    const rows =
      tier && tier !== "all"
        ? await dbAll(
            `SELECT id, full_name, dob, email, phone, gender, tier, locale,
                    created_at, deleted_at
             FROM customers
             WHERE tier = $1 AND deleted_at IS NULL
             ORDER BY created_at DESC`,
            [tier]
          )
        : await dbAll(
            `SELECT id, full_name, dob, email, phone, gender, tier, locale,
                    created_at, deleted_at
             FROM customers
             WHERE deleted_at IS NULL
             ORDER BY created_at DESC`
          );
    res.json({ count: rows.length, customers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch customers." });
  }
});

router.get("/users", async (req, res) => {
  req.url = "/customers";
  router.handle(req, res);
});

// ────────────────────────────────────────────────────────────
// NUMEROLOGY PROFILES
// ────────────────────────────────────────────────────────────
router.get("/profiles", async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT
        np.id,
        np.user_id,
        c.full_name,
        np.name_used,
        np.dob_used,
        np.is_primary,
        np.schema_version,
        np.psychic_number,       np.psychic_compound,
        np.destiny_number,       np.destiny_compound,
        np.name_number,          np.name_compound,
        np.soul_urge_number,     np.soul_urge_compound,
        np.personality_number,   np.personality_compound,
        np.maturity_number,      np.maturity_compound,
        np.power_number,         np.power_compound,
        np.life_path_number,     np.life_path_compound,
        np.ruling_planet,        np.pd_combination,
        np.personal_year_number, np.personal_month_number,
        np.universal_year_number,
        np.pinnacle_1, np.pinnacle_1_end_age,
        np.pinnacle_2, np.pinnacle_2_end_age,
        np.pinnacle_3, np.pinnacle_3_end_age,
        np.pinnacle_4,
        np.current_pinnacle,
        np.challenge_1, np.challenge_2,
        np.challenge_3, np.challenge_4,
        np.current_challenge,
        np.cornerstone, np.capstone, np.first_vowel,
        np.subconscious_self,
        np.hidden_passions,
        np.karmic_lessons,
        np.missing_numbers,
        np.has_karmic_debt,
        np.karmic_debt_numbers,
        np.karmic_debt_locations,
        np.has_master_11, np.has_master_22, np.has_master_33,
        np.master_numbers_found,
        np.dominant_plane,
        np.plane_mental_count, np.plane_physical_count,
        np.plane_emotional_count, np.plane_intuitive_count,
        np.soul_expression_bridge, np.life_personality_bridge,
        np.rational_thought_number, np.balance_number,
        np.essence_number,
        np.physical_transit,  np.physical_transit_value,
        np.mental_transit,    np.mental_transit_value,
        np.spiritual_transit, np.spiritual_transit_value,
        np.calculated_at
       FROM numerology_profiles np
       JOIN customers c ON c.id = np.user_id
       WHERE np.is_primary = TRUE
       ORDER BY np.calculated_at DESC`
    );
    res.json({ count: rows.length, profiles: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profiles." });
  }
});

// ────────────────────────────────────────────────────────────
// ORDERS
// ────────────────────────────────────────────────────────────
router.get("/orders", async (req, res) => {
  try {
    const { status } = req.query;
    const rows =
      status && status !== "all"
        ? await dbAll(
            `SELECT o.*,
                    c.full_name AS customer_full_name, c.email, c.phone
             FROM orders o
             JOIN customers c ON c.id = o.user_id
             WHERE o.status = $1
             ORDER BY o.created_at DESC`,
            [status]
          )
        : await dbAll(
            `SELECT o.*,
                    c.full_name AS customer_full_name, c.email, c.phone
             FROM orders o
             JOIN customers c ON c.id = o.user_id
             ORDER BY o.created_at DESC`
          );
    res.json({ count: rows.length, orders: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// ────────────────────────────────────────────────────────────
// READINGS
// ────────────────────────────────────────────────────────────
router.get("/readings", async (req, res) => {
  try {
    const { status } = req.query;
    const rows =
      status && status !== "all"
        ? await dbAll(
            `SELECT r.id, r.user_id, r.profile_id, r.order_id,
                    c.full_name AS customer_full_name, c.email,
                    o.customer_name, o.subject_name, o.subject_dob, o.is_self,
                    r.product_slug, r.status, r.engine_config, r.engine_used,
                    r.report_content, r.report_text,
                    r.delivered_to, r.generated_at, r.delivered_at, r.created_at
             FROM readings r
             JOIN customers c ON c.id = r.user_id
             LEFT JOIN orders o ON o.id = r.order_id
             WHERE r.status = $1
             ORDER BY r.created_at DESC`,
            [status]
          )
        : await dbAll(
            `SELECT r.id, r.user_id, r.profile_id, r.order_id,
                    c.full_name AS customer_full_name, c.email,
                    o.customer_name, o.subject_name, o.subject_dob, o.is_self,
                    r.product_slug, r.status, r.engine_config, r.engine_used,
                    r.report_content, r.report_text,
                    r.delivered_to, r.generated_at, r.delivered_at, r.created_at
             FROM readings r
             JOIN customers c ON c.id = r.user_id
             LEFT JOIN orders o ON o.id = r.order_id
             ORDER BY r.created_at DESC`
          );
    res.json({ count: rows.length, readings: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch readings." });
  }
});

// ────────────────────────────────────────────────────────────
// PENDING PAID READINGS (Fulfilment Queue)
// ────────────────────────────────────────────────────────────
router.get("/pending-paid", async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT
        r.id              AS reading_id,
        r.status,
        r.product_slug,
        r.created_at      AS reading_created_at,
        r.admin_notes,
        c.full_name       AS customer_full_name,
        c.email,
        c.phone,
        o.id              AS order_id,
        o.customer_name,
        o.subject_name,
        o.subject_dob,
        o.subject_gender,
        o.is_self,
        o.final_amount,
        o.paid_at,
        np.name_used,
        np.dob_used,
        np.psychic_number,      np.psychic_compound,
        np.destiny_number,      np.destiny_compound,
        np.name_number,         np.name_compound,
        np.soul_urge_number,    np.soul_urge_compound,
        np.personality_number,  np.personality_compound,
        np.maturity_number,     np.maturity_compound,
        np.power_number,
        np.personal_year_number,
        np.ruling_planet,       np.pd_combination,
        np.has_karmic_debt,     np.karmic_debt_numbers,
        np.has_master_11,       np.has_master_22,     np.has_master_33,
        np.current_pinnacle,    np.current_challenge,
        np.essence_number,      np.dominant_plane,
        np.missing_numbers,     np.hidden_passions
       FROM readings r
       JOIN customers c  ON c.id  = r.user_id
       LEFT JOIN orders o         ON o.id  = r.order_id
       LEFT JOIN numerology_profiles np ON np.id = r.profile_id
       WHERE r.order_id IS NOT NULL
         AND r.status IN ('pending', 'generated')
         AND r.report_sent_at IS NULL
       ORDER BY o.paid_at ASC NULLS LAST, r.created_at ASC`
    );
    res.json({ count: rows.length, pending: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pending paid readings." });
  }
});

// ────────────────────────────────────────────────────────────
// DOWNLOAD HTML REPORT
// Returns the generated HTML file as a download
// ────────────────────────────────────────────────────────────
router.get("/readings/:id/report-html", async (req, res) => {
  try {
    const reading = await dbGet(
      `SELECT id, report_content, status FROM readings WHERE id = $1`,
      [req.params.id]
    );

    if (!reading) {
      return res.status(404).json({ error: "Reading not found." });
    }

    let reportContent;
    try {
      reportContent = JSON.parse(reading.report_content || "{}");
    } catch (e) {
      return res.status(400).json({ error: "Invalid report format." });
    }

    // Support both new format (html field) and old format (html_source)
    // Old records from before v3 may only have html_source (truncated) or docx_base64
    const htmlContent = reportContent.html || reportContent.html_source || null;

    if (!htmlContent) {
      return res.status(400).json({
        error: "No HTML report found. This reading was generated before HTML storage was added. It cannot be downloaded — the data is a DOCX that failed to generate."
      });
    }

    const fileName = reportContent.html_filename || "report.html";

    console.log(
      `[admin.js] >>> Sending HTML download | readingId=${req.params.id} | fileName="${fileName}" | size=${htmlContent.length}`
    );

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(htmlContent);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to download report." });
  }
});

// ────────────────────────────────────────────────────────────
// MARK READING AS SENT
// Updates status to delivered + saves admin notes
// ────────────────────────────────────────────────────────────
router.post("/readings/:id/mark-sent", async (req, res) => {
  try {
    const { sent_to, sent_by = "admin", admin_notes = "" } = req.body;

    if (!sent_to) {
      return res.status(400).json({ error: "sent_to (email) is required." });
    }

    await dbRun(
      `UPDATE readings
       SET status          = 'delivered',
           delivered_to    = $1,
           report_sent_at  = NOW(),
           delivered_at    = NOW(),
           generated_at    = COALESCE(generated_at, NOW()),
           sent_by         = $2,
           admin_notes     = NULLIF($3, '')
       WHERE id = $4`,
      [sent_to, sent_by, admin_notes, req.params.id]
    );

    // Upgrade customer tier if still free_reading
    await dbRun(
      `UPDATE customers
       SET tier       = 'paid_reading',
           updated_at = NOW()
       WHERE id = (SELECT user_id FROM readings WHERE id = $1)
         AND tier = 'free_reading'`,
      [req.params.id]
    );

    console.log(
      `[admin.js] >>> Reading marked as delivered | readingId=${req.params.id}`
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark reading as sent." });
  }
});

// ────────────────────────────────────────────────────────────
// SAVE ADMIN NOTES (without marking sent)
// ────────────────────────────────────────────────────────────
router.post("/readings/:id/notes", async (req, res) => {
  try {
    const { admin_notes = "" } = req.body;
    await dbRun(`UPDATE readings SET admin_notes = $1 WHERE id = $2`, [
      admin_notes,
      req.params.id,
    ]);

    console.log(`[admin.js] >>> Admin notes saved | readingId=${req.params.id}`);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save notes." });
  }
});

// ────────────────────────────────────────────────────────────
// CSV EXPORT
// ────────────────────────────────────────────────────────────
router.get("/leads/export", async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT
        c.id, c.created_at, c.full_name, c.email, c.phone,
        c.dob, c.gender, c.tier,
        np.psychic_number,       np.psychic_compound,
        np.destiny_number,       np.destiny_compound,
        np.name_number,          np.name_compound,
        np.soul_urge_number,
        np.personality_number,
        np.maturity_number,
        np.power_number,
        np.personal_year_number,
        np.ruling_planet,        np.pd_combination,
        np.has_karmic_debt,      np.karmic_debt_numbers,
        np.has_master_11,        np.has_master_22, np.has_master_33,
        np.current_pinnacle,     np.current_challenge,
        np.dominant_plane,
        np.missing_numbers,      np.essence_number
       FROM customers c
       LEFT JOIN numerology_profiles np
         ON np.user_id = c.id AND np.is_primary = TRUE
       WHERE c.deleted_at IS NULL
       ORDER BY c.created_at DESC`
    );

    const header = [
      "ID","Created At","Name","Email","Phone","DOB","Gender","Tier",
      "Psychic","Psychic Compound","Destiny","Destiny Compound",
      "Name Number","Name Compound","Soul Urge","Personality",
      "Maturity","Power","Personal Year","Ruling Planet","PD Combo",
      "Karmic Debt?","Karmic Debt Numbers",
      "Master 11?","Master 22?","Master 33?",
      "Current Pinnacle","Current Challenge","Dominant Plane",
      "Missing Numbers","Essence Number",
    ].join(",");

    const csv = [
      header,
      ...rows.map((r) => [
        r.id,
        r.created_at,
        `"${(r.full_name || "").replace(/"/g, '""')}"`,
        r.email || "",
        r.phone || "",
        r.dob || "",
        r.gender || "",
        r.tier,
        r.psychic_number ?? "",
        r.psychic_compound ?? "",
        r.destiny_number ?? "",
        r.destiny_compound ?? "",
        r.name_number ?? "",
        r.name_compound ?? "",
        r.soul_urge_number ?? "",
        r.personality_number ?? "",
        r.maturity_number ?? "",
        r.power_number ?? "",
        r.personal_year_number ?? "",
        r.ruling_planet || "",
        r.pd_combination || "",
        r.has_karmic_debt ?? "",
        Array.isArray(r.karmic_debt_numbers) ? `"${r.karmic_debt_numbers.join(",")}"` : "",
        r.has_master_11 ?? "",
        r.has_master_22 ?? "",
        r.has_master_33 ?? "",
        r.current_pinnacle ?? "",
        r.current_challenge ?? "",
        r.dominant_plane || "",
        Array.isArray(r.missing_numbers) ? `"${r.missing_numbers.join(",")}"` : "",
        r.essence_number ?? "",
      ].join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="knowselfnow-leads.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export leads." });
  }
});

module.exports = router;