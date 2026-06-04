// ============================================================
//  server.js  — Entry point
// ============================================================

console.log("🔥 [SERVER] File loaded - server.js starting...");
console.log("🔥 [SERVER] Node Version:", process.version);
console.log("🔥 [SERVER] Environment:", process.env.NODE_ENV);
console.log("🔥 [SERVER] PORT:", process.env.PORT);

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

  console.log("==================================================");
  console.log(`➡️ [REQUEST] ${req.method} ${req.url}`);
  console.log(`➡️ [REQUEST] Time: ${new Date().toISOString()}`);
  console.log(`➡️ [REQUEST] Content-Type: ${req.headers['content-type']}`);
  console.log(`➡️ [REQUEST] User-Agent: ${req.headers['user-agent']}`);
  console.log(`➡️ [REQUEST] IP: ${req.ip}`);

  if (req.url === '/webhook/razorpay') {
    console.log(
      "➡️ [WEBHOOK] Raw Body Length:",
      req.body ? req.body.length : 0
    );
  }

  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use('/', routes);

console.log("🔥 [SERVER] Routes mounted");

// ── Global Error Logger ───────────────────────────────────────
app.use((err, req, res, next) => {

  console.error("❌ [SERVER ERROR]");
  console.error("❌ URL:", req.originalUrl);
  console.error("❌ METHOD:", req.method);
  console.error("❌ MESSAGE:", err.message);
  console.error("❌ STACK:", err.stack);

  next(err);
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✦ NumeroSoul backend running on port ${PORT}`);
  console.log(`🔥 [SERVER] Listening on http://0.0.0.0:${PORT}`);
  console.log("🔥 [SERVER] Startup completed successfully");
});