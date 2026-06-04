// ============================================================
//  src/routes/admin.js
//  Admin API routes (all protected by requireAdmin middleware)
//
//  Endpoints:
//    GET  /admin/dashboard             — summary stats
//    GET  /admin/customers             — all customers
//    GET  /admin/profiles              — all numerology profiles
//    GET  /admin/orders                — all orders (filter by ?status=)
//    GET  /admin/readings              — all readings (filter by ?status=)
//    GET  /admin/pending               — readings pending delivery
//    POST /admin/readings/:id/deliver  — mark reading as delivered
//    GET  /admin/leads/export          — CSV export of free customers
//
//  Schema: Chaldean numerology_profiles (schema_version = 2)
//  Columns used: psychic_number, destiny_number, name_number,
//                soul_urge_number, personality_number, maturity_number,
//                power_number, personal_year_number, ruling_planet,
//                pd_combination, missing_numbers
// ============================================================

const express = require('express');
const router  = express.Router();
const { dbAll, dbGet, dbRun } = require('../config/db');
const { requireAdmin }        = require('../middleware/auth');

router.use(requireAdmin);


// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

router.get('/dashboard', async (req, res) => {
  try {
    const [customerStats, orderStats, readingStats, recentOrders, pendingReadings] =
      await Promise.all([
        // Customer counts by tier
        dbAll(
          `SELECT tier, COUNT(*) AS count
           FROM customers
           WHERE deleted_at IS NULL
           GROUP BY tier`
        ),

        // Order totals by status
        dbAll(
          `SELECT status,
                  COUNT(*) AS count,
                  COALESCE(SUM(final_amount), 0) AS total
           FROM orders
           GROUP BY status`
        ),

        // Reading counts by status
        dbAll(
          `SELECT status, COUNT(*) AS count
           FROM readings
           GROUP BY status`
        ),

        // 5 most recent paid orders — customer info + subject info
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

        // Count of undelivered paid readings
        dbGet(
          `SELECT COUNT(*) AS count
           FROM readings
           WHERE status = 'pending'
             AND order_id IS NOT NULL`
        ),
      ]);

    const paid = orderStats.find(r => r.status === 'paid');

    res.json({
      customers:         customerStats,
      orders:            orderStats,
      readings:          readingStats,
      recent_orders:     recentOrders,
      pending_count:     parseInt(pendingReadings?.count || 0),
      total_revenue_inr: paid ? Math.round(parseInt(paid.total) / 100) : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard.' });
  }
});


// ─────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────

router.get('/customers', async (req, res) => {
  try {
    const { tier } = req.query;

    const rows = (tier && tier !== 'all')
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
    res.status(500).json({ error: 'Failed to fetch customers.' });
  }
});

// Alias — keeps any existing integrations working
router.get('/users', async (req, res) => {
  req.url = '/customers';
  router.handle(req, res);
});


// ─────────────────────────────────────────────
// NUMEROLOGY PROFILES  (Chaldean schema v2)
// ─────────────────────────────────────────────

router.get('/profiles', async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT np.id,
              np.user_id,
              c.full_name,
              np.name_used,
              np.birth_name_used,
              np.dob_used,
              np.is_primary,

              -- DOB-based
              np.psychic_number,
              np.psychic_compound,
              np.destiny_number,
              np.destiny_compound,
              np.personal_year_number,
              np.ruling_planet,

              -- Name-based
              np.name_number,
              np.name_compound,
              np.soul_urge_number,
              np.soul_urge_compound,
              np.personality_number,
              np.personality_compound,

              -- Birth name (optional)
              np.birth_name_number,
              np.birth_name_compound,

              -- Derived
              np.maturity_number,
              np.power_number,

              -- Chaldean-specific
              np.missing_numbers,
              np.pd_combination,

              np.schema_version,
              np.calculated_at
       FROM numerology_profiles np
       JOIN customers c ON c.id = np.user_id
       WHERE np.is_primary = TRUE
       ORDER BY np.calculated_at DESC`
    );

    res.json({ count: rows.length, profiles: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profiles.' });
  }
});


// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;

    const rows = (status && status !== 'all')
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
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});


// ─────────────────────────────────────────────
// READINGS
// ─────────────────────────────────────────────

router.get('/readings', async (req, res) => {
  try {
    const { status } = req.query;

    const rows = (status && status !== 'all')
      ? await dbAll(
          `SELECT r.id,
                  r.user_id,
                  c.full_name AS customer_full_name,
                  c.email,
                  o.customer_name,
                  o.subject_name,
                  o.subject_dob,
                  o.is_self,
                  r.product_slug,
                  r.status,
                  r.engine_used,
                  r.delivered_to,
                  r.generated_at,
                  r.delivered_at,
                  r.created_at,
                  r.order_id
           FROM readings r
           JOIN customers c ON c.id = r.user_id
           LEFT JOIN orders o ON o.id = r.order_id
           WHERE r.status = $1
           ORDER BY r.created_at DESC`,
          [status]
        )
      : await dbAll(
          `SELECT r.id,
                  r.user_id,
                  c.full_name AS customer_full_name,
                  c.email,
                  o.customer_name,
                  o.subject_name,
                  o.subject_dob,
                  o.is_self,
                  r.product_slug,
                  r.status,
                  r.engine_used,
                  r.delivered_to,
                  r.generated_at,
                  r.delivered_at,
                  r.created_at,
                  r.order_id
           FROM readings r
           JOIN customers c ON c.id = r.user_id
           LEFT JOIN orders o ON o.id = r.order_id
           ORDER BY r.created_at DESC`
        );

    res.json({ count: rows.length, readings: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch readings.' });
  }
});


// ─────────────────────────────────────────────
// PENDING READINGS  (your manual fulfilment queue)
// Paid orders where report hasn't been delivered yet.
// Shows all the Chaldean numbers you need to write the report.
// ─────────────────────────────────────────────

router.get('/pending', async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT
              -- Reading & order identifiers
              r.id              AS reading_id,
              r.product_slug,
              r.created_at      AS reading_created_at,

              -- Customer (the person who paid)
              c.full_name       AS customer_full_name,
              c.email,
              c.phone,
              o.customer_name,

              -- Subject (whose numbers are being read)
              o.subject_name,
              o.subject_dob,
              o.subject_gender,
              o.is_self,

              -- Payment
              o.final_amount,
              o.currency,
              o.paid_at,

              -- Chaldean profile (for writing the report)
              np.name_used,
              np.birth_name_used,
              np.dob_used,

              np.psychic_number,
              np.psychic_compound,
              np.destiny_number,
              np.destiny_compound,
              np.personal_year_number,
              np.ruling_planet,

              np.name_number,
              np.name_compound,
              np.soul_urge_number,
              np.soul_urge_compound,
              np.personality_number,
              np.personality_compound,

              np.birth_name_number,
              np.birth_name_compound,

              np.maturity_number,
              np.power_number,

              np.missing_numbers,
              np.pd_combination

       FROM readings r
       JOIN customers c  ON c.id  = r.user_id
       LEFT JOIN orders o         ON o.id  = r.order_id
       LEFT JOIN numerology_profiles np ON np.id = r.profile_id
       WHERE r.status = 'pending'
         AND r.order_id IS NOT NULL
       ORDER BY r.created_at ASC`
    );

    res.json({ count: rows.length, pending: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending readings.' });
  }
});


// ─────────────────────────────────────────────
// MARK READING AS DELIVERED
// ─────────────────────────────────────────────

router.post('/readings/:id/deliver', async (req, res) => {
  try {
    const { delivered_to, report_text = '' } = req.body;

    if (!delivered_to)
      return res.status(400).json({ error: 'delivered_to (email) is required.' });

    await dbRun(
      `UPDATE readings
       SET status       = 'delivered',
           delivered_to = $1,
           report_text  = NULLIF($2, ''),
           delivered_at = NOW(),
           generated_at = COALESCE(generated_at, NOW())
       WHERE id = $3`,
      [delivered_to, report_text, req.params.id]
    );

    // Upgrade customer tier if still on free
    await dbRun(
      `UPDATE customers
       SET tier       = 'paid_reading',
           updated_at = NOW()
       WHERE id = (SELECT user_id FROM readings WHERE id = $1)
         AND tier = 'free_reading'`,
      [req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark as delivered.' });
  }
});


// ─────────────────────────────────────────────
// CSV EXPORT — all customers / leads
// ─────────────────────────────────────────────

router.get('/leads/export', async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT
              c.id,
              c.created_at,
              c.full_name,
              c.email,
              c.phone,
              c.dob,
              c.gender,
              c.tier,

              -- Chaldean profile numbers
              np.psychic_number,
              np.destiny_number,
              np.name_number,
              np.soul_urge_number,
              np.personality_number,
              np.maturity_number,
              np.power_number,
              np.personal_year_number,
              np.ruling_planet,
              np.pd_combination,
              np.missing_numbers

       FROM customers c
       LEFT JOIN numerology_profiles np
         ON np.user_id = c.id AND np.is_primary = TRUE
       WHERE c.deleted_at IS NULL
       ORDER BY c.created_at DESC`
    );

    const header = [
      'ID', 'Created At', 'Name', 'Email', 'Phone', 'DOB', 'Gender', 'Tier',
      'Psychic Number', 'Destiny Number', 'Name Number',
      'Soul Urge', 'Personality', 'Maturity', 'Power Number',
      'Personal Year', 'Ruling Planet', 'PD Combination', 'Missing Numbers',
    ].join(',');

    const csv = [
      header,
      ...rows.map(r => [
        r.id,
        r.created_at,
        `"${(r.full_name || '').replace(/"/g, '""')}"`,
        r.email        || '',
        r.phone        || '',
        r.dob          || '',
        r.gender       || '',
        r.tier,
        r.psychic_number       || '',
        r.destiny_number       || '',
        r.name_number          || '',
        r.soul_urge_number     || '',
        r.personality_number   || '',
        r.maturity_number      || '',
        r.power_number         || '',
        r.personal_year_number || '',
        r.ruling_planet        || '',
        r.pd_combination       || '',
        // missing_numbers is a Postgres array — convert to readable string
        Array.isArray(r.missing_numbers)
          ? `"${r.missing_numbers.join(', ')}"`
          : (r.missing_numbers || ''),
      ].join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="knowselfnow-leads.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export leads.' });
  }
});


module.exports = router;