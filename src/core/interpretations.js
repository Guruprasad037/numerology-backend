// ============================================================
//  core/interpretations.js
//  Static content: numerology reading texts and product catalogue.
//
//  Structure:
//    READINGS        — birth number texts (1–9)       [legacy / free reading]
//    LIFE_PATH       — life path texts (1–9, 11, 22, 33)
//    EXPRESSION      — expression/destiny texts (1–9, 11, 22, 33)
//    SOUL_URGE       — soul urge/heart's desire texts (1–9)
//    PERSONALITY     — personality number texts (1–9)
//    MATURITY        — maturity number texts (1–9)
//    PERSONAL_YEAR   — personal year texts (1–9)
//    PRODUCTS        — paid report catalogue
//    VALID_GENDERS   — allowed gender values for validation
//
//  NOTE (TESTING MODE):
//    All number texts currently return hardcoded content.
//    When you are ready for production, replace `getReadingText()`
//    in routes/reading.js with live Claude API calls and remove
//    the hardcoded texts below (or keep them as fallback).
// ============================================================


// ── Allowed gender values ─────────────────────────────────────
const VALID_GENDERS = ['Male', 'Female', 'Prefer not to say'];


// ══════════════════════════════════════════════════════════════
//  BIRTH NUMBER  (1–9)
//  Calculated from the day of birth alone.
//  Represents core personality traits and natural gifts.
// ══════════════════════════════════════════════════════════════
const READINGS = {
  1: {
    label: 'The Pioneer',
    traits: ['Leader', 'Independent', 'Ambitious', 'Pioneering', 'Determined'],
    text: `You carry the energy of new beginnings and self-reliance. Number 1 is the number of the pioneer — you are here to lead, to initiate, and to carve your own path where none existed before.\n\nYou think independently and trust your own instincts above all else. While others may seek consensus, you are comfortable standing alone when you know you are right. This strength is your greatest gift.\n\nYour challenge is learning to collaborate without feeling diminished. True leadership inspires rather than insists. Channel your ambition into vision, and others will follow naturally.`,
  },
  2: {
    label: 'The Peacemaker',
    traits: ['Diplomatic', 'Sensitive', 'Cooperative', 'Intuitive', 'Peacemaker'],
    text: `You are the soul of sensitivity and connection. Number 2 governs partnerships, balance, and the quiet power of listening — the kind of power most people overlook.\n\nYou read rooms effortlessly. You sense what others feel before they say it. This intuition is a rare gift, and it draws people to you for comfort and counsel.\n\nYour journey is about learning to honour your own needs as deeply as you honour others'. Your peace cannot come only from keeping the peace around you. Find the still centre within, and you become unshakeable.`,
  },
  3: {
    label: 'The Creator',
    traits: ['Creative', 'Expressive', 'Joyful', 'Optimistic', 'Communicative'],
    text: `You are a creative force — someone built to express, inspire, and bring light into the world. Number 3 is the number of the artist, the storyteller, and the eternal optimist.\n\nWords flow through you. Ideas arrive in bursts. People feel more alive around you, and this is not by accident — it is your nature and your purpose.\n\nYour challenge is focus. Scattered creativity produces sparks but not fire. Choose your canvas, commit to it fully, and watch what you are truly capable of building.`,
  },
  4: {
    label: 'The Builder',
    traits: ['Grounded', 'Disciplined', 'Reliable', 'Hardworking', 'Practical'],
    text: `You are the builder. Number 4 carries the energy of structure, patience, and the kind of deep reliability that makes the world work. You do not just dream — you construct.\n\nWhere others see obstacles, you see a sequence of steps. You understand that lasting things take time, and you are willing to put in the work others walk away from.\n\nYour growth edge is flexibility. Rigidity can become a cage. The most enduring structures are those built with both strength and the wisdom to bend.`,
  },
  5: {
    label: 'The Explorer',
    traits: ['Adventurous', 'Free-spirited', 'Adaptable', 'Curious', 'Magnetic'],
    text: `You are here to experience life fully — every texture, every direction, every possibility. Number 5 is the number of freedom, change, and the irresistible pull of what lies beyond the horizon.\n\nYou adapt faster than most. You thrive in change where others freeze. Your curiosity is magnetic — people follow you into the unknown simply because you make it look exciting.\n\nYour deepest challenge is stillness. Not all growth requires movement. Some of your most important discoveries will come in the quiet moments you allow yourself to simply be.`,
  },
  6: {
    label: 'The Nurturer',
    traits: ['Nurturing', 'Responsible', 'Compassionate', 'Harmonious', 'Devoted'],
    text: `You carry the energy of love and responsibility. Number 6 is the caretaker of the numerology chart — you feel a deep calling to protect, nurture, and bring harmony wherever you go.\n\nYou take your relationships seriously. You show up. You remember. The people in your life are not just lucky to have you — they know it.\n\nYour lesson is boundaries. Love given from an empty well helps no one. You must learn that caring for yourself is not selfish — it is the very foundation that makes your love sustainable.`,
  },
  7: {
    label: 'The Seeker',
    traits: ['Analytical', 'Introspective', 'Spiritual', 'Perceptive', 'Independent'],
    text: `You are a seeker. Number 7 is the number of depth, mystery, and the relentless pursuit of truth beneath the surface. You are not content with easy answers.\n\nYou observe more than you speak. You think in layers. Where others see what is in front of them, you sense what is hidden behind it — and you are usually right.\n\nYour challenge is trust. The analytical mind can become a wall against the world. Let your intuition and your intellect work together, and you will find the kind of understanding that changes lives — beginning with your own.`,
  },
  8: {
    label: 'The Powerhouse',
    traits: ['Powerful', 'Ambitious', 'Strategic', 'Authoritative', 'Resilient'],
    text: `You are built for mastery. Number 8 carries the energy of power, authority, and the ability to manifest on a large scale. You understand systems, leverage, and what it takes to build something that lasts.\n\nYou are drawn to challenges that others find daunting. You measure your progress not against where you started, but against the full extent of what you are capable of.\n\nYour shadow is control. Power held too tightly becomes a burden. Learn to trust others with pieces of your vision — delegation is not weakness, it is how empires are built.`,
  },
  9: {
    label: 'The Old Soul',
    traits: ['Compassionate', 'Wise', 'Idealistic', 'Generous', 'Old Soul'],
    text: `You carry the wisdom of completion. Number 9 is the number of the old soul — someone who has gathered lifetimes of experience and feels a deep responsibility to give back.\n\nYou see the humanity in every situation. You forgive more readily than most. You are drawn to causes larger than yourself, and when you find yours, you pursue it with quiet, unwavering devotion.\n\nYour challenge is release. You hold on — to people, to grief, to what should have been. Your greatest freedom will come the moment you learn that letting go is not loss. It is how you make room for everything that is still coming.`,
  },
};


// ══════════════════════════════════════════════════════════════
//  LIFE PATH NUMBER  (1–9, 11, 22, 33)
//  The most important number. Your overarching life theme,
//  the lessons you are here to learn, the road you walk.
// ══════════════════════════════════════════════════════════════
const LIFE_PATH = {
  1: {
    label: 'The Independent Leader',
    traits: ['Self-starter', 'Courageous', 'Original', 'Driven', 'Bold'],
    text: `Your Life Path is one of independence and initiation. You came here to forge your own way — not to follow a map, but to draw one. Every obstacle you face is secretly an invitation to discover how resourceful you really are.\n\nYou will find that life keeps pushing you into the front of the room, even when you are not sure you asked to be there. Trust that. You were designed to lead — not with force, but with the clarity of someone who simply knows which direction to walk.\n\nThe shadow of your path is isolation. The belief that you must do it all alone, or that asking for help is weakness. Your growth comes when you discover that the most powerful leaders are also the most open learners.`,
  },
  2: {
    label: 'The Harmoniser',
    traits: ['Empathic', 'Collaborative', 'Patient', 'Perceptive', 'Devoted'],
    text: `Your Life Path is one of partnership and sensitivity. You are here to bring people together, to hold the space between opposing forces and find the thread of understanding that connects them.\n\nYou feel things deeply — more deeply than most around you realise. This is not a vulnerability; it is a form of intelligence. Your sensitivity allows you to perceive nuances others miss, and to offer comfort that goes directly to the root.\n\nYour growth edge is learning that harmony cannot always be maintained — and that sometimes the most loving thing you can do is allow conflict to surface, so it can be truly resolved.`,
  },
  3: {
    label: 'The Communicator',
    traits: ['Expressive', 'Playful', 'Inspiring', 'Witty', 'Abundant'],
    text: `Your Life Path is one of expression and joy. You are here to create, to communicate, and to remind the world that beauty and laughter are not luxuries — they are essential.\n\nYou have a rare gift: you can take complex feelings and turn them into something others can hold. Whether through words, art, music, or presence, you translate the inner world into something shareable. This is a form of service.\n\nYour challenge is depth over breadth. The 3 can scatter its gifts across too many directions and wonder why nothing takes root. Commit to one expression fully, and it will multiply beyond anything you imagined.`,
  },
  4: {
    label: 'The Foundation Maker',
    traits: ['Structured', 'Loyal', 'Methodical', 'Honest', 'Enduring'],
    text: `Your Life Path is one of building and dedication. You are here to create things that last — structures, systems, families, businesses — the kind of foundations that hold up long after you are gone.\n\nYou have an almost sacred relationship with effort. You understand that real things take real time, and you are willing to give it. In a world addicted to shortcuts, your commitment to quality is quietly radical.\n\nYour shadow is rigidity. When the plan stops working, the 4 sometimes doubles down instead of adapting. Remember: the strongest structures have room to move. Flexibility is not failure — it is engineering.`,
  },
  5: {
    label: 'The Freedom Seeker',
    traits: ['Dynamic', 'Versatile', 'Fearless', 'Sensory', 'Progressive'],
    text: `Your Life Path is one of freedom and transformation. You are here to experience the full spectrum of what it means to be alive — and then to bring those experiences back as wisdom for others.\n\nYou are at your best when you are moving, learning, and adapting. Change is not something that happens to you; it is something you carry with you wherever you go. You make the unfamiliar feel safe for everyone around you.\n\nYour deepest lesson is that true freedom is not the absence of commitment — it is choosing what you are committed to. The 5 who learns to channel its energy into focused adventures becomes unstoppable.`,
  },
  6: {
    label: 'The Caretaker',
    traits: ['Loving', 'Protective', 'Idealistic', 'Harmonious', 'Responsible'],
    text: `Your Life Path is one of love and service. You are here to create beauty, to heal rifts, and to be the person others instinctively turn to when the world feels too heavy.\n\nYou have an extraordinary capacity for love — not just romantic love, but the kind that shows up with a meal, remembers the hard anniversary, and stays when everyone else leaves. This is your gift and your calling.\n\nYour lesson is that love cannot be given from a place of compulsion or fear. The 6 who learns to give freely — without tallying what they are owed in return — discovers that their love is, in fact, infinite.`,
  },
  7: {
    label: 'The Truth Seeker',
    traits: ['Introspective', 'Analytical', 'Spiritual', 'Private', 'Deep'],
    text: `Your Life Path is one of wisdom and solitude. You are here to go beneath the surface — of ideas, of relationships, of yourself — and surface with understanding that others could not find without you.\n\nYou are most alive when you are learning something that genuinely surprises you, or sitting in silence with a question too big to rush. You have a natural relationship with mystery, and you are comfortable in places where others need certainty.\n\nYour challenge is the wall. The 7 who only analyses without trusting, only questions without surrendering, eventually becomes isolated in their own precision. Your wisdom only changes things when it is shared.`,
  },
  8: {
    label: 'The Manifestor',
    traits: ['Ambitious', 'Authoritative', 'Executive', 'Abundant', 'Karmic'],
    text: `Your Life Path is one of power and abundance — material, spiritual, and karmic. You are here to master the physical world: to build, to lead, to accumulate wisdom about how power actually works.\n\nYou have an instinct for leverage. You understand that the right structure, applied at the right moment, can move enormous things. When this gift is aligned with integrity, what you build becomes legendary.\n\nThe shadow of the 8 path is the belief that more is always better. The 8 who is endlessly acquiring — money, status, control — is the 8 who has not yet met their own depth. Your greatest power is knowing when enough is enough.`,
  },
  9: {
    label: 'The Humanitarian',
    traits: ['Selfless', 'Visionary', 'Compassionate', 'Philosophical', 'Universal'],
    text: `Your Life Path is one of completion and giving. You are here in service — not to any one person or group, but to something larger. The 9 is the number that holds all the others inside it, and you feel that responsibility in your bones.\n\nYou are moved by injustice. You carry other people's pain as if it were your own. This is not a burden — it is the specific shape of your purpose. You are designed to feel broadly so you can act widely.\n\nYour lesson is release. The 9 path asks you to hold loosely: to love without possessing, to give without needing the credit, to let endings happen so beginnings can arrive. Everything you release makes room for more.`,
  },
  11: {
    label: 'The Inspired Messenger',
    traits: ['Visionary', 'Intuitive', 'Illuminating', 'Sensitive', 'Idealistic'],
    text: `You walk the Master Number 11 path — one of the most spiritually charged journeys in numerology. You are here as a channel: a bridge between the invisible world of intuition and the visible world of human experience.\n\nYou have always sensed that you are meant for something significant, even if you could not name it. This is accurate. The 11 is not designed for ordinary output — you are designed to inspire, to elevate, to crack open the ordinary and show what shimmers beneath.\n\nYour greatest challenge is also your greatest gift: extreme sensitivity. The same permeability that allows you to channel higher insight also makes the noise of the world genuinely painful. Your work is to find how to stay open without being overwhelmed.`,
  },
  22: {
    label: 'The Master Builder',
    traits: ['Visionary', 'Disciplined', 'Practical', 'Powerful', 'Transformative'],
    text: `You walk the Master Number 22 path — the path of the Master Builder. You are here to turn the most ambitious visions into concrete reality. Not just personal success: structures that transform how people live.\n\nYou contain multitudes. The idealism of the 11 and the discipline of the 4 live inside you simultaneously, and when they work in concert, there is almost nothing you cannot build. Institutions, movements, technologies, families — all can carry your imprint.\n\nYour challenge is the weight of your own potential. The 22 who has not yet stepped into their power can feel its pressure as anxiety, procrastination, or a fear of failing something important. Begin. The vision clarifies in motion.`,
  },
  33: {
    label: 'The Master Teacher',
    traits: ['Selfless', 'Compassionate', 'Nurturing', 'Uplifting', 'Transcendent'],
    text: `You walk the Master Number 33 path — the rarest and most selfless of all life paths. You are here to embody unconditional love at a scale that touches communities, not just individuals.\n\nThe 33 carries a calling so large that it rarely fully arrives until mid-life or later. Until then, you may feel a persistent sense of not-yet, of a purpose just out of reach. This is not failure. This is preparation.\n\nYour work is love in its fullest expression: not sentiment, but commitment. Not softness, but the fierce, unwavering presence of someone who will not abandon another person in their darkness. The world needs this. And you were made for it.`,
  },
};


// ══════════════════════════════════════════════════════════════
//  EXPRESSION (DESTINY) NUMBER  (1–9, 11, 22, 33)
//  Calculated from all letters in the full birth name.
//  Represents natural talents and what you are destined to do.
// ══════════════════════════════════════════════════════════════
const EXPRESSION = {
  1: {
    label: 'The Natural Leader',
    traits: ['Original', 'Assertive', 'Initiative', 'Independent', 'Pioneering'],
    text: `Your Expression number reveals you were born with the gifts of originality and initiative. You have a natural authority that others feel before you have even spoken — a quiet certainty that tells people this person knows where they are going.\n\nYour talents are strongest in fields where you can own the outcome: entrepreneurship, leadership, creative direction, or any domain where your individual vision can be expressed without being diluted by committee.\n\nYour growth lies in learning that your originality is most powerful when it invites others in rather than leaving them behind. The best leaders create other leaders.`,
  },
  2: {
    label: 'The Collaborator',
    traits: ['Mediating', 'Supportive', 'Detail-oriented', 'Tactful', 'Intuitive'],
    text: `Your Expression number reveals gifts of diplomacy and perception. You were born with an almost uncanny ability to sense what others need and to hold space for multiple perspectives simultaneously.\n\nYou excel in roles that require tact, cooperation, and careful attention to the human element: counselling, partnerships, support roles, teaching, or any work that requires building bridges between people or ideas.\n\nYour growth is in recognising that your contributions are not smaller for being quiet. The person who holds the team together is as essential as the one who leads it.`,
  },
  3: {
    label: 'The Expressive Artist',
    traits: ['Creative', 'Charismatic', 'Verbal', 'Optimistic', 'Social'],
    text: `Your Expression number reveals extraordinary gifts of communication and creativity. You carry a natural eloquence — words, images, and ideas flow through you in ways that engage and uplift others.\n\nYou were designed to work with people and for people: writing, speaking, performing, designing, teaching — any domain where your creative intelligence and warmth can be fully expressed is your natural territory.\n\nYour growth is in anchoring your gifts to a sustained focus. The most brilliant creative minds in history were not those with the most ideas, but those who chose one idea and went all the way into it.`,
  },
  4: {
    label: 'The Systems Builder',
    traits: ['Precise', 'Organised', 'Reliable', 'Logical', 'Enduring'],
    text: `Your Expression number reveals gifts of precision, organisation, and follow-through. You have a rare capacity for turning vision into plan, and plan into reality. You build things that do not fall apart.\n\nYou excel in fields that require structure, reliability, and long-term thinking: engineering, architecture, finance, project management, or any work that demands the kind of meticulous commitment most people struggle to sustain.\n\nYour growth is in allowing yourself to dream a little bigger than the plan allows. The greatest builders in history were not just precise — they were also bold.`,
  },
  5: {
    label: 'The Versatile Communicator',
    traits: ['Adaptive', 'Persuasive', 'Dynamic', 'Multi-talented', 'Progressive'],
    text: `Your Expression number reveals gifts of adaptability and persuasion. You have an innate ability to meet people where they are, to absorb new information quickly, and to communicate across very different audiences with equal ease.\n\nYou are built for variety: sales, marketing, journalism, travel, politics, education, or any field where the ability to shift, persuade, and connect is prized above consistency.\n\nYour growth is in depth. The 5 Expression who adds genuine expertise to their natural versatility becomes not just interesting, but irreplaceable.`,
  },
  6: {
    label: 'The Devoted Healer',
    traits: ['Caring', 'Responsible', 'Aesthetic', 'Healing', 'Community'],
    text: `Your Expression number reveals gifts of nurturing, healing, and the creation of beauty. You have an instinct for what people need to feel safe and cared for, and an aesthetic sensibility that brings order and warmth to any environment.\n\nYou thrive in service-oriented fields: medicine, counselling, interior design, social work, teaching, community leadership — any role where your love is the engine.\n\nYour growth is in recognising that your own wellbeing is part of the service you offer. A healer who neglects themselves cannot heal others. Your self-care is not indulgent — it is professional.`,
  },
  7: {
    label: 'The Analytical Mystic',
    traits: ['Investigative', 'Scholarly', 'Discerning', 'Refined', 'Independent'],
    text: `Your Expression number reveals gifts of deep analysis and quiet wisdom. You were born with an unusual combination: the precision of the scientist and the perception of the mystic. You see patterns others miss and connections others cannot make.\n\nYou excel in research, philosophy, psychology, technology, or spiritual study — any field where the reward is not external approval but the private thrill of genuine understanding.\n\nYour growth is in sharing what you find. Knowledge kept only to yourself is potential unrealised. The world is waiting for what you have discovered in your solitude.`,
  },
  8: {
    label: 'The Executive',
    traits: ['Authoritative', 'Strategic', 'Business-minded', 'Efficient', 'Resilient'],
    text: `Your Expression number reveals gifts of executive power and strategic intelligence. You were born understanding leverage — how systems work, where value is created, and how to position for maximum impact.\n\nYou are built for leadership at scale: business, finance, law, real estate, or any domain where your ability to think big and execute precisely can be fully deployed.\n\nYour growth is in the human dimension of power. The most enduring legacies are built not just on strategy, but on the loyalty of people who were genuinely developed and seen by their leaders.`,
  },
  9: {
    label: 'The Wise Counsellor',
    traits: ['Humanitarian', 'Artistic', 'Philosophical', 'Tolerant', 'Universal'],
    text: `Your Expression number reveals gifts of wisdom, compassion, and universal perspective. You were born with an instinctive understanding of the human condition — its pain, its beauty, and its potential — and a deep desire to serve it.\n\nYou are drawn to work that transcends the personal: the arts, education, humanitarian work, philosophy, or spirituality — anywhere you can use your gifts not just for yourself, but for something that outlasts you.\n\nYour growth is in allowing yourself to receive as generously as you give. The 9 Expression who learns to be served without guilt discovers that love is not finite — it only grows when it flows in both directions.`,
  },
  11: {
    label: 'The Intuitive Visionary',
    traits: ['Inspirational', 'Prophetic', 'Spiritual', 'Creative', 'Illuminating'],
    text: `Your Expression Master Number 11 reveals gifts that operate on a higher frequency than most. You carry an unusual combination of creative brilliance and spiritual sensitivity — an inner antenna that receives signals others cannot.\n\nYou are here to inspire at a large scale: through art, teaching, spiritual leadership, or any creative work that opens people's hearts and expands their sense of what is possible.\n\nThe gift and the challenge are the same: living with heightened sensitivity in a world that is often too loud. Learn to regulate your environment, and your capacity to inspire becomes unlimited.`,
  },
  22: {
    label: 'The Visionary Builder',
    traits: ['Practical Idealist', 'Architect', 'Large-scale', 'Grounded', 'Transformative'],
    text: `Your Expression Master Number 22 reveals the rarest of gifts: the ability to hold a vast vision and build it into something real. You combine the big-picture thinking of a visionary with the practical discipline of a master builder.\n\nYou are here to create things that change how people live — institutions, systems, technologies, or communities that carry your blueprint long after you are gone.\n\nThe scale of your gifts can feel like pressure. Begin with what is in front of you. Every great structure starts with a single, carefully placed stone.`,
  },
  33: {
    label: 'The Selfless Teacher',
    traits: ['Unconditional', 'Teaching', 'Healing', 'Community', 'Inspiring'],
    text: `Your Expression Master Number 33 reveals a calling to teach, heal, and love at a scale that transcends the personal. You were born with gifts of compassion so deep and wide that they are meant to serve whole communities, not just individuals.\n\nYour talents shine brightest in teaching, healing, creative service, or any work where your love is the curriculum and your presence is the lesson.\n\nRemember that your gifts develop slowly, by design. Do not measure yourself against others' timelines. The 33 ripens in depth, not speed.`,
  },
};


// ══════════════════════════════════════════════════════════════
//  SOUL URGE (HEART'S DESIRE) NUMBER  (1–9)
//  Calculated from vowels in the full name.
//  Represents your deepest motivations, what your soul longs for.
// ══════════════════════════════════════════════════════════════
const SOUL_URGE = {
  1: {
    label: 'Craves Autonomy',
    traits: ['Self-directed', 'Proud', 'Achievement-driven', 'Independent', 'Assertive'],
    text: `At your core, you crave independence and the freedom to do things your way. Your soul is most at peace when you are the author of your own story — when no one is waiting to approve your next move.\n\nYou are driven by a deep need to achieve something that is entirely yours. Not to prove yourself to others, but to satisfy a private inner standard that you set higher than anyone else would dare.\n\nWhat brings you joy is leading — whether a team, a project, or your own life. What drains you is feeling dependent, overlooked, or constrained by others' limitations.`,
  },
  2: {
    label: 'Craves Connection',
    traits: ['Relationally-driven', 'Harmonious', 'Loyal', 'Sensitive', 'Unifying'],
    text: `At your core, you crave deep connection and mutual understanding. Your soul is nourished by relationships that feel genuinely reciprocal — where you are truly seen, and where the people you love feel truly held.\n\nYou are motivated by harmony. Not the shallow kind that comes from avoiding conflict, but the deep kind that comes from two people truly hearing each other. This is what you are always reaching for.\n\nWhat brings you joy is belonging. What drains you is feeling alone in a crowd, or loving someone who cannot quite meet you where you are.`,
  },
  3: {
    label: 'Craves Expression',
    traits: ['Self-expressive', 'Playful', 'Inspired', 'Joyful', 'Creative'],
    text: `At your core, you crave expression and the joy of creation. Your soul is not content to simply receive the world — it needs to respond to it, shape it, add something to it that was not there before.\n\nYou are most alive when you are making something: a piece of writing, a conversation that sparks, a room that feels beautiful, a laugh that breaks tension. The medium matters less than the act of creating.\n\nWhat brings you joy is creative freedom. What drains you is silence when you want to speak, or a life so scheduled that spontaneity becomes impossible.`,
  },
  4: {
    label: 'Craves Security',
    traits: ['Stability-seeking', 'Grounded', 'Principled', 'Loyal', 'Order-loving'],
    text: `At your core, you crave security and solid ground. Your soul is not asking for luxury — it is asking for stability: a home that feels safe, work that means something, relationships built on genuine trust.\n\nYou are motivated by the desire to build something real. Not a performance of success, but the actual thing: a business that works, a family that holds together, a reputation earned through consistent integrity.\n\nWhat brings you joy is the feeling of things in their right place. What drains you is chaos, broken commitments, and environments that shift without warning.`,
  },
  5: {
    label: 'Craves Freedom',
    traits: ['Experience-driven', 'Restless', 'Curious', 'Sensory', 'Spontaneous'],
    text: `At your core, you crave freedom and the thrill of the new. Your soul is not built for sameness — it needs variety, movement, sensation, and the feeling of a horizon that keeps expanding.\n\nYou are motivated by experience itself. You want to have lived, not just to have existed. You want stories worth telling, and a life that surprises you.\n\nWhat brings you joy is discovery — new places, new ideas, new people who see the world differently than you do. What drains you is routine without meaning, or a life that stopped asking questions.`,
  },
  6: {
    label: 'Craves Harmony & Love',
    traits: ['Love-driven', 'Family-oriented', 'Aesthetic', 'Protective', 'Devoted'],
    text: `At your core, you crave love — not just romantic love, but the full, rich experience of belonging and being needed. Your soul is most at peace when the people you love are well, and when the spaces you inhabit feel warm and harmonious.\n\nYou are motivated by devotion. You want to be the person others can count on, the steady presence in a shifting world. This is not weakness — it is one of the rarest forms of strength.\n\nWhat brings you joy is a home that feels like a sanctuary, and relationships that feel like a safe harbour. What drains you is discord you cannot resolve, or love that goes unacknowledged.`,
  },
  7: {
    label: 'Craves Understanding',
    traits: ['Truth-seeking', 'Solitude-loving', 'Philosophical', 'Introspective', 'Perfectionistic'],
    text: `At your core, you crave understanding — not information, but genuine insight. Your soul is not satisfied with knowing what; it needs to know why, and then the why behind the why.\n\nYou are motivated by the pursuit of truth. You want to understand how things actually work, what people really mean, what lies beneath the surface of every experience and every relationship.\n\nWhat brings you joy is the private thrill of an idea finally clicking into place, or a conversation that goes somewhere neither person expected. What drains you is noise, pretence, and the exhausting performance of small talk.`,
  },
  8: {
    label: 'Craves Achievement',
    traits: ['Power-driven', 'Success-oriented', 'Material', 'Ambitious', 'Legacy-focused'],
    text: `At your core, you crave achievement and the tangible evidence of your own power. Your soul is most alive when it is working toward something significant — when the goal is worthy of your full capacity.\n\nYou are motivated by impact. Not just comfort, but consequence — the knowledge that what you build matters, that you changed something in the world by being in it.\n\nWhat brings you joy is mastery: the moment when years of effort produce undeniable results. What drains you is mediocrity — especially your own.`,
  },
  9: {
    label: 'Craves Purpose',
    traits: ['Purpose-driven', 'Compassionate', 'Generous', 'Universal', 'Selfless'],
    text: `At your core, you crave meaning — not just personal fulfilment, but the deep satisfaction of knowing that your life served something beyond itself. Your soul is not content with private success; it wants to contribute.\n\nYou are motivated by compassion. You feel the weight of suffering that is not your own. You want to use whatever gifts you have to alleviate it.\n\nWhat brings you joy is the moment your work touches someone genuinely — not applause, but the quiet recognition that something you gave mattered. What drains you is a life that feels small, or a world that seems indifferent.`,
  },
};


// ══════════════════════════════════════════════════════════════
//  PERSONALITY NUMBER  (1–9)
//  Calculated from consonants in the full name.
//  How the outside world perceives you; your social impression.
// ══════════════════════════════════════════════════════════════
const PERSONALITY = {
  1: {
    label: 'Appears Confident & Decisive',
    traits: ['Authoritative', 'Self-assured', 'Direct', 'Bold', 'Commanding'],
    text: `To the outside world, you appear confident, decisive, and quietly in charge. People sense that you have already thought through the situation before they have finished explaining it — and they find this reassuring.\n\nYour presence communicates competence. You rarely appear flustered. Even in unfamiliar situations, you project the kind of calm that others interpret as experience.\n\nThe impression you make can sometimes feel intimidating to those who are less certain of themselves. When you remember to soften your edges with warmth, your natural authority becomes magnetic rather than just commanding.`,
  },
  2: {
    label: 'Appears Warm & Approachable',
    traits: ['Gentle', 'Diplomatic', 'Considerate', 'Attentive', 'Refined'],
    text: `To the outside world, you appear warm, considerate, and genuinely interested in other people. You have a gift for making others feel noticed — a nod, a question, a moment of real attention that says: I see you.\n\nPeople trust you quickly because you do not seem to be performing. Your warmth appears effortless because, for you, it largely is.\n\nThe impression you make can sometimes cause others to underestimate your strength or depth. The gentleness they see is real, but it is not the whole picture. Let people discover your steel when the moment calls for it.`,
  },
  3: {
    label: 'Appears Vibrant & Engaging',
    traits: ['Charming', 'Expressive', 'Witty', 'Animated', 'Magnetic'],
    text: `To the outside world, you appear vibrant, expressive, and genuinely enjoyable to be around. People brighten in your presence — not because you perform, but because your natural energy is contagious.\n\nYou have a gift for conversation: you know how to draw people out, how to make the ordinary feel interesting, and how to find humour in places others would not think to look.\n\nThe impression you make is overwhelmingly positive, but it can create an expectation that you are always "on." Give yourself permission to be quiet sometimes. The people who matter will not confuse your still moments with absence.`,
  },
  4: {
    label: 'Appears Steady & Reliable',
    traits: ['Trustworthy', 'Calm', 'Solid', 'Professional', 'No-nonsense'],
    text: `To the outside world, you appear steady, competent, and dependable — the kind of person others instinctively call when they need the job done. You do not broadcast your capabilities; you demonstrate them.\n\nYour manner is grounded and direct. You waste little, say what you mean, and follow through on what you promise. In a world full of people who overcommit and underdeliver, this sets you apart.\n\nThe impression you make can sometimes feel cooler than you intend. Warmth and precision can coexist. When you show people the care behind your competence, they stop just trusting you — they become loyal to you.`,
  },
  5: {
    label: 'Appears Dynamic & Interesting',
    traits: ['Energetic', 'Unpredictable', 'Adventurous', 'Quick-witted', 'Stimulating'],
    text: `To the outside world, you appear dynamic, interesting, and impossible to fully predict — which makes you interesting to watch, and even more interesting to know.\n\nYou move through social situations with a lightness that others find refreshing. You are equally at ease in a boardroom and at a street market — your adaptability reads as confidence, and people respond to it.\n\nThe impression you make is energising, but it can also feel temporary. People wonder if you will stay, if this is real, if you are as present as you appear. Showing your depth — not just your range — is what converts admiration into trust.`,
  },
  6: {
    label: 'Appears Warm & Caring',
    traits: ['Nurturing', 'Responsible', 'Beautiful', 'Trustworthy', 'Comforting'],
    text: `To the outside world, you appear warm, caring, and genuinely invested in the people around you. People sense that you mean it — that your interest is not social performance but actual attention.\n\nYou often come across as slightly more put-together than everyone else in the room — not because you try harder, but because your aesthetic sensibility extends to how you present yourself to the world.\n\nThe impression you make can attract people who need more than you have to give. Learning to be warm and boundaried simultaneously is your ongoing social refinement — and when you manage it, you become someone others admire not just for your care, but for your wisdom.`,
  },
  7: {
    label: 'Appears Mysterious & Refined',
    traits: ['Private', 'Observant', 'Intelligent', 'Aloof', 'Intriguing'],
    text: `To the outside world, you appear intelligent, private, and slightly unknowable — which creates a quiet intrigue that draws others toward you even as you hold yourself at a slight remove.\n\nYou observe far more than you reveal. People often feel that you have already assessed the situation before they have finished explaining it — and they are usually right.\n\nThe impression you make can feel cool or distant to those who do not know you well. When you decide to let someone in — even a little — the effect is powerful. The contrast between your usual reserve and your moments of openness is one of your most compelling qualities.`,
  },
  8: {
    label: 'Appears Powerful & Capable',
    traits: ['Executive', 'Confident', 'Polished', 'Authoritative', 'Efficient'],
    text: `To the outside world, you appear powerful, competent, and someone worth paying attention to. You carry yourself with a quiet authority that communicates: I have thought this through, and I am not guessing.\n\nYou dress and present yourself in ways that project success — not because you are performing, but because your standards extend naturally into your appearance and environment.\n\nThe impression you make opens doors that others find closed. The challenge is ensuring that what is behind the door matches what is on the front of it — not because you lack substance, but because your exterior is so polished that people hold you to the very highest standard.`,
  },
  9: {
    label: 'Appears Compassionate & Wise',
    traits: ['Noble', 'Generous', 'Empathic', 'Broad-minded', 'Gracious'],
    text: `To the outside world, you appear compassionate, broad-minded, and possessed of a gentle wisdom that feels rare. People often feel, in your company, that they are being seen more generously than they see themselves.\n\nYou carry yourself with a quiet grace that is not studied or performed — it comes from genuinely not needing to compete. You are already where you are, and that settledness is visible.\n\nThe impression you make inspires trust and opens hearts. The challenge is that people sometimes mistake your acceptance for agreement, or your gentleness for a lack of convictions. When the moment calls for it, do not hesitate to let your depth show.`,
  },
};


// ══════════════════════════════════════════════════════════════
//  MATURITY NUMBER  (1–9)
//  Life Path + Expression, reduced.
//  The dominant energy of your second half of life (~35+).
// ══════════════════════════════════════════════════════════════
const MATURITY = {
  1: {
    label: 'Maturing into Sovereignty',
    text: `As you move through the second half of your life, you will feel an increasing pull toward independence and self-determination. The approval of others will matter less; your own clear sense of direction will matter more.\n\nThis is not selfishness — it is the natural result of a life spent learning who you actually are. In your mature years, you will find the courage to build something that is entirely, unapologetically yours.`,
  },
  2: {
    label: 'Maturing into Partnership',
    text: `As you grow into your maturity, your relationships will become the central and most rewarding theme of your life. Partnerships — romantic, professional, and creative — will be where your greatest growth and satisfaction live.\n\nYou will find that the older you get, the more you value depth over breadth, presence over productivity, and genuine connection over impressive achievement. This wisdom, when embraced, transforms everything.`,
  },
  3: {
    label: 'Maturing into Expression',
    text: `As you grow into your maturity, your creative and communicative gifts will deepen and find their truest form. The scattered creativity of your earlier years will focus into something more precise and more powerful.\n\nIn the second half of your life, you may feel called to share what you know — to teach, to write, to create in ways that leave something behind. This impulse is worth following fully.`,
  },
  4: {
    label: 'Maturing into Mastery',
    text: `As you grow into your maturity, you will find deep satisfaction in mastery and the tangible results of sustained effort. The structures you have spent a lifetime building — in work, in family, in character — will begin to show their durability.\n\nThe second half of your life rewards your patience. What you built slowly, carefully, and without shortcuts will outlast the quick constructions of others. This is your vindication and your legacy.`,
  },
  5: {
    label: 'Maturing into Freedom',
    text: `As you grow into your maturity, your relationship with freedom will evolve. The restless seeking of your earlier years will soften into something more deliberate — a freedom chosen, rather than chased.\n\nIn the second half of your life, you may find that you have all the adventure you need in the depth of a single day, a single place, a single relationship fully explored. This is not limitation — it is the freedom of the person who no longer needs to run to feel free.`,
  },
  6: {
    label: 'Maturing into Love',
    text: `As you grow into your maturity, love in its fullest expression will become your primary domain. Your relationships, your home, your community — these will be where you find your deepest meaning and your greatest joy.\n\nThe second half of your life asks you to give love without condition and to receive it without guilt. When you master this balance, you become one of the rarest things in the world: a person in whose presence others feel genuinely at home.`,
  },
  7: {
    label: 'Maturing into Wisdom',
    text: `As you grow into your maturity, the searching quality of your earlier years will deepen into wisdom. The questions you have been asking your whole life will begin to reveal their answers — not all at once, but in a steady accumulation of clarity.\n\nThe second half of your life is when your inner life becomes your greatest resource. The depth you have cultivated in solitude becomes the very quality that makes you valuable to others who are still searching.`,
  },
  8: {
    label: 'Maturing into Power',
    text: `As you grow into your maturity, your relationship with power, abundance, and achievement will come into its fullest and most integrated expression. What you were always capable of will finally have the platform it deserves.\n\nThe second half of your life is when your accumulated wisdom about how the world actually works becomes your greatest asset. Use it not just to build for yourself, but to build for others. This is where your legacy is made.`,
  },
  9: {
    label: 'Maturing into Service',
    text: `As you grow into your maturity, your sense of universal compassion and service will deepen into your primary mode of being. The personal ambitions of your earlier years will give way to something larger and more generous.\n\nThe second half of your life is when your gifts become the most freely given — not because you expect less in return, but because you no longer need the return. This is the mature expression of a life well-lived: giving from fullness, not from need.`,
  },
};


// ══════════════════════════════════════════════════════════════
//  PERSONAL YEAR NUMBER  (1–9)
//  Birth month + birth day + current year, reduced.
//  The theme and energy of your current calendar year.
// ══════════════════════════════════════════════════════════════
const PERSONAL_YEAR = {
  1: {
    label: 'Year of New Beginnings',
    text: `This is a Year 1 for you — a year of new beginnings, fresh starts, and the planting of seeds that will grow for the next nine years. The slate has been cleared. What you initiate now carries unusual momentum.\n\nThis year favours courage. Begin the project, launch the idea, move toward the thing you have been circling. The energy of a Year 1 rewards action and punishes hesitation.\n\nWhat to watch: the temptation to wait until everything is perfect. It never is. Begin anyway.`,
  },
  2: {
    label: 'Year of Partnership',
    text: `This is a Year 2 for you — a year of relationships, patience, and the quiet work of building trust. After the action-oriented Year 1, this year asks you to slow down and tend to the connections that matter.\n\nCollaboration is favoured. Partnerships — personal and professional — that you invest in now will prove their value over the years ahead. Listen more than you speak. Pay attention to what others need.\n\nWhat to watch: frustration at the slower pace. Year 2 is not passive — it is the deep work of laying relational foundations that Year 1's seeds need to grow.`,
  },
  3: {
    label: 'Year of Expression',
    text: `This is a Year 3 for you — a year of creativity, social expansion, and the joy of expressing who you are. After two years of beginning and building, this year opens a more playful, abundant chapter.\n\nThis is a year to socialise, create, communicate, and enjoy. Opportunities will come through people — new connections, creative collaborations, conversations that change direction. Say yes more than you say no.\n\nWhat to watch: scattered energy. The abundance of a Year 3 can lead to overcommitment. Enjoy the expansion while keeping a few important projects at the centre.`,
  },
  4: {
    label: 'Year of Building',
    text: `This is a Year 4 for you — a year of hard work, structure, and the satisfaction of building something real. The playfulness of last year gives way to something more focused and more demanding.\n\nThis is not a year for shortcuts. It rewards discipline, organisation, and the willingness to do the unglamorous work that real results require. What you build with integrity this year will last.\n\nWhat to watch: rigidity and overwork. Building is important, but so is rest. The structures that last are built by people who know when to stop and recover.`,
  },
  5: {
    label: 'Year of Change',
    text: `This is a Year 5 for you — a year of change, freedom, and unexpected developments. After the disciplined work of Year 4, life is ready to move, and it will — whether or not you have planned for it.\n\nThis year favours flexibility and a willingness to let the unexpected in. Travel, new opportunities, and significant shifts are all more likely in a Year 5. Embrace the instability. It is carrying you somewhere important.\n\nWhat to watch: recklessness. The energy of freedom is real, but not all changes are improvements. Choose your risks consciously.`,
  },
  6: {
    label: 'Year of Responsibility',
    text: `This is a Year 6 for you — a year centred on home, relationships, family, and responsibility. After the upheavals of Year 5, life is asking you to settle, to nurture, and to attend to what genuinely matters to you.\n\nThis year brings relationship themes to the foreground — whether deepening commitments, resolving long-standing tensions, or reimagining what home and family mean to you. Love is both the theme and the reward.\n\nWhat to watch: over-giving. Year 6 attracts those who need your care. Give freely, but not at the expense of your own health and happiness.`,
  },
  7: {
    label: 'Year of Reflection',
    text: `This is a Year 7 for you — a year of inner work, reflection, and the kind of deep self-understanding that only comes from genuine solitude. After the relational intensity of Year 6, life is offering you space.\n\nThis is not a year for aggressive external expansion. It is a year for reading, thinking, learning, and attending to the inner world that your outer life runs on. The insights you gain this year will shape your actions for years to come.\n\nWhat to watch: isolation and withdrawal. Reflection is good; retreat from life is not. Stay present to the people who matter, even as you go deep.`,
  },
  8: {
    label: 'Year of Achievement',
    text: `This is a Year 8 for you — a year of achievement, financial focus, and the tangible results of your accumulated effort. After the inner work of Year 7, you are ready to act, and the world is ready to reward you.\n\nThis year favours ambition, business, and the pursuit of material and professional goals. Opportunities for advancement, financial gain, and recognition are more available in a Year 8 than in almost any other year.\n\nWhat to watch: the pursuit of achievement at the expense of the people around you. Success without integrity is hollow. Build both.`,
  },
  9: {
    label: 'Year of Completion',
    text: `This is a Year 9 for you — a year of endings, completion, and the release of what has served its purpose. You are approaching the end of a nine-year cycle, and life is asking you to let go.\n\nThis is a year for finishing, closing, and clearing. Projects, relationships, habits, and identities that no longer fit are asking to be released. Trust the process of completion — it is making room for everything in your next cycle.\n\nWhat to watch: clinging to what is ending. The grace of a Year 9 is proportional to your willingness to release. Let go generously, and your Year 1 will arrive with extraordinary clarity.`,
  },
};


// ── Product catalogue ─────────────────────────────────────────
// amount_paise: price in Indian paise (₹1 = 100 paise).
// Currently set to 100 paise (₹1) for testing.
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


module.exports = {
  READINGS,
  LIFE_PATH,
  EXPRESSION,
  SOUL_URGE,
  PERSONALITY,
  MATURITY,
  PERSONAL_YEAR,
  PRODUCTS,
  VALID_GENDERS,
};