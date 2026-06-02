// ============================================================
//  src/routes/reading.js
// ============================================================

const express  = require('express');
const router   = express.Router();
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
    body: req.body,
    headers: req.headers?.["content-type"],
  });

  const { name, dob } = req.body;

  // ── Validation ──────────────────────────────────────────────
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

  log(6, "Validation passed", { name, dob });

  try {
    log(7, "Calling freeReading.generate()");

    const result = await freeReading.generate(name.trim(), dob);

    log(8, "Service returned result", {
      hasResult: !!result,
      hasReading: !!result?.reading,
    });

    log(9, "Sending response to frontend");

    return res.json(result);

  } catch (err) {
    log(10, "ERROR in route handler", {
      message: err.message,
    });

    console.error('Free reading error:', err.message);

    return res.status(500).json({
      error: 'Could not generate reading. Please try again.'
    });
  }
});

module.exports = router;