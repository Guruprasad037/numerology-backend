// ============================================================
//  src/services/free-reading.js
//  v6 — reads _engine_config and _engine_used from dispatcher
//       result and passes both to saveReading() for accurate DB
//
//  CHANGE from v5:
//    - After dispatcher.dispatch() returns, reads the two metadata
//      tags the dispatcher attached:
//        interpretations._engine_config  (what was configured)
//        interpretations._engine_used    (what actually ran)
//    - Passes both to saveReading() so the DB records reality
//    - Falls back gracefully if tags are missing (old dispatcher)
// ============================================================

const { buildNumerologyProfile } = require('../utils/calculator');
const dispatcher = require('../engines/dispatcher');
const { saveReading } = require('./reading-db');

const FILE = 'src/services/free-reading.js';

function log(step, message, data = null) {
  console.log(`[${FILE}] STEP ${step} ${message}`, data ? JSON.stringify(data) : '');
}

async function generate(name, dob) {
  log(1, 'generate() called', { name, dob });

  const profile = buildNumerologyProfile(name, dob);
  log(2, 'Profile calculated', {
    psychic_number:     profile.psychic_number,
    destiny_number:     profile.destiny_number,
    name_number:        profile.name_number,
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
    log(3, 'Dispatching to engine: free_reading');
    const interpretations = await dispatcher.dispatch('free_reading', profile);

    // ── Read engine metadata tags from dispatcher result ──────
    // The dispatcher attaches _engine_config (what was configured)
    // and _engine_used (what actually ran). These tell us exactly
    // what happened — whether Claude ran, OpenAI ran, or fallback fired.
    const engineConfig = interpretations._engine_config || 'unknown';
    const engineUsed   = interpretations._engine_used   || 'unknown';

    log(4, 'Engine response received', {
      keys:         interpretations ? Object.keys(interpretations).filter(k => !k.startsWith('_')) : null,
      hasCards:     !!interpretations?.cards,
      cardCount:    interpretations?.cards?.length || 0,
      engineConfig,
      engineUsed,
      // Highlight clearly in logs when fallback fired
      fallbackFired: engineConfig !== engineUsed,
    });

// Fire-and-forget DB save.
// `name` and `dob` here are the SUBJECT's details — whoever's
// name was typed into the free reading form. There is no
// "customer" in a free reading; the subject is all we know.
saveReading(name, dob, profile, interpretations, engineConfig, engineUsed).catch(err =>
  console.error(`[${FILE}] DB save failed (non-fatal):`, err.message)
);
log(5, 'DB save triggered (non-blocking) — subject saved', { subjectName: name, subjectDob: dob, engineConfig, engineUsed });

    const isV1 = Array.isArray(interpretations?.cards);
    log(6, 'Engine version detected', { isV1 });

    // ── Expanded coreNumbers — 67 fields ─────────────────────
    const coreNumbers = {

      // ── Identity ─────────────────────────────────────────
      dob_fmt: profile.dob_fmt,

      // ── Psychic Number ───────────────────────────────────
      psychic_number:        profile.psychic_number,
      psychic_compound:      profile.psychic_compound,
      ruling_planet:         profile.ruling_planet,

      // ── Destiny Number ───────────────────────────────────
      destiny_number:        profile.destiny_number,
      destiny_compound:      profile.destiny_compound,

      // ── PD Combination ───────────────────────────────────
      pd_combination:        profile.pd_combination,

      // ── Name Number ──────────────────────────────────────
      name_number:           profile.name_number,
      name_compound:         profile.name_compound,

      // ── Soul Urge ────────────────────────────────────────
      soul_urge_number:      profile.soul_urge_number,
      soul_urge_compound:    profile.soul_urge_compound,

      // ── Personality Number ───────────────────────────────
      personality_number:    profile.personality_number,
      personality_compound:  profile.personality_compound,

      // ── Maturity Number ──────────────────────────────────
      maturity_number:       profile.maturity_number,
      maturity_compound:     profile.maturity_compound,

      // ── Power Number ─────────────────────────────────────
      power_number:          profile.power_number,
      power_compound:        profile.power_compound,

      // ── Life Path (same as destiny in Chaldean) ──────────
      life_path_number:      profile.life_path_number,
      life_path_compound:    profile.life_path_compound,

      // ── Birth Components ─────────────────────────────────
      birth_day_number:      profile.birth_day_number,
      birth_month_number:    profile.birth_month_number,
      birth_year_number:     profile.birth_year_number,

      // ── Time Cycles ──────────────────────────────────────
      personal_year_number:  profile.personal_year_number,
      personal_month_number: profile.personal_month_number,
      personal_day_number:   profile.personal_day_number,
      universal_year_number: profile.universal_year_number,
      universal_month_number:profile.universal_month_number,

      // ── Pinnacles ────────────────────────────────────────
      current_pinnacle:      profile.current_pinnacle,
      pinnacle_1_end_age:    profile.pinnacle_1_end_age,
      pinnacle_2:            profile.pinnacle_2,
      pinnacle_2_end_age:    profile.pinnacle_2_end_age,
      pinnacle_4:            profile.pinnacle_4,

      // ── Challenges ───────────────────────────────────────
      current_challenge:     profile.current_challenge,
      challenge_1:           profile.challenge_1,
      challenge_2:           profile.challenge_2,
      challenge_3:           profile.challenge_3,
      challenge_4:           profile.challenge_4,

      // ── Life Periods ─────────────────────────────────────
      current_life_period:   profile.current_life_period,
      life_period_2_end_age: profile.life_period_2_end_age,

      // ── Name Analysis ────────────────────────────────────
      cornerstone:           profile.cornerstone,
      cornerstone_value:     profile.cornerstone_value,
      capstone:              profile.capstone,
      capstone_value:        profile.capstone_value,
      first_vowel:           profile.first_vowel,
      first_vowel_value:     profile.first_vowel_value,

      // ── Hidden Patterns ──────────────────────────────────
      subconscious_self:     profile.subconscious_self,
      hidden_passions:       profile.hidden_passions,
      karmic_lessons:        profile.karmic_lessons,
      missing_numbers:       profile.missing_numbers,

      // ── Karmic Debt ──────────────────────────────────────
      has_karmic_debt:       profile.has_karmic_debt,
      karmic_debt_numbers:   profile.karmic_debt_numbers,
      karmic_debt_locations: profile.karmic_debt_locations,

      // ── Master Numbers ───────────────────────────────────
      has_master_11:         profile.has_master_11,
      has_master_22:         profile.has_master_22,
      has_master_33:         profile.has_master_33,
      master_numbers_found:  profile.master_numbers_found,

      // ── Planes of Expression ─────────────────────────────
      dominant_plane:        profile.dominant_plane,
      plane_mental_count:    profile.plane_mental_count,
      plane_physical_count:  profile.plane_physical_count,
      plane_emotional_count: profile.plane_emotional_count,
      plane_intuitive_count: profile.plane_intuitive_count,

      // ── Bridge Numbers ───────────────────────────────────
      soul_expression_bridge:  profile.soul_expression_bridge,
      life_personality_bridge: profile.life_personality_bridge,

      // ── Additional Derived ───────────────────────────────
      rational_thought_number: profile.rational_thought_number,
      balance_number:          profile.balance_number,
      essence_number:          profile.essence_number,

      // ── Transits ─────────────────────────────────────────
      physical_transit:        profile.physical_transit,
      physical_transit_value:  profile.physical_transit_value,
      mental_transit:          profile.mental_transit,
      mental_transit_value:    profile.mental_transit_value,
      spiritual_transit:       profile.spiritual_transit,
      spiritual_transit_value: profile.spiritual_transit_value,
    };

    let result;

    if (isV1) {
      result = {
        name,
        ...coreNumbers,
        first_name:     interpretations.first_name || name.split(' ')[0],
        cards:          interpretations.cards  || [],
        cta:            interpretations.cta    || null,
        traits:         interpretations.traits || [],
        dominant_theme: interpretations.dominant_theme || '',
        reading:        interpretations.cards?.[0]?.body || null,
      };
    } else {
      const firstCard = interpretations?.birth || {};
      result = {
        name,
        ...coreNumbers,
        first_name:     name.split(' ')[0],
        reading:        firstCard.text   || null,
        traits:         firstCard.traits || [],
        cards:          [],
        cta:            null,
        dominant_theme: '',
      };
    }

    log(7, 'Final response built', {
      cardCount:    result.cards?.length || 0,
      hasCTA:       !!result.cta,
      traitCount:   result.traits?.length || 0,
      fieldCount:   Object.keys(result).length,
      engineConfig,
      engineUsed,
    });

    return result;

  } catch (err) {
    log(99, 'ERROR in generate()', { message: err.message, stack: err.stack });
    throw err;
  }
}

module.exports = { generate };