// ============================================================
// helpers/numerology.js
// Pure numerology calculation functions
// ============================================================


// ── Core reducer ─────────────────────────────────────────────
function reduceToSingle(n) {
  while (n > 9) {
    n = String(n)
      .split('')
      .reduce((sum, digit) => sum + parseInt(digit), 0);
  }
  return n;
}


// ─────────────────────────────────────────────────────────────
// Birth Number (day only)
// ─────────────────────────────────────────────────────────────
function calcBirthNum(dob) {
  const day = parseInt(dob.split('-')[2]);
  return reduceToSingle(day);
}


// ─────────────────────────────────────────────────────────────
// Destiny Number (FULL DOB + MASTER NUMBER SUPPORT)
// ─────────────────────────────────────────────────────────────
function calcDestinyNum(dob) {
  const digits = dob.replace(/-/g, '').split('').map(Number);
  const total = digits.reduce((a, b) => a + b, 0);

  // IMPORTANT: preserve master numbers first
  if (total === 11 || total === 22 || total === 33) {
    return total;
  }

  return reduceToSingle(total);
}


// ─────────────────────────────────────────────────────────────
// Master Number extractor (optional but recommended)
// ─────────────────────────────────────────────────────────────
function getMasterNumber(dob) {
  const digits = dob.replace(/-/g, '').split('').map(Number);
  const total = digits.reduce((a, b) => a + b, 0);

  if (total === 11 || total === 22 || total === 33) {
    return total;
  }

  return null;
}


// ── Date formatter ────────────────────────────────────────────
function formatDob(dob) {
  const [y, m, d] = dob.split('-');
  const months = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec'
  ];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}


// ── exports ──────────────────────────────────────────────────
module.exports = {
  reduceToSingle,
  calcBirthNum,
  calcDestinyNum,
  getMasterNumber,
  formatDob
};