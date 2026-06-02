// ============================================================
//  src/routes/reading.js
//  POST /reading  — receives request, calls service, responds.
//  No business logic here.
// ============================================================
const express  = require('express');
const router   = express.Router();
const freeReading = require('../services/free-reading');

router.post('/', async (req, res) => {
  const { name, dob } = req.body;

  // ── Validation ──────────────────────────────────────────────
  if (!name || !name.trim())
    return res.status(400).json({ error: 'Name is required.' });
  if (!dob)
    return res.status(400).json({ error: 'Date of birth is required.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob))
    return res.status(400).json({ error: 'DOB must be in YYYY-MM-DD format.' });

  try {
    const result = await freeReading.generate(name.trim(), dob);
    return res.json(result);
  } catch (err) {
    console.error('Free reading error:', err.message);
    return res.status(500).json({ error: 'Could not generate reading. Please try again.' });
  }
});

module.exports = router;