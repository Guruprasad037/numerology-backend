// ============================================================
//  helpers/numerology.js
//  Pure numerology calculation functions.
//  No database or Express dependencies — easy to test.
// ============================================================


// ── Core reducer ─────────────────────────────────────────────
/**
 * Repeatedly sums the digits of a number until it is a
 * single digit (1–9).
 *
 * Example: 29 → 2+9 = 11 → 1+1 = 2
 *
 * @param {number} n
 * @returns {number} single digit 1–9
 */
function reduceToSingle(n) {
  while (n > 9) {
    n = String(n)
      .split('')
      .reduce((sum, digit) => sum + parseInt(digit), 0);
  }
  return n;
}


// Birth Number — day of birth only, reduced to single digit
function calcBirthNum(dob) {
  const day = parseInt(dob.split('-')[2]);
  return reduceToSingle(day);
}

// Destiny Number — sum ALL digits of full DOB, reduced to single digit
function calcDestinyNum(dob) {
  const digits = dob.replace(/-/g, '').split('').map(Number);
  const total  = digits.reduce((a, b) => a + b, 0);
  return reduceToSingle(total);
}
// ── Date formatter ────────────────────────────────────────────
/**
 * Formats an ISO date string into a human-readable format.
 *
 * Example: "1990-07-25" → "25 Jul 1990"
 *
 * @param {string} dob  ISO date string, e.g. "1990-07-25"
 * @returns {string}
 */
function formatDob(dob) {
  const [y, m, d] = dob.split('-');
  const months = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec'
  ];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}


module.exports = { reduceToSingle, calcBirthNum, calcDestinyNum, formatDob };