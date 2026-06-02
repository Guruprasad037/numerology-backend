// ============================================================
//  routes/reading.js
//  POST /reading
//
//  Flow:
//    1. Validate input
//    2. Calculate all numerology numbers
//    3. Save to users table (tier = 'free')
//    4. Save all numbers to numerology_profiles
//    5. Save to readings table (engine = 'hardcoded')
//    6. Return enriched response with all numbers + interpretations
//
//  DB writes are fire-and-forget (non-blocking).
//  The response is always sent regardless of DB success.
// ============================================================
const express = require('express');
const router  = express.Router();
const { dbRun, dbGet } = require('../config/db');
const { buildNumerologyProfile } = require('../core/calculator');
const {
  READINGS,
  LIFE_PATH,
  EXPRESSION,
  SOUL_URGE,
  PERSONALITY,
  MATURITY,
  PERSONAL_YEAR,
  VALID_GENDERS,
} = require('../core/interpretations');


// ── Helper: build enriched interpretation block ───────────────
// Takes a lookup table and a number, returns { number, label, traits, text }
// Safe: returns null if number not found in table.
function interp(table, number) {
  const entry = table[number];
  if (!entry) return null;
  return {
    number,
    label:  entry.label  || null,
    traits: entry.traits || [],
    text:   entry.text   || null,
  };
}


// ── Main route ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { name, dob } = req.body;

  // ── Validation ─────────────────────────────────────────────
  if (!name || !name.trim())
    return res.status(400).json({ error: 'Name is required.' });
  if (!dob)
    return res.status(400).json({ error: 'Date of birth is required.' });

  // Basic date format check (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob))
    return res.status(400).json({ error: 'DOB must be in YYYY-MM-DD format.' });

  const cleanName = name.trim();

  // ── Calculate numbers ───────────────────────────────────────
  const profile = buildNumerologyProfile(cleanName, dob);
  const {
    birth_num,
    life_path_num,
    expression_num,
    soul_urge_num,
    personality_num,
    maturity_num,
    personal_year,
    master_number,
    dob_fmt,
  } = profile;

  // ── Build enriched interpretations ─────────────────────────
  const interpretations = {
    birth:         interp(READINGS,      birth_num),
    life_path:     interp(LIFE_PATH,     life_path_num),
    expression:    interp(EXPRESSION,    expression_num),
    soul_urge:     interp(SOUL_URGE,     soul_urge_num),
    personality:   interp(PERSONALITY,   personality_num),
    maturity:      interp(MATURITY,      maturity_num),
    personal_year: interp(PERSONAL_YEAR, personal_year),
  };

  // ── Legacy fields (keeps existing frontend working) ─────────
  // The old frontend reads: reading, traits directly on response root.
  // We keep them pointing at birth number interpretation.
  const birthInterp = READINGS[birth_num] || READINGS[1];

  // ── Fire-and-forget DB save ─────────────────────────────────
  // We don't await this — user gets their reading instantly.
  // Errors are logged but never shown to user.
  saveReading(cleanName, dob, profile).catch(err =>
    console.error('DB save failed (non-fatal):', err.message)
  );

  // ── Response ────────────────────────────────────────────────
  return res.json({
    // Identity
    name:    cleanName,
    dob_fmt,

    // Raw numbers (flat — keeps old frontend working)
    birth_num,
    life_path_num,
    expression_num,
    soul_urge_num,
    personality_num,
    maturity_num,
    personal_year,
    master_number,

    // Legacy fields (old frontend uses these directly)
    reading: birthInterp.text,
    traits:  birthInterp.traits,

    // Enriched interpretations (new frontend uses these)
    interpretations,
  });
});


// ── DB save function ──────────────────────────────────────────
// Saves to: users → numerology_profiles → readings
// All in sequence. If any step fails, throws (caller catches it).
async function saveReading(name, dob, profile) {
  const {
    birth_num, life_path_num, expression_num,
    soul_urge_num, personality_num, maturity_num,
    personal_year, master_number,
  } = profile;

  // 1. Insert or find user (match by name + dob for free users)
  //    We use a simple upsert-style: insert if not exists, return id either way.
  let user = await dbGet(
    `SELECT id FROM users WHERE full_name = $1 AND dob = $2 AND deleted_at IS NULL LIMIT 1`,
    [name, dob]
  );

  if (!user) {
    const result = await dbRun(
      `INSERT INTO users (full_name, dob, tier, locale, timezone)
       VALUES ($1, $2, 'free', 'en', 'Asia/Kolkata')
       RETURNING id`,
      [name, dob]
    );
    user = result.rows[0];
  }

  const userId = user.id;

  // 2. Insert numerology profile
  //    Mark any previous primary profiles as non-primary first.
  await dbRun(
    `UPDATE numerology_profiles SET is_primary = FALSE
     WHERE user_id = $1 AND is_primary = TRUE`,
    [userId]
  );

  const profileResult = await dbRun(
    `INSERT INTO numerology_profiles (
       user_id, name_used, dob_used, is_primary,
       life_path_number, birth_day_number,
       expression_number, soul_urge_number, personality_number,
       maturity_number, personal_year_number,
       has_master_11, has_master_22, has_master_33,
       master_numbers_found
     ) VALUES (
       $1, $2, $3, TRUE,
       $4, $5,
       $6, $7, $8,
       $9, $10,
       $11, $12, $13,
       $14
     ) RETURNING id`,
    [
      userId, name, dob,
      life_path_num, birth_num,
      expression_num, soul_urge_num, personality_num,
      maturity_num, personal_year,
      master_number === 11, master_number === 22, master_number === 33,
      master_number ? [master_number] : [],
    ]
  );

  const profileId = profileResult.rows[0].id;

  // 3. Insert reading record
  const reportContent = {
    birth:         { number: birth_num,      ...(READINGS[birth_num]       || {}) },
    life_path:     { number: life_path_num,  ...(LIFE_PATH[life_path_num]  || {}) },
    expression:    { number: expression_num, ...(EXPRESSION[expression_num]|| {}) },
    soul_urge:     { number: soul_urge_num,  ...(SOUL_URGE[soul_urge_num]  || {}) },
    personality:   { number: personality_num,...(PERSONALITY[personality_num]||{}) },
    maturity:      { number: maturity_num,   ...(MATURITY[maturity_num]    || {}) },
    personal_year: { number: personal_year,  ...(PERSONAL_YEAR[personal_year]||{}) },
  };

  await dbRun(
    `INSERT INTO readings (
       user_id, profile_id, order_id,
       product_slug, status,
       report_content, engine_used, language,
       generated_at, delivered_at
     ) VALUES (
       $1, $2, NULL,
       'free_reading_v1', 'delivered',
       $3, 'hardcoded', 'en',
       NOW(), NOW()
     )`,
    [userId, profileId, JSON.stringify(reportContent)]
  );
}


module.exports = router;