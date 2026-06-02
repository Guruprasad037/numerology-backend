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

  // ── Step 1: Calculate numbers ────────────────────────────────
  const profile = buildNumerologyProfile(name, dob);

  log(2, "Profile calculated", profile);

  // ── Step 2: Get interpretations from active engine ───────────
  try {
    log(3, "Dispatching to engine: free_reading");

    const interpretations = await dispatcher.dispatch('free_reading', profile);

    log(4, "Engine response received", {
      hasInterpretations: !!interpretations,
      keys: interpretations ? Object.keys(interpretations) : null,
    });

    // ── Step 3: Fire-and-forget DB save ──────────────────────────
    saveReading(name, dob, profile, interpretations).catch(err =>
      console.error('DB save failed (non-fatal):', err.message)
    );

    log(5, "DB save triggered (non-blocking)");

    // ── Step 4: Build response ───────────────────────────────────
    const birthInterp = interpretations.birth || {};

    const result = {
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

      reading: birthInterp.text   || null,
      traits:  birthInterp.traits || [],

      interpretations,
    };

    log(6, "Final response built", {
      hasReading: !!result.reading,
      traitCount: result.traits?.length,
    });

    return result;

  } catch (err) {
    log(99, "ERROR in generate()", {
      message: err.message,
    });

    throw err;
  }
}

module.exports = { generate };