// ============================================================
//  server.js  — Entry point
//
//  This file is intentionally small. Its only jobs are:
//    1. Load environment variables
//    2. Set up Express middleware
//    3. Mount the router
//    4. Initialise the DB and start listening
//
//  All business logic lives in /routes, /helpers, /config.
// ============================================================

require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const { initDB }  = require('./src/config/db');
const routes      = require('./src/routes/index');

const app = express();


// ── CORS ──────────────────────────────────────────────────────
// Allow requests from any origin.
// For production you can restrict this to your domain:
//   app.use(cors({ origin: 'https://numerosoul.com' }));
app.use(cors({ origin: '*' }));


// ── Raw body for Razorpay webhook ─────────────────────────────
// MUST be registered BEFORE express.json().
// Razorpay sends a raw Buffer body which we need for HMAC
// signature verification. express.json() would parse it first
// and break the signature check.
app.use(
  '/webhook/razorpay',
  express.raw({ type: 'application/json' })
);


// ── JSON body parser ──────────────────────────────────────────
// Parses application/json for all other routes.
app.use(express.json());


// ── Routes ────────────────────────────────────────────────────
app.use('/', routes);


// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

// Initialise DB tables first, then start the HTTP server.
initDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✦ NumeroSoul backend running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialise database:', err);
    process.exit(1);   // crash fast if DB is unreachable on startup
  });