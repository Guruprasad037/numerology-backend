// ============================================================
//  config/db.js
//  PostgreSQL connection pool + table initialisation
//  All database setup lives here — import `pool` anywhere
//  you need to run a query.
// ============================================================

const { Pool } = require('pg');

// ── Connection pool ──────────────────────────────────────────
// Reads DATABASE_URL from .env (set on Render as an env var).
// SSL is required for Render's hosted PostgreSQL.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── Lightweight query helpers ────────────────────────────────
// These wrap pool.query so routes stay clean and readable.

/** Run an INSERT / UPDATE / DELETE — returns the pg result object */
async function dbRun(sql, params = []) {
  return pool.query(sql, params);
}

/** Run a SELECT that returns multiple rows */
async function dbAll(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

/** Run a SELECT that returns a single row (or undefined) */
async function dbGet(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0];
}

// ── Table creation ───────────────────────────────────────────
// Called once on server start. IF NOT EXISTS means safe to run
// every time — it won't overwrite existing data.

async function initDB() {

  // ── orders ─────────────────────────────────────────────────
  // Stores every paid (or attempted) product order.
  // gender stores "Male" | "Female" | "Prefer not to say"
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id            SERIAL PRIMARY KEY,
      created_at    TIMESTAMP DEFAULT NOW(),

      -- Customer details
      name          TEXT    NOT NULL,
      email         TEXT    NOT NULL,
      phone         TEXT    NOT NULL,
      dob           TEXT    NOT NULL,
      gender        TEXT    NOT NULL DEFAULT 'Prefer not to say',

      -- Product details
      product_id    TEXT    NOT NULL,
      product_name  TEXT    NOT NULL,
      amount_paise  INTEGER NOT NULL,

      -- Razorpay fields (populated as payment progresses)
      rp_order_id   TEXT    UNIQUE,
      rp_payment_id TEXT,
      rp_signature  TEXT,

      -- Lifecycle status:
      --   pending_payment → paid → report_sent
      status        TEXT    DEFAULT 'pending_payment',

      -- Admin notes (e.g. "report emailed 12 Jun")
      notes         TEXT    DEFAULT ''
    )
  `);

  // ── free_readings ───────────────────────────────────────────
  // Stores every free personality reading submitted.
  // Useful for remarketing, analytics, and lead tracking.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS free_readings (
      id          SERIAL PRIMARY KEY,
      created_at  TIMESTAMP DEFAULT NOW(),

      -- User-provided details
      name        TEXT NOT NULL,
      phone       TEXT NOT NULL DEFAULT '',
      dob         TEXT NOT NULL,
      gender      TEXT NOT NULL DEFAULT 'Prefer not to say',

      -- Calculated numerology output
      birth_num   INTEGER NOT NULL,
      destiny_num INTEGER NOT NULL
    )
  `);

  console.log('✦ Database tables ready');
}

module.exports = { pool, dbRun, dbAll, dbGet, initDB };