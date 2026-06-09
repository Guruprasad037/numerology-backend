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
//    - Lucky attributes (colours, days, numbers, gem, metal, months)
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
const PLANE_MAP = {
  1:'mental', 2:'mental', 3:'mental',
  4:'physical', 5:'physical', 6:'physical',
  7:'intuitive', 8:'intuitive',
};


// ── Core reducers ─────────────────────────────────────────────

function reduceToSingle(n) {
  n = Math.abs(n);
  while (n > 9) {
    n = String(n).split('').reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return n;
}

function reducePreserveMaster(n) {
  n = Math.abs(n);
  while (n > 9 && !MASTER_NUMBERS.has(n)) {
    n = String(n).split('').reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return n;
}

function reducePreserveMasterAndKarmic(n) {
  n = Math.abs(n);
  if (KARMIC_DEBT_NUMBERS.has(n)) return n;
  while (n > 9 && !MASTER_NUMBERS.has(n)) {
    n = String(n).split('').reduce((sum, d) => sum + parseInt(d, 10), 0);
    if (KARMIC_DEBT_NUMBERS.has(n)) return n;
  }
  return n;
}

function nameToLetters(name) {
  return name.toUpperCase().split('').filter(ch => /[A-Z]/.test(ch));
}

function letterValue(ch) {
  return LETTER_VALUES[ch] || 0;
}

function formatDob(dob) {
  const [y, m, d] = dob.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}


// ═══════════════════════════════════════════════════════════════
//  1. PSYCHIC NUMBER
// ═══════════════════════════════════════════════════════════════
function calcPsychicNumber(dob) {
  const day = parseInt(dob.split('-')[2], 10);
  return {
    compound: day,
    number:   reducePreserveMaster(day),
  };
}


// ═══════════════════════════════════════════════════════════════
//  2. DESTINY NUMBER
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
// ═══════════════════════════════════════════════════════════════
function calcLifePathNumber(dob) {
  return calcDestinyNumber(dob);
}


// ═══════════════════════════════════════════════════════════════
//  4. BIRTH DAY / MONTH / YEAR breakdown
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
//  5. NAME NUMBER
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
//  6. SOUL URGE NUMBER
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
//  7. PERSONALITY NUMBER
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
// ═══════════════════════════════════════════════════════════════
function calcPinnaclesAndChallenges(dob, lifePathNumber, referenceDate = new Date()) {
  const { birth_day_number, birth_month_number, birth_year_number } =
    calcBirthComponents(dob);

  const lp = reduceToSingle(lifePathNumber);

  const p1End = 36 - lp;
  const p2End = p1End + 9;
  const p3End = p2End + 9;

  const p1Raw = birth_month_number + birth_day_number;
  const p2Raw = birth_day_number + birth_year_number;
  const p3Raw = reducePreserveMaster(p1Raw) + reducePreserveMaster(p2Raw);
  const p4Raw = birth_month_number + birth_year_number;

  const pinnacle_1 = reducePreserveMaster(p1Raw);
  const pinnacle_2 = reducePreserveMaster(p2Raw);
  const pinnacle_3 = reducePreserveMaster(p3Raw);
  const pinnacle_4 = reducePreserveMaster(p4Raw);

  const challenge_1 = Math.abs(birth_month_number - birth_day_number);
  const challenge_2 = Math.abs(birth_day_number - birth_year_number);
  const challenge_3 = Math.abs(challenge_1 - challenge_2);
  const challenge_4 = Math.abs(birth_month_number - birth_year_number);

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
//  13. LIFE PERIODS
// ═══════════════════════════════════════════════════════════════
function calcLifePeriods(dob, lifePathNumber, referenceDate = new Date()) {
  const { birth_day_number, birth_month_number, birth_year_number } =
    calcBirthComponents(dob);

  const lp   = reduceToSingle(lifePathNumber);
  const p1End = 36 - lp;
  const p2End = p1End + 27;

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
// ═══════════════════════════════════════════════════════════════
function calcMissingNumbers(name) {
  const present = new Set(
    nameToLetters(name).map(ch => letterValue(ch)).filter(Boolean)
  );
  return [1, 2, 3, 4, 5, 6, 7, 8].filter(n => !present.has(n));
}


// ═══════════════════════════════════════════════════════════════
//  16. HIDDEN PASSIONS
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
// ═══════════════════════════════════════════════════════════════
function calcSubconsciousSelf(missingNumbers) {
  return 8 - missingNumbers.length;
}


// ═══════════════════════════════════════════════════════════════
//  18. KARMIC DEBT
// ═══════════════════════════════════════════════════════════════
function calcKarmicDebt(compoundValues) {
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
// ═══════════════════════════════════════════════════════════════
function calcMasterNumbers(reducedValues) {
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
// ═══════════════════════════════════════════════════════════════
function calcRationalThoughtNumber(dob) {
  const { birth_day_number, birth_year_number } = calcBirthComponents(dob);
  const raw = birth_day_number + birth_year_number;
  return reducePreserveMaster(raw);
}


// ═══════════════════════════════════════════════════════════════
//  23. BALANCE NUMBER
// ═══════════════════════════════════════════════════════════════
function calcBalanceNumber(name) {
  const initials = name.toUpperCase().trim().split(/\s+/).map(w => w[0]);
  const raw = initials.reduce((sum, ch) => sum + (letterValue(ch) || 0), 0);
  return raw === 0 ? null : reducePreserveMaster(raw);
}


// ═══════════════════════════════════════════════════════════════
//  24. TRANSITS & ESSENCE NUMBER
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
  const last = letters[letters.length - 1];
  return { letter: last, value: letterValue(last) };
}

function calcTransits(name, dob, referenceDate = new Date()) {
  const parts = name.trim().split(/\s+/);
  const firstName  = parts[0] || '';
  const lastName   = parts[parts.length - 1] || '';
  const middleName = parts.length >= 3 ? parts[1] : lastName;

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
//  25. LUCKY ATTRIBUTES
//      Derived from psychic number (primary) and destiny number
//      (secondary). No DB column needed — calculated on the fly
//      and passed into the profile object for the prompt.
//
//      lucky_colors       — colours ruled by the psychic planet
//      lucky_days         — days ruled by the psychic planet
//      lucky_numbers      — dates/numbers vibrating with psychic
//      lucky_gem          — primary gemstone for psychic number
//      lucky_metal        — metal for the psychic planet
//      favourable_months  — months that resonate with psychic
//      secondary_gem      — gemstone for destiny number (if different)
// ═══════════════════════════════════════════════════════════════

const LUCKY_COLORS_MAP = {
  1: ['Gold', 'Orange', 'Yellow'],
  2: ['White', 'Silver', 'Cream'],
  3: ['Yellow', 'Purple', 'Violet'],
  4: ['Blue', 'Electric Blue', 'Grey'],
  5: ['Green', 'Light Green', 'White'],
  6: ['Pink', 'Blue', 'White'],
  7: ['Grey', 'Violet', 'Cream'],
  8: ['Black', 'Dark Blue', 'Dark Brown'],
  9: ['Red', 'Crimson', 'Orange-Red'],
};

const LUCKY_GEM_MAP = {
  1: { gem: 'Ruby',             metal: 'Gold'       },
  2: { gem: 'Pearl',            metal: 'Silver'     },
  3: { gem: 'Yellow Sapphire',  metal: 'Gold'       },
  4: { gem: "Cat's Eye",        metal: 'Mixed'      },
  5: { gem: 'Emerald',          metal: 'Gold'       },
  6: { gem: 'Diamond',          metal: 'Silver'     },
  7: { gem: "Cat's Eye",        metal: 'Mixed'      },
  8: { gem: 'Blue Sapphire',    metal: 'Iron/Steel' },
  9: { gem: 'Red Coral',        metal: 'Copper'     },
};

const LUCKY_DAYS_MAP = {
  1: ['Sunday', 'Monday'],
  2: ['Monday', 'Friday'],
  3: ['Thursday', 'Tuesday'],
  4: ['Sunday', 'Saturday'],
  5: ['Wednesday', 'Friday'],
  6: ['Friday', 'Wednesday'],
  7: ['Monday', 'Sunday'],
  8: ['Saturday', 'Sunday'],
  9: ['Tuesday', 'Thursday'],
};

const LUCKY_NUMBERS_MAP = {
  1: [1, 10, 19, 28],
  2: [2, 11, 20, 29],
  3: [3, 12, 21, 30],
  4: [4, 13, 22, 31],
  5: [5, 14, 23],
  6: [6, 15, 24],
  7: [7, 16, 25],
  8: [8, 17, 26],
  9: [9, 18, 27],
};

const FAVOURABLE_MONTHS_MAP = {
  1: ['January', 'October', 'July'],
  2: ['February', 'July', 'September'],
  3: ['March', 'December', 'June'],
  4: ['April', 'August', 'January'],
  5: ['May', 'June', 'September'],
  6: ['June', 'May', 'October'],
  7: ['July', 'February', 'August'],
  8: ['August', 'January', 'October'],
  9: ['September', 'March', 'November'],
};

function getLuckyAttributes(psychicNumber, destinyNumber) {
  const pn = reduceToSingle(psychicNumber) || 1;
  const dn = reduceToSingle(destinyNumber) || 1;

  const primaryColors   = LUCKY_COLORS_MAP[pn] || LUCKY_COLORS_MAP[1];
  const secondaryColors = LUCKY_COLORS_MAP[dn] || LUCKY_COLORS_MAP[1];
  const primaryGem      = LUCKY_GEM_MAP[pn]    || LUCKY_GEM_MAP[1];
  const secondaryGem    = LUCKY_GEM_MAP[dn]    || LUCKY_GEM_MAP[1];

  // Merge — psychic colours are primary, add one from destiny if different
  const allColors = [...new Set([...primaryColors, secondaryColors[0]])];

  return {
    lucky_colors:      allColors,
    lucky_days:        LUCKY_DAYS_MAP[pn]        || [],
    lucky_numbers:     LUCKY_NUMBERS_MAP[pn]     || [],
    lucky_gem:         primaryGem.gem,
    lucky_metal:       primaryGem.metal,
    favourable_months: FAVOURABLE_MONTHS_MAP[pn] || [],
    secondary_gem:     secondaryGem.gem !== primaryGem.gem ? secondaryGem.gem : null,
  };
}


// ═══════════════════════════════════════════════════════════════
//  MASTER BUILDER: buildNumerologyProfile
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
  const missing_numbers   = calcMissingNumbers(name);
  const hidden_passions   = calcHiddenPassions(name);
  const subconscious_self = calcSubconsciousSelf(missing_numbers);

  // ── Karmic debt ───────────────────────────────────────────
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

  // ── Lucky attributes ──────────────────────────────────────
  const luckyAttributes = getLuckyAttributes(psychic.number, destiny.number);

  // ── Assemble final profile object ─────────────────────────
  return {
    name_used: name,
    dob_used:  dob,

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

    life_path_number:    lifePath.number,
    life_path_compound:  lifePath.compound,
    ...birthComp,

    ...personalCycles,
    ...universalCycles,

    ...pinnacles,

    ...periods,

    ...nameAnalysis,

    subconscious_self,
    hidden_passions,
    karmic_lessons:   missing_numbers,
    missing_numbers,

    ...karmic,

    ...masters,

    ...planes,

    ...bridges,

    rational_thought_number,
    balance_number,

    ...transits,

    // Lucky attributes
    ...luckyAttributes,

    schema_version: 3,

    dob_fmt: formatDob(dob),
  };
}


module.exports = {
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
  getLuckyAttributes,

  buildNumerologyProfile,

  LETTER_VALUES,
  RULING_PLANETS,
  MASTER_NUMBERS,
  KARMIC_DEBT_NUMBERS,

  reduceToSingle,
  reducePreserveMaster,
  reducePreserveMasterAndKarmic,
  formatDob,
};