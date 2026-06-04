// ============================================================
//  src/services/free-reading.js
//  Schema v3 — removed birthName, updated response fields.
// ============================================================

const { buildNumerologyProfile } = require('../utils/calculator');
const dispatcher = require('../engines/dispatcher');
const { saveReading } = require('./reading-db');

const FILE = "src/services/free-reading.js";

function log(step, message, data = null) {
  console.log(
    `[${FILE}] STEP ${step} ${message}`,
    data ? JSON.stringify(data) : ""
  );
}

// birthName param removed — v3 uses single name only
async function generate(name, dob) {
  log(1, "generate() called", { name, dob });

  // ── Step 1: Build full Chaldean profile (all 83 fields) ──────
  const profile = buildNumerologyProfile(name, dob);

  log(2, "Profile calculated", {
    psychic_number:     profile.psychic_number,
    psychic_compound:   profile.psychic_compound,
    destiny_number:     profile.destiny_number,
    destiny_compound:   profile.destiny_compound,
    name_number:        profile.name_number,
    name_compound:      profile.name_compound,
    life_path_number:   profile.life_path_number,
    soul_urge_number:   profile.soul_urge_number,
    personality_number: profile.personality_number,
    maturity_number:    profile.maturity_number,
    power_number:       profile.power_number,
    personal_year:      profile.personal_year_number,
    ruling_planet:      profile.ruling_planet,
    pd_combination:     profile.pd_combination,
    current_pinnacle:   profile.current_pinnacle,
    has_karmic_debt:    profile.has_karmic_debt,
    has_master_11:      profile.has_master_11,
    missing_numbers:    profile.missing_numbers,
  });

  try {
    // ── Step 2: Engine dispatch ──────────────────────────────────
    log(3, "Dispatching to engine: free_reading");
    const interpretations = await dispatcher.dispatch('free_reading', profile);

    log(4, "Engine response received", {
      keys:      interpretations ? Object.keys(interpretations) : null,
      hasCards:  !!interpretations?.cards,
      cardCount: interpretations?.cards?.length || 0,
    });

    // ── Step 3: Fire-and-forget DB save ─────────────────────────
    saveReading(name, dob, profile, interpretations).catch(err =>
      console.error(`[${FILE}] DB save failed (non-fatal):`, err.message)
    );
    log(5, "DB save triggered (non-blocking)");

    // ── Step 4: Detect engine version ────────────────────────────
    const isV1 = Array.isArray(interpretations?.cards);
    log(6, "Engine version detected", { isV1 });

    // ── Step 5: Build response ────────────────────────────────────
    // Core numbers always sent to frontend regardless of engine.
    const coreNumbers = {
      psychic_number:          profile.psychic_number,
      psychic_compound:        profile.psychic_compound,
      destiny_number:          profile.destiny_number,
      destiny_compound:        profile.destiny_compound,
      name_number:             profile.name_number,
      name_compound:           profile.name_compound,
      soul_urge_number:        profile.soul_urge_number,
      soul_urge_compound:      profile.soul_urge_compound,
      personality_number:      profile.personality_number,
      personality_compound:    profile.personality_compound,
      life_path_number:        profile.life_path_number,
      life_path_compound:      profile.life_path_compound,
      maturity_number:         profile.maturity_number,
      maturity_compound:       profile.maturity_compound,
      power_number:            profile.power_number,
      power_compound:          profile.power_compound,
      personal_year_number:    profile.personal_year_number,
      personal_month_number:   profile.personal_month_number,
      ruling_planet:           profile.ruling_planet,
      pd_combination:          profile.pd_combination,
      missing_numbers:         profile.missing_numbers,
      current_pinnacle:        profile.current_pinnacle,
      current_challenge:       profile.current_challenge,
      has_karmic_debt:         profile.has_karmic_debt,
      karmic_debt_numbers:     profile.karmic_debt_numbers,
      has_master_11:           profile.has_master_11,
      has_master_22:           profile.has_master_22,
      has_master_33:           profile.has_master_33,
      dominant_plane:          profile.dominant_plane,
      essence_number:          profile.essence_number,
    };

    let result;

    if (isV1) {
      result = {
        name,
        dob_fmt: profile.dob_fmt,
        ...coreNumbers,

        // Engine output
        first_name:     interpretations.first_name || name,
        cards:          interpretations.cards || [],
        cta:            interpretations.cta || null,
        traits:         interpretations.traits || [],
        dominant_theme: interpretations.dominant_theme || "",
        reading:        interpretations.cards?.[0]?.body || null,
      };
    } else {
      // Legacy engine path
      log(6.1, "Legacy engine detected (non-v1)");
      const firstCard = interpretations?.birth || {};

      result = {
        name,
        dob_fmt: profile.dob_fmt,
        ...coreNumbers,

        first_name:     name,
        reading:        firstCard.text || null,
        traits:         firstCard.traits || [],
        cards:          [],
        cta:            null,
        dominant_theme: "",
      };
    }

    log(7, "Final response built", {
      cardCount:  result.cards?.length || 0,
      hasCTA:     !!result.cta,
      traitCount: result.traits?.length || 0,
    });

    return result;

  } catch (err) {
    log(99, "ERROR in generate()", {
      message: err.message,
      stack:   err.stack,
    });
    throw err;
  }
}

module.exports = { generate };