// ============================================================
// routes/reading.js
// POST /reading
// Free Numerology Reading API
// ============================================================

const express = require('express');
const router = express.Router();

const { dbRun } = require('../config/db');
const {
  calcBirthNum,
  calcDestinyNum,
  formatDob
} = require('../helpers/numerology');

const { READINGS, VALID_GENDERS } = require('../helpers/data');


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

  // ── Numerology Calculations (FIXED LOGIC) ──────────────────
  const birth_num = calcBirthNum(dob);        // day-based
  const destiny_num = calcDestinyNum(dob);    // FULL DOB-based

  const reading = READINGS[birth_num] || READINGS[1];

  // ── Save to DB (non-blocking) ──────────────────────────────
  dbRun(
    `INSERT INTO free_readings 
     (name, phone, dob, gender, birth_num, destiny_num)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      name.trim(),
      phone.trim(),
      dob,
      gender,
      birth_num,
      destiny_num
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
    traits: reading.traits,
    reading: reading.text
  });
});

module.exports = router;