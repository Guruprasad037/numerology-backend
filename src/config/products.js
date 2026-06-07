// ============================================================
//  src/config/products.js
//  ₹999 + 18% GST = ₹1,179 display price
//  Razorpay charge: 100 paise (₹1) during testing
//  Change amount_paise to 117900 at launch
// ============================================================
const VALID_GENDERS = ['Male', 'Female', 'Prefer not to say'];

const PRODUCTS = {
  full_reading: {
    id:           'full_reading',
    name:         'Complete Numerology Reading',
    amount_paise: 100,      // ← keep as 100 (₹1) while testing
                            // change to 117900 (₹1,179) at launch
  },
};

// Admin coupon — always charges ₹1 regardless of product price
// Use this after launch to test without paying full amount
// Keep this value secret — don't share it publicly
const ADMIN_COUPONS = {
  'ADMIN@L12': 100,   // always ₹1 (100 paise)
};

module.exports = { PRODUCTS, VALID_GENDERS, ADMIN_COUPONS };