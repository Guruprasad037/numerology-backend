// ============================================================
//  src/services/reading-db.js
//  v2 — accepts explicit engineConfig + engineUsed parameters
//
//  CHANGE from v1:
//    - saveReading() now accepts two new parameters:
//        engineConfig  (what reading.settings.js requested)
//        engineUsed    (what actually ran — may differ if fallback fired)
//    - Both are written to the readings table
//    - Falls back gracefully if not provided (old callers safe)
//    - Removed the internal engine resolution that caused the bug
//      (previously resolved engine from settings here, which always
//       returned the configured engine even when fallback had fired)
// ============================================================

const { dbAll, dbGet, dbRun } = require('../config/db');
const settings = require('../reading.settings');

const FILE = 'src/services/reading-db.js';

function log(step, message, data = null) {
  console.log(`[${FILE}] STEP ${step} ${message}`, data ? JSON.stringify(data) : '');
}

// ── saveReading ──────────────────────────────────────────────
// Parameters:
//   name          — full name string
//   dob           — "YYYY-MM-DD"
//   profile       — full 90-field numerology profile object
//   interpretations — result from dispatcher (cards, cta, etc.)
//   engineConfig  — what was configured (e.g. "claude")    ← NEW
//   engineUsed    — what actually ran (e.g. "hardcoded")   ← NEW
//
// engineConfig and engineUsed are optional for backwards compatibility.
// If not provided, both default to settings.defaultEngine (old behaviour).
async function saveReading(name, dob, profile, interpretations, engineConfig, engineUsed) {
  log(1, 'saveReading() called', { name, dob });
  console.log(
    `[${FILE}] >>> ENTER saveReading() | name="${name}" dob="${dob}" engineConfig=${engineConfig} engineUsed=${engineUsed}`
  );

  // ── Resolve engine values ────────────────────────────────
  // Use the explicitly passed values when available.
  // Fall back to settings.defaultEngine for backwards compatibility
  // (in case saveReading is called from somewhere without the new params).
  const resolvedEngineConfig = engineConfig || settings.defaultEngine || 'unknown';
  const resolvedEngineUsed   = engineUsed   || engineConfig || settings.defaultEngine || 'unknown';

  console.log(
    `[${FILE}] >>> engine resolved | engine_config="${resolvedEngineConfig}" engine_used="${resolvedEngineUsed}" | fallback_fired=${resolvedEngineConfig !== resolvedEngineUsed}`
  );

  try {
    // ── Step 2: Check existing customer ─────────────────────
    log(2, 'Checking if customer exists');
    console.log(`[${FILE}] >>> STEP 2 START: dbGet() — checking existing customer`);

    let userId;
    const existing = await dbGet(
      `SELECT id FROM customers
       WHERE full_name = $1 AND dob = $2 AND deleted_at IS NULL
       LIMIT 1`,
      [name, dob]
    );

    console.log(`[${FILE}] >>> STEP 2 DONE: customer query returned | found=${!!existing}`);

    if (existing) {
      userId = existing.id;
      log(3, 'Existing customer found', { customerId: userId });
      console.log(`[${FILE}] >>> STEP 3 SKIP: customer already exists | customerId=${userId}`);
    } else {
      // ── Step 4: Create new customer ───────────────────────
      log(4, 'Creating new customer');
      const newCustomer = await dbRun(
        `INSERT INTO customers (full_name, dob, tier, created_at)
         VALUES ($1, $2, 'free_reading', NOW())
         RETURNING id`,
        [name, dob]
      );
      userId = newCustomer.rows?.[0]?.id || newCustomer.lastID;
      log(4, 'New customer created', { customerId: userId });
    }

    console.log(`[${FILE}] >>> userId resolved | userId=${userId}`);

    // ── Step 5: Demote previous primary profile ──────────────
    log(5, 'Demoting previous primary profile');
    console.log(
      `[${FILE}] >>> STEP 5 START: dbRun() — demoting existing primary profile for userId=${userId}`
    );
    await dbRun(
      `UPDATE numerology_profiles
       SET is_primary = FALSE
       WHERE user_id = $1 AND is_primary = TRUE`,
      [userId]
    );
    console.log(`[${FILE}] >>> STEP 5 DONE: demote query completed`);

    // ── Step 6: Insert numerology profile ───────────────────
    log(6, 'Inserting numerology profile (v3, 89 params)');
    console.log(
      `[${FILE}] >>> STEP 6 START: dbRun() — inserting numerology profile | userId=${userId} name="${name}"`
    );

    const p = profile;
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
        userId, name, dob,
        p.psychic_number,      p.psychic_compound,
        p.destiny_number,      p.destiny_compound,
        p.name_number,         p.name_compound,
        p.soul_urge_number,    p.soul_urge_compound,
        p.personality_number,  p.personality_compound,
        p.maturity_number,     p.maturity_compound,
        p.power_number,        p.power_compound,
        p.ruling_planet,       p.pd_combination,
        p.life_path_number,    p.life_path_compound,
        p.birth_day_number,    p.birth_month_number,  p.birth_year_number,
        p.personal_year_number, p.personal_month_number, p.personal_day_number,
        p.universal_year_number, p.universal_month_number,
        p.pinnacle_1, p.pinnacle_1_start_age, p.pinnacle_1_end_age,
        p.pinnacle_2, p.pinnacle_2_start_age, p.pinnacle_2_end_age,
        p.pinnacle_3, p.pinnacle_3_start_age, p.pinnacle_3_end_age,
        p.pinnacle_4, p.pinnacle_4_start_age,
        p.current_pinnacle,
        p.challenge_1, p.challenge_2, p.challenge_3, p.challenge_4,
        p.current_challenge,
        p.life_period_1, p.life_period_1_end_age,
        p.life_period_2, p.life_period_2_end_age,
        p.life_period_3, p.current_life_period,
        p.cornerstone,  p.cornerstone_value,
        p.capstone,     p.capstone_value,
        p.first_vowel,  p.first_vowel_value,
        p.subconscious_self,
        p.hidden_passions, p.karmic_lessons, p.missing_numbers,
        p.has_karmic_debt,
        p.karmic_debt_numbers, p.karmic_debt_locations,
        p.has_master_11, p.has_master_22, p.has_master_33,
        p.master_numbers_found,
        p.plane_mental_count,    p.plane_physical_count,
        p.plane_emotional_count, p.plane_intuitive_count,
        p.plane_mental_number,   p.plane_physical_number,
        p.plane_emotional_number, p.plane_intuitive_number,
        p.dominant_plane,
        p.soul_expression_bridge, p.life_personality_bridge,
        p.rational_thought_number, p.balance_number,
        p.physical_transit,  p.physical_transit_value,
        p.mental_transit,    p.mental_transit_value,
        p.spiritual_transit, p.spiritual_transit_value,
        p.essence_number,
      ]
    );

    const profileId = profileResult.rows?.[0]?.id || profileResult.lastID;
    log(7, 'Profile inserted', { profileId });
    console.log(
      `[${FILE}] >>> STEP 6 DONE: numerology profile inserted | profileId=${profileId}`
    );

    // ── Step 8: Insert reading record ───────────────────────
    log(8, 'Inserting reading record');
    console.log(
      `[${FILE}] >>> STEP 8 START: dbRun() — inserting reading record | userId=${userId} profileId=${profileId}`
    );

    // Log which engine was actually used vs configured
    console.log(
      `[${FILE}] >>> STEP 8 engine recorded | engine_config="${resolvedEngineConfig}" engine_used="${resolvedEngineUsed}"`
    );

    await dbRun(
      `INSERT INTO readings (
         user_id, profile_id, order_id,
         product_slug, status,
         report_content, engine_config, engine_used,
         language, generated_at, delivered_at
       ) VALUES (
         $1, $2, NULL,
         'free_reading', 'delivered',
         $3, $4, $5,
         'en', NOW(), NOW()
       )`,
      [
        userId,
        profileId,
        JSON.stringify(interpretations),
        resolvedEngineConfig,   // ← what was configured
        resolvedEngineUsed,     // ← what actually ran
      ]
    );

    console.log(`[${FILE}] >>> STEP 8 DONE: reading record inserted`);

    log(9, 'Reading saved successfully', { userId, profileId });
    console.log(
      `[${FILE}] >>> EXIT saveReading() SUCCESS | userId=${userId} profileId=${profileId}`
    );

  } catch (err) {
    console.error(`[${FILE}] >>> EXIT saveReading() ERROR:`, err.message);
    throw err;
  }
}

module.exports = { saveReading };