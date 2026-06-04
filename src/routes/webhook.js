// ============================================================
//  src/routes/webhook.js
//  POST /webhook/razorpay
//
//  Fixed:
//    1. Profile insert now uses correct Chaldean v3 column names
//    2. Reading is actually generated + email triggered after capture
//    3. res.json() called immediately, processing happens async
// ============================================================
const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const { dbRun, dbGet }           = require('../config/db');
const { buildNumerologyProfile } = require('../utils/calculator');
const dispatcher                 = require('../engines/dispatcher');

router.post('/', async (req, res) => {

  // ── Signature verification ──────────────────────────────────
  const receivedSig = req.headers['x-razorpay-signature'];
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)           // raw Buffer — needs express.raw() in server.js
    .digest('hex');

  if (receivedSig !== expectedSig) {
    console.warn('Webhook: invalid signature — rejected');
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

  // ── Respond to Razorpay immediately — then process async ────
  // Razorpay retries on non-200. Respond first, process after.
  res.json({ received: true });

  try {
    // ── 1. Load order + customer ────────────────────────────────
    const order = await dbGet(
      `SELECT o.*,
              c.full_name AS customer_full_name,
              c.dob       AS customer_dob,
              c.email     AS customer_email
       FROM orders o
       JOIN customers c ON c.id = o.user_id
       WHERE o.gateway_order_id = $1`,
      [rpOrderId]
    );

    if (!order) {
      console.warn(`Webhook: no order found for gateway_order_id ${rpOrderId}`);
      return;
    }

    if (order.status === 'paid') {
      console.log(`Webhook: order ${order.id} already paid — skipped`);
      return;
    }

    // ── 2. Mark order as paid ───────────────────────────────────
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

    // ── 3. Upgrade customer tier ────────────────────────────────
    await dbRun(
      `UPDATE customers
       SET tier = 'paid_reading', updated_at = NOW()
       WHERE id = $1 AND tier = 'free_reading'`,
      [order.user_id]
    );

    // ── 4. Build numerology profile ─────────────────────────────
    // Use subject fields from the order (set at purchase time).
    const subjectName = order.subject_name || order.customer_full_name;
    const subjectDob  = order.subject_dob  || order.customer_dob;

    // Build the profile (needed for both the DB insert and engine dispatch)
    const p = buildNumerologyProfile(subjectName, subjectDob);

    let profileId;
    const existing = await dbGet(
      `SELECT id FROM numerology_profiles
       WHERE user_id = $1 AND is_primary = TRUE LIMIT 1`,
      [order.user_id]
    );

    if (existing) {
      profileId = existing.id;
    } else {
      // FIX: was using old Pythagorean field names (expression_num, life_path_num etc.)
      // Now uses correct Chaldean v3 column names matching the DB schema.
      const result = await dbRun(
        `INSERT INTO numerology_profiles (
          user_id, name_used, dob_used, is_primary,
          psychic_number, psychic_compound,
          destiny_number, destiny_compound,
          name_number, name_compound,
          soul_urge_number, soul_urge_compound,
          personality_number, personality_compound,
          life_path_number, life_path_compound,
          maturity_number, maturity_compound,
          power_number, power_compound,
          birth_day_number, birth_month_number, birth_year_number,
          personal_year_number, personal_month_number, personal_day_number,
          universal_year_number, universal_month_number,
          ruling_planet, pd_combination,
          pinnacle_1, pinnacle_1_start_age, pinnacle_1_end_age,
          pinnacle_2, pinnacle_2_start_age, pinnacle_2_end_age,
          pinnacle_3, pinnacle_3_start_age, pinnacle_3_end_age,
          pinnacle_4, pinnacle_4_start_age, current_pinnacle,
          challenge_1, challenge_2, challenge_3, challenge_4, current_challenge,
          life_period_1, life_period_1_end_age,
          life_period_2, life_period_2_end_age,
          life_period_3, current_life_period,
          cornerstone, cornerstone_value, capstone, capstone_value,
          first_vowel, first_vowel_value, subconscious_self,
          hidden_passions, karmic_lessons, missing_numbers,
          has_karmic_debt, karmic_debt_numbers, karmic_debt_locations,
          has_master_11, has_master_22, has_master_33, master_numbers_found,
          plane_mental_count, plane_physical_count,
          plane_emotional_count, plane_intuitive_count,
          plane_mental_number, plane_physical_number,
          plane_emotional_number, plane_intuitive_number,
          dominant_plane,
          soul_expression_bridge, life_personality_bridge,
          rational_thought_number, balance_number,
          physical_transit, physical_transit_value,
          mental_transit, mental_transit_value,
          spiritual_transit, spiritual_transit_value,
          essence_number,
          schema_version, calculated_at
        ) VALUES (
          $1,$2,$3,TRUE,
          $4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
          $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,
          $30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,
          $42,$43,$44,$45,$46,
          $47,$48,$49,$50,$51,$52,
          $53,$54,$55,$56,$57,$58,$59,
          $60,$61,$62,
          $63,$64,$65,
          $66,$67,$68,$69,
          $70,$71,$72,$73,$74,$75,$76,$77,$78,
          $79,$80,$81,$82,
          $83,$84,$85,$86,$87,$88,$89,
          3, NOW()
        ) RETURNING id`,
        [
          order.user_id, subjectName, subjectDob,
          p.psychic_number,        p.psychic_compound,
          p.destiny_number,        p.destiny_compound,
          p.name_number,           p.name_compound,
          p.soul_urge_number,      p.soul_urge_compound,
          p.personality_number,    p.personality_compound,
          p.life_path_number,      p.life_path_compound,
          p.maturity_number,       p.maturity_compound,
          p.power_number,          p.power_compound,
          p.birth_day_number,      p.birth_month_number,    p.birth_year_number,
          p.personal_year_number,  p.personal_month_number, p.personal_day_number,
          p.universal_year_number, p.universal_month_number,
          p.ruling_planet,         p.pd_combination,
          p.pinnacle_1,            p.pinnacle_1_start_age,  p.pinnacle_1_end_age,
          p.pinnacle_2,            p.pinnacle_2_start_age,  p.pinnacle_2_end_age,
          p.pinnacle_3,            p.pinnacle_3_start_age,  p.pinnacle_3_end_age,
          p.pinnacle_4,            p.pinnacle_4_start_age,  p.current_pinnacle,
          p.challenge_1, p.challenge_2, p.challenge_3, p.challenge_4, p.current_challenge,
          p.life_period_1,      p.life_period_1_end_age,
          p.life_period_2,      p.life_period_2_end_age,
          p.life_period_3,      p.current_life_period,
          p.cornerstone,        p.cornerstone_value,
          p.capstone,           p.capstone_value,
          p.first_vowel,        p.first_vowel_value,
          p.subconscious_self,
          p.hidden_passions,    p.karmic_lessons,      p.missing_numbers,
          p.has_karmic_debt,    p.karmic_debt_numbers, p.karmic_debt_locations,
          p.has_master_11,      p.has_master_22,       p.has_master_33,
          p.master_numbers_found,
          p.plane_mental_count,     p.plane_physical_count,
          p.plane_emotional_count,  p.plane_intuitive_count,
          p.plane_mental_number,    p.plane_physical_number,
          p.plane_emotional_number, p.plane_intuitive_number,
          p.dominant_plane,
          p.soul_expression_bridge,  p.life_personality_bridge,
          p.rational_thought_number, p.balance_number,
          p.physical_transit,   p.physical_transit_value,
          p.mental_transit,     p.mental_transit_value,
          p.spiritual_transit,  p.spiritual_transit_value,
          p.essence_number,
        ]
      );
      profileId = result.rows[0].id;
    }

    // ── 5. Generate report via engine ───────────────────────────
    // Attach meta so AI prompts can personalise by name / gender
    p._meta = {
      subject_name:   subjectName,
      subject_gender: order.subject_gender || 'Prefer not to say',
      is_self:        order.is_self,
      customer_name:  order.customer_full_name,
      product_slug:   order.product_slug,
    };

    let report = null;
    try {
      report = await dispatcher.dispatch(order.product_slug, p);
    } catch (err) {
      console.error(`Webhook: engine dispatch failed for ${order.product_slug}:`, err.message);
      // Still write reading record as 'failed' so admin can retry
    }

    const engine = require('../reading.settings').defaultEngine;

    // ── 6. Save reading record ──────────────────────────────────
    const readingResult = await dbRun(
      `INSERT INTO readings
         (user_id, profile_id, order_id,
          product_slug, status,
          report_content, engine_used,
          language, delivered_to, generated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'en',$8,NOW())
       RETURNING id`,
      [
        order.user_id,
        profileId,
        order.id,
        order.product_slug,
        report ? 'generated' : 'failed',
        report ? JSON.stringify(report) : null,
        engine,
        order.customer_email,
      ]
    );
    const readingId = readingResult.rows[0].id;

    // ── 7. Send email ───────────────────────────────────────────
    if (report) {
      await sendReportEmail({
        customerEmail: order.customer_email,
        customerName:  order.customer_full_name,
        subjectName,
        productSlug:   order.product_slug,
        report,
      });

      await dbRun(
        `UPDATE readings SET status = 'delivered', delivered_at = NOW() WHERE id = $1`,
        [readingId]
      );
    }

    console.log(`Payment processed: order ${order.id} | reading ${readingId} | ${order.product_slug} | ${subjectName}`);

  } catch (err) {
    console.error('Webhook: processing error:', err.message, err.stack);
  }
});

// ── Email delivery ──────────────────────────────────────────────
// Currently logs to console. Uncomment a provider block to send real email.
async function sendReportEmail({ customerEmail, customerName, subjectName, productSlug, report }) {
  console.log(`
==== REPORT EMAIL (dev — not sent) ====
To:      ${customerEmail}
For:     ${subjectName}
Product: ${productSlug}
========================================`);

  // ── Nodemailer (any SMTP — Gmail, Zoho, etc.) ────────────────
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: parseInt(process.env.SMTP_PORT || '587'),
  //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  // });
  // await transporter.sendMail({
  //   from:    `"KnowSelfNow" <${process.env.SMTP_FROM}>`,
  //   to:      customerEmail,
  //   subject: `Your ${productSlug} reading is ready`,
  //   html:    buildEmailHtml({ customerName, subjectName, productSlug, report }),
  // });

  // ── Resend (easiest option, free tier available) ─────────────
  // const { Resend } = require('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from:    'KnowSelfNow <hello@yourdomain.com>',
  //   to:      customerEmail,
  //   subject: `Your ${productSlug} reading is ready`,
  //   html:    buildEmailHtml({ customerName, subjectName, productSlug, report }),
  // });
}

module.exports = router;