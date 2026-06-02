// ============================================================
//  src/services/free-reading.js
//  Business logic for the free reading flow.
//
//  Flow:
//    1. Calculate all numerology numbers
//    2. Dispatch to interpretation engine (Claude / OpenAI / hardcoded)
//    3. Fire-and-forget DB save
//    4. Return enriched response
// ============================================================
const { buildNumerologyProfile } = require('../utils/calculator');
const dispatcher = require('../engines/dispatcher');
const { saveReading } = require('./reading-db');

async function generate(name, dob) {
  // ── Step 1: Calculate numbers ────────────────────────────────
  const profile = buildNumerologyProfile(name, dob);

  // ── Step 2: Get interpretations from active engine ───────────
  const interpretations = await dispatcher.dispatch('free_reading', profile);

  // ── Step 3: Fire-and-forget DB save ──────────────────────────
  saveReading(name, dob, profile, interpretations).catch(err =>
    console.error('DB save failed (non-fatal):', err.message)
  );

  // ── Step 4: Return response ───────────────────────────────────
  const birthInterp = interpretations.birth || {};

  return {
    // Identity
    name,
    dob_fmt: profile.dob_fmt,

    // Raw numbers
    birth_num:       profile.birth_num,
    life_path_num:   profile.life_path_num,
    expression_num:  profile.expression_num,
    soul_urge_num:   profile.soul_urge_num,
    personality_num: profile.personality_num,
    maturity_num:    profile.maturity_num,
    personal_year:   profile.personal_year,
    master_number:   profile.master_number,

    // Legacy fields (existing frontend reads these directly)
    reading: birthInterp.text   || null,
    traits:  birthInterp.traits || [],

    // Enriched interpretations (new frontend uses these)
    interpretations,
  };
}

module.exports = { generate };