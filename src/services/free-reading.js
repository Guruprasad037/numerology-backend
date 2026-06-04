// ============================================================
//  src/services/free-reading.js
//  v4 — birth_name removed. Chaldean uses single name only.
// ============================================================

const { buildNumerologyProfile } = require('../utils/calculator');
const dispatcher = require('../engines/dispatcher');
const { saveReading } = require('./reading-db');

const FILE = 'src/services/free-reading.js';

function log(step, message, data = null) {
  console.log(`[${FILE}] STEP ${step} ${message}`, data ? JSON.stringify(data) : '');
}

/**
 * Generate a free numerology reading.
 * @param {string} name  - The name the person goes by day-to-day
 * @param {string} dob   - ISO date string YYYY-MM-DD
 */
async function generate(name, dob) {
  log(1, 'generate() called', { name, dob });
  console.log(`[${FILE}] >>> ENTER generate() | name="${name}" dob="${dob}"`);

  // ── Step 1: Build full Chaldean profile (all 83+ fields) ─────
  console.log(`[${FILE}] >>> STEP 1 START: buildNumerologyProfile()`);
  const profile = buildNumerologyProfile(name, dob);
  console.log(`[${FILE}] >>> STEP 1 DONE: profile built | keys=${Object.keys(profile).length}`);

  log(2, 'Profile calculated', {
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
  console.log(`[${FILE}] >>> STEP 2 DONE: profile logged`);

  try {
    // ── Step 2: Engine dispatch ───────────────────────────────────
    log(3, 'Dispatching to engine: free_reading');
    console.log(`[${FILE}] >>> STEP 3 START: dispatcher.dispatch("free_reading")`);
    const interpretations = await dispatcher.dispatch('free_reading', profile);
    console.log(`[${FILE}] >>> STEP 3 DONE: dispatch returned | interpretations=${interpretations ? 'object' : 'null/undefined'}`);

    log(4, 'Engine response received', {
      keys:      interpretations ? Object.keys(interpretations) : null,
      hasCards:  !!interpretations?.cards,
      cardCount: interpretations?.cards?.length || 0,
    });
    console.log(`[${FILE}] >>> STEP 4 DONE: engine response logged`);

    // ── Step 3: Fire-and-forget DB save ──────────────────────────
    console.log(`[${FILE}] >>> STEP 5 START: saveReading() (fire-and-forget)`);
    saveReading(name, dob, profile, interpretations).catch(err =>
      console.error(`[${FILE}] DB save failed (non-fatal):`, err.message)
    );
    log(5, 'DB save triggered (non-blocking)');
    console.log(`[${FILE}] >>> STEP 5 DONE: saveReading() triggered`);

    // ── Step 4: Detect engine version ────────────────────────────
    console.log(`[${FILE}] >>> STEP 6 START: detecting engine version`);
    const isV1 = Array.isArray(interpretations?.cards);
    log(6, 'Engine version detected', { isV1 });
    console.log(`[${FILE}] >>> STEP 6 DONE: isV1=${isV1}`);

    // ── Step 5: Core numbers — always sent to frontend ───────────
    console.log(`[${FILE}] >>> STEP 6.2 START: building coreNumbers object`);
    const coreNumbers = {
      psychic_number:        profile.psychic_number,
      psychic_compound:      profile.psychic_compound,
      destiny_number:        profile.destiny_number,
      destiny_compound:      profile.destiny_compound,
      name_number:           profile.name_number,
      name_compound:         profile.name_compound,
      soul_urge_number:      profile.soul_urge_number,
      soul_urge_compound:    profile.soul_urge_compound,
      personality_number:    profile.personality_number,
      personality_compound:  profile.personality_compound,
      life_path_number:      profile.life_path_number,
      life_path_compound:    profile.life_path_compound,
      maturity_number:       profile.maturity_number,
      maturity_compound:     profile.maturity_compound,
      power_number:          profile.power_number,
      power_compound:        profile.power_compound,
      personal_year_number:  profile.personal_year_number,
      personal_month_number: profile.personal_month_number,
      ruling_planet:         profile.ruling_planet,
      pd_combination:        profile.pd_combination,
      missing_numbers:       profile.missing_numbers,
      current_pinnacle:      profile.current_pinnacle,
      current_challenge:     profile.current_challenge,
      has_karmic_debt:       profile.has_karmic_debt,
      karmic_debt_numbers:   profile.karmic_debt_numbers,
      has_master_11:         profile.has_master_11,
      has_master_22:         profile.has_master_22,
      has_master_33:         profile.has_master_33,
      dominant_plane:        profile.dominant_plane,
      essence_number:        profile.essence_number,
    };
    console.log(`[${FILE}] >>> STEP 6.2 DONE: coreNumbers built | keys=${Object.keys(coreNumbers).length}`);

    let result;

    if (isV1) {
      console.log(`[${FILE}] >>> STEP 6.3 START: building result (V1 engine path)`);
      result = {
        name,
        dob_fmt: profile.dob_fmt,
        ...coreNumbers,
        first_name:     interpretations.first_name || name,
        cards:          interpretations.cards  || [],
        cta:            interpretations.cta    || null,
        traits:         interpretations.traits || [],
        dominant_theme: interpretations.dominant_theme || '',
        reading:        interpretations.cards?.[0]?.body || null,
      };
      console.log(`[${FILE}] >>> STEP 6.3 DONE: V1 result built | cards=${result.cards.length} traits=${result.traits.length} hasCTA=${!!result.cta}`);
    } else {
      // Legacy hardcoded engine path
      log('6.1', 'Legacy engine detected (non-v1)');
      console.log(`[${FILE}] >>> STEP 6.1 START: building result (legacy engine path)`);
      const firstCard = interpretations?.birth || {};
      result = {
        name,
        dob_fmt: profile.dob_fmt,
        ...coreNumbers,
        first_name:     name,
        reading:        firstCard.text   || null,
        traits:         firstCard.traits || [],
        cards:          [],
        cta:            null,
        dominant_theme: '',
      };
      console.log(`[${FILE}] >>> STEP 6.1 DONE: legacy result built | hasReading=${!!result.reading} traits=${result.traits.length}`);
    }

    log(7, 'Final response built', {
      cardCount:  result.cards?.length || 0,
      hasCTA:     !!result.cta,
      traitCount: result.traits?.length || 0,
    });
    console.log(`[${FILE}] >>> STEP 7 DONE: final result ready | cardCount=${result.cards?.length || 0} hasCTA=${!!result.cta} traitCount=${result.traits?.length || 0}`);
    console.log(`[${FILE}] >>> EXIT generate() SUCCESS`);

    return result;

  } catch (err) {
    log(99, 'ERROR in generate()', { message: err.message, stack: err.stack });
    console.error(`[${FILE}] >>> STEP 99 FATAL ERROR in generate() | message="${err.message}"`);
    console.error(`[${FILE}] >>> STACK TRACE:`, err.stack);
    throw err;
  }
}

module.exports = { generate };