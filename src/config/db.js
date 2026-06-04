// ============================================================
//  config/db.js
//  PostgreSQL connection pool + lightweight query helpers.
//
//  Schema is managed externally (applied directly to Postgres).
//  This file does NOT create or alter any tables.
// ============================================================
const { Pool } = require('pg');

console.log('[db.js] Initializing PostgreSQL connection pool');
console.log('[db.js] DATABASE_URL present:', !!process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
console.log('[db.js] Pool created');

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
  console.log('[db.js] dbRun() called');
  console.log('[db.js] dbRun() SQL:', sql);
  console.log('[db.js] dbRun() Params:', JSON.stringify(params));
  const result = await pool.query(sql, params);
  console.log('[db.js] dbRun() Result — rowCount:', result.rowCount, '| command:', result.command);
  return result;
}

/** SELECT many rows */
async function dbAll(sql, params = []) {
  console.log('[db.js] dbAll() called');
  console.log('[db.js] dbAll() SQL:', sql);
  console.log('[db.js] dbAll() Params:', JSON.stringify(params));
  const result = await pool.query(sql, params);
  console.log('[db.js] dbAll() Rows returned:', result.rows.length);
  return result.rows;
}

/** SELECT one row (or undefined) */
async function dbGet(sql, params = []) {
  console.log('[db.js] dbGet() called');
  console.log('[db.js] dbGet() SQL:', sql);
  console.log('[db.js] dbGet() Params:', JSON.stringify(params));
  const result = await pool.query(sql, params);
  console.log('[db.js] dbGet() Row found:', !!result.rows[0]);
  return result.rows[0];
}

// initDB is intentionally removed.
// Tables: users, numerology_profiles, orders, readings
// are created directly in PostgreSQL via the schema SQL file.
console.log('[db.js] Exporting: { pool, dbRun, dbAll, dbGet }');
module.exports = { pool, dbRun, dbAll, dbGet };