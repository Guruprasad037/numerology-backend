// ============================================================
//  src/routes/orders.js
//  POST /orders/create
//
//  Flow:
//    1. Validate input
//    2. Upsert user into users table (with email/phone/gender)
//    3. Create order on Razorpay
//    4. Insert pending row in orders table
//    5. Return order details to frontend
// ============================================================
const express   = require('express');
const router    = express.Router();
const Razorpay  = require('razorpay');
const { dbRun, dbGet }          = require('../config/db');
const { PRODUCTS, VALID_GENDERS } = require('../config/products');  // ← changed

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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
  if (!product_id || !name || !email || !phone || !dob)
    return res.status(400).json({ error: 'product_id, name, email, phone, and dob are all required.' });

  if (!email.includes('@'))
    return res.status(400).json({ error: 'Please provide a valid email address.' });

  if (!/^\+?[\d\s\-]{7,15}$/.test(phone.trim()))
    return res.status(400).json({ error: 'Please provide a valid phone number.' });

  if (!VALID_GENDERS.includes(gender))
    return res.status(400).json({ error: `gender must be one of: ${VALID_GENDERS.join(', ')}` });

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob))
    return res.status(400).json({ error: 'DOB must be in YYYY-MM-DD format.' });

  const product = PRODUCTS[product_id];
  if (!product)
    return res.status(400).json({ error: 'Unknown product_id.' });

  try {
    // ── Step 1: Upsert user ──────────────────────────────────
    let user = await dbGet(
      `SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
      [email.trim()]
    );

// ✅ NEW
if (user) {
  await dbRun(
    `UPDATE users
     SET phone = $1, gender = $2, dob = $3,
         full_name = $4, tier = 'paid_reading', updated_at = NOW()
     WHERE id = $5`,
    [phone.trim(), gender, dob, name.trim(), user.id]
  );
}else {
      const result = await dbRun(
        `INSERT INTO users
           (full_name, dob, email, phone, gender, tier, locale, timezone)
         VALUES ($1, $2, $3, $4, $5, 'paid_reading', 'en', 'Asia/Kolkata')
         RETURNING id`,
        [name.trim(), dob, email.trim(), phone.trim(), gender]
      );
      user = result.rows[0];
    }

    const userId = user.id;

    // ── Step 2: Create order on Razorpay ─────────────────────
    const rp_order = await razorpay.orders.create({
      amount:   product.amount_paise,
      currency: 'INR',
      notes:    { user_id: userId, name, email, product_id },
    });

    // ── Step 3: Insert pending order in DB ───────────────────
    await dbRun(
      `INSERT INTO orders
         (user_id, product_slug, product_name,
          amount, currency, discount_amount, final_amount,
          status, gateway, gateway_order_id)
       VALUES ($1, $2, $3, $4, 'INR', 0, $4, 'pending', 'razorpay', $5)`,
      [
        userId,
        product.id,
        product.name,
        product.amount_paise,
        rp_order.id,
      ]
    );

    // ── Step 4: Return to frontend ────────────────────────────
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