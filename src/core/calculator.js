// ============================================================
//  core/calculator.js
//  Pure Pythagorean numerology calculations.
//
//  Calculates all 7 core numbers:
//    1. Birth Number        — day of birth reduced
//    2. Life Path Number    — full DOB reduced (master-number aware)
//    3. Expression Number   — full name letter values reduced
//    4. Soul Urge Number    — vowels in full name
//    5. Personality Number  — consonants in full name
//    6. Maturity Number     — Life Path + Expression reduced
//    7. Personal Year       — birth month+day + current year
//
//  Master numbers (11, 22, 33) are preserved where they arise
//  in Life Path and Expression; other numbers reduce to 1–9.
//
//  All functions are pure: no side-effects, no DB calls.
// ============================================================

// ── Pythagorean letter-value map ──────────────────────────────
// A=1, B=2 ... I=9, J=1, K=2 ... Z=8
const LETTER_VALUES = {
  A:1, B:2, C:3, D:4, E:5, F:6, G:7, H:8, I:9,
  J:1, K:2, L:3, M:4, N:5, O:6, P:7, Q:8, R:9,
  S:1, T:2, U:3, V:4, W:5, X:6, Y:7, Z:8,
};

const VOWELS     = new Set(['A','E','I','O','U']);
const CONSONANTS = new Set(Object.keys(LETTER_VALUES).filter(l => !VOWELS.has(l)));
// Y is treated as a consonant in Pythagorean numerology (common convention)

const MASTER_NUMBERS = new Set([11, 22, 33]);

// ── Core reducer ─────────────────────────────────────────────
// Reduces any integer to 1–9 by repeated digit-sum.
// Does NOT preserve master numbers — call preserveMaster() when needed.
function reduceToSingle(n) {
  while (n > 9) {
    n = String(n)
      .split('')
      .reduce((sum, digit) => sum + parseInt(digit, 10), 0);
  }
  return n;
}

// Reduces but STOPS at 11, 22, or 33 before going further.
function reducePreserveMaster(n) {
  while (n > 9 && !MASTER_NUMBERS.has(n)) {
    n = String(n)
      .split('')
      .reduce((sum, digit) => sum + parseInt(digit, 10), 0);
  }
  return n;
}


// ═══════════════════════════════════════════════════════════════
//  1. BIRTH NUMBER
//     Numerological meaning of the day you were born.
//     Range: 1–9  (no master numbers; day 11/22 reduce normally)
// ═══════════════════════════════════════════════════════════════
function calcBirthNum(dob) {
  const day = parseInt(dob.split('-')[2], 10);
  return reduceToSingle(day);
}


// ═══════════════════════════════════════════════════════════════
//  2. LIFE PATH NUMBER
//     The most important number: your overarching life theme.
//     Calculated by summing ALL digits of the full DOB.
//     Master numbers 11, 22, 33 are preserved.
//     Range: 1–9, 11, 22, 33
// ═══════════════════════════════════════════════════════════════
function calcLifePathNum(dob) {
  // Sum each component separately first (month, day, year) then combine
  // — this is the correct Pythagorean method to preserve master numbers.
  const [year, month, day] = dob.split('-').map(Number);

  const m = reducePreserveMaster(month);
  const d = reducePreserveMaster(day);
  const y = reducePreserveMaster(
    String(year).split('').reduce((s, c) => s + parseInt(c, 10), 0)
  );

  const total = m + d + y;
  return reducePreserveMaster(total);
}


// ═══════════════════════════════════════════════════════════════
//  3. EXPRESSION (DESTINY) NUMBER
//     What you are meant to accomplish / your natural talents.
//     Calculated from ALL letters of your full birth name.
//     Master numbers 11, 22, 33 are preserved.
//     Range: 1–9, 11, 22, 33
// ═══════════════════════════════════════════════════════════════
function calcExpressionNum(name) {
  const total = nameToLetters(name)
    .reduce((sum, letter) => sum + (LETTER_VALUES[letter] || 0), 0);
  return reducePreserveMaster(total);
}


// ═══════════════════════════════════════════════════════════════
//  4. SOUL URGE (HEART'S DESIRE) NUMBER
//     Your inner motivations, what you truly want at your core.
//     Calculated from VOWELS only in the full name.
//     Range: 1–9  (master numbers not traditionally preserved here)
// ═══════════════════════════════════════════════════════════════
function calcSoulUrgeNum(name) {
  const total = nameToLetters(name)
    .filter(l => VOWELS.has(l))
    .reduce((sum, letter) => sum + (LETTER_VALUES[letter] || 0), 0);
  return total === 0 ? 0 : reduceToSingle(total);
}


// ═══════════════════════════════════════════════════════════════
//  5. PERSONALITY NUMBER
//     How the outside world perceives you; your social mask.
//     Calculated from CONSONANTS only in the full name.
//     Range: 1–9
// ═══════════════════════════════════════════════════════════════
function calcPersonalityNum(name) {
  const total = nameToLetters(name)
    .filter(l => CONSONANTS.has(l))
    .reduce((sum, letter) => sum + (LETTER_VALUES[letter] || 0), 0);
  return total === 0 ? 0 : reduceToSingle(total);
}


// ═══════════════════════════════════════════════════════════════
//  6. MATURITY NUMBER
//     The energy that becomes prominent after mid-life (~35+).
//     Life Path + Expression, then reduced.
//     Range: 1–9
// ═══════════════════════════════════════════════════════════════
function calcMaturityNum(lifePathNum, expressionNum) {
  // If either is a master number, use its reduced form for this calculation
  const lp = MASTER_NUMBERS.has(lifePathNum) ? reduceToSingle(lifePathNum) : lifePathNum;
  const ex = MASTER_NUMBERS.has(expressionNum) ? reduceToSingle(expressionNum) : expressionNum;
  return reduceToSingle(lp + ex);
}


// ═══════════════════════════════════════════════════════════════
//  7. PERSONAL YEAR NUMBER
//     The theme / energy governing your current calendar year.
//     Calculated from birth month + birth day + CURRENT year.
//     Resets each birthday. Range: 1–9
// ═══════════════════════════════════════════════════════════════
function calcPersonalYearNum(dob, referenceDate = new Date()) {
  const [, month, day] = dob.split('-').map(Number);
  const currentYear = referenceDate.getFullYear();

  const total =
    reduceToSingle(month) +
    reduceToSingle(day) +
    String(currentYear).split('').reduce((s, c) => s + parseInt(c, 10), 0);

  return reduceToSingle(total);
}


// ── Internal helper: clean name → uppercase letter array ──────
function nameToLetters(name) {
  return name
    .toUpperCase()
    .split('')
    .filter(c => /[A-Z]/.test(c));
}


// ── Date formatter ────────────────────────────────────────────
function formatDob(dob) {
  const [y, m, d] = dob.split('-');
  const months = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec',
  ];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}


// ── Master number detector ────────────────────────────────────
// Returns the master number if present, else null.
// Useful for adding a special callout in the UI.
function getMasterNumber(dob) {
  const lp = calcLifePathNum(dob);
  return MASTER_NUMBERS.has(lp) ? lp : null;
}


// ── Full profile builder ──────────────────────────────────────
// Convenience function: returns ALL numbers for a name + dob.
// This is the function routes/reading.js should call.
function buildNumerologyProfile(name, dob) {
  const birth_num      = calcBirthNum(dob);
  const life_path_num  = calcLifePathNum(dob);
  const expression_num = calcExpressionNum(name);
  const soul_urge_num  = calcSoulUrgeNum(name);
  const personality_num = calcPersonalityNum(name);
  const maturity_num   = calcMaturityNum(life_path_num, expression_num);
  const personal_year  = calcPersonalYearNum(dob);
  const master_number  = MASTER_NUMBERS.has(life_path_num) ? life_path_num : null;

  return {
    birth_num,
    life_path_num,
    expression_num,
    soul_urge_num,
    personality_num,
    maturity_num,
    personal_year,
    master_number,
    dob_fmt: formatDob(dob),
  };
}


module.exports = {
  // Individual calculators
  calcBirthNum,
  calcLifePathNum,
  calcExpressionNum,
  calcSoulUrgeNum,
  calcPersonalityNum,
  calcMaturityNum,
  calcPersonalYearNum,
  getMasterNumber,
  formatDob,
  // Convenience
  buildNumerologyProfile,
  reduceToSingle,
  reducePreserveMaster,
};