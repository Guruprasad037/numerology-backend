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
  console.log('[auth.js] requireAdmin called — method:', req.method, '| path:', req.path);

  const token = req.headers['x-admin-token'] || req.query.token;

  console.log('[auth.js] token source:', req.headers['x-admin-token'] ? 'header' : req.query.token ? 'query param' : 'not provided');
  console.log('[auth.js] token present:', !!token);
  console.log('[auth.js] ADMIN_TOKEN set in env:', !!process.env.ADMIN_TOKEN);

  if (token && token === process.env.ADMIN_TOKEN) {
    console.log('[auth.js] ✅ authorised — proceeding to route handler');
    return next(); // ✅ authorised — proceed to route handler
  }

  // ❌ missing or wrong token
  console.log('[auth.js] ❌ unauthorised —', !token ? 'no token provided' : 'token mismatch');
  return res.status(401).json({ error: 'Unauthorised' });
}
module.exports = { requireAdmin };