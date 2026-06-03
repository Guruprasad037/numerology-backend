// ============================================================
//  src/services/reading-db.js
// ============================================================
const { dbRun, dbGet } = require('../config/db');
const FILE = "src/services/reading-db.js";

function log(step, message, data = null) {
  console.log(
    `[${FILE}] STEP ${step} ${message}`,
    data ? JSON.stringify(data) : ""
  );
}

async function saveReading(name, dob, profile, interpretations) {
  log(1, "saveReading() called", { name, dob });

  const {
    birth_num, life_path_num, expression_num,
    soul_urge_num, personality_num, maturity_num,
    personal_year, master_number,
  } = profile;

  log(2, "Profile destructured");

  // ── 1. Upsert customer ───────────────────────────────────────
  log(3, "Checking if customer exists");
  let customer = await dbGet(
    `SELECT id FROM customers
     WHERE full_name = $1 AND dob = $2 AND deleted_at IS NULL
     LIMIT 1`,
    [name, dob]
  );

  log(4, "Customer lookup result", { found: !!customer });

  if (!customer) {
    log(5, "Creating new customer");
    const result = await dbRun(
      `INSERT INTO customers (full_name, dob, tier, locale, timezone)
       VALUES ($1, $2, 'free_reading', 'en', 'Asia/Kolkata')
       RETURNING id`,
      [name, dob]
    );
    customer = result.rows[0];
    log(6, "Customer created", { customerId: customer.id });
  }

  const userId = customer.id;

  // ── 2. Insert numerology profile ─────────────────────────────
  log(7, "Updating previous primary profile");
  await dbRun(
    `UPDATE numerology_profiles
     SET is_primary = FALSE
     WHERE user_id = $1 AND is_primary = TRUE`,
    [userId]
  );

  log(8, "Inserting new numerology profile");
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
  log(9, "Profile inserted", { profileId });

  // ── 3. Insert reading record ──────────────────────────────────
  log(10, "Inserting reading record");
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

  log(11, "Reading saved successfully", { userId, profileId });
}

module.exports = { saveReading };