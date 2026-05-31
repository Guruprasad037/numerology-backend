// ============================================================
//  routes/admin.js
//  All /admin/* routes — protected by requireAdmin middleware.
//
//  Available endpoints:
//    GET  /admin/orders              — list all orders (filterable by status)
//    GET  /admin/orders/:id          — single order detail
//    POST /admin/orders/:id/complete — mark order as report_sent
//    GET  /admin/dashboard           — order counts + revenue by status
//    GET  /admin/leads               — list all free reading leads
//    GET  /admin/leads/export        — export leads as CSV
// ============================================================

const express          = require('express');
const router           = express.Router();
const { dbAll, dbGet, dbRun } = require('../config/db');
const { requireAdmin } = require('../middleware/auth');


// ── Apply admin auth to ALL routes in this file ───────────────
// Every route below automatically requires the admin token.
router.use(requireAdmin);


// ── GET /admin/orders ─────────────────────────────────────────
// Returns all orders, newest first.
// Optional query param: ?status=paid | pending_payment | report_sent | all
router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;

    const rows = (status && status !== 'all')
      ? await dbAll(
          `SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC`,
          [status]
        )
      : await dbAll(
          `SELECT * FROM orders ORDER BY created_at DESC`,
          []
        );

    return res.json({ count: rows.length, orders: rows });
  } catch (err) {
    console.error('Admin orders error:', err);
    return res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});


// ── GET /admin/orders/:id ─────────────────────────────────────
// Returns a single order by its internal DB id.
router.get('/orders/:id', async (req, res) => {
  try {
    const row = await dbGet(
      `SELECT * FROM orders WHERE id = $1`,
      [req.params.id]
    );

    if (!row) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    return res.json(row);
  } catch (err) {
    console.error('Admin single order error:', err);
    return res.status(500).json({ error: 'Failed to fetch order.' });
  }
});


// ── POST /admin/orders/:id/complete ───────────────────────────
// Marks an order as 'report_sent' and saves optional admin notes.
// Body: { notes: "Sent via email at 10:30am" }
router.post('/orders/:id/complete', async (req, res) => {
  try {
    const { notes = '' } = req.body;

    await dbRun(
      `UPDATE orders
       SET status = 'report_sent', notes = $1
       WHERE id = $2`,
      [notes, req.params.id]
    );

    return res.json({ success: true, message: 'Order marked as report_sent.' });
  } catch (err) {
    console.error('Admin complete order error:', err);
    return res.status(500).json({ error: 'Failed to update order.' });
  }
});


// ── GET /admin/dashboard ──────────────────────────────────────
// Returns order counts and total revenue grouped by status.
// Also includes total paid revenue in rupees for quick reference.
router.get('/dashboard', async (req, res) => {
  try {
    const statusRows = await dbAll(
      `SELECT
         status,
         COUNT(*)            AS count,
         SUM(amount_paise)   AS total_paise
       FROM orders
       GROUP BY status`,
      []
    );

    // Total paid revenue in rupees (for the summary card)
    const paidRow = statusRows.find(r => r.status === 'paid');
    const total_revenue_inr = paidRow
      ? Math.round(parseInt(paidRow.total_paise) / 100)
      : 0;

    // Total free reading leads
    const leadsRow = await dbGet(
      `SELECT COUNT(*) AS count FROM free_readings`,
      []
    );

    return res.json({
      by_status:          statusRows,
      total_revenue_inr,
      total_free_leads:   parseInt(leadsRow?.count || 0),
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
});


// ── GET /admin/leads ──────────────────────────────────────────
// Returns all free reading leads, newest first.
// Useful for remarketing — these are people interested but
// haven't paid yet.
router.get('/leads', async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT * FROM free_readings ORDER BY created_at DESC`,
      []
    );
    return res.json({ count: rows.length, leads: rows });
  } catch (err) {
    console.error('Admin leads error:', err);
    return res.status(500).json({ error: 'Failed to fetch leads.' });
  }
});


// ── GET /admin/leads/export ───────────────────────────────────
// Downloads all free reading leads as a CSV file.
// Open in Excel / Google Sheets for marketing campaigns.
router.get('/leads/export', async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT id, created_at, name, phone, dob, gender, birth_num, destiny_num
       FROM free_readings
       ORDER BY created_at DESC`,
      []
    );

    // Build CSV string
    const header = 'ID,Created At,Name,Phone,DOB,Gender,Birth Number,Destiny Number';
    const lines  = rows.map(r =>
      [
        r.id,
        r.created_at,
        `"${r.name}"`,         // quotes handle commas in names
        r.phone,
        r.dob,
        r.gender,
        r.birth_num,
        r.destiny_num,
      ].join(',')
    );

    const csv = [header, ...lines].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="numerosoul-leads.csv"');
    return res.send(csv);
  } catch (err) {
    console.error('Admin leads export error:', err);
    return res.status(500).json({ error: 'Failed to export leads.' });
  }
});


module.exports = router;