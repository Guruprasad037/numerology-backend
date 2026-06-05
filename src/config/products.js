// ============================================================
//  src/config/products.js
//  Single product — Full Numerology Reading
//  ₹999 = 99900 paise
// ============================================================
const VALID_GENDERS = ['Male', 'Female', 'Prefer not to say'];

const PRODUCTS = {
  full_reading: {
    id:           'full_reading',
    name:         'Complete Numerology Reading',
    amount_paise: 100,   // Set to Rs 1 for testing
  },
};

module.exports = { PRODUCTS, VALID_GENDERS };