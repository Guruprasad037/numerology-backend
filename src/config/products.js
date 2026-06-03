// ============================================================
//  src/config/products.js
//  Product catalogue — slugs, display names, prices (paise).
//  This is the single source of truth for what can be purchased.
// ============================================================

const VALID_GENDERS = ['Male', 'Female', 'Prefer not to say'];

const PRODUCTS = {
  career: {
    id:           'career',
    name:         'Career & Wealth Report',
    amount_paise: 100,
  },
  love: {
    id:           'love',
    name:         'Love & Relationships Report',
    amount_paise: 100,
  },
  blueprint: {
    id:           'blueprint',
    name:         'Full Life Blueprint',
    amount_paise: 100,
  },
  health: {
    id:           'health',
    name:         'Health & Wellbeing Report',
    amount_paise: 100,
  },
};

module.exports = { PRODUCTS, VALID_GENDERS };