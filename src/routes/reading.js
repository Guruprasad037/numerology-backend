// ============================================================
//  src/routes/reading.js
// ============================================================

const express     = require('express');
const router      = express.Router();
const freeReading = require('../services/free-reading');

const FILE = "src/routes/reading.js";

function log(step, message, data = null) {
  console.log(
    `[${FILE}] STEP ${step} ${message}`,
    data ? JSON.stringify(data) : ""
  );
}

router.post('/', async (req, res) => {
  log(1, "POST /reading hit", {
    body:    req.body,
    headers: req.headers?.["content-type"],
  });

  const { name, dob, birth_name } = req.body;

  // ── Validation ───────────────────────────────────────────────
  log(2, "Validating request");

  if (!name || !name.trim()) {
    log(3, "Validation failed: missing name");
    return res.status(400).json({ error: 'Name is required.' });
  }

  if (!dob) {
    log(4, "Validation failed: missing dob");
    return res.status(400).json({ error: 'Date of birth is required.' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    log(5, "Validation failed: invalid dob format", { dob });
    return res.status(400).json({ error: 'DOB must be in YYYY-MM-DD format.' });
  }

  const year = parseInt(dob.split('-')[0], 10);
  if (year < 1924 || year > 2010) {
    log(6, "Validation failed: year out of range", { year });
    return res.status(400).json({ error: 'Please enter a valid year of birth.' });
  }

  log(7, "Validation passed", { name, dob, hasBirthName: !!birth_name });

  try {
    log(8, "Calling freeReading.generate()");
    const result = await freeReading.generate(
      name.trim(),
      dob,
      birth_name ? birth_name.trim() : null
    );

    log(9, "Service returned result", {
      hasCards:  !!result?.cards?.length,
      cardCount: result?.cards?.length || 0,
      hasCTA:    !!result?.cta,
    });

    log(10, "Sending response to frontend");
    return res.json(result);

  } catch (err) {
    log(11, "ERROR in route handler", { message: err.message });
    console.error('Free reading error:', err.message);
    return res.status(500).json({
      error: 'Could not generate reading. Please try again.',
    });
  }
});

module.exports = router;