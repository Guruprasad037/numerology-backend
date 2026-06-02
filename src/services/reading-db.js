// ============================================================
//  src/services/reading-db.js
//  Handles all DB writes for a free reading.
//  Called fire-and-forget from free-reading.js.
// ============================================================
const { dbRun, dbGet } = require('../config/db');

async function saveReading(name, dob, profile, interpretations) {
  const {
    birth_num, life_path_num, expression_num,
    soul_urge_num, personality_num, maturity_num,
    personal_year, master_number,
  } = profile;

  // ── 1. Upsert user ───────────────────────────────────────────
  let user = await dbGet(
    `SELECT id FROM users
     WHERE full_name = $1 AND dob = $2 AND deleted_at IS NULL
     LIMIT 1`,
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

  // ── 2. Insert numerology profile ─────────────────────────────
  await dbRun(
    `UPDATE numerology_profiles
     SET is_primary = FALSE
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
       $4, $5, $6, $7, $8,
       $9, $10,
       $11, $12, $13, $14
     ) RETURNING id`,
    [
      userId, name, dob,
      life_path_num, birth_num,
      expression_num, soul_urge_num, personality_num,
      maturity_num, personal_year,
      master_number === 11,
      master_number === 22,
      master_number === 33,
      master_number ? [master_number] : [],
    ]
  );

  const profileId = profileResult.rows[0].id;

  // ── 3. Insert reading record ──────────────────────────────────
  // Store the full interpretations object as report_content.
  // This works whether it came from hardcoded, Claude, or OpenAI —
  // the shape is always the same.
  await dbRun(
    `INSERT INTO readings (
       user_id, profile_id, order_id,
       product_slug, status,
       report_content, engine_used, language,
       generated_at, delivered_at
     ) VALUES (
       $1, $2, NULL,
       'free_reading_v1', 'delivered',
       $3, $4, 'en',
       NOW(), NOW()
     )`,
    [
      userId,
      profileId,
      JSON.stringify(interpretations),
      require('../reading.settings').defaultEngine,
    ]
  );
}

module.exports = { saveReading };