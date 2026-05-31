require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const crypto     = require('crypto');
const Razorpay   = require('razorpay');
const sqlite3    = require('sqlite3').verbose();
const path       = require('path');

const app = express();

// ── Razorpay client ──────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── SQLite DB ────────────────────────────────────
const db = new sqlite3.Database(path.join(__dirname, 'numerosoul.db'));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at    TEXT    DEFAULT (datetime('now','localtime')),
      name          TEXT NOT NULL,
      email         TEXT NOT NULL,
      dob           TEXT NOT NULL,
      product_id    TEXT NOT NULL,
      product_name  TEXT NOT NULL,
      amount_paise  INTEGER NOT NULL,
      rp_order_id   TEXT UNIQUE,
      rp_payment_id TEXT,
      rp_signature  TEXT,
      status        TEXT DEFAULT 'pending_payment',
      notes         TEXT DEFAULT ''
    )
  `);
});

// Helper: promisify db.run and db.all
function dbRun(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}
function dbAll(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}
function dbGet(sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// ── Middleware ───────────────────────────────────
app.use(cors({ origin: '*' }));
app.use('/webhook/razorpay', express.raw({ type: 'application/json' }));
app.use(express.json());

// ── Admin auth ───────────────────────────────────
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token && token === process.env.ADMIN_TOKEN) return next();
  res.status(401).json({ error: 'Unauthorised' });
}

// ════════════════════════════════════════════════
//  NUMEROLOGY HELPERS
// ════════════════════════════════════════════════
function reduceToSingle(n) {
  while (n > 9) n = String(n).split('').reduce((s, d) => s + parseInt(d), 0);
  return n;
}
function calcBirthNum(dob) {
  const digits = dob.replace(/-/g, '').split('').map(Number);
  return reduceToSingle(digits.reduce((a, b) => a + b, 0));
}
function calcDestinyNum(name) {
  const val = name.toUpperCase().replace(/[^A-Z]/g, '')
    .split('').reduce((s, c) => s + (c.charCodeAt(0) - 64), 0);
  return reduceToSingle(val);
}
function formatDob(dob) {
  const [y, m, d] = dob.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}

const READINGS = {
  1: { traits: ['Leader','Independent','Ambitious','Pioneering','Determined'], text: `You carry the energy of new beginnings and self-reliance. Number 1 is the number of the pioneer — you are here to lead, to initiate, and to carve your own path where none existed before.\n\nYou think independently and trust your own instincts above all else. While others may seek consensus, you are comfortable standing alone when you know you are right. This strength is your greatest gift.\n\nYour challenge is learning to collaborate without feeling diminished. True leadership inspires rather than insists. Channel your ambition into vision, and others will follow naturally.` },
  2: { traits: ['Diplomatic','Sensitive','Cooperative','Intuitive','Peacemaker'], text: `You are the soul of sensitivity and connection. Number 2 governs partnerships, balance, and the quiet power of listening — the kind of power most people overlook.\n\nYou read rooms effortlessly. You sense what others feel before they say it. This intuition is a rare gift, and it draws people to you for comfort and counsel.\n\nYour journey is about learning to honour your own needs as deeply as you honour others'. Your peace cannot come only from keeping the peace around you. Find the still centre within, and you become unshakeable.` },
  3: { traits: ['Creative','Expressive','Joyful','Optimistic','Communicative'], text: `You are a creative force — someone built to express, inspire, and bring light into the world. Number 3 is the number of the artist, the storyteller, and the eternal optimist.\n\nWords flow through you. Ideas arrive in bursts. People feel more alive around you, and this is not by accident — it is your nature and your purpose.\n\nYour challenge is focus. Scattered creativity produces sparks but not fire. Choose your canvas, commit to it fully, and watch what you are truly capable of building.` },
  4: { traits: ['Grounded','Disciplined','Reliable','Hardworking','Practical'], text: `You are the builder. Number 4 carries the energy of structure, patience, and the kind of deep reliability that makes the world work. You do not just dream — you construct.\n\nWhere others see obstacles, you see a sequence of steps. You understand that lasting things take time, and you are willing to put in the work others walk away from.\n\nYour growth edge is flexibility. Rigidity can become a cage. The most enduring structures are those built with both strength and the wisdom to bend.` },
  5: { traits: ['Adventurous','Free-spirited','Adaptable','Curious','Magnetic'], text: `You are here to experience life fully — every texture, every direction, every possibility. Number 5 is the number of freedom, change, and the irresistible pull of what lies beyond the horizon.\n\nYou adapt faster than most. You thrive in change where others freeze. Your curiosity is magnetic — people follow you into the unknown simply because you make it look exciting.\n\nYour deepest challenge is stillness. Not all growth requires movement. Some of your most important discoveries will come in the quiet moments you allow yourself to simply be.` },
  6: { traits: ['Nurturing','Responsible','Compassionate','Harmonious','Devoted'], text: `You carry the energy of love and responsibility. Number 6 is the caretaker of the numerology chart — you feel a deep calling to protect, nurture, and bring harmony wherever you go.\n\nYou take your relationships seriously. You show up. You remember. The people in your life are not just lucky to have you — they know it.\n\nYour lesson is boundaries. Love given from an empty well helps no one. You must learn that caring for yourself is not selfish — it is the very foundation that makes your love sustainable.` },
  7: { traits: ['Analytical','Introspective','Spiritual','Perceptive','Independent'], text: `You are a seeker. Number 7 is the number of depth, mystery, and the relentless pursuit of truth beneath the surface. You are not content with easy answers.\n\nYou observe more than you speak. You think in layers. Where others see what is in front of them, you sense what is hidden behind it — and you are usually right.\n\nYour challenge is trust. The analytical mind can become a wall against the world. Let your intuition and your intellect work together, and you will find the kind of understanding that changes lives — beginning with your own.` },
  8: { traits: ['Powerful','Ambitious','Strategic','Authoritative','Resilient'], text: `You are built for mastery. Number 8 carries the energy of power, authority, and the ability to manifest on a large scale. You understand systems, leverage, and what it takes to build something that lasts.\n\nYou are drawn to challenges that others find daunting. You measure your progress not against where you started, but against the full extent of what you are capable of.\n\nYour shadow is control. Power held too tightly becomes a burden. Learn to trust others with pieces of your vision — delegation is not weakness, it is how empires are built.` },
  9: { traits: ['Compassionate','Wise','Idealistic','Generous','Old Soul'], text: `You carry the wisdom of completion. Number 9 is the number of the old soul — someone who has gathered lifetimes of experience and feels a deep responsibility to give back.\n\nYou see the humanity in every situation. You forgive more readily than most. You are drawn to causes larger than yourself, and when you find yours, you pursue it with quiet, unwavering devotion.\n\nYour challenge is release. You hold on — to people, to grief, to what should have been. Your greatest freedom will come the moment you learn that letting go is not loss. It is how you make room for everything that is still coming.` },
};

const PRODUCTS = {
  career:    { id:'career',    name:'Career & Wealth Report',        amount_paise:59900 },
  love:      { id:'love',      name:'Love & Relationships Report',   amount_paise:59900 },
  blueprint: { id:'blueprint', name:'Full Life Blueprint',           amount_paise:99900 },
  health:    { id:'health',    name:'Health & Wellbeing Report',     amount_paise:49900 },
};

// ════════════════════════════════════════════════
//  ROUTES
// ════════════════════════════════════════════════

app.get('/', (req, res) => res.send('NumeroSoul backend running ✦'));

// ── Free reading (dummy) ─────────────────────────
app.post('/reading', (req, res) => {
  const { name, dob } = req.body;
  if (!name || !dob) return res.status(400).json({ error: 'Name and date of birth are required.' });
  const birth_num   = calcBirthNum(dob);
  const destiny_num = calcDestinyNum(name);
  const data        = READINGS[birth_num] || READINGS[1];
  res.json({ name, dob_fmt: formatDob(dob), birth_num, destiny_num, traits: data.traits, reading: data.text });
});

// ── Create Razorpay order ────────────────────────
app.post('/orders/create', async (req, res) => {
  const { product_id, name, email, dob } = req.body;
  if (!product_id || !name || !email || !dob)
    return res.status(400).json({ error: 'product_id, name, email and dob are required.' });

  const product = PRODUCTS[product_id];
  if (!product) return res.status(400).json({ error: 'Unknown product.' });

  try {
    const rp_order = await razorpay.orders.create({
      amount: product.amount_paise, currency: 'INR',
      notes: { name, email, dob, product_id },
    });

    await dbRun(
      `INSERT INTO orders (name,email,dob,product_id,product_name,amount_paise,rp_order_id,status)
       VALUES (?,?,?,?,?,?,?,'pending_payment')`,
      [name, email, dob, product_id, product.name, product.amount_paise, rp_order.id]
    );

    res.json({
      rp_order_id:  rp_order.id,
      amount_paise: product.amount_paise,
      currency:     'INR',
      product_name: product.name,
      key_id:       process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Could not create payment order.' });
  }
});

// ── Razorpay webhook ─────────────────────────────
app.post('/webhook/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const expected  = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
                          .update(req.body).digest('hex');

  if (signature !== expected) {
    console.warn('Webhook: invalid signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(req.body.toString());
  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    await dbRun(
      `UPDATE orders SET status='paid', rp_payment_id=?, rp_signature=? WHERE rp_order_id=?`,
      [payment.id, signature, payment.order_id]
    );
    console.log(`✦ Payment captured: ${payment.order_id}`);
  }
  res.json({ received: true });
});

// ── Admin: list orders ───────────────────────────
app.get('/admin/orders', requireAdmin, async (req, res) => {
  const { status } = req.query;
  const rows = status && status !== 'all'
    ? await dbAll(`SELECT * FROM orders WHERE status=? ORDER BY created_at DESC`, [status])
    : await dbAll(`SELECT * FROM orders ORDER BY created_at DESC`, []);
  res.json(rows);
});

// ── Admin: single order ──────────────────────────
app.get('/admin/orders/:id', requireAdmin, async (req, res) => {
  const row = await dbGet(`SELECT * FROM orders WHERE id=?`, [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Order not found' });
  res.json(row);
});

// ── Admin: mark report sent ──────────────────────
app.post('/admin/orders/:id/complete', requireAdmin, async (req, res) => {
  const { notes } = req.body;
  await dbRun(`UPDATE orders SET status='report_sent', notes=? WHERE id=?`, [notes||'', req.params.id]);
  res.json({ success: true });
});

// ── Admin: dashboard stats ───────────────────────
app.get('/admin/dashboard', requireAdmin, async (req, res) => {
  const rows = await dbAll(
    `SELECT status, COUNT(*) as count, SUM(amount_paise) as total_paise FROM orders GROUP BY status`, []
  );
  res.json(rows);
});

// ── Start ────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`NumeroSoul backend running on port ${PORT} ✦`));