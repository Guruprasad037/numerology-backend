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

  // ── 1. Upsert customer ───────────────────────────────────────
  log(2, "Checking if customer exists");
  let customer = await dbGet(
    `SELECT id FROM customers
     WHERE full_name = $1 AND dob = $2 AND deleted_at IS NULL
     LIMIT 1`,
    [name, dob]
  );

  log(3, "Customer lookup result", { found: !!customer });

  if (!customer) {
    log(4, "Creating new customer");
    const result = await dbRun(
      `INSERT INTO customers (full_name, dob, tier, locale, timezone)
       VALUES ($1, $2, 'free_reading', 'en', 'Asia/Kolkata')
       RETURNING id`,
      [name, dob]
    );
    customer = result.rows[0];
    log(5, "Customer created", { customerId: customer.id });
  }

  const userId = customer.id;

  // ── 2. Demote any existing primary profile ───────────────────
  log(6, "Demoting previous primary profile");
  await dbRun(
    `UPDATE numerology_profiles
     SET is_primary = FALSE
     WHERE user_id = $1 AND is_primary = TRUE`,
    [userId]
  );

  // ── 3. Insert new Chaldean numerology profile ────────────────
  log(7, "Inserting new numerology profile");
  const profileResult = await dbRun(
    `INSERT INTO numerology_profiles (
       user_id,
       name_used,
       birth_name_used,
       dob_used,
       is_primary,

       psychic_number,
       psychic_compound,
       destiny_number,
       destiny_compound,
       personal_year_number,
       ruling_planet,

       name_number,
       name_compound,
       soul_urge_number,
       soul_urge_compound,
       personality_number,
       personality_compound,

       birth_name_number,
       birth_name_compound,

       maturity_number,
       power_number,

       missing_numbers,
       pd_combination
     ) VALUES (
       $1,  $2,  $3,  $4,  TRUE,
       $5,  $6,  $7,  $8,  $9,  $10,
       $11, $12, $13, $14, $15, $16,
       $17, $18,
       $19, $20,
       $21, $22
     ) RETURNING id`,
    [
      userId,                        // $1
      profile.name_used,             // $2
      profile.birth_name_used,       // $3  — null if not provided
      dob,                           // $4

      profile.psychic_number,        // $5
      profile.psychic_compound,      // $6
      profile.destiny_number,        // $7
      profile.destiny_compound,      // $8
      profile.personal_year_number,  // $9
      profile.ruling_planet,         // $10

      profile.name_number,           // $11
      profile.name_compound,         // $12
      profile.soul_urge_number,      // $13
      profile.soul_urge_compound,    // $14
      profile.personality_number,    // $15
      profile.personality_compound,  // $16

      profile.birth_name_number,     // $17 — null if not provided
      profile.birth_name_compound,   // $18 — null if not provided

      profile.maturity_number,       // $19
      profile.power_number,          // $20

      profile.missing_numbers,       // $21 — array e.g. [3,7]
      profile.pd_combination,        // $22 — e.g. '5-5'
    ]
  );

  const profileId = profileResult.rows[0].id;
  log(8, "Profile inserted", { profileId });

  // ── 4. Insert reading record ─────────────────────────────────
  log(9, "Inserting reading record");
  await dbRun(
    `INSERT INTO readings (
       user_id,
       profile_id,
       order_id,
       product_slug,
       status,
       report_content,
       engine_used,
       language,
       generated_at,
       delivered_at
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

  log(10, "Reading saved successfully", { userId, profileId });
}

module.exports = { saveReading };