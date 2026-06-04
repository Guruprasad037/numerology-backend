// ============================================================
//  src/routes/reading.js
//  POST /reading
//
//  v4 — birth_name removed (Chaldean single-name calculation).
//  Accepts: { name, dob }
// ============================================================
const express     = require('express');
const router      = express.Router();
const freeReading = require('../services/free-reading');

const FILE = 'src/routes/reading.js';

function log(step, message, data = null) {
  console.log(`[${FILE}] STEP ${step} ${message}`, data ? JSON.stringify(data) : '');
}

router.post('/', async (req, res) => {
  console.log(`[${FILE}] >>> ENTER POST /reading`);
  log(1, 'POST /reading hit', {
    body:    req.body,
    headers: req.headers?.['content-type'],
  });
  console.log(`[${FILE}] >>> STEP 1: raw body received | content-type="${req.headers?.['content-type']}"`);

  const { name, dob } = req.body;
  console.log(`[${FILE}] >>> STEP 1: destructured | name="${name}" dob="${dob}"`);

  // ── Validation ───────────────────────────────────────────────
  console.log(`[${FILE}] >>> STEP 2 START: input validation`);

  if (!name || !name.trim()) {
    log(2, 'Validation failed: missing name');
    console.log(`[${FILE}] >>> STEP 2 FAIL: name is missing or blank`);
    return res.status(400).json({ error: 'Name is required.' });
  }

  if (!dob) {
    log(3, 'Validation failed: missing dob');
    console.log(`[${FILE}] >>> STEP 3 FAIL: dob is missing`);
    return res.status(400).json({ error: 'Date of birth is required.' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    log(4, 'Validation failed: invalid dob format', { dob });
    console.log(`[${FILE}] >>> STEP 4 FAIL: dob format invalid | dob="${dob}"`);
    return res.status(400).json({ error: 'DOB must be in YYYY-MM-DD format.' });
  }

  const year = parseInt(dob.split('-')[0], 10);
  console.log(`[${FILE}] >>> STEP 5: year parsed | year=${year}`);

  if (year < 1924 || year > 2010) {
    log(5, 'Validation failed: year out of range', { year });
    console.log(`[${FILE}] >>> STEP 5 FAIL: year out of range | year=${year} (allowed 1924–2010)`);
    return res.status(400).json({ error: 'Please enter a valid year of birth.' });
  }

  log(6, 'Validation passed', { name, dob });
  console.log(`[${FILE}] >>> STEP 6 DONE: all validation passed | name="${name}" dob="${dob}"`);

  try {
    log(7, 'Calling freeReading.generate()');
    console.log(`[${FILE}] >>> STEP 7 START: freeReading.generate() | name="${name.trim()}" dob="${dob}"`);

    const result = await freeReading.generate(name.trim(), dob);

    log(8, 'Service returned result', {
      hasCards:  !!result?.cards?.length,
      cardCount: result?.cards?.length || 0,
      hasCTA:    !!result?.cta,
    });
    console.log(`[${FILE}] >>> STEP 8 DONE: result received | cardCount=${result?.cards?.length || 0} hasCTA=${!!result?.cta} hasReading=${!!result?.reading}`);
    console.log(`[${FILE}] >>> STEP 8: sending JSON response to client`);
    console.log(`[${FILE}] >>> EXIT POST /reading SUCCESS`);

    return res.json(result);

  } catch (err) {
    log(9, 'ERROR in route handler', { message: err.message });
    console.error(`[${FILE}] >>> STEP 99 FATAL ERROR in POST /reading | message="${err.message}"`);
    console.error(`[${FILE}] >>> STACK TRACE:`, err.stack);
    console.error('Free reading error:', err.message);
    return res.status(500).json({
      error: 'Could not generate reading. Please try again.',
    });
  }
});

module.exports = router;