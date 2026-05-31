// ============================================================
//  helpers/data.js
//  Static content: numerology reading texts and product catalogue.
//
//  To add a new product: add an entry to PRODUCTS.
//  To edit reading text: find the number key in READINGS.
// ============================================================


// ── Allowed gender values ─────────────────────────────────────
// Used for validation in routes. Kept here so any route can
// import and check against this list consistently.
const VALID_GENDERS = ['Male', 'Female', 'Prefer not to say'];


// ── Numerology readings ───────────────────────────────────────
// Keyed by birth number (1–9).
// Each entry has:
//   traits  — array of 5 keywords shown as pills in the UI
//   text    — the full reading paragraph(s)
const READINGS = {
  1: {
    traits: ['Leader', 'Independent', 'Ambitious', 'Pioneering', 'Determined'],
    text: `You carry the energy of new beginnings and self-reliance. Number 1 is the number of the pioneer — you are here to lead, to initiate, and to carve your own path where none existed before.\n\nYou think independently and trust your own instincts above all else. While others may seek consensus, you are comfortable standing alone when you know you are right. This strength is your greatest gift.\n\nYour challenge is learning to collaborate without feeling diminished. True leadership inspires rather than insists. Channel your ambition into vision, and others will follow naturally.`,
  },
  2: {
    traits: ['Diplomatic', 'Sensitive', 'Cooperative', 'Intuitive', 'Peacemaker'],
    text: `You are the soul of sensitivity and connection. Number 2 governs partnerships, balance, and the quiet power of listening — the kind of power most people overlook.\n\nYou read rooms effortlessly. You sense what others feel before they say it. This intuition is a rare gift, and it draws people to you for comfort and counsel.\n\nYour journey is about learning to honour your own needs as deeply as you honour others'. Your peace cannot come only from keeping the peace around you. Find the still centre within, and you become unshakeable.`,
  },
  3: {
    traits: ['Creative', 'Expressive', 'Joyful', 'Optimistic', 'Communicative'],
    text: `You are a creative force — someone built to express, inspire, and bring light into the world. Number 3 is the number of the artist, the storyteller, and the eternal optimist.\n\nWords flow through you. Ideas arrive in bursts. People feel more alive around you, and this is not by accident — it is your nature and your purpose.\n\nYour challenge is focus. Scattered creativity produces sparks but not fire. Choose your canvas, commit to it fully, and watch what you are truly capable of building.`,
  },
  4: {
    traits: ['Grounded', 'Disciplined', 'Reliable', 'Hardworking', 'Practical'],
    text: `You are the builder. Number 4 carries the energy of structure, patience, and the kind of deep reliability that makes the world work. You do not just dream — you construct.\n\nWhere others see obstacles, you see a sequence of steps. You understand that lasting things take time, and you are willing to put in the work others walk away from.\n\nYour growth edge is flexibility. Rigidity can become a cage. The most enduring structures are those built with both strength and the wisdom to bend.`,
  },
  5: {
    traits: ['Adventurous', 'Free-spirited', 'Adaptable', 'Curious', 'Magnetic'],
    text: `You are here to experience life fully — every texture, every direction, every possibility. Number 5 is the number of freedom, change, and the irresistible pull of what lies beyond the horizon.\n\nYou adapt faster than most. You thrive in change where others freeze. Your curiosity is magnetic — people follow you into the unknown simply because you make it look exciting.\n\nYour deepest challenge is stillness. Not all growth requires movement. Some of your most important discoveries will come in the quiet moments you allow yourself to simply be.`,
  },
  6: {
    traits: ['Nurturing', 'Responsible', 'Compassionate', 'Harmonious', 'Devoted'],
    text: `You carry the energy of love and responsibility. Number 6 is the caretaker of the numerology chart — you feel a deep calling to protect, nurture, and bring harmony wherever you go.\n\nYou take your relationships seriously. You show up. You remember. The people in your life are not just lucky to have you — they know it.\n\nYour lesson is boundaries. Love given from an empty well helps no one. You must learn that caring for yourself is not selfish — it is the very foundation that makes your love sustainable.`,
  },
  7: {
    traits: ['Analytical', 'Introspective', 'Spiritual', 'Perceptive', 'Independent'],
    text: `You are a seeker. Number 7 is the number of depth, mystery, and the relentless pursuit of truth beneath the surface. You are not content with easy answers.\n\nYou observe more than you speak. You think in layers. Where others see what is in front of them, you sense what is hidden behind it — and you are usually right.\n\nYour challenge is trust. The analytical mind can become a wall against the world. Let your intuition and your intellect work together, and you will find the kind of understanding that changes lives — beginning with your own.`,
  },
  8: {
    traits: ['Powerful', 'Ambitious', 'Strategic', 'Authoritative', 'Resilient'],
    text: `You are built for mastery. Number 8 carries the energy of power, authority, and the ability to manifest on a large scale. You understand systems, leverage, and what it takes to build something that lasts.\n\nYou are drawn to challenges that others find daunting. You measure your progress not against where you started, but against the full extent of what you are capable of.\n\nYour shadow is control. Power held too tightly becomes a burden. Learn to trust others with pieces of your vision — delegation is not weakness, it is how empires are built.`,
  },
  9: {
    traits: ['Compassionate', 'Wise', 'Idealistic', 'Generous', 'Old Soul'],
    text: `You carry the wisdom of completion. Number 9 is the number of the old soul — someone who has gathered lifetimes of experience and feels a deep responsibility to give back.\n\nYou see the humanity in every situation. You forgive more readily than most. You are drawn to causes larger than yourself, and when you find yours, you pursue it with quiet, unwavering devotion.\n\nYour challenge is release. You hold on — to people, to grief, to what should have been. Your greatest freedom will come the moment you learn that letting go is not loss. It is how you make room for everything that is still coming.`,
  },
};


// ── Product catalogue ─────────────────────────────────────────
// amount_paise: price in Indian paise (₹1 = 100 paise).
// Currently set to 100 paise (₹1) for testing.
// Change to real values before going live:
//   ₹599 = 59900 paise
//   ₹999 = 99900 paise
//   ₹499 = 49900 paise
const PRODUCTS = {
  career: {
    id:           'career',
    name:         'Career & Wealth Report',
    amount_paise: 100,       // TODO: change to 59900 for live
  },
  love: {
    id:           'love',
    name:         'Love & Relationships Report',
    amount_paise: 100,       // TODO: change to 59900 for live
  },
  blueprint: {
    id:           'blueprint',
    name:         'Full Life Blueprint',
    amount_paise: 100,       // TODO: change to 99900 for live
  },
  health: {
    id:           'health',
    name:         'Health & Wellbeing Report',
    amount_paise: 100,       // TODO: change to 49900 for live
  },
};


module.exports = { READINGS, PRODUCTS, VALID_GENDERS };