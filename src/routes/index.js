// ============================================================
//  routes/index.js
//  Central router — mounts all sub-routers onto their paths.
//
//  To add a new feature, create a new route file and mount
//  it here. server.js stays untouched.
// ============================================================
const express = require('express');
const router  = express.Router();

const FILE = 'routes/index.js';

function log(step, message, data = null) {
  console.log(`[${FILE}] STEP ${step} ${message}`, data ? JSON.stringify(data) : '');
}

// ── Sub-routers ───────────────────────────────────────────────
console.log(`[${FILE}] >>> Loading sub-routers...`);
const readingRouter = require('./reading');
console.log(`[${FILE}] >>> readingRouter loaded`);
const ordersRouter  = require('./orders');
console.log(`[${FILE}] >>> ordersRouter loaded`);
const webhookRouter = require('./webhook');
console.log(`[${FILE}] >>> webhookRouter loaded`);
const adminRouter   = require('./admin');
console.log(`[${FILE}] >>> adminRouter loaded`);

// ── Health check ──────────────────────────────────────────────
// Quick way to confirm the server is running.
router.get('/', (req, res) => {
  console.log(`[${FILE}] >>> GET / — health check hit`);
  res.send('NumeroSoul backend running ✦');
  console.log(`[${FILE}] >>> GET / — response sent`);
});

// ── Mount routes ──────────────────────────────────────────────
console.log(`[${FILE}] >>> Mounting sub-routers...`);
router.use('/reading',           readingRouter);
console.log(`[${FILE}] >>> Mounted readingRouter at /reading`);
router.use('/orders',            ordersRouter);
console.log(`[${FILE}] >>> Mounted ordersRouter at /orders`);
router.use('/webhook/razorpay',  webhookRouter);
console.log(`[${FILE}] >>> Mounted webhookRouter at /webhook/razorpay`);
router.use('/admin',             adminRouter);
console.log(`[${FILE}] >>> Mounted adminRouter at /admin`);

console.log(`[${FILE}] >>> All routers mounted. Exporting router.`);
module.exports = router;