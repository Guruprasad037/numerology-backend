// ============================================================
//  routes/orders.js
//  POST /orders/create
//
//  Creates a Razorpay payment order and stores a pending
//  record in the orders table.
//
//  Flow:
//    1. Validate user input
//    2. Create order on Razorpay
//    3. Insert pending row in DB
//    4. Return order details to frontend (to open Razorpay popup)
// ============================================================

const express    = require('express');
const router     = express.Router();
const Razorpay   = require('razorpay');
const { dbRun }  = require('../config/db');
const { PRODUCTS, VALID_GENDERS } = require('../helpers/data');


// ── Razorpay client ───────────────────────────────────────────
// Initialised here so it only runs once when this module loads.
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ── POST /orders/create ───────────────────────────────────────
router.post('/create', async (req, res) => {
  const {
    product_id,
    name,
    email,
    phone,
    dob,
    gender = 'Prefer not to say',
  } = req.body;

  // ── Validation ──────────────────────────────────────────────
  if (!product_id || !name || !email || !phone || !dob) {
    return res.status(400).json({
      error: 'product_id, name, email, phone, and dob are all required.',
    });
  }

  // Basic email check
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  // Basic phone check — at least 7 digits
  if (!/^\+?[\d\s\-]{7,15}$/.test(phone.trim())) {
    return res.status(400).json({ error: 'Please provide a valid phone number.' });
  }

  if (!VALID_GENDERS.includes(gender)) {
    return res.status(400).json({
      error: `gender must be one of: ${VALID_GENDERS.join(', ')}`,
    });
  }

  const product = PRODUCTS[product_id];
  if (!product) {
    return res.status(400).json({ error: 'Unknown product_id.' });
  }

  try {
    // ── Step 1: Create order on Razorpay ──────────────────────
    const rp_order = await razorpay.orders.create({
      amount:   product.amount_paise,
      currency: 'INR',
      notes:    { name, email, phone, dob, gender, product_id },
    });

    // ── Step 2: Save pending order in DB ──────────────────────
    // Status starts as 'pending_payment'.
    // The webhook route updates it to 'paid' on success.
    await dbRun(
      `INSERT INTO orders
         (name, email, phone, dob, gender,
          product_id, product_name, amount_paise,
          rp_order_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending_payment')`,
      [
        name.trim(),
        email.trim(),
        phone.trim(),
        dob,
        gender,
        product.id,
        product.name,
        product.amount_paise,
        rp_order.id,
      ]
    );

    // ── Step 3: Return order details to frontend ───────────────
    // The frontend uses these to open the Razorpay checkout popup.
    return res.json({
      rp_order_id:  rp_order.id,
      amount_paise: product.amount_paise,
      currency:     'INR',
      product_name: product.name,
      key_id:       process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ error: 'Could not create payment order. Please try again.' });
  }
});


module.exports = router;