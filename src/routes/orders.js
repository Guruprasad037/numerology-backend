// ============================================================
//  src/routes/orders.js
//  POST /orders/create
//
//  Flow:
//    1. Validate input (customer + subject fields)
//    2. Upsert customer into customers table
//    3. Create order on Razorpay
//    4. Insert pending row in orders table (with subject fields)
//    5. Return order details to frontend
//
//  Terminology:
//    customer — the person paying and receiving the report (GURU)
//    subject  — the person whose numbers are being read (SINDHU or GURU)
//    is_self  — true when customer and subject are the same person
//
//  CHANGE (email validation fix):
//    Was:  !email.includes('@')
//    Now:  !/.+@.+\..+/.test(email)
//    Why:  The old check accepted garbage like "a@b" or "hello@"
//          which have no domain extension. The new regex requires
//          something before @, something after @, and a dot with
//          at least one character after it — e.g. gmail.com
// ============================================================
const express   = require('express');
const router    = express.Router();
const Razorpay  = require('razorpay');
const { dbRun, dbGet }            = require('../config/db');
const { PRODUCTS, VALID_GENDERS } = require('../config/products');

const FILE = 'src/routes/orders.js';

function log(step, message, data = null) {
  console.log(`[${FILE}] STEP ${step} ${message}`, data ? JSON.stringify(data) : '');
}

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
console.log(`[${FILE}] >>> Razorpay instance created`);

router.post('/create', async (req, res) => {
  console.log(`[${FILE}] >>> ENTER POST /orders/create`);
  log(1, 'Request received', { body: req.body });

  const {
    product_id,

    // Customer fields — person paying and receiving the report
    name,           // kept for backward compat; used as customer_name if customer_name absent
    email,
    phone,
    customer_name,
    customer_dob,   // optional — customer's own DOB for their profile
    customer_gender,

    // Subject fields — person whose numerology is being read
    subject_name,
    subject_dob,
    subject_gender,

    // Relationship flag
    is_self = true,
  } = req.body;

  // Resolve customer_name — accept either spelling from frontend
  const resolvedCustomerName = (customer_name || name || '').trim();
  const resolvedIsSelf = is_self === true || is_self === 'true';

  // Resolve subject fields:
  // If is_self, subject == customer (same person)
  const resolvedSubjectName   = resolvedIsSelf ? resolvedCustomerName : (subject_name || '').trim();
  const resolvedSubjectDob    = resolvedIsSelf ? (customer_dob || subject_dob || '') : (subject_dob || '');
  const resolvedSubjectGender = resolvedIsSelf
    ? (customer_gender || subject_gender || 'Prefer not to say')
    : (subject_gender  || 'Prefer not to say');

  console.log(`[${FILE}] >>> Fields resolved | resolvedCustomerName="${resolvedCustomerName}" resolvedIsSelf=${resolvedIsSelf}`);
  console.log(`[${FILE}] >>> Subject resolved | resolvedSubjectName="${resolvedSubjectName}" resolvedSubjectDob="${resolvedSubjectDob}" resolvedSubjectGender="${resolvedSubjectGender}"`);

  // ── Validation ──────────────────────────────────────────────
  console.log(`[${FILE}] >>> STEP 2 START: input validation`);

  if (!product_id || !resolvedCustomerName || !email || !phone) {
    console.log(`[${FILE}] >>> STEP 2 FAIL: missing required fields | product_id=${!!product_id} name=${!!resolvedCustomerName} email=${!!email} phone=${!!phone}`);
    return res.status(400).json({ error: 'product_id, name, email, and phone are required.' });
  }

  // ── EMAIL VALIDATION (fixed) ────────────────────────────────
  // Old check: !email.includes('@')
  //   → accepted garbage like "a@b", "hello@", "@domain.com"
  //
  // New check: /.+@.+\..+/.test(email)
  //   → requires: [something]@[something].[something]
  //   → rejects:  "a@b", "hello@", "@domain", "nodot@nodot"
  //   → accepts:  "priya@gmail.com", "user@occultpulse.in"
  // ────────────────────────────────────────────────────────────
  if (!/.+@.+\..+/.test(email)) {
    console.log(`[${FILE}] >>> STEP 2 FAIL: invalid email | email="${email}"`);
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (!/^\+?[\d\s\-]{7,15}$/.test(phone.trim())) {
    console.log(`[${FILE}] >>> STEP 2 FAIL: invalid phone | phone="${phone}"`);
    return res.status(400).json({ error: 'Please provide a valid phone number.' });
  }

  if (!resolvedSubjectName) {
    console.log(`[${FILE}] >>> STEP 2 FAIL: subject_name missing`);
    return res.status(400).json({ error: 'subject_name is required.' });
  }

  if (!resolvedSubjectDob || !/^\d{4}-\d{2}-\d{2}$/.test(resolvedSubjectDob)) {
    console.log(`[${FILE}] >>> STEP 2 FAIL: invalid subject_dob | subject_dob="${resolvedSubjectDob}"`);
    return res.status(400).json({ error: 'subject_dob must be in YYYY-MM-DD format.' });
  }

  // Build the product list — product_id may be a single slug or
  // a comma-separated list of slugs (e.g. "career,love")
  const slugs = product_id.split(',').map(s => s.trim()).filter(Boolean);
  const products = slugs.map(s => PRODUCTS[s]).filter(Boolean);
  console.log(`[${FILE}] >>> STEP 2: products resolved | slugs=${JSON.stringify(slugs)} matchedCount=${products.length}`);

  if (products.length === 0) {
    console.log(`[${FILE}] >>> STEP 2 FAIL: unknown product_id | product_id="${product_id}"`);
    return res.status(400).json({ error: 'Unknown product_id.' });
  }

  // Combined amount across all selected products
  const totalAmountPaise = products.reduce((sum, p) => sum + p.amount_paise, 0);
  const productNames     = products.map(p => p.name).join(' + ');
  console.log(`[${FILE}] >>> STEP 2 DONE: validation passed | totalAmountPaise=${totalAmountPaise} productNames="${productNames}"`);

  try {
    // ── Step 1: Upsert customer ──────────────────────────────
    log(3, 'Checking if customer exists by email');
    console.log(`[${FILE}] >>> STEP 3 START: dbGet() — lookup customer by email="${email.trim()}"`);
    let customer = await dbGet(
      `SELECT id FROM customers WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
      [email.trim()]
    );
    console.log(`[${FILE}] >>> STEP 3 DONE: customer lookup returned | found=${!!customer}`);

    if (customer) {
      // Update existing customer record
      console.log(`[${FILE}] >>> STEP 3.1 START: dbRun() — updating existing customer | customerId=${customer.id}`);
      await dbRun(
        `UPDATE customers
         SET full_name  = $1,
             phone      = $2,
             tier       = 'paid_reading',
             updated_at = NOW()
         WHERE id = $3`,
        [resolvedCustomerName, phone.trim(), customer.id]
      );
      console.log(`[${FILE}] >>> STEP 3.1 DONE: existing customer updated | customerId=${customer.id}`);
    } else {
      // New customer — Gender is optional for paying customers
      // (they're mandatory only for the subject)
      console.log(`[${FILE}] >>> STEP 3.2 START: dbRun() — inserting new customer`);
      const result = await dbRun(
        `INSERT INTO customers
           (full_name, email, phone, gender, tier, locale, timezone)
         VALUES ($1, $2, $3, $4, 'paid_reading', 'en', 'Asia/Kolkata')
         RETURNING id`,
        [
          resolvedCustomerName,
          email.trim(),
          phone.trim(),
          customer_gender || 'Prefer not to say',
        ]
      );
      customer = result.rows[0];
      console.log(`[${FILE}] >>> STEP 3.2 DONE: new customer inserted | customerId=${customer.id}`);
    }

    const customerId = customer.id;
    log(4, 'Customer upserted', { customerId });
    console.log(`[${FILE}] >>> customerId resolved | customerId=${customerId}`);

    // ── Step 2: Create order on Razorpay ─────────────────────
    log(5, 'Creating Razorpay order');
    console.log(`[${FILE}] >>> STEP 5 START: razorpay.orders.create() | amount=${totalAmountPaise} currency=INR`);
    const rp_order = await razorpay.orders.create({
      amount:   totalAmountPaise,
      currency: 'INR',
      notes: {
        customer_id:   customerId,
        customer_name: resolvedCustomerName,
        email,
        product_id,
        subject_name:  resolvedSubjectName,
        is_self:       resolvedIsSelf,
      },
    });
    console.log(`[${FILE}] >>> STEP 5 DONE: Razorpay order created | rp_order_id="${rp_order.id}"`);

    // ── Step 3: Insert pending order in DB ───────────────────
    log(6, 'Inserting pending order in DB');
    console.log(`[${FILE}] >>> STEP 6 START: dbRun() — inserting pending order | customerId=${customerId} rp_order_id="${rp_order.id}"`);
    await dbRun(
      `INSERT INTO orders
         (user_id,
          product_slug, product_name,
          amount, currency, discount_amount, final_amount,
          status, gateway, gateway_order_id,
          is_self,
          customer_name,
          subject_name, subject_dob, subject_gender)
       VALUES
         ($1,
          $2, $3,
          $4, 'INR', 0, $4,
          'pending', 'razorpay', $5,
          $6,
          $7,
          $8, $9, $10)`,
      [
        customerId,
        slugs[0],       // primary product slug (first selected)
        productNames,
        totalAmountPaise,
        rp_order.id,
        resolvedIsSelf,
        resolvedCustomerName,
        resolvedSubjectName,
        resolvedSubjectDob,
        resolvedSubjectGender,
      ]
    );
    console.log(`[${FILE}] >>> STEP 6 DONE: pending order inserted`);

    // ── Step 4: Return to frontend ────────────────────────────
    log(7, 'Sending response to frontend');
    console.log(`[${FILE}] >>> STEP 7: sending success response | rp_order_id="${rp_order.id}" amount_paise=${totalAmountPaise}`);
    console.log(`[${FILE}] >>> EXIT POST /orders/create SUCCESS`);
    return res.json({
      rp_order_id:  rp_order.id,
      amount_paise: totalAmountPaise,
      currency:     'INR',
      product_name: productNames,
      key_id:       process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error(`[${FILE}] >>> STEP 99 FATAL ERROR in POST /orders/create | message="${err.message}"`);
    console.error(`[${FILE}] >>> STACK TRACE:`, err.stack);
    console.error('Create order error:', err);
    return res.status(500).json({ error: 'Could not create payment order. Please try again.' });
  }
});

module.exports = router;