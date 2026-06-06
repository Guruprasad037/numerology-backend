// ============================================================
//  src/routes/admin.js  v8
//
//  CHANGES from v7:
//    - /admin/export  new endpoint — multi-sheet .xlsx export
//      (Readings, Orders, Profiles, Customers) using SheetJS
//    - All other endpoints unchanged
// ============================================================

const express = require("express");
const router  = express.Router();
const { dbAll, dbGet, dbRun } = require("../config/db");
const { requireAdmin }        = require("../middleware/auth");

let htmlDocx;
try { htmlDocx = require("html-docx-js"); }
catch (e) { console.warn("[admin.js] html-docx-js not available:", e.message); }

let XLSX;
try { XLSX = require("xlsx"); }
catch (e) { console.warn("[admin.js] xlsx not available:", e.message); }

router.use(requireAdmin);

// ────────────────────────────────────────────────────────────
// Helper: safely parse jsonb — pg may return object or string
// ────────────────────────────────────────────────────────────
function parseReportContent(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return null; }
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
           FROM orders o JOIN customers c ON c.id = o.user_id
           WHERE o.status = 'paid' ORDER BY o.created_at DESC LIMIT 5`
        ),
        dbGet(`SELECT COUNT(*) AS count FROM readings WHERE status IN ('pending','generated') AND order_id IS NOT NULL`),
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
// ────────────────────────────────────────────────────────────
router.get("/fulfilment", async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT
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
        CASE
          WHEN r.report_content IS NOT NULL
           AND (r.report_content->>'html' IS NOT NULL
             OR r.report_content->>'html_source' IS NOT NULL)
          THEN true ELSE false
        END                 AS has_report,
        c.full_name         AS customer_full_name,
        c.email,
        c.phone,
        c.dob               AS customer_dob,
        c.gender            AS customer_gender,
        c.tier,
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
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch fulfilment data." }); }
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
           FROM customers WHERE tier = $1 AND deleted_at IS NULL ORDER BY created_at DESC`, [tier])
      : await dbAll(
          `SELECT id, full_name, dob, email, phone, gender, tier, locale,
                  timezone, created_at, updated_at, deleted_at
           FROM customers WHERE deleted_at IS NULL ORDER BY created_at DESC`);
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
      `SELECT np.id, np.user_id, c.full_name, np.name_used, np.dob_used, np.is_primary,
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
       WHERE np.is_primary = TRUE ORDER BY np.calculated_at DESC`
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
    const q = `SELECT o.id, o.user_id, o.product_slug, o.product_name,
                      o.amount, o.currency, o.coupon_code, o.discount_amount,
                      o.final_amount, o.status, o.gateway, o.gateway_order_id,
                      o.gateway_payment_id, o.gateway_metadata, o.failure_reason,
                      o.ip_address, o.country_code, o.notes,
                      o.is_self, o.customer_name, o.subject_name, o.subject_dob, o.subject_gender,
                      o.created_at, o.paid_at, o.refunded_at,
                      c.full_name AS customer_full_name, c.email, c.phone
               FROM orders o JOIN customers c ON c.id = o.user_id`;
    const rows = status && status !== "all"
      ? await dbAll(q + ` WHERE o.status = $1 ORDER BY o.created_at DESC`, [status])
      : await dbAll(q + ` ORDER BY o.created_at DESC`);
    res.json({ count: rows.length, orders: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch orders." }); }
});

// ────────────────────────────────────────────────────────────
// READINGS — all 19 columns
// ────────────────────────────────────────────────────────────
router.get("/readings", async (req, res) => {
  try {
    const { status } = req.query;
    const q = `SELECT r.id, r.user_id, r.profile_id, r.order_id,
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
               LEFT JOIN orders o ON o.id = r.order_id`;
    const rows = status && status !== "all"
      ? await dbAll(q + ` WHERE r.status = $1 ORDER BY r.created_at DESC`, [status])
      : await dbAll(q + ` ORDER BY r.created_at DESC`);
    res.json({ count: rows.length, readings: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch readings." }); }
});

// ────────────────────────────────────────────────────────────
// EXPORT — 4-sheet .xlsx
// Sheet 1: Readings  Sheet 2: Orders
// Sheet 3: Profiles  Sheet 4: Customers
// ────────────────────────────────────────────────────────────
router.get("/export", async (req, res) => {
  if (!XLSX) return res.status(500).json({ error: "xlsx package not installed. Run: npm install xlsx" });
  try {
    const now = new Date();
    const dateStr = now.toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
    const brand   = "Occult Pulse";

    // ── fetch all 4 tables ──
    const [readings, orders, profiles, customers] = await Promise.all([
      dbAll(
        `SELECT r.id, r.user_id, r.profile_id, r.order_id,
                r.product_slug, r.status, r.engine_used, r.engine_model, r.engine_config,
                r.language, r.delivered_to, r.generated_at, r.delivered_at, r.created_at,
                r.report_sent_at, r.sent_by, r.admin_notes,
                r.report_text,
                r.report_content::text AS report_content_raw,
                c.full_name AS customer_full_name, c.email,
                o.subject_name, o.subject_dob, o.is_self
         FROM readings r
         JOIN customers c ON c.id = r.user_id
         LEFT JOIN orders o ON o.id = r.order_id
         ORDER BY r.created_at ASC`
      ),
      dbAll(
        `SELECT o.id, o.user_id, o.product_slug, o.product_name,
                o.amount, o.currency, o.coupon_code, o.discount_amount, o.final_amount,
                o.status, o.gateway, o.gateway_order_id, o.gateway_payment_id,
                o.failure_reason, o.ip_address, o.country_code, o.notes,
                o.is_self, o.customer_name, o.subject_name, o.subject_dob, o.subject_gender,
                o.created_at, o.paid_at, o.refunded_at,
                c.full_name AS customer_full_name, c.email, c.phone
         FROM orders o JOIN customers c ON c.id = o.user_id
         ORDER BY o.created_at ASC`
      ),
      dbAll(
        `SELECT np.id, np.user_id, c.full_name, np.name_used, np.dob_used, np.is_primary,
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
         WHERE np.is_primary = TRUE ORDER BY np.calculated_at ASC`
      ),
      dbAll(
        `SELECT id, full_name, dob, email, phone, gender, tier, locale, timezone,
                created_at, updated_at, deleted_at
         FROM customers WHERE deleted_at IS NULL ORDER BY created_at ASC`
      ),
    ]);

    const wb = XLSX.utils.book_new();

    // ── helper: build a sheet with a branded title block + data table ──
    function makeSheet(title, rows, colDefs) {
      // title block rows
      const titleRows = [
        [brand],
        [title],
        [`Exported: ${dateStr}`],
        [`Total records: ${rows.length}`],
        [], // blank spacer
      ];

      // header row
      const header = ["#", ...colDefs.map(c => c.label)];

      // data rows
      const dataRows = rows.map((r, i) => [
        i + 1,
        ...colDefs.map(c => {
          const v = c.get ? c.get(r) : r[c.key];
          if (v === null || v === undefined) return "";
          if (Array.isArray(v)) return v.join(", ");
          if (typeof v === "object") return JSON.stringify(v);
          return v;
        }),
      ]);

      const allRows = [...titleRows, header, ...dataRows];
      const ws = XLSX.utils.aoa_to_sheet(allRows);

      // ── column widths ──
      const colWidths = [{ wch: 5 }, ...colDefs.map(c => ({ wch: Math.min(c.width || 20, 60) }))];
      ws["!cols"] = colWidths;

      // ── styles via cell objects ──
      const headerRowIdx = titleRows.length; // 0-based row index of header

      // Brand name cell — large bold
      const brandCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if (ws[brandCell]) ws[brandCell].s = { font: { bold: true, sz: 16, color: { rgb: "B5621E" } } };

      // Sheet title cell — bold
      const titleCell = XLSX.utils.encode_cell({ r: 1, c: 0 });
      if (ws[titleCell]) ws[titleCell].s = { font: { bold: true, sz: 13 } };

      // Meta cells — italic grey
      for (let r = 2; r <= 3; r++) {
        const cell = XLSX.utils.encode_cell({ r, c: 0 });
        if (ws[cell]) ws[cell].s = { font: { italic: true, color: { rgb: "9E9086" } } };
      }

      // Header row — bold white on dark background
      for (let c = 0; c < header.length; c++) {
        const cell = XLSX.utils.encode_cell({ r: headerRowIdx, c });
        if (ws[cell]) {
          ws[cell].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "2C1F14" } },
            alignment: { horizontal: "center", wrapText: true },
            border: {
              bottom: { style: "thin", color: { rgb: "B5621E" } },
            },
          };
        }
      }

      // Data rows — alternating background + wrap long text
      dataRows.forEach((_, i) => {
        const rowIdx = headerRowIdx + 1 + i;
        const bg = i % 2 === 0 ? "FFFFFF" : "F9F8F6";
        for (let c = 0; c < header.length; c++) {
          const cell = XLSX.utils.encode_cell({ r: rowIdx, c });
          if (ws[cell]) {
            ws[cell].s = {
              fill: { fgColor: { rgb: bg } },
              alignment: { vertical: "top", wrapText: true },
              border: {
                bottom: { style: "hair", color: { rgb: "E4E2DE" } },
              },
            };
          }
        }
        // serial number cell — bold amber
        const snCell = XLSX.utils.encode_cell({ r: rowIdx, c: 0 });
        if (ws[snCell]) ws[snCell].s = { ...ws[snCell].s, font: { bold: true, color: { rgb: "B5621E" } } };
      });

      return ws;
    }

    // ── Sheet 1: Readings ──
    const readingCols = [
      { key:"id",                 label:"Reading ID",     width:38 },
      { key:"user_id",            label:"User ID",        width:38 },
      { key:"profile_id",         label:"Profile ID",     width:38 },
      { key:"order_id",           label:"Order ID",       width:38 },
      { key:"customer_full_name", label:"Customer",       width:22 },
      { key:"email",              label:"Email",          width:26 },
      { key:"subject_name",       label:"Subject Name",   width:22 },
      { key:"subject_dob",        label:"Subject DOB",    width:14 },
      { key:"is_self",            label:"Is Self",        width:10 },
      { key:"product_slug",       label:"Product Slug",   width:24 },
      { key:"status",             label:"Status",         width:14 },
      { key:"engine_used",        label:"Engine",         width:14 },
      { key:"engine_model",       label:"Engine Model",   width:20 },
      { key:"engine_config",      label:"Engine Config",  width:18 },
      { key:"language",           label:"Language",       width:10 },
      { key:"delivered_to",       label:"Delivered To",   width:26 },
      { key:"sent_by",            label:"Sent By",        width:16 },
      { key:"admin_notes",        label:"Admin Notes",    width:40 },
      { key:"generated_at",       label:"Generated At",   width:20 },
      { key:"delivered_at",       label:"Delivered At",   width:20 },
      { key:"report_sent_at",     label:"Report Sent At", width:20 },
      { key:"created_at",         label:"Created At",     width:20 },
      { key:"report_text",        label:"Report Text",    width:60 },
      { key:"report_content_raw", label:"Report Content (HTML)", width:60 },
    ];
    wb.SheetNames.push("Readings");
    wb.Sheets["Readings"] = makeSheet("Readings", readings, readingCols);

    // ── Sheet 2: Orders ──
    const orderCols = [
      { key:"id",                 label:"Order ID",         width:38 },
      { key:"user_id",            label:"User ID",          width:38 },
      { key:"customer_full_name", label:"Customer",         width:22 },
      { key:"email",              label:"Email",            width:26 },
      { key:"phone",              label:"Phone",            width:16 },
      { key:"customer_name",      label:"Customer Name",    width:22 },
      { key:"subject_name",       label:"Subject Name",     width:22 },
      { key:"subject_dob",        label:"Subject DOB",      width:14 },
      { key:"subject_gender",     label:"Subject Gender",   width:14 },
      { key:"is_self",            label:"Is Self",          width:10 },
      { key:"product_slug",       label:"Product Slug",     width:24 },
      { key:"product_name",       label:"Product Name",     width:26 },
      { key:"amount",             label:"Amount (paise)",   width:16, get: r => r.amount != null ? r.amount / 100 : "" },
      { key:"discount_amount",    label:"Discount",         width:14, get: r => r.discount_amount != null ? r.discount_amount / 100 : "" },
      { key:"final_amount",       label:"Final Amount ₹",   width:16, get: r => r.final_amount != null ? r.final_amount / 100 : "" },
      { key:"currency",           label:"Currency",         width:10 },
      { key:"coupon_code",        label:"Coupon",           width:16 },
      { key:"status",             label:"Status",           width:14 },
      { key:"gateway",            label:"Gateway",          width:14 },
      { key:"gateway_order_id",   label:"Gateway Order ID", width:30 },
      { key:"gateway_payment_id", label:"Gateway Pmt ID",   width:30 },
      { key:"failure_reason",     label:"Failure Reason",   width:30 },
      { key:"ip_address",         label:"IP Address",       width:18 },
      { key:"country_code",       label:"Country",          width:10 },
      { key:"notes",              label:"Notes",            width:30 },
      { key:"created_at",         label:"Created At",       width:20 },
      { key:"paid_at",            label:"Paid At",          width:20 },
      { key:"refunded_at",        label:"Refunded At",      width:20 },
    ];
    wb.SheetNames.push("Orders");
    wb.Sheets["Orders"] = makeSheet("Orders", orders, orderCols);

    // ── Sheet 3: Numerology Profiles ──
    const profileCols = [
      { key:"id",                   label:"Profile ID",           width:38 },
      { key:"user_id",              label:"User ID",              width:38 },
      { key:"full_name",            label:"Customer Name",        width:22 },
      { key:"name_used",            label:"Name Used",            width:22 },
      { key:"dob_used",             label:"DOB Used",             width:14 },
      { key:"is_primary",           label:"Is Primary",           width:10 },
      { key:"psychic_number",       label:"Psychic",              width:10 },
      { key:"psychic_compound",     label:"Psychic Compound",     width:16 },
      { key:"destiny_number",       label:"Destiny",              width:10 },
      { key:"destiny_compound",     label:"Destiny Compound",     width:16 },
      { key:"name_number",          label:"Name Number",          width:14 },
      { key:"name_compound",        label:"Name Compound",        width:14 },
      { key:"soul_urge_number",     label:"Soul Urge",            width:12 },
      { key:"soul_urge_compound",   label:"Soul Urge Compound",   width:18 },
      { key:"personality_number",   label:"Personality",          width:14 },
      { key:"personality_compound", label:"Personality Compound", width:20 },
      { key:"maturity_number",      label:"Maturity",             width:12 },
      { key:"maturity_compound",    label:"Maturity Compound",    width:18 },
      { key:"power_number",         label:"Power",                width:10 },
      { key:"power_compound",       label:"Power Compound",       width:16 },
      { key:"life_path_number",     label:"Life Path",            width:12 },
      { key:"life_path_compound",   label:"Life Path Compound",   width:18 },
      { key:"ruling_planet",        label:"Ruling Planet",        width:14 },
      { key:"pd_combination",       label:"PD Combination",       width:14 },
      { key:"birth_day_number",     label:"Birth Day",            width:12 },
      { key:"birth_month_number",   label:"Birth Month",          width:14 },
      { key:"birth_year_number",    label:"Birth Year",           width:12 },
      { key:"personal_year_number", label:"Personal Year",        width:14 },
      { key:"personal_month_number",label:"Personal Month",       width:16 },
      { key:"personal_day_number",  label:"Personal Day",         width:14 },
      { key:"universal_year_number",label:"Universal Year",       width:16 },
      { key:"universal_month_number",label:"Universal Month",     width:16 },
      { key:"pinnacle_1",           label:"Pinnacle 1",           width:12 },
      { key:"pinnacle_1_start_age", label:"P1 Start Age",         width:14 },
      { key:"pinnacle_1_end_age",   label:"P1 End Age",           width:12 },
      { key:"pinnacle_2",           label:"Pinnacle 2",           width:12 },
      { key:"pinnacle_2_start_age", label:"P2 Start Age",         width:14 },
      { key:"pinnacle_2_end_age",   label:"P2 End Age",           width:12 },
      { key:"pinnacle_3",           label:"Pinnacle 3",           width:12 },
      { key:"pinnacle_3_start_age", label:"P3 Start Age",         width:14 },
      { key:"pinnacle_3_end_age",   label:"P3 End Age",           width:12 },
      { key:"pinnacle_4",           label:"Pinnacle 4",           width:12 },
      { key:"pinnacle_4_start_age", label:"P4 Start Age",         width:14 },
      { key:"current_pinnacle",     label:"Current Pinnacle",     width:16 },
      { key:"challenge_1",          label:"Challenge 1",          width:12 },
      { key:"challenge_2",          label:"Challenge 2",          width:12 },
      { key:"challenge_3",          label:"Challenge 3",          width:12 },
      { key:"challenge_4",          label:"Challenge 4",          width:12 },
      { key:"current_challenge",    label:"Current Challenge",    width:16 },
      { key:"life_period_1",        label:"Life Period 1",        width:14 },
      { key:"life_period_1_end_age",label:"LP1 End Age",          width:14 },
      { key:"life_period_2",        label:"Life Period 2",        width:14 },
      { key:"life_period_2_end_age",label:"LP2 End Age",          width:14 },
      { key:"life_period_3",        label:"Life Period 3",        width:14 },
      { key:"current_life_period",  label:"Current Life Period",  width:18 },
      { key:"cornerstone",          label:"Cornerstone",          width:12 },
      { key:"cornerstone_value",    label:"Cornerstone Value",    width:16 },
      { key:"capstone",             label:"Capstone",             width:12 },
      { key:"capstone_value",       label:"Capstone Value",       width:14 },
      { key:"first_vowel",          label:"First Vowel",          width:12 },
      { key:"first_vowel_value",    label:"First Vowel Value",    width:16 },
      { key:"subconscious_self",    label:"Subconscious Self",    width:16 },
      { key:"hidden_passions",      label:"Hidden Passions",      width:20 },
      { key:"karmic_lessons",       label:"Karmic Lessons",       width:16 },
      { key:"missing_numbers",      label:"Missing Numbers",      width:16 },
      { key:"has_karmic_debt",      label:"Has Karmic Debt",      width:14 },
      { key:"karmic_debt_numbers",  label:"Karmic Debt Numbers",  width:20 },
      { key:"karmic_debt_locations",label:"Karmic Debt Locations",width:22 },
      { key:"has_master_11",        label:"Master 11",            width:12 },
      { key:"has_master_22",        label:"Master 22",            width:12 },
      { key:"has_master_33",        label:"Master 33",            width:12 },
      { key:"master_numbers_found", label:"Master Numbers",       width:16 },
      { key:"plane_mental_count",   label:"Mental Count",         width:14 },
      { key:"plane_mental_number",  label:"Mental Number",        width:14 },
      { key:"plane_physical_count", label:"Physical Count",       width:16 },
      { key:"plane_physical_number",label:"Physical Number",      width:16 },
      { key:"plane_emotional_count",label:"Emotional Count",      width:16 },
      { key:"plane_emotional_number",label:"Emotional Number",    width:16 },
      { key:"plane_intuitive_count",label:"Intuitive Count",      width:16 },
      { key:"plane_intuitive_number",label:"Intuitive Number",    width:16 },
      { key:"dominant_plane",       label:"Dominant Plane",       width:16 },
      { key:"soul_expression_bridge",label:"Soul-Expression Bridge",width:22 },
      { key:"life_personality_bridge",label:"Life-Personality Bridge",width:22 },
      { key:"rational_thought_number",label:"Rational Thought",  width:16 },
      { key:"balance_number",       label:"Balance Number",       width:14 },
      { key:"physical_transit",     label:"Physical Transit",     width:16 },
      { key:"physical_transit_value",label:"Physical Transit Val",width:18 },
      { key:"mental_transit",       label:"Mental Transit",       width:16 },
      { key:"mental_transit_value", label:"Mental Transit Val",   width:18 },
      { key:"spiritual_transit",    label:"Spiritual Transit",    width:18 },
      { key:"spiritual_transit_value",label:"Spiritual Transit Val",width:20 },
      { key:"essence_number",       label:"Essence Number",       width:14 },
      { key:"schema_version",       label:"Schema Version",       width:14 },
      { key:"calculated_at",        label:"Calculated At",        width:20 },
      { key:"created_at",           label:"Created At",           width:20 },
    ];
    wb.SheetNames.push("Numerology Profiles");
    wb.Sheets["Numerology Profiles"] = makeSheet("Numerology Profiles", profiles, profileCols);

    // ── Sheet 4: Customers ──
    const customerCols = [
      { key:"id",         label:"Customer ID", width:38 },
      { key:"full_name",  label:"Full Name",   width:22 },
      { key:"dob",        label:"DOB",         width:14 },
      { key:"email",      label:"Email",       width:26 },
      { key:"phone",      label:"Phone",       width:16 },
      { key:"gender",     label:"Gender",      width:12 },
      { key:"tier",       label:"Tier",        width:16 },
      { key:"locale",     label:"Locale",      width:10 },
      { key:"timezone",   label:"Timezone",    width:22 },
      { key:"created_at", label:"Created At",  width:20 },
      { key:"updated_at", label:"Updated At",  width:20 },
      { key:"deleted_at", label:"Deleted At",  width:20 },
    ];
    wb.SheetNames.push("Customers");
    wb.Sheets["Customers"] = makeSheet("Customers", customers, customerCols);

    // ── write and send ──
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx", cellStyles: true });
    const filename = `occult-pulse-export-${now.toISOString().slice(0,10)}.xlsx`;
    console.log(`[admin.js] >>> XLSX export | sheets=4 | file="${filename}" | size=${buf.length}`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (err) {
    console.error("[admin.js] Export error:", err);
    res.status(500).json({ error: "Export failed: " + err.message });
  }
});

// ────────────────────────────────────────────────────────────
// DOWNLOAD HTML
// ────────────────────────────────────────────────────────────
router.get("/readings/:id/report-html", async (req, res) => {
  try {
    const reading = await dbGet(`SELECT id, report_content, status FROM readings WHERE id = $1`, [req.params.id]);
    if (!reading) return res.status(404).json({ error: "Reading not found." });
    const rc = parseReportContent(reading.report_content);
    if (!rc) return res.status(400).json({ error: "No report content stored for this reading." });
    const html = rc.html || rc.html_source || null;
    if (!html) return res.status(400).json({ error: "No HTML found in report." });
    const fileName = rc.html_filename || `reading-${req.params.id}.html`;
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
    const reading = await dbGet(`SELECT id, report_content, status FROM readings WHERE id = $1`, [req.params.id]);
    if (!reading) return res.status(404).json({ error: "Reading not found." });
    const rc = parseReportContent(reading.report_content);
    if (!rc) return res.status(400).json({ error: "No report content stored for this reading." });
    const htmlContent = rc.html || rc.html_source || null;
    if (!htmlContent) return res.status(400).json({ error: "No HTML found in report." });
    let fullHtml = htmlContent;
    if (!htmlContent.trim().toLowerCase().startsWith("<!doctype") && !htmlContent.trim().toLowerCase().startsWith("<html")) {
      fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${htmlContent}</body></html>`;
    }
    const docxResult = htmlDocx.asBlob(fullHtml);
    let buffer;
    if (Buffer.isBuffer(docxResult)) { buffer = docxResult; }
    else if (docxResult && typeof docxResult.arrayBuffer === "function") { buffer = Buffer.from(await docxResult.arrayBuffer()); }
    else { buffer = Buffer.from(docxResult); }
    const baseName = (rc.html_filename || `reading-${req.params.id}`).replace(/\.html?$/i, "");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${baseName}.docx"`);
    res.send(buffer);
  } catch (err) { console.error("[admin.js] DOCX error:", err); res.status(500).json({ error: "DOCX failed: " + err.message }); }
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
         report_sent_at=COALESCE(report_sent_at,NOW()), admin_notes=COALESCE(NULLIF($1,''),admin_notes) WHERE id=$2`,
        [admin_notes||"", req.params.id]
      );
      await dbRun(
        `UPDATE customers SET tier='paid_reading', updated_at=NOW()
         WHERE id=(SELECT user_id FROM readings WHERE id=$1) AND tier='free_reading'`,
        [req.params.id]
      );
    } else {
      await dbRun(
        `UPDATE readings SET status=$1, admin_notes=COALESCE(NULLIF($2,''),admin_notes) WHERE id=$3`,
        [status, admin_notes||"", req.params.id]
      );
    }
    res.json({ success: true, status });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update status." }); }
});

// ────────────────────────────────────────────────────────────
// MARK SENT
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
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed to save notes." }); }
});

module.exports = router;