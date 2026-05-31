// ============================================================
//  routes/webhook.js
//  POST /webhook/razorpay
//
//  Receives payment events from Razorpay and updates the DB.
//
//  IMPORTANT: This route uses express.raw() middleware (set in
//  server.js) because Razorpay sends a raw body for signature
//  verification — NOT JSON. Do not move express.json() before
//  this route or the signature check will always fail.
//
//  Events handled:
//    payment.captured → marks order as 'paid'
// ============================================================

const express   = require('express');
const router    = express.Router();
const crypto    = require('crypto');
const { dbRun } = require('../config/db');


// ── POST /webhook/razorpay ────────────────────────────────────
router.post('/', async (req, res) => {

  // ── Step 1: Verify the webhook signature ───────────────────
  // Razorpay signs the raw body with your webhook secret.
  // We recompute the HMAC and compare — if they don't match,
  // reject immediately (could be a forged request).
  const receivedSignature = req.headers['x-razorpay-signature'];

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)           // req.body is raw Buffer here
    .digest('hex');

  if (receivedSignature !== expectedSignature) {
    console.warn('⚠️  Webhook: invalid signature — request rejected');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // ── Step 2: Parse the event ─────────────────────────────────
  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch (err) {
    console.error('Webhook: failed to parse body', err);
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // ── Step 3: Handle specific events ──────────────────────────
  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;

    try {
      await dbRun(
        `UPDATE orders
         SET status        = 'paid',
             rp_payment_id = $1,
             rp_signature  = $2
         WHERE rp_order_id = $3`,
        [payment.id, receivedSignature, payment.order_id]
      );
      console.log(`✦ Payment captured: order ${payment.order_id} | payment ${payment.id}`);
    } catch (err) {
      console.error('Webhook: DB update failed', err);
      // Still return 200 so Razorpay doesn't keep retrying for a DB error
    }
  }

  // Razorpay expects a 200 response to confirm receipt
  return res.json({ received: true });
});


module.exports = router;