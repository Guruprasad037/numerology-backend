// ============================================================
//  src/services/reading-db.js
//  Schema v3 — inserts all 89 bound params (83 profile columns,
//  with schema_version and calculated_at hardcoded in SQL).
// ============================================================

const { dbRun, dbGet } = require('../config/db');
const FILE = "src/services/reading-db.js";

function log(step, message, data = null) {
  console.log(
    `[${FILE}] STEP ${step} ${message}`,
    data ? JSON.stringify(data) : ""
  );
}

async function saveReading(name, dob, profile, interpretations, engineUsed = null) {
  log(1, "saveReading() called", { name, dob });

  // ── 1. Upsert customer ───────────────────────────────────────
  log(2, "Checking if customer exists");
  let customer = await dbGet(
    `SELECT id FROM customers
     WHERE full_name = $1 AND dob = $2 AND deleted_at IS NULL
     LIMIT 1`,
    [name, dob]
  );

  if (!customer) {
    log(3, "Creating new customer");
    const result = await dbRun(
      `INSERT INTO customers (full_name, dob, tier, locale, timezone)
       VALUES ($1, $2, 'free_reading', 'en', 'Asia/Kolkata')
       RETURNING id`,
      [name, dob]
    );
    customer = result.rows[0];
    log(4, "Customer created", { customerId: customer.id });
  } else {
    log(3, "Existing customer found", { customerId: customer.id });
  }

  const userId = customer.id;

  // ── 2. Demote any existing primary profile ───────────────────
  log(5, "Demoting previous primary profile");
  await dbRun(
    `UPDATE numerology_profiles
     SET is_primary = FALSE
     WHERE user_id = $1 AND is_primary = TRUE`,
    [userId]
  );

  // ── 3. Insert full v3 numerology profile ─────────────────────
  log(6, "Inserting numerology profile (v3, 89 params)");

  const profileResult = await dbRun(
    `INSERT INTO numerology_profiles (
      user_id,        -- $1
      name_used,      -- $2
      dob_used,       -- $3
      is_primary,     -- TRUE (hardcoded)

      psychic_number,       psychic_compound,        -- $4  $5
      destiny_number,       destiny_compound,        -- $6  $7
      name_number,          name_compound,           -- $8  $9
      soul_urge_number,     soul_urge_compound,      -- $10 $11
      personality_number,   personality_compound,    -- $12 $13
      maturity_number,      maturity_compound,       -- $14 $15
      power_number,         power_compound,          -- $16 $17

      ruling_planet,        pd_combination,          -- $18 $19

      life_path_number,     life_path_compound,      -- $20 $21
      birth_day_number,     birth_month_number,
      birth_year_number,                             -- $22 $23 $24

      personal_year_number,  personal_month_number,
      personal_day_number,                           -- $25 $26 $27
      universal_year_number, universal_month_number, -- $28 $29

      pinnacle_1, pinnacle_1_start_age, pinnacle_1_end_age,  -- $30 $31 $32
      pinnacle_2, pinnacle_2_start_age, pinnacle_2_end_age,  -- $33 $34 $35
      pinnacle_3, pinnacle_3_start_age, pinnacle_3_end_age,  -- $36 $37 $38
      pinnacle_4, pinnacle_4_start_age,                      -- $39 $40
      current_pinnacle,                                      -- $41

      challenge_1, challenge_2, challenge_3, challenge_4,    -- $42 $43 $44 $45
      current_challenge,                                     -- $46

      life_period_1, life_period_1_end_age,                  -- $47 $48
      life_period_2, life_period_2_end_age,                  -- $49 $50
      life_period_3, current_life_period,                    -- $51 $52

      cornerstone,   cornerstone_value,                      -- $53 $54
      capstone,      capstone_value,                         -- $55 $56
      first_vowel,   first_vowel_value,                      -- $57 $58

      subconscious_self,                                     -- $59
      hidden_passions,  karmic_lessons, missing_numbers,     -- $60 $61 $62

      has_karmic_debt,                                       -- $63
      karmic_debt_numbers, karmic_debt_locations,            -- $64 $65

      has_master_11, has_master_22, has_master_33,           -- $66 $67 $68
      master_numbers_found,                                  -- $69

      plane_mental_count,    plane_physical_count,           -- $70 $71
      plane_emotional_count, plane_intuitive_count,          -- $72 $73
      plane_mental_number,   plane_physical_number,          -- $74 $75
      plane_emotional_number, plane_intuitive_number,        -- $76 $77
      dominant_plane,                                        -- $78

      soul_expression_bridge, life_personality_bridge,       -- $79 $80
      rational_thought_number, balance_number,               -- $81 $82

      physical_transit,  physical_transit_value,             -- $83 $84
      mental_transit,    mental_transit_value,               -- $85 $86
      spiritual_transit, spiritual_transit_value,            -- $87 $88
      essence_number,                                        -- $89

      schema_version, calculated_at  -- hardcoded
    ) VALUES (
      $1, $2, $3, TRUE,
      $4,  $5,  $6,  $7,  $8,  $9,  $10, $11,
      $12, $13, $14, $15, $16, $17,
      $18, $19,
      $20, $21, $22, $23, $24,
      $25, $26, $27, $28, $29,
      $30, $31, $32,
      $33, $34, $35,
      $36, $37, $38,
      $39, $40, $41,
      $42, $43, $44, $45, $46,
      $47, $48, $49, $50, $51, $52,
      $53, $54, $55, $56, $57, $58,
      $59, $60, $61, $62,
      $63, $64, $65,
      $66, $67, $68, $69,
      $70, $71, $72, $73,
      $74, $75, $76, $77, $78,
      $79, $80, $81, $82,
      $83, $84, $85, $86, $87, $88, $89,
      3, NOW()
    ) RETURNING id`,
    [
      userId,                          // $1
      name,                            // $2
      dob,                             // $3

      profile.psychic_number,          // $4
      profile.psychic_compound,        // $5
      profile.destiny_number,          // $6
      profile.destiny_compound,        // $7
      profile.name_number,             // $8
      profile.name_compound,           // $9
      profile.soul_urge_number,        // $10
      profile.soul_urge_compound,      // $11
      profile.personality_number,      // $12
      profile.personality_compound,    // $13
      profile.maturity_number,         // $14
      profile.maturity_compound,       // $15
      profile.power_number,            // $16
      profile.power_compound,          // $17

      profile.ruling_planet,           // $18
      profile.pd_combination,          // $19

      profile.life_path_number,        // $20
      profile.life_path_compound,      // $21
      profile.birth_day_number,        // $22
      profile.birth_month_number,      // $23
      profile.birth_year_number,       // $24

      profile.personal_year_number,    // $25
      profile.personal_month_number,   // $26
      profile.personal_day_number,     // $27
      profile.universal_year_number,   // $28
      profile.universal_month_number,  // $29

      profile.pinnacle_1,              // $30
      profile.pinnacle_1_start_age,    // $31
      profile.pinnacle_1_end_age,      // $32
      profile.pinnacle_2,              // $33
      profile.pinnacle_2_start_age,    // $34
      profile.pinnacle_2_end_age,      // $35
      profile.pinnacle_3,              // $36
      profile.pinnacle_3_start_age,    // $37
      profile.pinnacle_3_end_age,      // $38
      profile.pinnacle_4,              // $39
      profile.pinnacle_4_start_age,    // $40
      profile.current_pinnacle,        // $41

      profile.challenge_1,             // $42
      profile.challenge_2,             // $43
      profile.challenge_3,             // $44
      profile.challenge_4,             // $45
      profile.current_challenge,       // $46

      profile.life_period_1,           // $47
      profile.life_period_1_end_age,   // $48
      profile.life_period_2,           // $49
      profile.life_period_2_end_age,   // $50
      profile.life_period_3,           // $51
      profile.current_life_period,     // $52

      profile.cornerstone,             // $53
      profile.cornerstone_value,       // $54
      profile.capstone,                // $55
      profile.capstone_value,          // $56
      profile.first_vowel,             // $57
      profile.first_vowel_value,       // $58

      profile.subconscious_self,       // $59
      profile.hidden_passions,         // $60 — smallint[]
      profile.karmic_lessons,          // $61 — smallint[]
      profile.missing_numbers,         // $62 — smallint[]

      profile.has_karmic_debt,         // $63
      profile.karmic_debt_numbers,     // $64 — smallint[]
      profile.karmic_debt_locations,   // $65 — text[]

      profile.has_master_11,           // $66
      profile.has_master_22,           // $67
      profile.has_master_33,           // $68
      profile.master_numbers_found,    // $69 — smallint[]

      profile.plane_mental_count,      // $70
      profile.plane_physical_count,    // $71
      profile.plane_emotional_count,   // $72
      profile.plane_intuitive_count,   // $73
      profile.plane_mental_number,     // $74
      profile.plane_physical_number,   // $75
      profile.plane_emotional_number,  // $76
      profile.plane_intuitive_number,  // $77
      profile.dominant_plane,          // $78

      profile.soul_expression_bridge,  // $79
      profile.life_personality_bridge, // $80
      profile.rational_thought_number, // $81
      profile.balance_number,          // $82

      profile.physical_transit,        // $83
      profile.physical_transit_value,  // $84
      profile.mental_transit,          // $85
      profile.mental_transit_value,    // $86
      profile.spiritual_transit,       // $87
      profile.spiritual_transit_value, // $88
      profile.essence_number,          // $89
    ]
  );

  const profileId = profileResult.rows[0].id;
  log(7, "Profile inserted", { profileId });

  // ── 4. Insert reading record ─────────────────────────────────
  log(8, "Inserting reading record");

  const engine = engineUsed || require('../reading.settings').defaultEngine;

  await dbRun(
    `INSERT INTO readings (
       user_id, profile_id, order_id,
       product_slug, status,
       report_content, engine_used,
       language, generated_at, delivered_at
     ) VALUES (
       $1, $2, NULL,
       'free_reading', 'delivered',
       $3, $4,
       'en', NOW(), NOW()
     )`,
    [
      userId,
      profileId,
      JSON.stringify(interpretations),
      engine,
    ]
  );

  log(9, "Reading saved successfully", { userId, profileId });
  return { userId, profileId };
}

module.exports = { saveReading };