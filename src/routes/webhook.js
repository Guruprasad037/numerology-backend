// ============================================================
//  src/routes/webhook.js
//  POST /webhook/razorpay
// ============================================================
const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const { dbRun, dbGet } = require('../config/db');
const { buildNumerologyProfile } = require('../utils/calculator'); // ← changed

router.post('/', async (req, res) => {

  const receivedSig = req.headers['x-razorpay-signature'];
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (receivedSig !== expectedSig) {
    console.warn('⚠ Webhook: invalid signature — rejected');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (event.event !== 'payment.captured') {
    return res.json({ received: true, action: 'ignored' });
  }

  const payment   = event.payload.payment.entity;
  const rpOrderId = payment.order_id;
  const rpPayId   = payment.id;

  try {
    const order = await dbGet(
      `SELECT o.*, u.full_name, u.dob, u.email
       FROM orders o
       JOIN users u ON u.id = o.user_id
       WHERE o.gateway_order_id = $1`,
      [rpOrderId]
    );

    if (!order) {
      console.warn(`Webhook: no order found for gateway_order_id ${rpOrderId}`);
      return res.json({ received: true, action: 'order_not_found' });
    }

    if (order.status === 'paid') {
      console.log(`Webhook: order ${order.id} already paid — skipped`);
      return res.json({ received: true, action: 'already_processed' });
    }

    await dbRun(
      `UPDATE orders
       SET status             = 'paid',
           gateway_payment_id = $1,
           gateway_metadata   = $2,
           paid_at            = NOW()
       WHERE id = $3`,
      [
        rpPayId,
        JSON.stringify({
          signature:      receivedSig,
          webhook_event:  event.event,
          payment_method: payment.method,
        }),
        order.id,
      ]
    );

    await dbRun(
      `UPDATE users SET tier = 'paid', updated_at = NOW()
       WHERE id = $1 AND tier = 'free'`,
      [order.user_id]
    );

    let profile = await dbGet(
      `SELECT id FROM numerology_profiles
       WHERE user_id = $1 AND is_primary = TRUE LIMIT 1`,
      [order.user_id]
    );

    if (!profile) {
      const nums = buildNumerologyProfile(order.full_name, order.dob);
      const {
        life_path_num, birth_num, expression_num, soul_urge_num,
        personality_num, maturity_num, personal_year, master_number,
      } = nums;

      const result = await dbRun(
        `INSERT INTO numerology_profiles
           (user_id, name_used, dob_used, is_primary,
            life_path_number, birth_day_number,
            expression_number, soul_urge_number, personality_number,
            maturity_number, personal_year_number,
            has_master_11, has_master_22, has_master_33,
            master_numbers_found)
         VALUES ($1,$2,$3,TRUE,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING id`,
        [
          order.user_id, order.full_name, order.dob,
          life_path_num, birth_num,
          expression_num, soul_urge_num, personality_num,
          maturity_num, personal_year,
          master_number === 11,
          master_number === 22,
          master_number === 33,
          master_number ? [master_number] : [],
        ]
      );
      profile = result.rows[0];
    }

    await dbRun(
      `INSERT INTO readings
         (user_id, profile_id, order_id,
          product_slug, status, engine_used, language)
       VALUES ($1, $2, $3, $4, 'pending', 'manual', 'en')`,
      [order.user_id, profile.id, order.id, order.product_slug]
    );

    console.log(`✦ Payment captured: order ${order.id} | user ${order.user_id} | ${order.product_slug}`);

  } catch (err) {
    console.error('Webhook: DB error:', err);
    // Return 200 anyway — Razorpay retries on non-200, causing duplicates
  }

  return res.json({ received: true });
});

module.exports = router;