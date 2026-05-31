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


// ── Birth Number ──────────────────────────────────────────────
/**
 * Calculates the Birth Number from a date of birth string.
 * Sums all digits in the date, then reduces to a single digit.
 *
 * Example: "1990-07-25"
 *   digits → [1,9,9,0,0,7,2,5] → sum = 33 → 3+3 = 6
 *
 * @param {string} dob  ISO date string, e.g. "1990-07-25"
 * @returns {number}
 */
function calcBirthNum(dob) {
  const digits = dob.replace(/-/g, '').split('').map(Number);
  const total  = digits.reduce((a, b) => a + b, 0);
  return reduceToSingle(total);
}


// ── Destiny Number ────────────────────────────────────────────
/**
 * Calculates the Destiny Number from a full name.
 * Each letter is converted to its alphabet position (A=1 … Z=26),
 * all values are summed, then reduced to a single digit.
 *
 * Example: "ANA" → 1+14+1 = 16 → 1+6 = 7
 *
 * @param {string} name  Full name (any case, spaces ignored)
 * @returns {number}
 */
function calcDestinyNum(name) {
  const total = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')           // keep only letters
    .split('')
    .reduce((sum, char) => sum + (char.charCodeAt(0) - 64), 0);
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