// ============================================================
//  src/utils/calculator.js
//  Chaldean Numerology — pure calculation functions.
//
//  Core numbers:
//    1. Psychic Number     — day of birth reduced (Birth/Driver)
//    2. Destiny Number     — full DOB all digits reduced (Life Path/Conductor)
//    3. Personal Year      — birth day + month + current year
//    4. Name Number        — all letters of daily-use name (Expression)
//    5. Soul Urge Number   — vowels only from name
//    6. Personality Number — consonants only from name
//    7. Maturity Number    — psychic + destiny reduced
//    8. Power Number       — name number + destiny number reduced
//    9. Missing Numbers    — values 1–8 absent from name
//
//  Compound numbers are ALWAYS stored alongside reduced numbers.
//  This is the defining feature of Chaldean vs Pythagorean.
//
//  Master numbers 11, 22, 33 are preserved throughout.
//  9 is never directly assigned to letters (sacred in Chaldean)
//  but CAN appear as a final result.
//
//  All functions are pure: no side-effects, no DB calls.
// ============================================================

// ── Chaldean letter-value map (1–8 only) ─────────────────────
const LETTER_VALUES = {
  A:1, I:1, J:1, Q:1, Y:1,
  B:2, K:2, R:2,
  C:3, G:3, L:3, S:3,
  D:4, M:4, T:4,
  E:5, H:5, N:5, X:5,
  U:6, V:6, W:6,
  O:7, Z:7,
  F:8, P:8,
  // 9 is intentionally unassigned — sacred in Chaldean
};

const VOWELS         = new Set(['A','E','I','O','U']);
const MASTER_NUMBERS = new Set([11, 22, 33]);

// Planets ruled by each number in Chaldean (aligns with Vedic)
const RULING_PLANETS = {
  1:'Sun', 2:'Moon', 3:'Jupiter', 4:'Rahu',
  5:'Mercury', 6:'Venus', 7:'Ketu', 8:'Saturn', 9:'Mars',
};


// ── Core reducers ─────────────────────────────────────────────

// Reduces to single digit 1–9. Does NOT stop at master numbers.
function reduceToSingle(n) {
  while (n > 9) {
    n = String(n).split('').reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return n;
}

// Reduces but STOPS at 11, 22, or 33.
function reducePreserveMaster(n) {
  while (n > 9 && !MASTER_NUMBERS.has(n)) {
    n = String(n).split('').reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return n;
}


// ═══════════════════════════════════════════════════════════════
//  1. PSYCHIC NUMBER  (Birth Number / Driver Number)
//     The day you were born, reduced.
//     Reveals inner nature, instincts, and how you see yourself.
//     compound = raw day (e.g. 23), number = reduced (e.g. 5)
// ═══════════════════════════════════════════════════════════════
function calcPsychicNumber(dob) {
  const day = parseInt(dob.split('-')[2], 10);
  return {
    compound: day,
    number:   reducePreserveMaster(day),
  };
}


// ═══════════════════════════════════════════════════════════════
//  2. DESTINY NUMBER  (Life Path / Conductor Number)
//     All digits of full date of birth summed and reduced.
//     Reveals overarching life direction and purpose.
//     e.g. 23-07-1991 → 2+3+0+7+1+9+9+1 = 32 → 5
// ═══════════════════════════════════════════════════════════════
function calcDestinyNumber(dob) {
  const raw = dob
    .replace(/-/g, '')
    .split('')
    .reduce((s, d) => s + parseInt(d, 10), 0);
  return {
    compound: raw,
    number:   reducePreserveMaster(raw),
  };
}


// ═══════════════════════════════════════════════════════════════
//  3. PERSONAL YEAR NUMBER
//     The energy theme governing your current calendar year.
//     Birth day + birth month + current year, all reduced.
//     Range: 1–9
// ═══════════════════════════════════════════════════════════════
function calcPersonalYearNumber(dob, referenceDate = new Date()) {
  const [, monthStr, dayStr] = dob.split('-');
  const day     = parseInt(dayStr, 10);
  const month   = parseInt(monthStr, 10);
  const year    = referenceDate.getFullYear();
  const yearSum = String(year).split('').reduce((s, d) => s + parseInt(d, 10), 0);
  const total   = reduceToSingle(day) + reduceToSingle(month) + yearSum;
  return reduceToSingle(total);
}


// ═══════════════════════════════════════════════════════════════
//  4. NAME NUMBER  (Expression / Destiny from Name)
//     All letters of the daily-use name summed using Chaldean
//     values. Both compound and reduced are stored.
//     The compound carries its own Chaldean meaning.
// ═══════════════════════════════════════════════════════════════
function calcNameNumber(name) {
  const compound = nameToLetters(name)
    .reduce((sum, ch) => sum + (LETTER_VALUES[ch] || 0), 0);
  return {
    compound,
    number: reducePreserveMaster(compound),
  };
}


// ═══════════════════════════════════════════════════════════════
//  5. SOUL URGE NUMBER  (Heart's Desire / Inner Voice)
//     Vowels only in the name. Reveals inner motivations
//     and what the soul truly desires.
// ═══════════════════════════════════════════════════════════════
function calcSoulUrgeNumber(name) {
  const compound = nameToLetters(name)
    .filter(ch => VOWELS.has(ch))
    .reduce((sum, ch) => sum + (LETTER_VALUES[ch] || 0), 0);
  return {
    compound,
    number: compound === 0 ? 0 : reducePreserveMaster(compound),
  };
}


// ═══════════════════════════════════════════════════════════════
//  6. PERSONALITY NUMBER  (Outer Expression / Dream Number)
//     Consonants only in the name.
//     How the world perceives you; your outward social mask.
// ═══════════════════════════════════════════════════════════════
function calcPersonalityNumber(name) {
  const compound = nameToLetters(name)
    .filter(ch => !VOWELS.has(ch))
    .reduce((sum, ch) => sum + (LETTER_VALUES[ch] || 0), 0);
  return {
    compound,
    number: compound === 0 ? 0 : reducePreserveMaster(compound),
  };
}


// ═══════════════════════════════════════════════════════════════
//  7. MATURITY NUMBER
//     Psychic Number + Destiny Number, reduced.
//     The energy that strengthens and becomes prominent after 35.
// ═══════════════════════════════════════════════════════════════
function calcMaturityNumber(psychicNumber, destinyNumber) {
  return reduceToSingle(
    reduceToSingle(psychicNumber) + reduceToSingle(destinyNumber)
  );
}


// ═══════════════════════════════════════════════════════════════
//  8. POWER NUMBER
//     Name Number + Destiny Number, reduced.
//     Combined potential of name vibration and life direction.
// ═══════════════════════════════════════════════════════════════
function calcPowerNumber(nameNumber, destinyNumber) {
  return reduceToSingle(
    reduceToSingle(nameNumber) + reduceToSingle(destinyNumber)
  );
}


// ═══════════════════════════════════════════════════════════════
//  9. MISSING NUMBERS
//     Which values 1–8 are absent from the name letters.
//     Missing numbers reveal energy gaps and lessons to develop.
// ═══════════════════════════════════════════════════════════════
function calcMissingNumbers(name) {
  const present = new Set(
    nameToLetters(name)
      .map(ch => LETTER_VALUES[ch])
      .filter(Boolean)
  );
  return [1, 2, 3, 4, 5, 6, 7, 8].filter(n => !present.has(n));
}


// ── Internal helper ────────────────────────────────────────────
function nameToLetters(name) {
  return name.toUpperCase().split('').filter(ch => /[A-Z]/.test(ch));
}

// ── Date formatter ─────────────────────────────────────────────
function formatDob(dob) {
  const [y, m, d] = dob.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}


// ── Full profile builder ───────────────────────────────────────
// Called by free-reading.js. Returns every number for DB + engine.
function buildNumerologyProfile(name, dob, birthName = null) {
  const psychic     = calcPsychicNumber(dob);
  const destiny     = calcDestinyNumber(dob);
  const nameNum     = calcNameNumber(name);
  const soulUrge    = calcSoulUrgeNumber(name);
  const personality = calcPersonalityNumber(name);

  const psychic_number       = psychic.number;
  const psychic_compound     = psychic.compound;
  const destiny_number       = destiny.number;
  const destiny_compound     = destiny.compound;
  const name_number          = nameNum.number;
  const name_compound        = nameNum.compound;
  const soul_urge_number     = soulUrge.number;
  const soul_urge_compound   = soulUrge.compound;
  const personality_number   = personality.number;
  const personality_compound = personality.compound;

  // Birth name (optional — user may or may not provide it)
  let birth_name_number   = null;
  let birth_name_compound = null;
  if (birthName && birthName.trim()) {
    const bn        = calcNameNumber(birthName.trim());
    birth_name_number   = bn.number;
    birth_name_compound = bn.compound;
  }

  return {
    // DOB-based
    psychic_number,
    psychic_compound,
    destiny_number,
    destiny_compound,
    personal_year_number: calcPersonalYearNumber(dob),
    ruling_planet:        RULING_PLANETS[psychic_number] || null,

    // Name-based
    name_number,
    name_compound,
    soul_urge_number,
    soul_urge_compound,
    personality_number,
    personality_compound,

    // Birth name
    birth_name_number,
    birth_name_compound,
    birth_name_used: birthName ? birthName.trim() : null,

    // Derived
    maturity_number: calcMaturityNumber(psychic_number, destiny_number),
    power_number:    calcPowerNumber(name_number, destiny_number),

    // Chaldean-specific
    missing_numbers: calcMissingNumbers(name),
    pd_combination:  `${psychic_number}-${destiny_number}`,

    // Meta
    dob_fmt:   formatDob(dob),
    name_used: name,
  };
}


module.exports = {
  calcPsychicNumber,
  calcDestinyNumber,
  calcPersonalYearNumber,
  calcNameNumber,
  calcSoulUrgeNumber,
  calcPersonalityNumber,
  calcMaturityNumber,
  calcPowerNumber,
  calcMissingNumbers,
  formatDob,
  buildNumerologyProfile,
  reduceToSingle,
  reducePreserveMaster,
  LETTER_VALUES,
  RULING_PLANETS,
};