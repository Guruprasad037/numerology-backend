// ============================================================
//  middleware/auth.js
//  Admin authentication middleware.
//
//  Usage: add `requireAdmin` as the second argument on any
//  route you want to protect, e.g.:
//    router.get('/orders', requireAdmin, handler)
//
//  The token is read from either:
//    - Header:      x-admin-token: YOUR_TOKEN
//    - Query param: ?token=YOUR_TOKEN   (handy for browser testing)
//
//  Set ADMIN_TOKEN in your .env file.
// ============================================================

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;

  if (token && token === process.env.ADMIN_TOKEN) {
    return next(); // ✅ authorised — proceed to route handler
  }

  // ❌ missing or wrong token
  return res.status(401).json({ error: 'Unauthorised' });
}

module.exports = { requireAdmin };