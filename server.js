// ============================================================
//  server.js  — Entry point
// ============================================================

console.log("🔥 [SERVER] File loaded - server.js starting...");

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const routes  = require('./src/routes/index');

console.log("🔥 [SERVER] Dependencies loaded (express, cors, routes)");

const app = express();

console.log("🔥 [SERVER] Express app initialized");

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
console.log("🔥 [SERVER] CORS middleware enabled");

// ── Raw body for Razorpay webhook ─────────────────────────────
// Must be before express.json()
app.use(
  '/webhook/razorpay',
  express.raw({ type: 'application/json' })
);

console.log("🔥 [SERVER] Razorpay webhook raw middleware registered");

// ── JSON body parser ──────────────────────────────────────────
app.use(express.json());

console.log("🔥 [SERVER] JSON body parser enabled");

// ── Request logger (IMPORTANT - helps debug frontend calls) ───
app.use((req, res, next) => {
  console.log(`➡️ [REQUEST] ${req.method} ${req.url}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use('/', routes);

console.log("🔥 [SERVER] Routes mounted");

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✦ NumeroSoul backend running on port ${PORT}`);
  console.log(`🔥 [SERVER] Listening on http://0.0.0.0:${PORT}`);
});