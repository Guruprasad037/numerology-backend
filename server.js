// ============================================================
//  server.js  — Entry point
// ============================================================
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const routes  = require('./src/routes/index');

const app = express();

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));

// ── Raw body for Razorpay webhook ─────────────────────────────
// Must be before express.json()
app.use(
  '/webhook/razorpay',
  express.raw({ type: 'application/json' })
);

// ── JSON body parser ──────────────────────────────────────────
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────
app.use('/', routes);

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✦ NumeroSoul backend running on port ${PORT}`);
});