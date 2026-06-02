// ============================================================
//  src/services/free-reading.js
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

async function generate(name, dob) {
  log(1, "generate() called", { name, dob });

  // ── Step 1: Build numerology profile ─────────────────────────
  const profile = buildNumerologyProfile(name, dob);

  log(2, "Profile calculated", {
    birth_num: profile.birth_num,
    life_path_num: profile.life_path_num,
    expression_num: profile.expression_num,
    soul_urge_num: profile.soul_urge_num,
    personality_num: profile.personality_num,
    maturity_num: profile.maturity_num,
    personal_year: profile.personal_year,
  });

  try {
    // ── Step 2: Engine dispatch ────────────────────────────────
    log(3, "Dispatching to engine: free_reading");

    const interpretations = await dispatcher.dispatch('free_reading', profile);

    log(4, "Engine response received", {
      keys: interpretations ? Object.keys(interpretations) : null,
      hasCards: !!interpretations?.cards,
      cardCount: interpretations?.cards?.length || 0,
    });

    // ── Step 3: Fire-and-forget DB save ────────────────────────
    saveReading(name, dob, profile, interpretations).catch(err =>
      console.error(`[${FILE}] DB save failed (non-fatal):`, err.message)
    );

    log(5, "DB save triggered (non-blocking)");

    // ── Step 4: Detect engine version ───────────────────────────
    const isV1 = Array.isArray(interpretations?.cards);

    log(6, "Engine version detected", {
      isV1,
    });

    // ── Step 5: Build response safely ───────────────────────────
    let result;

    if (isV1) {
      // ✅ NEW v1 ENGINE PATH (cards-based)
      const firstCard = interpretations.cards?.[0];

      result = {
        name,
        dob_fmt: profile.dob_fmt,

        birth_num:       profile.birth_num,
        life_path_num:   profile.life_path_num,
        expression_num:  profile.expression_num,
        soul_urge_num:   profile.soul_urge_num,
        personality_num: profile.personality_num,
        maturity_num:    profile.maturity_num,
        personal_year:   profile.personal_year,
        master_number:   profile.master_number,

        first_name: interpretations.first_name || name,
        cards: interpretations.cards || [],
        cta: interpretations.cta || null,
        traits: interpretations.traits || [],
        dominant_theme: interpretations.dominant_theme || "",

        // backward compatibility
        reading: firstCard?.body || null,
      };

    } else {
      // ⚠️ LEGACY ENGINE PATH (old structure)
      log(6.1, "Legacy engine detected (non-v1)");

      const birthInterp = interpretations?.birth || {};

      result = {
        name,
        dob_fmt: profile.dob_fmt,

        birth_num:       profile.birth_num,
        life_path_num:   profile.life_path_num,
        expression_num:  profile.expression_num,
        soul_urge_num:   profile.soul_urge_num,
        personality_num: profile.personality_num,
        maturity_num:    profile.maturity_num,
        personal_year:   profile.personal_year,
        master_number:   profile.master_number,

        first_name: name,
        reading: birthInterp.text || null,
        traits: birthInterp.traits || [],

        cards: [],
        cta: null,
        dominant_theme: "",
      };
    }

    // ── Step 6: Final log ───────────────────────────────────────
    log(7, "Final response built", {
      hasReading: !!result.reading,
      traitCount: result.traits?.length || 0,
      hasCards: result.cards?.length || 0,
      hasCTA: !!result.cta,
    });

    return result;

  } catch (err) {
    log(99, "ERROR in generate()", {
      message: err.message,
      stack: err.stack,
    });

    throw err;
  }
}

module.exports = { generate };