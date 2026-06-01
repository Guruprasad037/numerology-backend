// ============================================================
// routes/reading.js
// POST /reading
// Free Numerology Reading API (with Master Number support)
// ============================================================

const express = require('express');
const router = express.Router();

const { dbRun } = require('../config/db');
const {
  calcBirthNum,
  calcDestinyNum,
  formatDob
} = require('../core/calculator');

const { READINGS, VALID_GENDERS } = require('../core/interpretations');


// ─────────────────────────────────────────────────────────────
// Helper: extract master number (11, 22, 33)
// ─────────────────────────────────────────────────────────────
function getMasterNumber(dob) {
  const digits = dob.replace(/-/g, '').split('').map(Number);
  const total = digits.reduce((a, b) => a + b, 0);

  // check master numbers before reduction
  if (total === 11 || total === 22 || total === 33) {
    return total;
  }

  return null;
}


// ─────────────────────────────────────────────────────────────
// POST /reading
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    name,
    dob,
    phone = '',
    gender = 'Prefer not to say'
  } = req.body;

  // ── Validation ─────────────────────────────────────────────
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  if (!dob) {
    return res.status(400).json({ error: 'Date of birth is required.' });
  }

  if (gender && !VALID_GENDERS.includes(gender)) {
    return res.status(400).json({
      error: `gender must be one of: ${VALID_GENDERS.join(', ')}`
    });
  }

  // ── Numerology Calculations ────────────────────────────────
  const birth_num = calcBirthNum(dob);
  const destiny_num = calcDestinyNum(dob);
  const master_number = getMasterNumber(dob);

  const reading = READINGS[birth_num] || READINGS[1];

  // ── Save to DB (UPDATED SCHEMA) ────────────────────────────
  dbRun(
    `INSERT INTO free_readings 
     (name, dob, birth_num, destiny_num, master_number)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      name.trim(),
      dob,
      birth_num,
      destiny_num,
      master_number
    ]
  ).catch(err => {
    console.error('Failed to save free reading:', err);
  });

  // ── Response ───────────────────────────────────────────────
  return res.json({
    name: name.trim(),
    dob_fmt: formatDob(dob),
    birth_num,
    destiny_num,
    master_number,
    traits: reading.traits,
    reading: reading.text
  });
});

module.exports = router;