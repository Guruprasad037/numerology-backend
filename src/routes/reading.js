// ============================================================
// routes/reading.js
// POST /reading
// ============================================================
const express = require('express');
const router = express.Router();
const { dbRun } = require('../config/db');
const { buildNumerologyProfile, formatDob } = require('../core/calculator');
const { READINGS, VALID_GENDERS } = require('../core/interpretations');

router.post('/', async (req, res) => {
  const { name, dob, phone = '', gender = 'Prefer not to say' } = req.body;

  if (!name || !name.trim())
    return res.status(400).json({ error: 'Name is required.' });
  if (!dob)
    return res.status(400).json({ error: 'Date of birth is required.' });
  if (gender && !VALID_GENDERS.includes(gender))
    return res.status(400).json({ error: `gender must be one of: ${VALID_GENDERS.join(', ')}` });

  const {
    birth_num, life_path_num, expression_num,
    soul_urge_num, personality_num, maturity_num,
    personal_year, master_number, dob_fmt
  } = buildNumerologyProfile(name.trim(), dob);

  const reading = READINGS[birth_num] || READINGS[1];

  dbRun(
    `INSERT INTO free_readings
     (name, dob, birth_num, life_path_num, expression_num,
      soul_urge_num, personality_num, maturity_num,
      personal_year, master_number)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [name.trim(), dob, birth_num, life_path_num, expression_num,
     soul_urge_num, personality_num, maturity_num,
     personal_year, master_number]
  ).catch(err => console.error('Failed to save free reading:', err));

  return res.json({
    name: name.trim(),
    dob_fmt,
    birth_num,
    life_path_num,
    expression_num,
    soul_urge_num,
    personality_num,
    maturity_num,
    personal_year,
    master_number,
    traits: reading.traits,
    reading: reading.text
  });
});

module.exports = router;