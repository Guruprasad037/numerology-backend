// ============================================================
//  routes/index.js
//  Central router — mounts all sub-routers onto their paths.
//
//  To add a new feature, create a new route file and mount
//  it here. server.js stays untouched.
// ============================================================

const express = require('express');
const router  = express.Router();

// ── Sub-routers ───────────────────────────────────────────────
const readingRouter = require('./reading');
const ordersRouter  = require('./orders');
const webhookRouter = require('./webhook');
const adminRouter   = require('./admin');

// ── Health check ──────────────────────────────────────────────
// Quick way to confirm the server is running.
router.get('/', (req, res) => {
  res.send('NumeroSoul backend running ✦');
});

// ── Mount routes ──────────────────────────────────────────────
router.use('/reading',           readingRouter);   // POST /reading
router.use('/orders',            ordersRouter);    // POST /orders/create
router.use('/webhook/razorpay',  webhookRouter);   // POST /webhook/razorpay
router.use('/admin',             adminRouter);     // GET|POST /admin/*

module.exports = router;