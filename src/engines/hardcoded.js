// ============================================================
//  src/engines/hardcoded.js
//  Returns interpretations as the 8-card JSON structure,
//  matching the shape returned by claude.js and openai.js.
//  No API calls — always works as the fallback engine.
// ============================================================

// ── Helper ────────────────────────────────────────────────────
function interp(table, number) {
  console.log(`[hardcoded] interp called — number: ${number}`);
  const entry = table[number];
  if (!entry) {
    console.log(`[hardcoded] interp — no entry found for number: ${number}`);
    return null;
  }
  return {
    number,
    label:  entry.label  || null,
    traits: entry.traits || [],
    text:   entry.text   || null,
  };
}

// ══════════════════════════════════════════════════════════════
//  BIRTH NUMBER (1–9)
// ══════════════════════════════════════════════════════════════
const READINGS = {
  1: { label: 'The Pioneer',     traits: ['Leader','Independent','Ambitious','Pioneering','Determined'],          text: `You carry the energy of new beginnings and self-reliance. Number 1 is the number of the pioneer — you are here to lead, to initiate, and to carve your own path where none existed before.\n\nYou think independently and trust your own instincts above all else. While others may seek consensus, you are comfortable standing alone when you know you are right. This strength is your greatest gift.\n\nYour challenge is learning to collaborate without feeling diminished. True leadership inspires rather than insists. Channel your ambition into vision, and others will follow naturally.` },
  2: { label: 'The Peacemaker',  traits: ['Diplomatic','Sensitive','Cooperative','Intuitive','Peacemaker'],       text: `You are the soul of sensitivity and connection. Number 2 governs partnerships, balance, and the quiet power of listening — the kind of power most people overlook.\n\nYou read rooms effortlessly. You sense what others feel before they say it. This intuition is a rare gift, and it draws people to you for comfort and counsel.\n\nYour journey is about learning to honour your own needs as deeply as you honour others'. Your peace cannot come only from keeping the peace around you. Find the still centre within, and you become unshakeable.` },
  3: { label: 'The Creator',     traits: ['Creative','Expressive','Joyful','Optimistic','Communicative'],         text: `You are a creative force — someone built to express, inspire, and bring light into the world. Number 3 is the number of the artist, the storyteller, and the eternal optimist.\n\nWords flow through you. Ideas arrive in bursts. People feel more alive around you, and this is not by accident — it is your nature and your purpose.\n\nYour challenge is focus. Scattered creativity produces sparks but not fire. Choose your canvas, commit to it fully, and watch what you are truly capable of building.` },
  4: { label: 'The Builder',     traits: ['Grounded','Disciplined','Reliable','Hardworking','Practical'],         text: `You are the builder. Number 4 carries the energy of structure, patience, and the kind of deep reliability that makes the world work. You do not just dream — you construct.\n\nWhere others see obstacles, you see a sequence of steps. You understand that lasting things take time, and you are willing to put in the work others walk away from.\n\nYour growth edge is flexibility. Rigidity can become a cage. The most enduring structures are those built with both strength and the wisdom to bend.` },
  5: { label: 'The Explorer',    traits: ['Adventurous','Free-spirited','Adaptable','Curious','Magnetic'],        text: `You are here to experience life fully — every texture, every direction, every possibility. Number 5 is the number of freedom, change, and the irresistible pull of what lies beyond the horizon.\n\nYou adapt faster than most. You thrive in change where others freeze. Your curiosity is magnetic — people follow you into the unknown simply because you make it look exciting.\n\nYour deepest challenge is stillness. Not all growth requires movement. Some of your most important discoveries will come in the quiet moments you allow yourself to simply be.` },
  6: { label: 'The Nurturer',    traits: ['Nurturing','Responsible','Compassionate','Harmonious','Devoted'],      text: `You carry the energy of love and responsibility. Number 6 is the caretaker of the numerology chart — you feel a deep calling to protect, nurture, and bring harmony wherever you go.\n\nYou take your relationships seriously. You show up. You remember. The people in your life are not just lucky to have you — they know it.\n\nYour lesson is boundaries. Love given from an empty well helps no one. You must learn that caring for yourself is not selfish — it is the very foundation that makes your love sustainable.` },
  7: { label: 'The Seeker',      traits: ['Analytical','Introspective','Spiritual','Perceptive','Independent'],   text: `You are a seeker. Number 7 is the number of depth, mystery, and the relentless pursuit of truth beneath the surface. You are not content with easy answers.\n\nYou observe more than you speak. You think in layers. Where others see what is in front of them, you sense what is hidden behind it — and you are usually right.\n\nYour challenge is trust. The analytical mind can become a wall against the world. Let your intuition and your intellect work together, and you will find the kind of understanding that changes lives — beginning with your own.` },
  8: { label: 'The Powerhouse',  traits: ['Powerful','Ambitious','Strategic','Authoritative','Resilient'],        text: `You are built for mastery. Number 8 carries the energy of power, authority, and the ability to manifest on a large scale. You understand systems, leverage, and what it takes to build something that lasts.\n\nYou are drawn to challenges that others find daunting. You measure your progress not against where you started, but against the full extent of what you are capable of.\n\nYour shadow is control. Power held too tightly becomes a burden. Learn to trust others with pieces of your vision — delegation is not weakness, it is how empires are built.` },
  9: { label: 'The Old Soul',    traits: ['Compassionate','Wise','Idealistic','Generous','Old Soul'],             text: `You carry the wisdom of completion. Number 9 is the number of the old soul — someone who has gathered lifetimes of experience and feels a deep responsibility to give back.\n\nYou see the humanity in every situation. You forgive more readily than most. You are drawn to causes larger than yourself, and when you find yours, you pursue it with quiet, unwavering devotion.\n\nYour challenge is release. You hold on — to people, to grief, to what should have been. Your greatest freedom will come the moment you learn that letting go is not loss. It is how you make room for everything that is still coming.` },
};

// ══════════════════════════════════════════════════════════════
//  LIFE PATH (1–9, 11, 22, 33)
// ══════════════════════════════════════════════════════════════
const LIFE_PATH = {
  1:  { label: 'The Independent Leader',   traits: ['Self-starter','Courageous','Original','Driven','Bold'],                          text: `Your Life Path is one of independence and initiation. You came here to forge your own way — not to follow a map, but to draw one. Every obstacle you face is secretly an invitation to discover how resourceful you really are.\n\nYou will find that life keeps pushing you into the front of the room, even when you are not sure you asked to be there. Trust that. You were designed to lead — not with force, but with the clarity of someone who simply knows which direction to walk.\n\nThe shadow of your path is isolation. The belief that you must do it all alone, or that asking for help is weakness. Your growth comes when you discover that the most powerful leaders are also the most open learners.` },
  2:  { label: 'The Harmoniser',           traits: ['Empathic','Collaborative','Patient','Perceptive','Devoted'],                     text: `Your Life Path is one of partnership and sensitivity. You are here to bring people together, to hold the space between opposing forces and find the thread of understanding that connects them.\n\nYou feel things deeply — more deeply than most around you realise. This is not a vulnerability; it is a form of intelligence. Your sensitivity allows you to perceive nuances others miss, and to offer comfort that goes directly to the root.\n\nYour growth edge is learning that harmony cannot always be maintained — and that sometimes the most loving thing you can do is allow conflict to surface, so it can be truly resolved.` },
  3:  { label: 'The Communicator',         traits: ['Expressive','Playful','Inspiring','Witty','Abundant'],                           text: `Your Life Path is one of expression and joy. You are here to create, to communicate, and to remind the world that beauty and laughter are not luxuries — they are essential.\n\nYou have a rare gift: you can take complex feelings and turn them into something others can hold. Whether through words, art, music, or presence, you translate the inner world into something shareable. This is a form of service.\n\nYour challenge is depth over breadth. The 3 can scatter its gifts across too many directions and wonder why nothing takes root. Commit to one expression fully, and it will multiply beyond anything you imagined.` },
  4:  { label: 'The Foundation Maker',     traits: ['Structured','Loyal','Methodical','Honest','Enduring'],                           text: `Your Life Path is one of building and dedication. You are here to create things that last — structures, systems, families, businesses — the kind of foundations that hold up long after you are gone.\n\nYou have an almost sacred relationship with effort. You understand that real things take real time, and you are willing to give it. In a world addicted to shortcuts, your commitment to quality is quietly radical.\n\nYour shadow is rigidity. When the plan stops working, the 4 sometimes doubles down instead of adapting. Remember: the strongest structures have room to move. Flexibility is not failure — it is engineering.` },
  5:  { label: 'The Freedom Seeker',       traits: ['Dynamic','Versatile','Fearless','Sensory','Progressive'],                        text: `Your Life Path is one of freedom and transformation. You are here to experience the full spectrum of what it means to be alive — and then to bring those experiences back as wisdom for others.\n\nYou are at your best when you are moving, learning, and adapting. Change is not something that happens to you; it is something you carry with you wherever you go. You make the unfamiliar feel safe for everyone around you.\n\nYour deepest lesson is that true freedom is not the absence of commitment — it is choosing what you are committed to. The 5 who learns to channel its energy into focused adventures becomes unstoppable.` },
  6:  { label: 'The Caretaker',            traits: ['Loving','Protective','Idealistic','Harmonious','Responsible'],                   text: `Your Life Path is one of love and service. You are here to create beauty, to heal rifts, and to be the person others instinctively turn to when the world feels too heavy.\n\nYou have an extraordinary capacity for love — not just romantic love, but the kind that shows up with a meal, remembers the hard anniversary, and stays when everyone else leaves. This is your gift and your calling.\n\nYour lesson is that love cannot be given from a place of compulsion or fear. The 6 who learns to give freely — without tallying what they are owed in return — discovers that their love is, in fact, infinite.` },
  7:  { label: 'The Truth Seeker',         traits: ['Introspective','Analytical','Spiritual','Private','Deep'],                       text: `Your Life Path is one of wisdom and solitude. You are here to go beneath the surface — of ideas, of relationships, of yourself — and surface with understanding that others could not find without you.\n\nYou are most alive when you are learning something that genuinely surprises you, or sitting in silence with a question too big to rush. You have a natural relationship with mystery, and you are comfortable in places where others need certainty.\n\nYour challenge is the wall. The 7 who only analyses without trusting, only questions without surrendering, eventually becomes isolated in their own precision. Your wisdom only changes things when it is shared.` },
  8:  { label: 'The Manifestor',           traits: ['Ambitious','Authoritative','Executive','Abundant','Karmic'],                     text: `Your Life Path is one of power and abundance — material, spiritual, and karmic. You are here to master the physical world: to build, to lead, to accumulate wisdom about how power actually works.\n\nYou have an instinct for leverage. You understand that the right structure, applied at the right moment, can move enormous things. When this gift is aligned with integrity, what you build becomes legendary.\n\nThe shadow of the 8 path is the belief that more is always better. The 8 who is endlessly acquiring — money, status, control — is the 8 who has not yet met their own depth. Your greatest power is knowing when enough is enough.` },
  9:  { label: 'The Humanitarian',         traits: ['Selfless','Visionary','Compassionate','Philosophical','Universal'],              text: `Your Life Path is one of completion and giving. You are here in service — not to any one person or group, but to something larger. The 9 is the number that holds all the others inside it, and you feel that responsibility in your bones.\n\nYou are moved by injustice. You carry other people's pain as if it were your own. This is not a burden — it is the specific shape of your purpose. You are designed to feel broadly so you can act widely.\n\nYour lesson is release. The 9 path asks you to hold loosely: to love without possessing, to give without needing the credit, to let endings happen so beginnings can arrive. Everything you release makes room for more.` },
  11: { label: 'The Inspired Messenger',   traits: ['Visionary','Intuitive','Illuminating','Sensitive','Idealistic'],                 text: `You walk the Master Number 11 path — one of the most spiritually charged journeys in numerology. You are here as a channel: a bridge between the invisible world of intuition and the visible world of human experience.\n\nYou have always sensed that you are meant for something significant, even if you could not name it. This is accurate. The 11 is not designed for ordinary output — you are designed to inspire, to elevate, to crack open the ordinary and show what shimmers beneath.\n\nYour greatest challenge is also your greatest gift: extreme sensitivity. The same permeability that allows you to channel higher insight also makes the noise of the world genuinely painful. Your work is to find how to stay open without being overwhelmed.` },
  22: { label: 'The Master Builder',       traits: ['Visionary','Disciplined','Practical','Powerful','Transformative'],               text: `You walk the Master Number 22 path — the path of the Master Builder. You are here to turn the most ambitious visions into concrete reality. Not just personal success: structures that transform how people live.\n\nYou contain multitudes. The idealism of the 11 and the discipline of the 4 live inside you simultaneously, and when they work in concert, there is almost nothing you cannot build. Institutions, movements, technologies, families — all can carry your imprint.\n\nYour challenge is the weight of your own potential. The 22 who has not yet stepped into their power can feel its pressure as anxiety, procrastination, or a fear of failing something important. Begin. The vision clarifies in motion.` },
  33: { label: 'The Master Teacher',       traits: ['Selfless','Compassionate','Nurturing','Uplifting','Transcendent'],               text: `You walk the Master Number 33 path — the rarest and most selfless of all life paths. You are here to embody unconditional love at a scale that touches communities, not just individuals.\n\nThe 33 carries a calling so large that it rarely fully arrives until mid-life or later. Until then, you may feel a persistent sense of not-yet, of a purpose just out of reach. This is not failure. This is preparation.\n\nYour work is love in its fullest expression: not sentiment, but commitment. Not softness, but the fierce, unwavering presence of someone who will not abandon another person in their darkness. The world needs this. And you were made for it.` },
};

// ══════════════════════════════════════════════════════════════
//  EXPRESSION (1–9, 11, 22, 33)
// ══════════════════════════════════════════════════════════════
const EXPRESSION = {
  1:  { label: 'The Natural Leader',        traits: ['Original','Assertive','Initiative','Independent','Pioneering'],                  text: `Your Expression number reveals you were born with the gifts of originality and initiative. You have a natural authority that others feel before you have even spoken — a quiet certainty that tells people this person knows where they are going.\n\nYour talents are strongest in fields where you can own the outcome: entrepreneurship, leadership, creative direction, or any domain where your individual vision can be expressed without being diluted by committee.\n\nYour growth lies in learning that your originality is most powerful when it invites others in rather than leaving them behind. The best leaders create other leaders.` },
  2:  { label: 'The Collaborator',          traits: ['Mediating','Supportive','Detail-oriented','Tactful','Intuitive'],               text: `Your Expression number reveals gifts of diplomacy and perception. You were born with an almost uncanny ability to sense what others need and to hold space for multiple perspectives simultaneously.\n\nYou excel in roles that require tact, cooperation, and careful attention to the human element: counselling, partnerships, support roles, teaching, or any work that requires building bridges between people or ideas.\n\nYour growth is in recognising that your contributions are not smaller for being quiet. The person who holds the team together is as essential as the one who leads it.` },
  3:  { label: 'The Expressive Artist',     traits: ['Creative','Charismatic','Verbal','Optimistic','Social'],                        text: `Your Expression number reveals extraordinary gifts of communication and creativity. You carry a natural eloquence — words, images, and ideas flow through you in ways that engage and uplift others.\n\nYou were designed to work with people and for people: writing, speaking, performing, designing, teaching — any domain where your creative intelligence and warmth can be fully expressed is your natural territory.\n\nYour growth is in anchoring your gifts to a sustained focus. The most brilliant creative minds in history were not those with the most ideas, but those who chose one idea and went all the way into it.` },
  4:  { label: 'The Systems Builder',       traits: ['Precise','Organised','Reliable','Logical','Enduring'],                          text: `Your Expression number reveals gifts of precision, organisation, and follow-through. You have a rare capacity for turning vision into plan, and plan into reality. You build things that do not fall apart.\n\nYou excel in fields that require structure, reliability, and long-term thinking: engineering, architecture, finance, project management, or any work that demands the kind of meticulous commitment most people struggle to sustain.\n\nYour growth is in allowing yourself to dream a little bigger than the plan allows. The greatest builders in history were not just precise — they were also bold.` },
  5:  { label: 'The Versatile Communicator',traits: ['Adaptive','Persuasive','Dynamic','Multi-talented','Progressive'],               text: `Your Expression number reveals gifts of adaptability and persuasion. You have an innate ability to meet people where they are, to absorb new information quickly, and to communicate across very different audiences with equal ease.\n\nYou are built for variety: sales, marketing, journalism, travel, politics, education, or any field where the ability to shift, persuade, and connect is prized above consistency.\n\nYour growth is in depth. The 5 Expression who adds genuine expertise to their natural versatility becomes not just interesting, but irreplaceable.` },
  6:  { label: 'The Devoted Healer',        traits: ['Caring','Responsible','Aesthetic','Healing','Community'],                       text: `Your Expression number reveals gifts of nurturing, healing, and the creation of beauty. You have an instinct for what people need to feel safe and cared for, and an aesthetic sensibility that brings order and warmth to any environment.\n\nYou thrive in service-oriented fields: medicine, counselling, interior design, social work, teaching, community leadership — any role where your love is the engine.\n\nYour growth is in recognising that your own wellbeing is part of the service you offer. A healer who neglects themselves cannot heal others. Your self-care is not indulgent — it is professional.` },
  7:  { label: 'The Analytical Mystic',     traits: ['Investigative','Scholarly','Discerning','Refined','Independent'],               text: `Your Expression number reveals gifts of deep analysis and quiet wisdom. You were born with an unusual combination: the precision of the scientist and the perception of the mystic. You see patterns others miss and connections others cannot make.\n\nYou excel in research, philosophy, psychology, technology, or spiritual study — any field where the reward is not external approval but the private thrill of genuine understanding.\n\nYour growth is in sharing what you find. Knowledge kept only to yourself is potential unrealised. The world is waiting for what you have discovered in your solitude.` },
  8:  { label: 'The Executive',             traits: ['Authoritative','Strategic','Business-minded','Efficient','Resilient'],           text: `Your Expression number reveals gifts of executive power and strategic intelligence. You were born understanding leverage — how systems work, where value is created, and how to position for maximum impact.\n\nYou are built for leadership at scale: business, finance, law, real estate, or any domain where your ability to think big and execute precisely can be fully deployed.\n\nYour growth is in the human dimension of power. The most enduring legacies are built not just on strategy, but on the loyalty of people who were genuinely developed and seen by their leaders.` },
  9:  { label: 'The Wise Counsellor',       traits: ['Humanitarian','Artistic','Philosophical','Tolerant','Universal'],               text: `Your Expression number reveals gifts of wisdom, compassion, and universal perspective. You were born with an instinctive understanding of the human condition — its pain, its beauty, and its potential — and a deep desire to serve it.\n\nYou are drawn to work that transcends the personal: the arts, education, humanitarian work, philosophy, or spirituality — anywhere you can use your gifts not just for yourself, but for something that outlasts you.\n\nYour growth is in allowing yourself to receive as generously as you give. The 9 Expression who learns to be served without guilt discovers that love is not finite — it only grows when it flows in both directions.` },
  11: { label: 'The Intuitive Visionary',   traits: ['Inspirational','Prophetic','Spiritual','Creative','Illuminating'],              text: `Your Expression Master Number 11 reveals gifts that operate on a higher frequency than most. You carry an unusual combination of creative brilliance and spiritual sensitivity — an inner antenna that receives signals others cannot.\n\nYou are here to inspire at a large scale: through art, teaching, spiritual leadership, or any creative work that opens people's hearts and expands their sense of what is possible.\n\nThe gift and the challenge are the same: living with heightened sensitivity in a world that is often too loud. Learn to regulate your environment, and your capacity to inspire becomes unlimited.` },
  22: { label: 'The Visionary Builder',     traits: ['Practical Idealist','Architect','Large-scale','Grounded','Transformative'],     text: `Your Expression Master Number 22 reveals the rarest of gifts: the ability to hold a vast vision and build it into something real. You combine the big-picture thinking of a visionary with the practical discipline of a master builder.\n\nYou are here to create things that change how people live — institutions, systems, technologies, or communities that carry your blueprint long after you are gone.\n\nThe scale of your gifts can feel like pressure. Begin with what is in front of you. Every great structure starts with a single, carefully placed stone.` },
  33: { label: 'The Selfless Teacher',      traits: ['Unconditional','Teaching','Healing','Community','Inspiring'],                   text: `Your Expression Master Number 33 reveals a calling to teach, heal, and love at a scale that transcends the personal. You were born with gifts of compassion so deep and wide that they are meant to serve whole communities, not just individuals.\n\nYour talents shine brightest in teaching, healing, creative service, or any work where your love is the curriculum and your presence is the lesson.\n\nRemember that your gifts develop slowly, by design. Do not measure yourself against others' timelines. The 33 ripens in depth, not speed.` },
};

// ══════════════════════════════════════════════════════════════
//  SOUL URGE (1–9)
// ══════════════════════════════════════════════════════════════
const SOUL_URGE = {
  1: { label: 'Craves Autonomy',        traits: ['Self-directed','Proud','Achievement-driven','Independent','Assertive'],          text: `At your core, you crave independence and the freedom to do things your way. Your soul is most at peace when you are the author of your own story — when no one is waiting to approve your next move.\n\nYou are driven by a deep need to achieve something that is entirely yours. Not to prove yourself to others, but to satisfy a private inner standard that you set higher than anyone else would dare.\n\nWhat brings you joy is leading — whether a team, a project, or your own life. What drains you is feeling dependent, overlooked, or constrained by others' limitations.` },
  2: { label: 'Craves Connection',      traits: ['Relationally-driven','Harmonious','Loyal','Sensitive','Unifying'],              text: `At your core, you crave deep connection and mutual understanding. Your soul is nourished by relationships that feel genuinely reciprocal — where you are truly seen, and where the people you love feel truly held.\n\nYou are motivated by harmony. Not the shallow kind that comes from avoiding conflict, but the deep kind that comes from two people truly hearing each other. This is what you are always reaching for.\n\nWhat brings you joy is belonging. What drains you is feeling alone in a crowd, or loving someone who cannot quite meet you where you are.` },
  3: { label: 'Craves Expression',      traits: ['Self-expressive','Playful','Inspired','Joyful','Creative'],                     text: `At your core, you crave expression and the joy of creation. Your soul is not content to simply receive the world — it needs to respond to it, shape it, add something to it that was not there before.\n\nYou are most alive when you are making something: a piece of writing, a conversation that sparks, a room that feels beautiful, a laugh that breaks tension. The medium matters less than the act of creating.\n\nWhat brings you joy is creative freedom. What drains you is silence when you want to speak, or a life so scheduled that spontaneity becomes impossible.` },
  4: { label: 'Craves Security',        traits: ['Stability-seeking','Grounded','Principled','Loyal','Order-loving'],             text: `At your core, you crave security and solid ground. Your soul is not asking for luxury — it is asking for stability: a home that feels safe, work that means something, relationships built on genuine trust.\n\nYou are motivated by the desire to build something real. Not a performance of success, but the actual thing: a business that works, a family that holds together, a reputation earned through consistent integrity.\n\nWhat brings you joy is the feeling of things in their right place. What drains you is chaos, broken commitments, and environments that shift without warning.` },
  5: { label: 'Craves Freedom',         traits: ['Experience-driven','Restless','Curious','Sensory','Spontaneous'],               text: `At your core, you crave freedom and the thrill of the new. Your soul is not built for sameness — it needs variety, movement, sensation, and the feeling of a horizon that keeps expanding.\n\nYou are motivated by experience itself. You want to have lived, not just to have existed. You want stories worth telling, and a life that surprises you.\n\nWhat brings you joy is discovery — new places, new ideas, new people who see the world differently than you do. What drains you is routine without meaning, or a life that stopped asking questions.` },
  6: { label: 'Craves Harmony & Love',  traits: ['Love-driven','Family-oriented','Aesthetic','Protective','Devoted'],             text: `At your core, you crave love — not just romantic love, but the full, rich experience of belonging and being needed. Your soul is most at peace when the people you love are well, and when the spaces you inhabit feel warm and harmonious.\n\nYou are motivated by devotion. You want to be the person others can count on, the steady presence in a shifting world. This is not weakness — it is one of the rarest forms of strength.\n\nWhat brings you joy is a home that feels like a sanctuary, and relationships that feel like a safe harbour. What drains you is discord you cannot resolve, or love that goes unacknowledged.` },
  7: { label: 'Craves Understanding',   traits: ['Truth-seeking','Solitude-loving','Philosophical','Introspective','Perfectionistic'], text: `At your core, you crave understanding — not information, but genuine insight. Your soul is not satisfied with knowing what; it needs to know why, and then the why behind the why.\n\nYou are motivated by the pursuit of truth. You want to understand how things actually work, what people really mean, what lies beneath the surface of every experience and every relationship.\n\nWhat brings you joy is the private thrill of an idea finally clicking into place, or a conversation that goes somewhere neither person expected. What drains you is noise, pretence, and the exhausting performance of small talk.` },
  8: { label: 'Craves Achievement',     traits: ['Power-driven','Success-oriented','Material','Ambitious','Legacy-focused'],       text: `At your core, you crave achievement and the tangible evidence of your own power. Your soul is most alive when it is working toward something significant — when the goal is worthy of your full capacity.\n\nYou are motivated by impact. Not just comfort, but consequence — the knowledge that what you build matters, that you changed something in the world by being in it.\n\nWhat brings you joy is mastery: the moment when years of effort produce undeniable results. What drains you is mediocrity — especially your own.` },
  9: { label: 'Craves Purpose',         traits: ['Purpose-driven','Compassionate','Generous','Universal','Selfless'],             text: `At your core, you crave meaning — not just personal fulfilment, but the deep satisfaction of knowing that your life served something beyond itself. Your soul is not content with private success; it wants to contribute.\n\nYou are motivated by compassion. You feel the weight of suffering that is not your own. You want to use whatever gifts you have to alleviate it.\n\nWhat brings you joy is the moment your work touches someone genuinely — not applause, but the quiet recognition that something you gave mattered. What drains you is a life that feels small, or a world that seems indifferent.` },
};

// ══════════════════════════════════════════════════════════════
//  PERSONALITY (1–9)
// ══════════════════════════════════════════════════════════════
const PERSONALITY = {
  1: { label: 'Appears Confident & Decisive',   traits: ['Authoritative','Self-assured','Direct','Bold','Commanding'],        text: `To the outside world, you appear confident, decisive, and quietly in charge. People sense that you have already thought through the situation before they have finished explaining it — and they find this reassuring.\n\nYour presence communicates competence. You rarely appear flustered. Even in unfamiliar situations, you project the kind of calm that others interpret as experience.\n\nThe impression you make can sometimes feel intimidating to those who are less certain of themselves. When you remember to soften your edges with warmth, your natural authority becomes magnetic rather than just commanding.` },
  2: { label: 'Appears Warm & Approachable',    traits: ['Gentle','Diplomatic','Considerate','Attentive','Refined'],          text: `To the outside world, you appear warm, considerate, and genuinely interested in other people. You have a gift for making others feel noticed — a nod, a question, a moment of real attention that says: I see you.\n\nPeople trust you quickly because you do not seem to be performing. Your warmth appears effortless because, for you, it largely is.\n\nThe impression you make can sometimes cause others to underestimate your strength or depth. The gentleness they see is real, but it is not the whole picture. Let people discover your steel when the moment calls for it.` },
  3: { label: 'Appears Vibrant & Engaging',     traits: ['Charming','Expressive','Witty','Animated','Magnetic'],             text: `To the outside world, you appear vibrant, expressive, and genuinely enjoyable to be around. People brighten in your presence — not because you perform, but because your natural energy is contagious.\n\nYou have a gift for conversation: you know how to draw people out, how to make the ordinary feel interesting, and how to find humour in places others would not think to look.\n\nThe impression you make is overwhelmingly positive, but it can create an expectation that you are always "on." Give yourself permission to be quiet sometimes. The people who matter will not confuse your still moments with absence.` },
  4: { label: 'Appears Steady & Reliable',      traits: ['Trustworthy','Calm','Solid','Professional','No-nonsense'],          text: `To the outside world, you appear steady, competent, and dependable — the kind of person others instinctively call when they need the job done. You do not broadcast your capabilities; you demonstrate them.\n\nYour manner is grounded and direct. You waste little, say what you mean, and follow through on what you promise. In a world full of people who overcommit and underdeliver, this sets you apart.\n\nThe impression you make can sometimes feel cooler than you intend. Warmth and precision can coexist. When you show people the care behind your competence, they stop just trusting you — they become loyal to you.` },
  5: { label: 'Appears Dynamic & Interesting',  traits: ['Energetic','Unpredictable','Adventurous','Quick-witted','Stimulating'], text: `To the outside world, you appear dynamic, interesting, and impossible to fully predict — which makes you interesting to watch, and even more interesting to know.\n\nYou move through social situations with a lightness that others find refreshing. You are equally at ease in a boardroom and at a street market — your adaptability reads as confidence, and people respond to it.\n\nThe impression you make is energising, but it can also feel temporary. People wonder if you will stay, if this is real, if you are as present as you appear. Showing your depth — not just your range — is what converts admiration into trust.` },
  6: { label: 'Appears Warm & Caring',          traits: ['Nurturing','Responsible','Beautiful','Trustworthy','Comforting'],   text: `To the outside world, you appear warm, caring, and genuinely invested in the people around you. People sense that you mean it — that your interest is not social performance but actual attention.\n\nYou often come across as slightly more put-together than everyone else in the room — not because you try harder, but because your aesthetic sensibility extends to how you present yourself to the world.\n\nThe impression you make can attract people who need more than you have to give. Learning to be warm and boundaried simultaneously is your ongoing social refinement — and when you manage it, you become someone others admire not just for your care, but for your wisdom.` },
  7: { label: 'Appears Mysterious & Refined',   traits: ['Private','Observant','Intelligent','Aloof','Intriguing'],           text: `To the outside world, you appear intelligent, private, and slightly unknowable — which creates a quiet intrigue that draws others toward you even as you hold yourself at a slight remove.\n\nYou observe far more than you reveal. People often feel that you have already assessed the situation before they have finished explaining it — and they are usually right.\n\nThe impression you make can feel cool or distant to those who do not know you well. When you decide to let someone in — even a little — the effect is powerful. The contrast between your usual reserve and your moments of openness is one of your most compelling qualities.` },
  8: { label: 'Appears Powerful & Capable',     traits: ['Executive','Confident','Polished','Authoritative','Efficient'],     text: `To the outside world, you appear powerful, competent, and someone worth paying attention to. You carry yourself with a quiet authority that communicates: I have thought this through, and I am not guessing.\n\nYou dress and present yourself in ways that project success — not because you are performing, but because your standards extend naturally into your appearance and environment.\n\nThe impression you make opens doors that others find closed. The challenge is ensuring that what is behind the door matches what is on the front of it — not because you lack substance, but because your exterior is so polished that people hold you to the very highest standard.` },
  9: { label: 'Appears Compassionate & Wise',   traits: ['Noble','Generous','Empathic','Broad-minded','Gracious'],            text: `To the outside world, you appear compassionate, broad-minded, and possessed of a gentle wisdom that feels rare. People often feel, in your company, that they are being seen more generously than they see themselves.\n\nYou carry yourself with a quiet grace that is not studied or performed — it comes from genuinely not needing to compete. You are already where you are, and that settledness is visible.\n\nThe impression you make inspires trust and opens hearts. The challenge is that people sometimes mistake your acceptance for agreement, or your gentleness for a lack of convictions. When the moment calls for it, do not hesitate to let your depth show.` },
};

// ══════════════════════════════════════════════════════════════
//  MATURITY (1–9)
// ══════════════════════════════════════════════════════════════
const MATURITY = {
  1: { label: 'Maturing into Sovereignty', text: `As you move through the second half of your life, you will feel an increasing pull toward independence and self-determination. The approval of others will matter less; your own clear sense of direction will matter more.\n\nThis is not selfishness — it is the natural result of a life spent learning who you actually are. In your mature years, you will find the courage to build something that is entirely, unapologetically yours.` },
  2: { label: 'Maturing into Partnership', text: `As you grow into your maturity, your relationships will become the central and most rewarding theme of your life. Partnerships — romantic, professional, and creative — will be where your greatest growth and satisfaction live.\n\nYou will find that the older you get, the more you value depth over breadth, presence over productivity, and genuine connection over impressive achievement. This wisdom, when embraced, transforms everything.` },
  3: { label: 'Maturing into Expression',  text: `As you grow into your maturity, your creative and communicative gifts will deepen and find their truest form. The scattered creativity of your earlier years will focus into something more precise and more powerful.\n\nIn the second half of your life, you may feel called to share what you know — to teach, to write, to create in ways that leave something behind. This impulse is worth following fully.` },
  4: { label: 'Maturing into Mastery',     text: `As you grow into your maturity, you will find deep satisfaction in mastery and the tangible results of sustained effort. The structures you have spent a lifetime building — in work, in family, in character — will begin to show their durability.\n\nThe second half of your life rewards your patience. What you built slowly, carefully, and without shortcuts will outlast the quick constructions of others. This is your vindication and your legacy.` },
  5: { label: 'Maturing into Freedom',     text: `As you grow into your maturity, your relationship with freedom will evolve. The restless seeking of your earlier years will soften into something more deliberate — a freedom chosen, rather than chased.\n\nIn the second half of your life, you may find that you have all the adventure you need in the depth of a single day, a single place, a single relationship fully explored. This is not limitation — it is the freedom of the person who no longer needs to run to feel free.` },
  6: { label: 'Maturing into Love',        text: `As you grow into your maturity, love in its fullest expression will become your primary domain. Your relationships, your home, your community — these will be where you find your deepest meaning and your greatest joy.\n\nThe second half of your life asks you to give love without condition and to receive it without guilt. When you master this balance, you become one of the rarest things in the world: a person in whose presence others feel genuinely at home.` },
  7: { label: 'Maturing into Wisdom',      text: `As you grow into your maturity, the searching quality of your earlier years will deepen into wisdom. The questions you have been asking your whole life will begin to reveal their answers — not all at once, but in a steady accumulation of clarity.\n\nThe second half of your life is when your inner life becomes your greatest resource. The depth you have cultivated in solitude becomes the very quality that makes you valuable to others who are still searching.` },
  8: { label: 'Maturing into Power',       text: `As you grow into your maturity, your relationship with power, abundance, and achievement will come into its fullest and most integrated expression. What you were always capable of will finally have the platform it deserves.\n\nThe second half of your life is when your accumulated wisdom about how the world actually works becomes your greatest asset. Use it not just to build for yourself, but to build for others. This is where your legacy is made.` },
  9: { label: 'Maturing into Service',     text: `As you grow into your maturity, your sense of universal compassion and service will deepen into your primary mode of being. The personal ambitions of your earlier years will give way to something larger and more generous.\n\nThe second half of your life is when your gifts become the most freely given — not because you expect less in return, but because you no longer need the return. This is the mature expression of a life well-lived: giving from fullness, not from need.` },
};

// ══════════════════════════════════════════════════════════════
//  PERSONAL YEAR (1–9)
// ══════════════════════════════════════════════════════════════
const PERSONAL_YEAR = {
  1: { label: 'Year of New Beginnings',  text: `This is a Year 1 for you — a year of new beginnings, fresh starts, and the planting of seeds that will grow for the next nine years. The slate has been cleared. What you initiate now carries unusual momentum.\n\nThis year favours courage. Begin the project, launch the idea, move toward the thing you have been circling. The energy of a Year 1 rewards action and punishes hesitation.\n\nWhat to watch: the temptation to wait until everything is perfect. It never is. Begin anyway.` },
  2: { label: 'Year of Partnership',     text: `This is a Year 2 for you — a year of relationships, patience, and the quiet work of building trust. After the action-oriented Year 1, this year asks you to slow down and tend to the connections that matter.\n\nCollaboration is favoured. Partnerships — personal and professional — that you invest in now will prove their value over the years ahead. Listen more than you speak. Pay attention to what others need.\n\nWhat to watch: frustration at the slower pace. Year 2 is not passive — it is the deep work of laying relational foundations that Year 1's seeds need to grow.` },
  3: { label: 'Year of Expression',      text: `This is a Year 3 for you — a year of creativity, social expansion, and the joy of expressing who you are. After two years of beginning and building, this year opens a more playful, abundant chapter.\n\nThis is a year to socialise, create, communicate, and enjoy. Opportunities will come through people — new connections, creative collaborations, conversations that change direction. Say yes more than you say no.\n\nWhat to watch: scattered energy. The abundance of a Year 3 can lead to overcommitment. Enjoy the expansion while keeping a few important projects at the centre.` },
  4: { label: 'Year of Building',        text: `This is a Year 4 for you — a year of hard work, structure, and the satisfaction of building something real. The playfulness of last year gives way to something more focused and more demanding.\n\nThis is not a year for shortcuts. It rewards discipline, organisation, and the willingness to do the unglamorous work that real results require. What you build with integrity this year will last.\n\nWhat to watch: rigidity and overwork. Building is important, but so is rest. The structures that last are built by people who know when to stop and recover.` },
  5: { label: 'Year of Change',          text: `This is a Year 5 for you — a year of change, freedom, and unexpected developments. After the disciplined work of Year 4, life is ready to move, and it will — whether or not you have planned for it.\n\nThis year favours flexibility and a willingness to let the unexpected in. Travel, new opportunities, and significant shifts are all more likely in a Year 5. Embrace the instability. It is carrying you somewhere important.\n\nWhat to watch: recklessness. The energy of freedom is real, but not all changes are improvements. Choose your risks consciously.` },
  6: { label: 'Year of Responsibility',  text: `This is a Year 6 for you — a year centred on home, relationships, family, and responsibility. After the upheavals of Year 5, life is asking you to settle, to nurture, and to attend to what genuinely matters to you.\n\nThis year brings relationship themes to the foreground — whether deepening commitments, resolving long-standing tensions, or reimagining what home and family mean to you. Love is both the theme and the reward.\n\nWhat to watch: over-giving. Year 6 attracts those who need your care. Give freely, but not at the expense of your own health and happiness.` },
  7: { label: 'Year of Reflection',      text: `This is a Year 7 for you — a year of inner work, reflection, and the kind of deep self-understanding that only comes from genuine solitude. After the relational intensity of Year 6, life is offering you space.\n\nThis is not a year for aggressive external expansion. It is a year for reading, thinking, learning, and attending to the inner world that your outer life runs on. The insights you gain this year will shape your actions for years to come.\n\nWhat to watch: isolation and withdrawal. Reflection is good; retreat from life is not. Stay present to the people who matter, even as you go deep.` },
  8: { label: 'Year of Achievement',     text: `This is a Year 8 for you — a year of achievement, financial focus, and the tangible results of your accumulated effort. After the inner work of Year 7, you are ready to act, and the world is ready to reward you.\n\nThis year favours ambition, business, and the pursuit of material and professional goals. Opportunities for advancement, financial gain, and recognition are more available in a Year 8 than in almost any other year.\n\nWhat to watch: the pursuit of achievement at the expense of the people around you. Success without integrity is hollow. Build both.` },
  9: { label: 'Year of Completion',      text: `This is a Year 9 for you — a year of endings, completion, and the release of what has served its purpose. You are approaching the end of a nine-year cycle, and life is asking you to let go.\n\nThis is a year for finishing, closing, and clearing. Projects, relationships, habits, and identities that no longer fit are asking to be released. Trust the process of completion — it is making room for everything in your next cycle.\n\nWhat to watch: clinging to what is ending. The grace of a Year 9 is proportional to your willingness to release. Let go generously, and your Year 1 will arrive with extraordinary clarity.` },
};

// ══════════════════════════════════════════════════════════════
//  PLANES OF EXPRESSION
//  Describes dominant plane tendencies
// ══════════════════════════════════════════════════════════════
const PLANE_DOMINANT = {
  Mental:    `Your chart shows a strong Mental plane — you lead with your intellect. You process the world through analysis, ideas, and logic, and your best decisions come after careful, systematic thinking. The risk is over-analysis: living so much in the mind that you delay action or disconnect from your emotions.`,
  Physical:  `Your chart shows a strong Physical plane — you lead with action and practicality. You are at your best when building, doing, and producing tangible results. You trust what you can touch and measure, and others trust you because you deliver. The risk is neglecting the inner world; results without reflection can lead you in the wrong direction.`,
  Emotional: `Your chart shows a strong Emotional plane — you lead with feeling. Your empathy and sensitivity are your greatest assets; you understand people and situations at a depth others miss entirely. The risk is making decisions from the heart when the situation also calls for the head.`,
  Intuitive: `Your chart shows a strong Intuitive plane — you lead with inner knowing. You sense things before they happen, read between lines that others cannot see, and navigate by a compass that defies rational explanation. The risk is difficulty communicating your insight to others who need logical explanation before they can trust a direction.`,
};

const PLANE_WEAKEST = {
  Mental:    `Your least active plane is the Mental — a reminder to slow down and think before acting. When logic and analysis feel like obstacles, that is precisely when they are most needed.`,
  Physical:  `Your least active plane is the Physical — a reminder that ideas must eventually become actions. Inspiration unrealised is just a dream. The world responds to what you build, not only what you feel or think.`,
  Emotional: `Your least active plane is the Emotional — a reminder to check in with how you and others feel, not just what you or they think. The most precise decisions still carry human consequences.`,
  Intuitive: `Your least active plane is the Intuitive — a reminder to pause and listen to the quiet signal beneath the noise. Not everything worth knowing can be found by analysis or effort alone.`,
};

// ══════════════════════════════════════════════════════════════
//  KARMIC DEBT
// ══════════════════════════════════════════════════════════════
const KARMIC_DEBT = {
  13: `The karmic debt of 13 tends to suggest a soul that may have avoided hard work or discipline in a previous cycle. In this life, it often manifests as a tendency to resist structure — until the moment you discover that mastery is not a prison but a liberation. Every time you complete something difficult, you are paying a debt forward with interest.`,
  14: `The karmic debt of 14 tends to suggest a soul that may have overindulged in freedom or abused personal liberty in a previous cycle. In this life, the invitation is to embrace responsible freedom — to discover that the deepest adventures are taken by those who have also learned restraint.`,
  16: `The karmic debt of 16 tends to suggest a soul carrying themes of ego and the fall of pride. In this life, your most profound growth often arrives through humbling experiences — not as punishment, but as the universe ensuring that your considerable gifts are built on a foundation of genuine wisdom rather than brittle certainty.`,
  19: `The karmic debt of 19 tends to suggest a soul that may have misused power or independence at the expense of others. In this life, the lesson is interdependence: discovering that true strength is not self-sufficiency alone, but the courage to need and be needed in return.`,
};

// ══════════════════════════════════════════════════════════════
//  HIDDEN PASSIONS
// ══════════════════════════════════════════════════════════════
const HIDDEN_PASSION_TEXT = {
  1: 'a drive for leadership and originality that runs deeper than most people around you realise',
  2: 'a hunger for genuine partnership and harmony that shapes every significant choice you make',
  3: 'a creative restlessness that never fully quiets — an insistence on expressing yourself that cannot be suppressed for long',
  4: 'a deep need to build things that last, and a private dissatisfaction with anything that is merely temporary',
  5: 'a hunger for experience and freedom that makes conventional paths feel like a slow erosion',
  6: 'a devotion to love and beauty so fundamental that it colours every relationship and every space you inhabit',
  7: 'a quiet obsession with truth and understanding that makes surface-level answers feel like an insult to your intelligence',
  8: 'an ambition for impact and mastery that rarely sleeps — and a deep private knowledge that you are capable of far more than your current situation reflects',
  9: 'a compassion so broad and deep that you sometimes feel it as a weight — a sense of responsibility to the whole human story, not just your chapter in it',
};

// ══════════════════════════════════════════════════════════════
//  MASTER NUMBER OPENER (for Card 1)
// ══════════════════════════════════════════════════════════════
const MASTER_NUMBER_OPENER = {
  11: `There is something rare in your chart that announces itself immediately: a Master Number 11. This is not ordinary numerology territory. The 11 appears in fewer than one in ten charts, and it marks a soul that carries both exceptional sensitivity and an unusual capacity to inspire others — often without fully understanding why people are drawn to them the way they are.`,
  22: `Your chart opens with something extraordinary: a Master Number 22 — the rarest of the master numbers, carried by those who are here not just to achieve, but to build things that outlast them. The 22 does not appear by accident. It marks a soul with both the vision to see what could be and the practical power to make it real.`,
  33: `Your chart carries the most selfless of the master numbers: 33. This number appears so rarely that many numerologists go their entire practice without seeing it in its pure form. It marks a soul whose calling is not personal success but something far larger — a life oriented toward love, teaching, and the healing of others at scale.`,
};

// ══════════════════════════════════════════════════════════════
//  BUILD 8-CARD RESPONSE
// ══════════════════════════════════════════════════════════════
function buildCards(profile) {
  console.log('[hardcoded] buildCards called with profile:', profile);

  const {
    name,
    birth_num,
    life_path_num,
    expression_num,
    soul_urge_num,
    personality_num,
    maturity_num,
    personal_year,
    master_number,
    master_numbers_found,
    karmic_debt_numbers,
    karmic_lessons,
    hidden_passions,
    plane_mental_count    = 0,
    plane_physical_count  = 0,
    plane_emotional_count = 0,
    plane_intuitive_count = 0,
    current_pinnacle,
    current_challenge,
    hook_description,
  } = profile;

  const firstName = (name || '').trim().split(/\s+/)[0] || 'friend';
  console.log(`[hardcoded] resolved firstName: "${firstName}"`);

  // Determine master numbers list
  const masterList = (() => {
    if (Array.isArray(master_numbers_found) && master_numbers_found.length)
      return master_numbers_found;
    if (master_number) return [master_number];
    return [];
  })();
  const hasMaster = masterList.length > 0;
  const primaryMaster = masterList[0] || null;
  console.log(`[hardcoded] masterList: ${JSON.stringify(masterList)}, hasMaster: ${hasMaster}, primaryMaster: ${primaryMaster}`);

  // Karmic debt
  const karmicDebtList = Array.isArray(karmic_debt_numbers) && karmic_debt_numbers.length
    ? karmic_debt_numbers : [];
  const hasKarmicDebt = karmicDebtList.length > 0;
  console.log(`[hardcoded] karmicDebtList: ${JSON.stringify(karmicDebtList)}, hasKarmicDebt: ${hasKarmicDebt}`);

  // Karmic lessons
  const karmicLessonsList = Array.isArray(karmic_lessons) && karmic_lessons.length
    ? karmic_lessons : [];
  console.log(`[hardcoded] karmicLessonsList: ${JSON.stringify(karmicLessonsList)}`);

  // Hidden passions
  const hiddenPassionsList = Array.isArray(hidden_passions) && hidden_passions.length
    ? hidden_passions : [];
  console.log(`[hardcoded] hiddenPassionsList: ${JSON.stringify(hiddenPassionsList)}`);

  // Planes
  const planeCounts = {
    Mental:    plane_mental_count,
    Physical:  plane_physical_count,
    Emotional: plane_emotional_count,
    Intuitive: plane_intuitive_count,
  };
  const sortedPlanes = Object.entries(planeCounts).sort((a, b) => b[1] - a[1]);
  const dominantPlane = sortedPlanes[0][0];
  const weakestPlane  = sortedPlanes[sortedPlanes.length - 1][0];
  console.log(`[hardcoded] planeCounts: ${JSON.stringify(planeCounts)}, dominantPlane: "${dominantPlane}", weakestPlane: "${weakestPlane}"`);

  // Lookup shorthand helpers
  const birth      = READINGS[birth_num]      || {};
  const lifePath   = LIFE_PATH[life_path_num] || {};
  const expression = EXPRESSION[expression_num] || {};
  const soulUrge   = SOUL_URGE[soul_urge_num]   || {};
  const personality= PERSONALITY[personality_num] || {};
  const maturity   = MATURITY[maturity_num]    || {};
  const personalYr = PERSONAL_YEAR[personal_year] || {};
  console.log(`[hardcoded] table lookups — birth_num: ${birth_num} (found: ${!!READINGS[birth_num]}), life_path_num: ${life_path_num} (found: ${!!LIFE_PATH[life_path_num]}), expression_num: ${expression_num} (found: ${!!EXPRESSION[expression_num]}), soul_urge_num: ${soul_urge_num} (found: ${!!SOUL_URGE[soul_urge_num]}), personality_num: ${personality_num} (found: ${!!PERSONALITY[personality_num]}), maturity_num: ${maturity_num} (found: ${!!MATURITY[maturity_num]}), personal_year: ${personal_year} (found: ${!!PERSONAL_YEAR[personal_year]})`);

  // ── CARD 1: Your Signature ───────────────────────────────────
  console.log('[hardcoded] building card 1');
  let card1Body = '';
  if (hasMaster && MASTER_NUMBER_OPENER[primaryMaster]) {
    card1Body = MASTER_NUMBER_OPENER[primaryMaster];
    card1Body += ` Combined with a Birth Number of ${birth_num} — ${birth.label || ''} — your chart carries an unusual tension between the ordinary and the extraordinary, between the self you show the world and the self that is still becoming.`;
    card1Body += ` The path ahead is not simple, but it is unmistakably yours.`;
  } else {
    const hookText = hook_description
      ? `Your chart opens with a distinct signature: ${hook_description}.`
      : `Your chart opens with a clarity that is immediately personal.`;
    card1Body = `${hookText} The combination of a ${birth.label || `Birth Number ${birth_num}`} and a ${lifePath.label || `Life Path ${life_path_num}`} tends to create someone who carries both ${(birth.traits || [])[0] || 'depth'} and ${(lifePath.traits || [])[0] || 'purpose'} as core operating energies — visible to those paying attention, but rarely fully named until now.`;
    card1Body += ` There is a particular quality in your chart that suggests you have always understood things slightly ahead of when you could explain them.`;
    card1Body += ` This reading is an attempt to give language to what you have long already known.`;
  }

  const card1 = {
    card_number: 1,
    title: `${firstName}'s Signature`,
    subtitle: hasMaster ? `A rare master number opens your chart` : `The pattern that makes you unmistakably you`,
    body: card1Body,
    accent_number: hasMaster ? String(primaryMaster) : String(birth_num),
    accent_label: hasMaster ? 'Master Number' : 'Birth Number',
  };

  // ── CARD 2: The Day You Were Born ────────────────────────────
  console.log('[hardcoded] building card 2');
  const card2Body = birth.text || `Your Birth Number ${birth_num} — ${birth.label || ''} — shapes the instinctive, unfiltered version of you that existed before the world had a chance to teach you otherwise. It is the energy you return to under pressure, and the gift you carry without effort.`;

  const card2 = {
    card_number: 2,
    title: 'The Day You Were Born',
    subtitle: `Birth Number ${birth_num} · ${birth.label || ''}`,
    body: card2Body,
    accent_number: String(birth_num),
    accent_label: 'Birth Number',
  };

  // ── CARD 3: Your Life's True Direction ───────────────────────
  console.log('[hardcoded] building card 3');
  const card3Body = lifePath.text || `Your Life Path ${life_path_num} — ${lifePath.label || ''} — is the overarching current beneath everything you do. It does not dictate your choices, but it shapes the kind of experiences that find you, and the kind of person you tend to become through them.`;

  const card3 = {
    card_number: 3,
    title: "Your Life's True Direction",
    subtitle: `Life Path ${life_path_num} · ${lifePath.label || ''}`,
    body: card3Body,
    accent_number: String(life_path_num),
    accent_label: 'Life Path',
  };

  // ── CARD 4: The Name You Were Given ──────────────────────────
  console.log('[hardcoded] building card 4');
  const exprText = expression.text || `Your Expression Number ${expression_num} reveals the talents and abilities encoded in your name — the gifts you carry into every room, often without realising you are deploying them.`;
  const soulText = soulUrge.text   || `Your Soul Urge ${soul_urge_num} reveals what you privately hunger for beneath all of that — the inner need that drives your choices whether or not you consciously acknowledge it.`;

  // Check for tension between expression and soul urge
  const tensionPairs = new Set([
    '1-2','2-1','1-9','9-1','3-4','4-3','5-4','4-5','7-3','3-7','8-2','2-8',
  ]);
  const tensionKey = `${expression_num}-${soul_urge_num}`;
  const hasTension = tensionPairs.has(tensionKey);
  console.log(`[hardcoded] tensionKey: "${tensionKey}", hasTension: ${hasTension}`);

  let card4Body = `${exprText.split('\n\n')[0]} Meanwhile, your Soul Urge ${soul_urge_num} — ${soulUrge.label || ''} — reveals a very different interior. ${soulText.split('\n\n')[0]}`;
  if (hasTension) {
    card4Body += ` The tension between your Expression ${expression_num} and your Soul Urge ${soul_urge_num} tends to create someone who presents one face to the world while quietly wanting something quite different — a gap that may feel familiar, and that your full blueprint explores in precise detail.`;
  } else {
    card4Body += ` In your case, what you show the world and what you privately crave tend to move in the same direction — which gives your actions an unusual coherence and authenticity that others find quietly magnetic.`;
  }

  const card4 = {
    card_number: 4,
    title: 'The Name You Were Given',
    subtitle: `Expression ${expression_num} meets Soul Urge ${soul_urge_num}`,
    body: card4Body,
    accent_number: String(expression_num),
    accent_label: 'Expression',
  };

  // ── CARD 5: How the World Sees You ───────────────────────────
  console.log('[hardcoded] building card 5');
  const card5Body = personality.text || `Your Personality Number ${personality_num} shapes the first impression you make before you have said a single word. It is the energy others feel when you walk into a room — the outer layer of self that the world encounters first.`;

  const card5 = {
    card_number: 5,
    title: 'How the World Sees You',
    subtitle: `Personality Number ${personality_num} · ${personality.label || ''}`,
    body: card5Body,
    accent_number: String(personality_num),
    accent_label: 'Personality',
  };

  // ── CARD 6: The Hidden Architecture ──────────────────────────
  console.log('[hardcoded] building card 6');
  const dominantText = PLANE_DOMINANT[dominantPlane] || `Your dominant plane is ${dominantPlane}, which shapes how you process and respond to the world.`;
  const weakestText  = PLANE_WEAKEST[weakestPlane]   || `Your least active plane is ${weakestPlane}, which may represent an area calling for more conscious attention.`;

  const card6Body = `${dominantText} ${weakestText} The balance — or imbalance — between your four planes of expression (Mental: ${planeCounts.Mental}, Physical: ${planeCounts.Physical}, Emotional: ${planeCounts.Emotional}, Intuitive: ${planeCounts.Intuitive}) tends to determine not just how you make decisions, but which kinds of problems you naturally solve and which ones quietly accumulate. Your full blueprint maps this in detail, including specific practices for developing your ${weakestPlane} plane.`;

  const card6 = {
    card_number: 6,
    title: 'The Hidden Architecture',
    subtitle: `Dominant: ${dominantPlane} · Developing: ${weakestPlane}`,
    body: card6Body,
    accent_number: null,
    accent_label: null,
  };

  // ── CARD 7: Shadows and Gifts ─────────────────────────────────
  console.log('[hardcoded] building card 7');
  let card7Body = '';
  let card7AccentNum = null;
  let card7AccentLabel = null;

  if (hasKarmicDebt) {
    const debtNum = karmicDebtList[0];
    const debtText = KARMIC_DEBT[debtNum] || `Your karmic debt of ${debtNum} carries a specific invitation to deep growth — a doorway, not a burden.`;
    console.log(`[hardcoded] card 7 — using karmic debt: ${debtNum}`);
    card7Body = debtText;
    card7AccentNum = String(debtNum);
    card7AccentLabel = 'Karmic Debt';
  } else if (karmicLessonsList.length > 0) {
    console.log(`[hardcoded] card 7 — using karmic lessons: ${JSON.stringify(karmicLessonsList)}`);
    card7Body = `Your chart shows karmic lessons in the areas of ${karmicLessonsList.join(', ')} — numbers that appear with less frequency in your name, suggesting energies that this lifetime tends to call you to develop rather than lean on naturally. These are not weaknesses; they are invitations.`;
  } else if (hiddenPassionsList.length > 0) {
    console.log(`[hardcoded] card 7 — using hidden passions: ${JSON.stringify(hiddenPassionsList)}`);
    const passionDesc = hiddenPassionsList
      .map(n => HIDDEN_PASSION_TEXT[n] || `a deep affinity with the energy of ${n}`)
      .join('; and ');
    card7Body = `Beneath the numbers your name and birth date declare openly, your chart carries hidden passions: ${passionDesc}. These are drives so fundamental they rarely surface as conscious goals — they simply shape every choice, whether or not you have ever named them.`;
  } else {
    console.log('[hardcoded] card 7 — using balanced distribution fallback');
    card7Body = `The deeper layers of your chart suggest a remarkably balanced distribution of energy — which carries its own particular quality. Balanced charts tend to produce people who are genuinely difficult to read: versatile, adaptive, and capable of moving through very different worlds with equal ease.`;
  }

  // Add timing hint
  card7Body += ` There are also timing dimensions in your chart — your current Pinnacle cycle, your Personal Year ${personal_year} energy (${personalYr.label || ''}), and the Challenge number that tends to characterise this chapter — that exist in your full blueprint and speak directly to where you are right now. These are not hinted at here; they are named precisely, with their specific implications for the next twelve to twenty-four months.`;

  const card7 = {
    card_number: 7,
    title: 'Shadows and Gifts',
    subtitle: hasKarmicDebt ? `Karmic debt as a doorway to depth` : `The deeper currents beneath the surface`,
    body: card7Body,
    accent_number: card7AccentNum,
    accent_label: card7AccentLabel,
  };

  // ── CARD 8: What Lies Beneath ─────────────────────────────────
  console.log('[hardcoded] building card 8');
  const maturityEntry = maturity;
  const card8Body = `This reading has traced the essential shape of your numerology — the numbers that define your nature, your path, your inner life, and the chapter you are currently moving through. But it has only traced the outline. Your Maturity Number ${maturity_num} — ${maturityEntry.label || ''} — describes who you are still in the process of becoming, particularly in the second half of your life, and it carries some of the most personally relevant insights in your entire chart. Your current Pinnacle cycle${current_pinnacle ? ` (${current_pinnacle})` : ''} speaks directly to the specific opportunities and tensions of this exact period of your life — and the bridge between your Soul Urge ${soul_urge_num} and your Life Path ${life_path_num} reveals an unresolved inner tension that tends to be the quiet engine behind your most significant choices. If any part of this reading has felt true, your full blueprint will feel like finally reading the book that was written about you.`;

  const card8 = {
    card_number: 8,
    title: 'What Lies Beneath',
    subtitle: `Your invitation to go deeper`,
    body: card8Body,
    accent_number: String(maturity_num),
    accent_label: 'Maturity Number',
  };

  // ── TRAITS (from birth + life path) ──────────────────────────
  const rawTraits = [
    ...(birth.traits    || []),
    ...(lifePath.traits || []),
  ];
  // Deduplicate and take first 5
  const traits = [...new Set(rawTraits)].slice(0, 5);
  console.log(`[hardcoded] resolved traits: ${JSON.stringify(traits)}`);

  // ── DOMINANT THEME ────────────────────────────────────────────
  const dominant_theme = `A ${birth.label || `Birth ${birth_num}`} walking the ${lifePath.label || `Life Path ${life_path_num}`} — ${hasMaster ? `charged with Master Number ${primaryMaster} energy` : `grounded in steady purpose`} — and shaped by a ${expression.label || `Expression ${expression_num}`} that meets the world with ${(expression.traits || [])[0] || 'depth'}.`;
  console.log(`[hardcoded] dominant_theme: "${dominant_theme}"`);

  // ── CTA ───────────────────────────────────────────────────────
  const cta = {
    headline: `${firstName}'s full blueprint goes far deeper than these 8 cards`,
    teaser_lines: [
      `What your Maturity Number ${maturity_num} reveals about who you are still becoming — and when that transformation tends to arrive`,
      `The precise meaning of your current Pinnacle cycle and what it suggests about the next 1–3 years of your life`,
      hasTension
        ? `Why the tension between your Expression ${expression_num} and Soul Urge ${soul_urge_num} may be the single most important dynamic in your most significant relationships`
        : `How the alignment of your Expression ${expression_num} and Soul Urge ${soul_urge_num} can be consciously amplified to accelerate what you are building`,
    ],
    button_text: 'Unlock My Full Blueprint',
  };

  const result = {
    first_name: firstName,
    cards: [card1, card2, card3, card4, card5, card6, card7, card8],
    cta,
    traits,
    dominant_theme,
  };
  console.log(`[hardcoded] buildCards complete — returning result for "${firstName}" with ${result.cards.length} cards`);
  return result;
}

// ══════════════════════════════════════════════════════════════
//  run() — called by dispatcher
//  Returns the same JSON shape as claude.js and openai.js
// ══════════════════════════════════════════════════════════════
function run(service, profile) {
  console.log(`[hardcoded] run called — service: "${service}"`);
  // All services route here; currently only free_reading is
  // fully implemented. Paid services fall back gracefully.
  const result = buildCards(profile);
  console.log(`[hardcoded] run complete — service: "${service}"`);
  return result;
}

module.exports = { run };