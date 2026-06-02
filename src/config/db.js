// ============================================================
//  config/db.js
//  PostgreSQL connection pool + lightweight query helpers.
//
//  Schema is managed externally (applied directly to Postgres).
//  This file does NOT create or alter any tables.
// ============================================================
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Test connection on startup and log result
pool.connect((err, client, release) => {
  if (err) {
    console.error('✖ Database connection failed:', err.message);
  } else {
    console.log('✦ Database connected');
    release();
  }
});

/** INSERT / UPDATE / DELETE — returns full pg result */
async function dbRun(sql, params = []) {
  return pool.query(sql, params);
}

/** SELECT many rows */
async function dbAll(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

/** SELECT one row (or undefined) */
async function dbGet(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0];
}

// initDB is intentionally removed.
// Tables: users, numerology_profiles, orders, readings
// are created directly in PostgreSQL via the schema SQL file.

module.exports = { pool, dbRun, dbAll, dbGet };