// ============================================================
//  routes/reading.js
//  POST /reading
//
//  Handles the free personality reading.
//  - Validates input
//  - Calculates birth number + destiny number
//  - Saves the lead to free_readings table
//  - Returns the reading text + traits to the frontend
// ============================================================

const express    = require('express');
const router     = express.Router();
const { dbRun }  = require('../config/db');
const { calcBirthNum, calcDestinyNum, formatDob } = require('../helpers/numerology');
const { READINGS, VALID_GENDERS } = require('../helpers/data');


// ── POST /reading ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    name,
    dob,
    phone  = '',                       // optional — empty string if not provided
    gender = 'Prefer not to say',      // optional — defaults to neutral value
  } = req.body;

  // ── Validation ──────────────────────────────────────────────
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (!dob) {
    return res.status(400).json({ error: 'Date of birth is required.' });
  }
  if (gender && !VALID_GENDERS.includes(gender)) {
    return res.status(400).json({ error: `gender must be one of: ${VALID_GENDERS.join(', ')}` });
  }

  // ── Calculate numbers ────────────────────────────────────────
  const birth_num   = calcBirthNum(dob);
  const destiny_num = calcDestinyNum(name.trim());
  const reading     = READINGS[birth_num] || READINGS[1];

  // ── Save lead to DB (non-blocking — don't fail the request) ──
  // We save asynchronously and catch errors silently so a DB
  // hiccup never breaks the user's free reading experience.
  dbRun(
    `INSERT INTO free_readings (name, phone, dob, gender, birth_num, destiny_num)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [name.trim(), phone.trim(), dob, gender, birth_num, destiny_num]
  ).catch(err => console.error('Failed to save free reading:', err));

  // ── Respond ──────────────────────────────────────────────────
  return res.json({
    name:        name.trim(),
    dob_fmt:     formatDob(dob),
    birth_num,
    destiny_num,
    traits:      reading.traits,
    reading:     reading.text,
  });
});


module.exports = router;