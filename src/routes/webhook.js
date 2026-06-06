// ============================================================
//  src/routes/webhook.js
//  v5 — Paid reading profiles are now permanent (never demoted)
//
//  CHANGES (v4 → v5):
//    The demotion step (UPDATE numerology_profiles SET
//    is_primary=FALSE) has been REMOVED for paid readings.
//
//    Why it was wrong:
//      Demotion was copied from the free-reading pattern where
//      one visitor has one "active" profile at a time. For paid
//      readings, each subject (Abhi, Bharat, Chirag, Deeksha)
//      is a different person — all profiles must be kept
//      permanently so admin can see every subject's numbers.
//
//    What we do instead:
//      All paid reading profiles are inserted with
//      is_primary = FALSE. The UNIQUE index on
//      (user_id WHERE is_primary=TRUE) is therefore never
//      triggered and multiple subjects under one customer
//      coexist safely without any demotion needed.
//
//    Free reading path (reading-db.js) is completely unchanged
//    — demotion still happens there and is correct for that
//    anonymous single-profile-per-visitor pattern.
//
//  ALSO FIXED IN v4 (still present):
//    Profile lookup matches (user_id + name_used + dob_used)
//    so the same subject repurchasing is handled correctly.
// ============================================================

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { dbRun, dbGet } = require("../config/db");
const { buildNumerologyProfile } = require("../utils/calculator");
const { handlePaidReading } = require("../services/paid-reading");

const FILE = "src/routes/webhook.js";

function log(step, message, data = null) {
  console.log(
    `[${FILE}] STEP ${step} ${message}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
}

router.post("/", async (req, res) => {
  console.log(`[${FILE}] >>> ENTER POST /webhook/razorpay`);

  // ── Signature verification ──────────────────────────────────
  log(1, "Verifying Razorpay signature");
  const receivedSig = req.headers["x-razorpay-signature"];
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest("hex");

  if (receivedSig !== expectedSig) {
    console.warn(`[${FILE}] >>> STEP 1 FAIL: invalid signature — rejecting`);
    return res.status(400).json({ error: "Invalid signature" });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  log(2, "Event received", { event: event.event });

  if (event.event !== "payment.captured") {
    return res.json({ received: true, action: "ignored" });
  }

  const payment = event.payload.payment.entity;
  const rpOrderId = payment.order_id;
  const rpPayId = payment.id;

  // ── Respond to Razorpay immediately — then process async ────
  res.json({ received: true });

  try {
    // ── 1. Load order + customer ────────────────────────────────
    log(5, "Loading order from DB");
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
      console.warn(
        `[${FILE}] >>> no order found for gateway_order_id="${rpOrderId}" — aborting`
      );
      return;
    }

    if (order.status === "paid") {
      console.log(`[${FILE}] >>> order ${order.id} already paid — skipped`);
      return;
    }

    // ── 2. Mark order as paid ───────────────────────────────────
    log(6, "Marking order as paid");
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
          signature: receivedSig,
          webhook_event: event.event,
          payment_method: payment.method,
        }),
        order.id,
      ]
    );

    // ── 3. Upgrade customer tier ────────────────────────────────
    log(7, "Upgrading customer tier");
    await dbRun(
      `UPDATE customers
       SET tier = 'paid_reading', updated_at = NOW()
       WHERE id = $1 AND tier = 'free_reading'`,
      [order.user_id]
    );

    // ── 4. Build numerology profile ─────────────────────────────
    // subject_name / subject_dob are the SUBJECT's details
    // (the person whose numbers are being read — may differ
    // from the customer who paid, when is_self = false).
    const subjectName = order.subject_name || order.customer_full_name;
    const rawDob = order.subject_dob || order.customer_dob;
    const subjectDob =
      rawDob instanceof Date
        ? rawDob.toISOString().split("T")[0]
        : String(rawDob);

    log(8, "Building numerology profile", { subjectName, subjectDob });
    const profile = buildNumerologyProfile(subjectName, subjectDob);

    // ── 5. Create or get numerology profile record ──────────────
    //
    // Lookup matches (user_id + name_used + dob_used) so:
    //   - Same customer, same subject  → reuse existing profile
    //     (covers duplicate webhook delivery and repurchases)
    //   - Same customer, new subject   → insert a fresh profile
    //
    // All paid reading profiles use is_primary = FALSE.
    // This means the UNIQUE index on (user_id WHERE is_primary=TRUE)
    // is never triggered, and no demotion step is needed.
    // Every subject's profile under a customer is kept permanently.
    //
    // Contrast with free readings (reading-db.js) where demotion
    // is still correct — one anonymous visitor, one active profile.
    // ────────────────────────────────────────────────────────────
    log(9, "Checking for existing numerology profile for this subject", {
      user_id: order.user_id,
      subjectName,
      subjectDob,
    });

    const existingForSubject = await dbGet(
      `SELECT id FROM numerology_profiles
       WHERE user_id   = $1
         AND name_used = $2
         AND dob_used  = $3
       LIMIT 1`,
      [order.user_id, subjectName, subjectDob]
    );

    let profileId;

    if (existingForSubject) {
      // Same customer + same subject → reuse the existing profile.
      profileId = existingForSubject.id;
      log(9.1, "Reusing existing profile — same customer + same subject", {
        profileId,
        subjectName,
        subjectDob,
      });

    } else {
      // New subject for this customer — insert a fresh profile.
      // NO demotion needed because is_primary = FALSE (see above).
      log(9.2, "New subject — inserting fresh profile", {
        subjectName,
        subjectDob,
        user_id: order.user_id,
      });

      const p = profile;
      const profileResult = await dbRun(
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
          $1,$2,$3,FALSE,
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
          order.user_id,
          subjectName,
          subjectDob,
          p.psychic_number,
          p.psychic_compound,
          p.destiny_number,
          p.destiny_compound,
          p.name_number,
          p.name_compound,
          p.soul_urge_number,
          p.soul_urge_compound,
          p.personality_number,
          p.personality_compound,
          p.life_path_number,
          p.life_path_compound,
          p.maturity_number,
          p.maturity_compound,
          p.power_number,
          p.power_compound,
          p.birth_day_number,
          p.birth_month_number,
          p.birth_year_number,
          p.personal_year_number,
          p.personal_month_number,
          p.personal_day_number,
          p.universal_year_number,
          p.universal_month_number,
          p.ruling_planet,
          p.pd_combination,
          p.pinnacle_1,
          p.pinnacle_1_start_age,
          p.pinnacle_1_end_age,
          p.pinnacle_2,
          p.pinnacle_2_start_age,
          p.pinnacle_2_end_age,
          p.pinnacle_3,
          p.pinnacle_3_start_age,
          p.pinnacle_3_end_age,
          p.pinnacle_4,
          p.pinnacle_4_start_age,
          p.current_pinnacle,
          p.challenge_1,
          p.challenge_2,
          p.challenge_3,
          p.challenge_4,
          p.current_challenge,
          p.life_period_1,
          p.life_period_1_end_age,
          p.life_period_2,
          p.life_period_2_end_age,
          p.life_period_3,
          p.current_life_period,
          p.cornerstone,
          p.cornerstone_value,
          p.capstone,
          p.capstone_value,
          p.first_vowel,
          p.first_vowel_value,
          p.subconscious_self,
          p.hidden_passions,
          p.karmic_lessons,
          p.missing_numbers,
          p.has_karmic_debt,
          p.karmic_debt_numbers,
          p.karmic_debt_locations,
          p.has_master_11,
          p.has_master_22,
          p.has_master_33,
          p.master_numbers_found,
          p.plane_mental_count,
          p.plane_physical_count,
          p.plane_emotional_count,
          p.plane_intuitive_count,
          p.plane_mental_number,
          p.plane_physical_number,
          p.plane_emotional_number,
          p.plane_intuitive_number,
          p.dominant_plane,
          p.soul_expression_bridge,
          p.life_personality_bridge,
          p.rational_thought_number,
          p.balance_number,
          p.physical_transit,
          p.physical_transit_value,
          p.mental_transit,
          p.mental_transit_value,
          p.spiritual_transit,
          p.spiritual_transit_value,
          p.essence_number,
        ]
      );
      profileId = profileResult.rows[0].id;
      log(9.2, "New profile created", { profileId, subjectName, subjectDob });
    }

    // ── 6. Handle paid reading ──────────────────────────────────
    log(10, "Calling handlePaidReading");
    const readingResult = await handlePaidReading(order, profile, profileId);

    log(11, "Paid reading handling complete", {
      readingId: readingResult.readingId,
      status:    readingResult.status,
      message:   readingResult.message,
    });

    console.log(
      `[${FILE}] >>> Payment processed successfully | orderId=${order.id} readingId=${readingResult.readingId}`
    );
  } catch (err) {
    console.error(
      `[${FILE}] >>> FATAL ERROR in async processing | message="${err.message}"`
    );
    console.error(`[${FILE}] >>> STACK TRACE:`, err.stack);
  }
});

module.exports = router;