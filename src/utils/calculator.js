// ============================================================
//  src/utils/calculator.js
//  Chaldean Numerology — complete calculation engine (Schema v3)
//
//  Covers all 83 columns in numerology_profiles:
//    - Core numbers (psychic, destiny, name, soul urge,
//      personality, maturity, power) — all with compounds
//    - Life path + birth day/month/year breakdown
//    - Time cycles (personal year/month/day, universal year/month)
//    - Pinnacles (4) + challenges (4) with ages
//    - Life periods (3) with end ages
//    - Name analysis (cornerstone, capstone, first vowel)
//    - Subconscious self, hidden passions, karmic lessons
//    - Karmic debt (13, 14, 16, 19) with locations
//    - Master numbers (11, 22, 33) with locations
//    - Planes of expression (mental/physical/emotional/intuitive)
//    - Bridge numbers (soul-expression, life-personality)
//    - Rational thought, balance number
//    - Transits (physical/mental/spiritual) + essence
//    - Ruling planet, PD combination
//
//  All functions are pure: no side-effects, no DB calls.
//  Compound numbers always stored alongside reduced numbers.
//  Master numbers 11, 22, 33 are preserved throughout.
//  9 is never assigned to letters (sacred in Chaldean)
//  but CAN appear as a final reduced result.
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
  // 9 intentionally unassigned — sacred in Chaldean
};

const VOWELS         = new Set(['A','E','I','O','U']);
const MASTER_NUMBERS = new Set([11, 22, 33]);

// Karmic debt compounds — these must NOT be reduced further
const KARMIC_DEBT_NUMBERS = new Set([13, 14, 16, 19]);

// Planets ruled by each number in Chaldean / Vedic tradition
const RULING_PLANETS = {
  1:'Sun', 2:'Moon', 3:'Jupiter', 4:'Rahu',
  5:'Mercury', 6:'Venus', 7:'Ketu', 8:'Saturn', 9:'Mars',
};

// Planes of expression — which plane each Chaldean value belongs to
// Mental: 1,2,3   Physical: 4,5,6   Emotional: 2,3,6   Intuitive: 7,8
// (Note: some letters are dual-plane in some traditions.
//  Using the most widely accepted Chaldean assignment below.)
const PLANE_MAP = {
  1:'mental', 2:'mental', 3:'mental',
  4:'physical', 5:'physical', 6:'physical',
  7:'intuitive', 8:'intuitive',
};


// ── Core reducers ─────────────────────────────────────────────

// Reduces any integer to single digit 1–9.
// Does NOT stop at master numbers. Use for final single-digit results.
function reduceToSingle(n) {
  n = Math.abs(n);
  while (n > 9) {
    n = String(n).split('').reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return n;
}

// Reduces but STOPS at 11, 22, or 33 (master numbers).
// Use this for all core numerology numbers.
function reducePreserveMaster(n) {
  n = Math.abs(n);
  while (n > 9 && !MASTER_NUMBERS.has(n)) {
    n = String(n).split('').reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return n;
}

// Reduces but also stops at karmic debt numbers (13, 14, 16, 19).
// Use when calculating life path, name, pinnacles, challenges.
function reducePreserveMasterAndKarmic(n) {
  n = Math.abs(n);
  if (KARMIC_DEBT_NUMBERS.has(n)) return n;
  while (n > 9 && !MASTER_NUMBERS.has(n)) {
    n = String(n).split('').reduce((sum, d) => sum + parseInt(d, 10), 0);
    if (KARMIC_DEBT_NUMBERS.has(n)) return n;
  }
  return n;
}

// Internal: extract A-Z letters from name
function nameToLetters(name) {
  return name.toUpperCase().split('').filter(ch => /[A-Z]/.test(ch));
}

// Internal: get Chaldean value for a single uppercase letter
function letterValue(ch) {
  return LETTER_VALUES[ch] || 0;
}

// Format DOB for display: "23 Jul 1991"
function formatDob(dob) {
  const [y, m, d] = dob.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}


// ═══════════════════════════════════════════════════════════════
//  1. PSYCHIC NUMBER  (Birth Number / Driver)
//     Day of birth only, reduced. If born on 29th:
//     compound=29, number=2 (or 11 if 29→11 — no, 2+9=11 yes!)
// ═══════════════════════════════════════════════════════════════
function calcPsychicNumber(dob) {
  const day = parseInt(dob.split('-')[2], 10);
  return {
    compound: day,
    number:   reducePreserveMaster(day),
  };
}


// ═══════════════════════════════════════════════════════════════
//  2. DESTINY NUMBER  (Life Path / Conductor)
//     ALL digits of full DOB summed and reduced.
//     e.g. 23-07-1991 → 2+3+0+7+1+9+9+1 = 32 → 5
//     Karmic debt compounds preserved if they appear.
// ═══════════════════════════════════════════════════════════════
function calcDestinyNumber(dob) {
  const raw = dob
    .replace(/-/g, '')
    .split('')
    .reduce((s, d) => s + parseInt(d, 10), 0);
  return {
    compound: raw,
    number:   reducePreserveMasterAndKarmic(raw),
  };
}


// ═══════════════════════════════════════════════════════════════
//  3. LIFE PATH NUMBER
//     In Chaldean, calculated same way as Destiny (flat sum).
//     Some traditions treat them as identical; stored separately
//     for flexibility. Both compounds are stored.
// ═══════════════════════════════════════════════════════════════
function calcLifePathNumber(dob) {
  // Same as destiny in Chaldean flat-sum method
  return calcDestinyNumber(dob);
}


// ═══════════════════════════════════════════════════════════════
//  4. BIRTH DAY / MONTH / YEAR breakdown
//     Each component reduced individually.
//     Used for pinnacle and challenge calculations.
// ═══════════════════════════════════════════════════════════════
function calcBirthComponents(dob) {
  const [yearStr, monthStr, dayStr] = dob.split('-');
  const day   = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const yearDigitSum = String(yearStr)
    .split('').reduce((s, d) => s + parseInt(d, 10), 0);

  return {
    birth_day_number:   reducePreserveMaster(day),
    birth_month_number: reducePreserveMaster(month),
    birth_year_number:  reducePreserveMaster(yearDigitSum),
  };
}


// ═══════════════════════════════════════════════════════════════
//  5. NAME NUMBER  (Expression / Name Vibration)
//     All letters of daily-use name in Chaldean values.
// ═══════════════════════════════════════════════════════════════
function calcNameNumber(name) {
  const compound = nameToLetters(name)
    .reduce((sum, ch) => sum + letterValue(ch), 0);
  return {
    compound,
    number: reducePreserveMasterAndKarmic(compound),
  };
}


// ═══════════════════════════════════════════════════════════════
//  6. SOUL URGE NUMBER  (Heart's Desire / Inner Voice)
//     Vowels only in the name.
// ═══════════════════════════════════════════════════════════════
function calcSoulUrgeNumber(name) {
  const compound = nameToLetters(name)
    .filter(ch => VOWELS.has(ch))
    .reduce((sum, ch) => sum + letterValue(ch), 0);
  return {
    compound,
    number: compound === 0 ? 0 : reducePreserveMasterAndKarmic(compound),
  };
}


// ═══════════════════════════════════════════════════════════════
//  7. PERSONALITY NUMBER  (Outer Expression / Dream Number)
//     Consonants only in the name.
// ═══════════════════════════════════════════════════════════════
function calcPersonalityNumber(name) {
  const compound = nameToLetters(name)
    .filter(ch => !VOWELS.has(ch))
    .reduce((sum, ch) => sum + letterValue(ch), 0);
  return {
    compound,
    number: compound === 0 ? 0 : reducePreserveMasterAndKarmic(compound),
  };
}


// ═══════════════════════════════════════════════════════════════
//  8. MATURITY NUMBER
//     Psychic + Destiny, reduced. Energy prominent after age 35.
//     Stored with compound.
// ═══════════════════════════════════════════════════════════════
function calcMaturityNumber(psychicNumber, destinyNumber) {
  const p = reduceToSingle(psychicNumber);
  const d = reduceToSingle(destinyNumber);
  const compound = p + d;
  return {
    compound,
    number: reducePreserveMaster(compound),
  };
}


// ═══════════════════════════════════════════════════════════════
//  9. POWER NUMBER
//     Name Number + Destiny Number, reduced.
//     Combined potential of name vibration and life direction.
// ═══════════════════════════════════════════════════════════════
function calcPowerNumber(nameNumber, destinyNumber) {
  const n = reduceToSingle(nameNumber);
  const d = reduceToSingle(destinyNumber);
  const compound = n + d;
  return {
    compound,
    number: reducePreserveMaster(compound),
  };
}


// ═══════════════════════════════════════════════════════════════
//  10. PERSONAL YEAR / MONTH / DAY NUMBERS
//      Govern energy cycles for the current period.
//      Personal Year:  birth day + birth month + current year
//      Personal Month: personal year + current calendar month
//      Personal Day:   personal month + current calendar day
// ═══════════════════════════════════════════════════════════════
function calcPersonalCycles(dob, referenceDate = new Date()) {
  const [, monthStr, dayStr] = dob.split('-');
  const birthDay   = parseInt(dayStr, 10);
  const birthMonth = parseInt(monthStr, 10);
  const curYear    = referenceDate.getFullYear();
  const curMonth   = referenceDate.getMonth() + 1;
  const curDay     = referenceDate.getDate();

  const yearSum  = String(curYear).split('').reduce((s, d) => s + parseInt(d, 10), 0);
  const pyRaw    = reduceToSingle(birthDay) + reduceToSingle(birthMonth) + yearSum;
  const pyNumber = reduceToSingle(pyRaw);

  const pmRaw    = pyNumber + curMonth;
  const pmNumber = reduceToSingle(pmRaw);

  const pdRaw    = pmNumber + curDay;
  const pdNumber = reduceToSingle(pdRaw);

  return {
    personal_year_number:  pyNumber,
    personal_month_number: pmNumber,
    personal_day_number:   pdNumber,
  };
}


// ═══════════════════════════════════════════════════════════════
//  11. UNIVERSAL YEAR / MONTH NUMBERS
//      Universal Year:  digits of current calendar year summed
//      Universal Month: universal year + current calendar month
// ═══════════════════════════════════════════════════════════════
function calcUniversalCycles(referenceDate = new Date()) {
  const curYear  = referenceDate.getFullYear();
  const curMonth = referenceDate.getMonth() + 1;

  const uyNumber = reduceToSingle(
    String(curYear).split('').reduce((s, d) => s + parseInt(d, 10), 0)
  );
  const umNumber = reduceToSingle(uyNumber + curMonth);

  return {
    universal_year_number:  uyNumber,
    universal_month_number: umNumber,
  };
}


// ═══════════════════════════════════════════════════════════════
//  12. PINNACLES & CHALLENGES
//
//  4 Pinnacle numbers represent life's peak themes.
//  4 Challenge numbers represent life's key lessons.
//
//  Pinnacle end ages are based on life path number:
//    Pinnacle 1 ends at: 36 - life_path_number
//    Pinnacle 2 ends at: pinnacle_1_end + 9
//    Pinnacle 3 ends at: pinnacle_2_end + 9
//    Pinnacle 4: remainder of life (no end age)
//
//  Pinnacle values:
//    P1 = birth month + birth day
//    P2 = birth day + birth year
//    P3 = P1 + P2
//    P4 = birth month + birth year
//
//  Challenge values:
//    C1 = |birth month - birth day|
//    C2 = |birth day - birth year|
//    C3 = |C1 - C2|    (main challenge)
//    C4 = |birth month - birth year|
// ═══════════════════════════════════════════════════════════════
function calcPinnaclesAndChallenges(dob, lifePathNumber, referenceDate = new Date()) {
  const { birth_day_number, birth_month_number, birth_year_number } =
    calcBirthComponents(dob);

  const lp = reduceToSingle(lifePathNumber);

  // Pinnacle ages
  const p1End = 36 - lp;
  const p2End = p1End + 9;
  const p3End = p2End + 9;

  // Pinnacle numbers
  const p1Raw = birth_month_number + birth_day_number;
  const p2Raw = birth_day_number + birth_year_number;
  const p3Raw = reducePreserveMaster(p1Raw) + reducePreserveMaster(p2Raw);
  const p4Raw = birth_month_number + birth_year_number;

  const pinnacle_1 = reducePreserveMaster(p1Raw);
  const pinnacle_2 = reducePreserveMaster(p2Raw);
  const pinnacle_3 = reducePreserveMaster(p3Raw);
  const pinnacle_4 = reducePreserveMaster(p4Raw);

  // Challenge numbers (absolute difference, no master/karmic preservation)
  const challenge_1 = Math.abs(birth_month_number - birth_day_number);
  const challenge_2 = Math.abs(birth_day_number - birth_year_number);
  const challenge_3 = Math.abs(challenge_1 - challenge_2);
  const challenge_4 = Math.abs(birth_month_number - birth_year_number);

  // Current pinnacle based on age today
  const birthYear  = parseInt(dob.split('-')[0], 10);
  const birthMonth = parseInt(dob.split('-')[1], 10);
  const birthDay   = parseInt(dob.split('-')[2], 10);
  const today      = referenceDate;
  let age = today.getFullYear() - birthYear;
  if (
    today.getMonth() + 1 < birthMonth ||
    (today.getMonth() + 1 === birthMonth && today.getDate() < birthDay)
  ) {
    age--;
  }

  let current_pinnacle;
  let current_challenge;
  if (age <= p1End) {
    current_pinnacle  = pinnacle_1;
    current_challenge = challenge_1;
  } else if (age <= p2End) {
    current_pinnacle  = pinnacle_2;
    current_challenge = challenge_2;
  } else if (age <= p3End) {
    current_pinnacle  = pinnacle_3;
    current_challenge = challenge_3;
  } else {
    current_pinnacle  = pinnacle_4;
    current_challenge = challenge_4;
  }

  return {
    pinnacle_1, pinnacle_1_start_age: 0,  pinnacle_1_end_age: p1End,
    pinnacle_2, pinnacle_2_start_age: p1End + 1, pinnacle_2_end_age: p2End,
    pinnacle_3, pinnacle_3_start_age: p2End + 1, pinnacle_3_end_age: p3End,
    pinnacle_4, pinnacle_4_start_age: p3End + 1,
    current_pinnacle,
    challenge_1, challenge_2, challenge_3, challenge_4,
    current_challenge,
  };
}


// ═══════════════════════════════════════════════════════════════
//  13. LIFE PERIODS  (3 major cycles)
//      Period 1: birth to (36 - life_path) — ruled by birth month
//      Period 2: next 27 years — ruled by birth day
//      Period 3: remainder — ruled by birth year
//      (Life periods mirror pinnacle ages in Chaldean tradition)
// ═══════════════════════════════════════════════════════════════
function calcLifePeriods(dob, lifePathNumber, referenceDate = new Date()) {
  const { birth_day_number, birth_month_number, birth_year_number } =
    calcBirthComponents(dob);

  const lp   = reduceToSingle(lifePathNumber);
  const p1End = 36 - lp;
  const p2End = p1End + 27;

  // Current age
  const birthYear  = parseInt(dob.split('-')[0], 10);
  const birthMonth = parseInt(dob.split('-')[1], 10);
  const birthDay   = parseInt(dob.split('-')[2], 10);
  const today      = referenceDate;
  let age = today.getFullYear() - birthYear;
  if (
    today.getMonth() + 1 < birthMonth ||
    (today.getMonth() + 1 === birthMonth && today.getDate() < birthDay)
  ) {
    age--;
  }

  const current_life_period = age <= p1End ? 1 : age <= p2End ? 2 : 3;

  return {
    life_period_1:         birth_month_number,
    life_period_1_end_age: p1End,
    life_period_2:         birth_day_number,
    life_period_2_end_age: p2End,
    life_period_3:         birth_year_number,
    current_life_period,
  };
}


// ═══════════════════════════════════════════════════════════════
//  14. NAME ANALYSIS — Cornerstone, Capstone, First Vowel
//      Cornerstone: first letter of full name (how you start things)
//      Capstone:    last letter of full name (how you finish things)
//      First Vowel: first vowel in full name (inner emotional response)
// ═══════════════════════════════════════════════════════════════
function calcNameAnalysis(name) {
  const letters = nameToLetters(name);
  if (letters.length === 0) return {};

  const cornerstone       = letters[0];
  const cornerstone_value = letterValue(cornerstone);
  const capstone          = letters[letters.length - 1];
  const capstone_value    = letterValue(capstone);

  const firstVowelLetter  = letters.find(ch => VOWELS.has(ch)) || null;
  const first_vowel       = firstVowelLetter;
  const first_vowel_value = firstVowelLetter ? letterValue(firstVowelLetter) : null;

  return {
    cornerstone,
    cornerstone_value,
    capstone,
    capstone_value,
    first_vowel,
    first_vowel_value,
  };
}


// ═══════════════════════════════════════════════════════════════
//  15. MISSING NUMBERS / KARMIC LESSONS
//      Values 1–8 absent from name letters.
//      In Chaldean, 9 is sacred so we only check 1–8.
//      Missing numbers = energy gaps = lessons for this lifetime.
// ═══════════════════════════════════════════════════════════════
function calcMissingNumbers(name) {
  const present = new Set(
    nameToLetters(name).map(ch => letterValue(ch)).filter(Boolean)
  );
  return [1, 2, 3, 4, 5, 6, 7, 8].filter(n => !present.has(n));
}


// ═══════════════════════════════════════════════════════════════
//  16. HIDDEN PASSIONS
//      Values appearing 3 or more times in the name.
//      These numbers dominate the personality — sometimes
//      positively (talent), sometimes as obsession.
// ═══════════════════════════════════════════════════════════════
function calcHiddenPassions(name) {
  const freq = {};
  nameToLetters(name).forEach(ch => {
    const v = letterValue(ch);
    if (v) freq[v] = (freq[v] || 0) + 1;
  });
  return Object.entries(freq)
    .filter(([, count]) => count >= 3)
    .map(([v]) => parseInt(v, 10))
    .sort((a, b) => a - b);
}


// ═══════════════════════════════════════════════════════════════
//  17. SUBCONSCIOUS SELF
//      8 minus the count of missing numbers (Chaldean uses 1–8).
//      Reveals how quickly you respond under pressure.
//      Higher = more instinctive and resourceful under stress.
// ═══════════════════════════════════════════════════════════════
function calcSubconsciousSelf(missingNumbers) {
  return 8 - missingNumbers.length;
}


// ═══════════════════════════════════════════════════════════════
//  18. KARMIC DEBT
//      Karmic debt compounds: 13, 14, 16, 19
//      These appear in the pre-reduction (compound) values of
//      core numbers. Their presence signals karmic lessons.
//
//      13 → laziness / transformation
//      14 → overindulgence / freedom lessons
//      16 → ego destruction / spiritual rebirth
//      19 → selfishness / independence lessons
// ═══════════════════════════════════════════════════════════════
function calcKarmicDebt(compoundValues) {
  // compoundValues: { life_path: 14, name: 32, soul_urge: 16, ... }
  const debt_numbers = [];
  const debt_locations = [];

  Object.entries(compoundValues).forEach(([location, compound]) => {
    if (KARMIC_DEBT_NUMBERS.has(compound)) {
      debt_numbers.push(compound);
      debt_locations.push(location);
    }
  });

  return {
    has_karmic_debt:       debt_numbers.length > 0,
    karmic_debt_numbers:   debt_numbers,
    karmic_debt_locations: debt_locations,
  };
}


// ═══════════════════════════════════════════════════════════════
//  19. MASTER NUMBERS (11, 22, 33)
//      Detected across all core reduced numbers.
//      Master numbers carry elevated spiritual responsibility.
//      11 = Master Intuitive  22 = Master Builder  33 = Master Teacher
// ═══════════════════════════════════════════════════════════════
function calcMasterNumbers(reducedValues) {
  // reducedValues: { life_path: 11, name: 4, destiny: 22, ... }
  const found = [];
  const locations = [];

  Object.entries(reducedValues).forEach(([location, number]) => {
    if (MASTER_NUMBERS.has(number)) {
      if (!found.includes(number)) found.push(number);
      locations.push(`${location}:${number}`);
    }
  });

  return {
    has_master_11:        found.includes(11),
    has_master_22:        found.includes(22),
    has_master_33:        found.includes(33),
    master_numbers_found: found.sort((a, b) => a - b),
  };
}


// ═══════════════════════════════════════════════════════════════
//  20. PLANES OF EXPRESSION
//      Each letter belongs to a plane based on its Chaldean value.
//      Mental (1,2,3): thinkers, communicators
//      Physical (4,5,6): builders, doers, sensualists
//      Intuitive (7,8): mystics, visionaries
//
//      Count of letters per plane reveals dominant mode.
//      Plane number = sum of values in that plane, reduced.
// ═══════════════════════════════════════════════════════════════
function calcPlanesOfExpression(name) {
  const planes = { mental: [], physical: [], emotional: [], intuitive: [] };

  nameToLetters(name).forEach(ch => {
    const v = letterValue(ch);
    const plane = PLANE_MAP[v];
    if (plane) planes[plane].push(v);
  });

  const sum = arr => arr.reduce((s, v) => s + v, 0);

  const mental_count    = planes.mental.length;
  const physical_count  = planes.physical.length;
  const emotional_count = planes.emotional.length;
  const intuitive_count = planes.intuitive.length;

  const counts = { mental: mental_count, physical: physical_count,
                   emotional: emotional_count, intuitive: intuitive_count };
  const dominant = Object.entries(counts)
    .sort(([,a],[,b]) => b - a)[0][0];

  return {
    plane_mental_count:    mental_count,
    plane_physical_count:  physical_count,
    plane_emotional_count: emotional_count,
    plane_intuitive_count: intuitive_count,
    plane_mental_number:   mental_count    ? reducePreserveMaster(sum(planes.mental))    : null,
    plane_physical_number: physical_count  ? reducePreserveMaster(sum(planes.physical))  : null,
    plane_emotional_number:emotional_count ? reducePreserveMaster(sum(planes.emotional)) : null,
    plane_intuitive_number:intuitive_count ? reducePreserveMaster(sum(planes.intuitive)) : null,
    dominant_plane: dominant,
  };
}


// ═══════════════════════════════════════════════════════════════
//  21. BRIDGE NUMBERS
//      Reveal the gap between two energies and how to close it.
//      soul_expression_bridge = |soul_urge - name_number|
//      life_personality_bridge = |life_path - personality|
// ═══════════════════════════════════════════════════════════════
function calcBridgeNumbers(soulUrge, nameNumber, lifePath, personality) {
  return {
    soul_expression_bridge:  Math.abs(
      reduceToSingle(soulUrge) - reduceToSingle(nameNumber)
    ),
    life_personality_bridge: Math.abs(
      reduceToSingle(lifePath) - reduceToSingle(personality)
    ),
  };
}


// ═══════════════════════════════════════════════════════════════
//  22. RATIONAL THOUGHT NUMBER
//      Birth day + birth year, reduced.
//      Reveals HOW you think and process information.
// ═══════════════════════════════════════════════════════════════
function calcRationalThoughtNumber(dob) {
  const { birth_day_number, birth_year_number } = calcBirthComponents(dob);
  const raw = birth_day_number + birth_year_number;
  return reducePreserveMaster(raw);
}


// ═══════════════════════════════════════════════════════════════
//  23. BALANCE NUMBER
//      Initials of each word in the name, reduced.
//      How you restore balance when life gets challenging.
// ═══════════════════════════════════════════════════════════════
function calcBalanceNumber(name) {
  const initials = name.toUpperCase().trim().split(/\s+/).map(w => w[0]);
  const raw = initials.reduce((sum, ch) => sum + (letterValue(ch) || 0), 0);
  return raw === 0 ? null : reducePreserveMaster(raw);
}


// ═══════════════════════════════════════════════════════════════
//  24. TRANSITS & ESSENCE NUMBER
//
//  Each letter of the name governs a span of years equal to
//  its Chaldean value. Cycling through letters reveals which
//  letter (transit) is active in the current year.
//
//  physical_transit  = active letter from FIRST name
//  mental_transit    = active letter from MIDDLE name (or last if no middle)
//  spiritual_transit = active letter from LAST name
//
//  essence_number = sum of all three transit values, reduced.
//
//  This is one of the most time-specific Chaldean tools.
// ═══════════════════════════════════════════════════════════════
function getActiveTransitLetter(namePart, age) {
  const letters = nameToLetters(namePart);
  if (letters.length === 0) return { letter: null, value: null };

  let yearsAccumulated = 0;
  let cycleAge = age % letters.reduce((s, ch) => s + (letterValue(ch) || 1), 0);
  if (cycleAge < 0) cycleAge = 0;

  for (const ch of letters) {
    const duration = letterValue(ch) || 1;
    yearsAccumulated += duration;
    if (yearsAccumulated > cycleAge) {
      return { letter: ch, value: letterValue(ch) };
    }
  }
  // Fallback: last letter
  const last = letters[letters.length - 1];
  return { letter: last, value: letterValue(last) };
}

function calcTransits(name, dob, referenceDate = new Date()) {
  // Split name into parts
  const parts = name.trim().split(/\s+/);
  const firstName  = parts[0] || '';
  const lastName   = parts[parts.length - 1] || '';
  const middleName = parts.length >= 3 ? parts[1] : lastName; // fallback to last

  // Current age
  const birthYear  = parseInt(dob.split('-')[0], 10);
  const birthMonth = parseInt(dob.split('-')[1], 10);
  const birthDay   = parseInt(dob.split('-')[2], 10);
  let age = referenceDate.getFullYear() - birthYear;
  if (
    referenceDate.getMonth() + 1 < birthMonth ||
    (referenceDate.getMonth() + 1 === birthMonth &&
     referenceDate.getDate() < birthDay)
  ) { age--; }

  const physical  = getActiveTransitLetter(firstName, age);
  const mental    = getActiveTransitLetter(middleName, age);
  const spiritual = getActiveTransitLetter(lastName, age);

  const essenceRaw = (physical.value || 0) + (mental.value || 0) + (spiritual.value || 0);

  return {
    physical_transit:        physical.letter,
    physical_transit_value:  physical.value,
    mental_transit:          mental.letter,
    mental_transit_value:    mental.value,
    spiritual_transit:       spiritual.letter,
    spiritual_transit_value: spiritual.value,
    essence_number:          essenceRaw > 0 ? reducePreserveMaster(essenceRaw) : null,
  };
}


// ═══════════════════════════════════════════════════════════════
//  MASTER BUILDER: buildNumerologyProfile
//
//  The single function called by your services.
//  Returns a flat object matching ALL 83 columns of
//  numerology_profiles in the database.
//
//  Usage:
//    const profile = buildNumerologyProfile('Guru Prasad', '1991-07-23');
// ═══════════════════════════════════════════════════════════════
function buildNumerologyProfile(name, dob, referenceDate = new Date()) {
  // ── Core numbers ─────────────────────────────────────────
  const psychic     = calcPsychicNumber(dob);
  const destiny     = calcDestinyNumber(dob);
  const lifePath    = calcLifePathNumber(dob);
  const nameNum     = calcNameNumber(name);
  const soulUrge    = calcSoulUrgeNumber(name);
  const personality = calcPersonalityNumber(name);
  const maturity    = calcMaturityNumber(psychic.number, destiny.number);
  const power       = calcPowerNumber(nameNum.number, destiny.number);
  const birthComp   = calcBirthComponents(dob);

  // ── Time cycles ──────────────────────────────────────────
  const personalCycles  = calcPersonalCycles(dob, referenceDate);
  const universalCycles = calcUniversalCycles(referenceDate);

  // ── Pinnacles + Challenges ────────────────────────────────
  const pinnacles = calcPinnaclesAndChallenges(dob, lifePath.number, referenceDate);

  // ── Life periods ─────────────────────────────────────────
  const periods = calcLifePeriods(dob, lifePath.number, referenceDate);

  // ── Name analysis ─────────────────────────────────────────
  const nameAnalysis = calcNameAnalysis(name);

  // ── Missing / hidden / subconscious ──────────────────────
  const missing_numbers = calcMissingNumbers(name);
  const hidden_passions = calcHiddenPassions(name);
  const subconscious_self = calcSubconsciousSelf(missing_numbers);

  // ── Karmic debt ───────────────────────────────────────────
  // Check compounds of all major numbers for karmic debt
  const karmic = calcKarmicDebt({
    life_path:   lifePath.compound,
    name:        nameNum.compound,
    soul_urge:   soulUrge.compound,
    personality: personality.compound,
    destiny:     destiny.compound,
  });

  // ── Master numbers ────────────────────────────────────────
  const masters = calcMasterNumbers({
    psychic:     psychic.number,
    destiny:     destiny.number,
    life_path:   lifePath.number,
    name:        nameNum.number,
    soul_urge:   soulUrge.number,
    personality: personality.number,
    maturity:    maturity.number,
  });

  // ── Planes of expression ──────────────────────────────────
  const planes = calcPlanesOfExpression(name);

  // ── Bridge numbers ────────────────────────────────────────
  const bridges = calcBridgeNumbers(
    soulUrge.number, nameNum.number,
    lifePath.number, personality.number
  );

  // ── Additional derived ────────────────────────────────────
  const rational_thought_number = calcRationalThoughtNumber(dob);
  const balance_number          = calcBalanceNumber(name);

  // ── Transits ─────────────────────────────────────────────
  const transits = calcTransits(name, dob, referenceDate);

  // ── Ruling planet + PD combination ───────────────────────
  const ruling_planet  = RULING_PLANETS[psychic.number] || null;
  const pd_combination = `${psychic.number}-${destiny.number}`;

  // ── Assemble final profile object ─────────────────────────
  return {
    // Identity (caller sets name_used, dob_used, user_id, is_primary)
    name_used: name,
    dob_used:  dob,

    // Core Chaldean numbers
    psychic_number:        psychic.number,
    psychic_compound:      psychic.compound,
    destiny_number:        destiny.number,
    destiny_compound:      destiny.compound,
    name_number:           nameNum.number,
    name_compound:         nameNum.compound,
    soul_urge_number:      soulUrge.number,
    soul_urge_compound:    soulUrge.compound,
    personality_number:    personality.number,
    personality_compound:  personality.compound,
    maturity_number:       maturity.number,
    maturity_compound:     maturity.compound,
    power_number:          power.number,
    power_compound:        power.compound,

    ruling_planet,
    pd_combination,

    // Life path
    life_path_number:    lifePath.number,
    life_path_compound:  lifePath.compound,
    ...birthComp,

    // Time cycles
    ...personalCycles,
    ...universalCycles,

    // Pinnacles + challenges
    ...pinnacles,

    // Life periods
    ...periods,

    // Name analysis
    ...nameAnalysis,

    // Subconscious + hidden
    subconscious_self,
    hidden_passions,
    karmic_lessons:   missing_numbers,   // same values, different label
    missing_numbers,

    // Karmic debt
    ...karmic,

    // Master numbers
    ...masters,

    // Planes of expression
    ...planes,

    // Bridge numbers
    ...bridges,

    // Additional derived
    rational_thought_number,
    balance_number,

    // Transits + essence
    ...transits,

    // Meta
    schema_version: 3,

    // Convenience for display
    dob_fmt: formatDob(dob),
  };
}


module.exports = {
  // Individual calculators (export for testing / partial use)
  calcPsychicNumber,
  calcDestinyNumber,
  calcLifePathNumber,
  calcBirthComponents,
  calcNameNumber,
  calcSoulUrgeNumber,
  calcPersonalityNumber,
  calcMaturityNumber,
  calcPowerNumber,
  calcPersonalCycles,
  calcUniversalCycles,
  calcPinnaclesAndChallenges,
  calcLifePeriods,
  calcNameAnalysis,
  calcMissingNumbers,
  calcHiddenPassions,
  calcSubconsciousSelf,
  calcKarmicDebt,
  calcMasterNumbers,
  calcPlanesOfExpression,
  calcBridgeNumbers,
  calcRationalThoughtNumber,
  calcBalanceNumber,
  calcTransits,

  // Master builder — use this in your services
  buildNumerologyProfile,

  // Constants (useful in prompts / interpretation)
  LETTER_VALUES,
  RULING_PLANETS,
  MASTER_NUMBERS,
  KARMIC_DEBT_NUMBERS,

  // Utilities
  reduceToSingle,
  reducePreserveMaster,
  reducePreserveMasterAndKarmic,
  formatDob,
};