// ============================================================
//  src/engines/hardcoded.js
//  Chaldean Numerology — v2 (Schema v3 field names)
//
//  FIXES from v1:
//    - All field names updated to match calculator.js output:
//        birth_num        → psychic_number
//        life_path_num    → life_path_number  (same as destiny_number in Chaldean)
//        expression_num   → name_number
//        soul_urge_num    → soul_urge_number
//        personality_num  → personality_number
//        maturity_num     → maturity_number
//        personal_year    → personal_year_number
//    - firstName now reads profile.name_used (not profile.name)
//    - Cards reference Chaldean terminology throughout:
//        "Psychic Number" not "Birth Number"
//        "Destiny Number" not "Life Path"
//        "Name Number" not "Expression"
//    - Ruling planet (from psychic_number) referenced in cards
//    - Compound numbers referenced where they differ
//    - Indian cultural context woven into interpretations
//    - CTA updated with real numbers (no undefined)
// ============================================================

// ── Helper ────────────────────────────────────────────────────
function interp(table, number) {
  const entry = table[number];
  if (!entry) return null;
  return { number, label: entry.label || null, traits: entry.traits || [], text: entry.text || null };
}

// ══════════════════════════════════════════════════════════════
//  PSYCHIC NUMBER (1–9)
//  The day of birth reduced. Core personality, raw instinct.
// ══════════════════════════════════════════════════════════════
const PSYCHIC = {
  1: { label: 'The Pioneer',    planet: 'Sun',     traits: ['Leader','Independent','Ambitious','Self-reliant','Determined'],
       text: `Your Psychic Number is 1, ruled by the Sun — the king of all planets in Vedic tradition. You carry the energy of the pioneer: someone who leads not by appointment but by nature. Before you have spoken a word, people sense that you have already decided.\n\nYou think independently and trust your own instincts above consensus. This is your greatest strength. In a culture that often values collective harmony over individual direction, your clarity can feel like disruption — but it is actually leadership in its purest form.\n\nYour challenge is learning to include others without feeling diminished by it. True authority inspires; it does not insist. Channel your Sun energy into vision, and people will follow with genuine loyalty.` },

  2: { label: 'The Peacemaker', planet: 'Moon',    traits: ['Diplomatic','Sensitive','Cooperative','Intuitive','Harmonious'],
       text: `Your Psychic Number is 2, ruled by the Moon — the planet of mind, emotion, and deep intuition in Vedic astrology. You are wired for connection. You read the emotional temperature of a room before most people have even sat down.\n\nYou have a gift that is rare and often underestimated: you make people feel genuinely heard. In Indian families and workplaces, this skill builds the invisible architecture of trust that holds everything together.\n\nYour journey is learning to honour your own needs as deeply as you honour everyone else's. The Moon's power comes from its fullness — not from giving its light away until nothing remains.` },

  3: { label: 'The Creator',    planet: 'Jupiter', traits: ['Creative','Expressive','Optimistic','Communicative','Joyful'],
       text: `Your Psychic Number is 3, ruled by Jupiter — the Guru of the planets in Vedic tradition. You carry the energy of expansion, creativity, and the irresistible urge to express. Words, ideas, stories — they flow through you naturally.\n\nJupiter blesses you with optimism that is not naivety but genuine wisdom about possibility. You see potential where others see obstacles. This quality draws people toward you without effort.\n\nYour challenge is focus. Jupiter's abundance can scatter your gifts across too many directions at once. Choose one canvas, commit to it fully, and what you build will carry the mark of someone who understood both inspiration and discipline.` },

  4: { label: 'The Builder',    planet: 'Rahu',    traits: ['Grounded','Disciplined','Reliable','Methodical','Enduring'],
       text: `Your Psychic Number is 4, ruled by Rahu — the shadow planet associated with worldly ambition, unconventional paths, and karmic acceleration. You are the builder: someone who understands that lasting things require patient, unglamorous work.\n\nRahu gives you an unusual quality among 4s — a hunger to break convention even while constructing something solid. You are not content with the traditional path if a better one exists. You will find it, then build it better than anyone expected.\n\nYour growth edge is flexibility. The structures you create are strongest when they have room to evolve. Rahu's energy rewards those who can hold both the blueprint and the willingness to redraw it.` },

  5: { label: 'The Explorer',   planet: 'Mercury', traits: ['Adaptable','Curious','Magnetic','Quick-minded','Versatile'],
       text: `Your Psychic Number is 5, ruled by Mercury — the planet of intelligence, communication, and rapid movement. You are wired for variety, stimulation, and the thrill of what lies around the next corner.\n\nYou adapt faster than almost anyone around you. In business, in relationships, in any new environment — you orient quickly and find your footing before others have stopped feeling lost. This is a rare and valuable quality.\n\nYour deepest lesson is stillness. Mercury's speed can become restlessness. Some of your most important discoveries will come not from moving toward the next thing, but from sitting long enough with what is already here.` },

  6: { label: 'The Nurturer',   planet: 'Venus',   traits: ['Devoted','Compassionate','Responsible','Harmonious','Aesthetic'],
       text: `Your Psychic Number is 6, ruled by Venus — the planet of love, beauty, harmony, and material grace. You feel a deep calling to protect what matters: your family, your relationships, the spaces and people you have claimed as your own.\n\nIn the Indian context, the 6 energy is the foundation of the household — the person who makes a house feel like a home, who remembers everyone's needs, who holds things together when the pressure is highest.\n\nYour lesson is boundaries. Venus's love is inexhaustible — but yours is not. Giving from an empty well helps no one. Learning to receive as generously as you give is the central spiritual work of your Psychic 6 life.` },

  7: { label: 'The Seeker',     planet: 'Ketu',    traits: ['Analytical','Introspective','Spiritual','Perceptive','Solitary'],
       text: `Your Psychic Number is 7, ruled by Ketu — the most spiritual of all Vedic planetary influences, associated with liberation, past-life wisdom, and detachment from the material world. You are not here for surface answers.\n\nYou observe more than you speak. You think in layers. In a world that rewards confident noise, your quiet discernment can be mistaken for aloofness — but those who know you understand that you see things others simply cannot.\n\nKetu's influence gives you an unusual relationship with the material world: you can succeed in it, but you are never fully of it. Your greatest growth comes when you learn to trust your inner knowing enough to act on it — not just observe.` },

  8: { label: 'The Powerhouse', planet: 'Saturn',  traits: ['Ambitious','Strategic','Authoritative','Resilient','Masterful'],
       text: `Your Psychic Number is 8, ruled by Saturn — the planet of karma, discipline, and the rewards that come only to those who have earned them. You are built for mastery. Not the performance of power, but the real thing.\n\nSaturn's blessing is delayed but profound. The 8 who does the work — honestly, patiently, without shortcuts — receives returns that compound over time. In business, in reputation, in relationships, you play a long game that others cannot sustain.\n\nYour shadow is control. Saturn can make the 8 grip too tightly, trust too little, and exhaust themselves trying to manage what cannot be managed. Your deepest freedom will come when you discover that genuine authority requires the willingness to let go.` },

  9: { label: 'The Old Soul',   planet: 'Mars',    traits: ['Compassionate','Wise','Generous','Idealistic','Universal'],
       text: `Your Psychic Number is 9, ruled by Mars — the planet of courage, action, and the warrior's discipline. In Chaldean tradition, 9 is the sacred number, the completion of the cycle. You carry lifetimes of accumulated understanding in this single life.\n\nYou feel the weight of other people's suffering as if it were your own. This is not a burden — it is the specific shape of your purpose. Mars gives you the courage to actually do something about it, rather than merely feel it.\n\nYour challenge is release. The 9 holds on — to grief, to people, to what should have been. Your greatest freedom arrives the moment you learn that letting go is not loss. It is how you make room for everything that is still coming.` },
};

// ══════════════════════════════════════════════════════════════
//  DESTINY NUMBER (1–9, 11, 22, 33 + karmic 13, 14, 16, 19)
//  Full DOB all digits summed. Life direction and purpose.
// ══════════════════════════════════════════════════════════════
const DESTINY = {
  1:  { label: 'The Independent Leader',   traits: ['Self-starter','Courageous','Original','Driven','Bold'],
        text: `Your Destiny Number is 1 — a life oriented around independence, initiation, and the courage to forge your own path. You did not come here to follow a map. You came here to draw one.\n\nEvery challenge life places in front of you is, at its core, an invitation to discover how resourceful you actually are. The obstacles are not obstacles — they are the curriculum.\n\nThe shadow of this Destiny is isolation: the belief that strength means needing no one. Your growth arrives when you discover that the most powerful leaders are also the most open learners. Independence is not the absence of connection; it is the freedom to connect without losing yourself.` },

  2:  { label: 'The Harmoniser',           traits: ['Empathic','Collaborative','Patient','Perceptive','Devoted'],
        text: `Your Destiny Number is 2 — a life built around partnership, sensitivity, and the quiet art of bringing people together. You are here to find the thread of understanding that connects opposing forces.\n\nYou feel things more deeply than the people around you realise. This is not weakness — it is a form of intelligence. Your sensitivity allows you to perceive what others miss entirely, and to offer comfort that reaches the actual root.\n\nYour growth edge: harmony cannot always be maintained, and sometimes the most loving thing you can do is allow conflict to surface so it can be genuinely resolved. The 2 who learns this becomes not just a peacemaker but a transformer.` },

  3:  { label: 'The Communicator',         traits: ['Expressive','Playful','Inspiring','Creative','Abundant'],
        text: `Your Destiny Number is 3 — a life of expression, creativity, and the gift of making the inner world shareable. You are here to communicate: in whatever form that takes, you translate the invisible into something others can hold.\n\nYou have a rare ability to take complex feelings and give them a shape that others recognise. This is a form of service, even when it looks like play.\n\nYour challenge is depth over breadth. The 3 Destiny can scatter gifts across too many directions and wonder why nothing takes root. One expression, fully committed to, will multiply beyond anything you imagined from the outside.` },

  4:  { label: 'The Foundation Maker',     traits: ['Structured','Loyal','Methodical','Honest','Enduring'],
        text: `Your Destiny Number is 4 — a life oriented around building, dedication, and the creation of things that outlast you. You are here to make something real: a business, a family legacy, a body of knowledge, a foundation others will stand on.\n\nYou understand, at a bone-deep level, that real things take real time. In a world addicted to speed, your commitment to quality is quietly radical.\n\nYour shadow is rigidity. When the blueprint stops working, the 4 Destiny can double down instead of adapting. Remember: the strongest structures have room to flex. Adaptability is not failure — it is advanced engineering.` },

  5:  { label: 'The Freedom Seeker',       traits: ['Dynamic','Versatile','Fearless','Progressive','Magnetic'],
        text: `Your Destiny Number is 5 — a life of transformation, experience, and the full, unfiltered range of what it means to be alive. You are here to experience the spectrum, and then bring that wisdom back as something others can use.\n\nChange is not something that happens to you — you carry it with you wherever you go. In any new environment, you orient faster than anyone around you, and your ease with the unfamiliar makes others feel safe enough to follow.\n\nYour deepest lesson: true freedom is not the absence of commitment. It is choosing, with full awareness, what you are committed to. The 5 who masters this becomes genuinely unstoppable.` },

  6:  { label: 'The Caretaker',            traits: ['Loving','Protective','Harmonious','Responsible','Devoted'],
        text: `Your Destiny Number is 6 — a life of love, service, and the creation of beauty and belonging. You are here to nurture: not just individuals, but the spaces, families, and communities that people call home.\n\nYou have an extraordinary capacity for love — the kind that shows up, remembers, stays when others leave. This is your gift and your calling. In the Indian tradition, the 6 Destiny is the energy of the householder who makes civilisation possible.\n\nYour lesson: love given from compulsion or fear depletes. The 6 who learns to give freely — without tallying the return — discovers that genuine love is, in fact, infinite.` },

  7:  { label: 'The Truth Seeker',         traits: ['Introspective','Analytical','Spiritual','Wise','Private'],
        text: `Your Destiny Number is 7 — a life of depth, solitude, and the relentless pursuit of truth beneath the surface. You are here to go beneath the obvious — of ideas, of relationships, of yourself — and return with understanding that changes things.\n\nYou are most alive in genuine questions: the kind that cannot be rushed or answered with a Google search. Your relationship with mystery is comfortable in ways others find unsettling.\n\nYour challenge: the wall. The 7 Destiny who only analyses without trusting, who questions without surrendering, eventually becomes isolated in their own precision. Wisdom only changes things when it is shared.` },

  8:  { label: 'The Manifestor',           traits: ['Ambitious','Authoritative','Executive','Resilient','Karmic'],
        text: `Your Destiny Number is 8 — a life of power, abundance, and the mastery of the material world. You are here to build, to lead, and to understand how real power actually works — not the performance of it, but the substance.\n\nYou have an instinct for leverage: where to apply pressure, when to wait, how to position for maximum impact. When this gift is aligned with integrity, what you build becomes legendary in the Indian business tradition.\n\nThe shadow of the 8 Destiny: the belief that more is always better. The 8 who is endlessly accumulating has not yet met their own depth. Your greatest power lies in knowing when enough is enough.` },

  9:  { label: 'The Humanitarian',         traits: ['Selfless','Visionary','Compassionate','Universal','Generous'],
        text: `Your Destiny Number is 9 — a life of completion, giving, and service to something larger than personal ambition. The 9 holds all other numbers within it, and you feel that weight: a responsibility not just to your own life but to the larger human story.\n\nYou are moved by injustice. You carry other people's pain as if it were your own. In the Indian tradition, this is the energy of seva — selfless service — at its most genuine.\n\nYour lesson: release. The 9 Destiny asks you to love without possessing, give without needing credit, and allow endings so beginnings can arrive. Everything you release makes room for more.` },

  11: { label: 'The Inspired Messenger',   traits: ['Visionary','Intuitive','Illuminating','Sensitive','Channelling'],
        text: `Your Destiny is the Master Number 11 — one of the most spiritually charged journeys in Chaldean numerology. You are here as a bridge between the invisible world of intuition and the visible world of human experience.\n\nYou have always sensed that you are meant for something beyond the ordinary, even when you could not name it. This is accurate. The 11 is not designed for average output — you are here to inspire, elevate, and reveal what shimmers beneath the surface of the everyday.\n\nYour greatest challenge is your greatest gift: extreme sensitivity. The same openness that allows you to channel higher insight makes the noise of the world genuinely overwhelming. Your work is learning to stay open without being consumed.` },

  22: { label: 'The Master Builder',       traits: ['Visionary','Disciplined','Powerful','Transformative','Grounded'],
        text: `Your Destiny is the Master Number 22 — the rarest and most powerful Destiny in Chaldean numerology. You are here to turn the most ambitious visions into concrete reality. Not personal achievement: structures that reshape how people live.\n\nYou contain both the idealism of 11 and the discipline of 4. When these work in concert, there is almost nothing you cannot build. Institutions, movements, families, systems — all can carry your blueprint.\n\nYour challenge is the weight of your own potential. The 22 who has not yet stepped into their power often feels this as anxiety or procrastination — the fear of failing something important. Begin. The vision clarifies in motion.` },

  33: { label: 'The Master Teacher',       traits: ['Selfless','Compassionate','Uplifting','Transcendent','Unconditional'],
        text: `Your Destiny is the Master Number 33 — the rarest and most selfless of all Destinies. You are here to embody unconditional love at a scale that touches not individuals, but communities.\n\nThe 33 Destiny rarely fully arrives until mid-life or later. Until then, you may feel a persistent sense of not-yet, of a purpose just out of reach. This is not failure — this is preparation. The universe is building the vessel before it pours in the water.\n\nYour work is love in its fullest expression: not sentiment, but fierce, unwavering presence. The kind that will not abandon another person in their darkness. The world needs this. And you were made for it.` },

  // Karmic debt Destinies
  13: { label: 'The Transformer (13/4)',   traits: ['Disciplined','Determined','Transformative','Grounded','Karmic'],
        text: `Your Destiny carries the karmic number 13, reducing to 4. This compound carries the energy of transformation through sustained effort. In a previous karmic cycle, there may have been a pattern of avoiding the hard work — the 13 is life's gentle but firm insistence that this time, things will be built properly.\n\nThis does not mean your path is harder than others — it means that the discipline you develop has a depth and authenticity that most people never find. Every time you complete something difficult, you are settling a debt and building genuine mastery simultaneously.\n\nThe 13/4 Destiny often produces people who become extraordinary precisely because they had to earn everything. Nothing is taken for granted. That is the gift inside the work.` },

  14: { label: 'The Freedom Earner (14/5)', traits: ['Adaptable','Disciplined','Freedom-seeking','Resilient','Karmic'],
        text: `Your Destiny carries the karmic number 14, reducing to 5. This compound carries the energy of freedom that must be earned through responsibility — not freedom that is simply taken.\n\nIn a previous karmic cycle, there may have been a pattern of overindulgence in personal liberty at the expense of others. In this life, the invitation is to discover what responsible freedom actually looks like: adventure with awareness, change with integrity.\n\nThe 14/5 Destiny often produces extraordinary travellers — people who move through the world with genuine wisdom because they learned, sometimes through difficult experience, that real freedom requires knowing when not to run.` },

  16: { label: 'The Spiritual Rebuilder (16/7)', traits: ['Introspective','Humble','Spiritual','Transformative','Karmic'],
        text: `Your Destiny carries the karmic number 16, reducing to 7. This is one of the most spiritually significant compounds in Chaldean numerology. It carries the energy of the fall of ego and the rebuilding of something more genuine in its place.\n\nThe 16/7 Destiny tends to produce people whose most profound growth arrives through experiences of loss, humbling, or radical disruption — not as punishment, but as the universe ensuring that your considerable gifts are built on wisdom rather than pride.\n\nWhat emerges from this process is extraordinary: a spiritual depth and authentic humility that no other path produces. The 16/7 who has done the inner work becomes one of the most genuinely wise presences in any room they enter.` },

  19: { label: 'The Independent Spirit (19/1)', traits: ['Courageous','Self-reliant','Independent','Transformative','Karmic'],
        text: `Your Destiny carries the karmic number 19, reducing to 1. This compound carries the energy of independence that must be balanced with genuine care for others — the learning of interdependence by someone who begins as deeply self-sufficient.\n\nIn a previous karmic cycle, there may have been a pattern of using personal power without adequate consideration of its effect on others. In this life, the invitation is to discover that true strength includes the willingness to need people, and to allow them to need you in return.\n\nThe 19/1 Destiny often produces the most inspiring leaders — people whose authority is genuine because it was forged in the understanding that power without compassion is just control.` },
};

// ══════════════════════════════════════════════════════════════
//  NAME NUMBER (1–9, 11, 22)
//  Chaldean value of daily-use name. Outer talent, expression.
// ══════════════════════════════════════════════════════════════
const NAME_NUM = {
  1:  { label: 'The Natural Leader',          traits: ['Original','Assertive','Initiative','Independent','Pioneering'],
        text: `Your Name Number is 1 — your name carries the energy of originality and natural authority. Before you have spoken, your name itself projects the quality of someone who knows where they are going.\n\nYour talents are strongest in domains where your individual vision can be expressed without being diluted: entrepreneurship, creative leadership, or any field where initiative is the primary currency.\n\nYour growth lies in recognising that your originality is most powerful when it invites others in rather than leaving them behind. The greatest leaders create other leaders.` },

  2:  { label: 'The Collaborator',            traits: ['Mediating','Supportive','Tactful','Intuitive','Detail-oriented'],
        text: `Your Name Number is 2 — your name carries the energy of diplomacy and quiet perception. You have an almost effortless ability to hold space for multiple perspectives simultaneously.\n\nYou excel in roles that require tact, cooperation, and careful attention to the human element: counselling, teaching, partnerships, or any work where bridges between people need to be built.\n\nYour growth is in recognising that your contributions are not smaller for being quiet. The person who holds the team together is as essential as the one who leads it.` },

  3:  { label: 'The Expressive Artist',       traits: ['Creative','Charismatic','Verbal','Optimistic','Social'],
        text: `Your Name Number is 3 — your name carries the energy of expression and creative intelligence. You have a natural eloquence; words, ideas, and images flow through you in ways that engage and lift others.\n\nYou were designed to work with and for people: writing, speaking, teaching, designing — any domain where your creative warmth can fully express itself is your natural territory.\n\nYour growth is in sustained focus. The most brilliant creative minds are not those with the most ideas but those who chose one idea and went all the way into it.` },

  4:  { label: 'The Systems Builder',         traits: ['Precise','Organised','Reliable','Logical','Enduring'],
        text: `Your Name Number is 4 — your name carries the energy of precision, organisation, and follow-through. You have a rare capacity for turning vision into plan, and plan into tangible result.\n\nYou excel in fields requiring structure, reliability, and long-term thinking: engineering, finance, project management, or any work that demands the meticulous commitment most people cannot sustain.\n\nYour growth is in allowing yourself to dream slightly bigger than the plan allows. The greatest builders were also, always, bold.` },

  5:  { label: 'The Versatile Communicator',  traits: ['Adaptive','Persuasive','Dynamic','Multi-talented','Progressive'],
        text: `Your Name Number is 5 — your name carries the energy of adaptability and natural persuasion. You have an innate ability to meet people where they are and communicate across very different audiences with equal ease.\n\nYou are built for variety: sales, marketing, journalism, politics, or any field where the ability to shift, persuade, and connect is valued above narrow consistency.\n\nYour growth is in depth. The 5 Name Number who adds genuine expertise to natural versatility becomes not just interesting, but irreplaceable.` },

  6:  { label: 'The Devoted Healer',          traits: ['Caring','Responsible','Aesthetic','Healing','Community'],
        text: `Your Name Number is 6 — your name carries the energy of nurturing and the creation of beauty. You have an instinct for what people need to feel safe and cared for, and an aesthetic sensibility that brings warmth to any environment.\n\nYou thrive in service-oriented fields: medicine, counselling, social work, teaching, interior design — any role where your love is the engine.\n\nYour growth is in recognising that your own wellbeing is part of the service you offer. A healer who neglects themselves cannot heal others.` },

  7:  { label: 'The Analytical Mystic',       traits: ['Investigative','Scholarly','Discerning','Refined','Independent'],
        text: `Your Name Number is 7 — your name carries the energy of deep analysis and quiet wisdom. You have an unusual combination: the precision of the scientist and the perception of the mystic.\n\nYou excel in research, philosophy, psychology, technology, or spiritual study — any domain where the reward is not external approval but the private thrill of genuine understanding.\n\nYour growth is in sharing what you find. Knowledge kept only to yourself is potential unrealised. The world is waiting for what you have discovered in solitude.` },

  8:  { label: 'The Executive',               traits: ['Authoritative','Strategic','Efficient','Business-minded','Resilient'],
        text: `Your Name Number is 8 — your name carries the energy of executive power and strategic intelligence. You were born understanding leverage: how systems work, where value is created, how to position for maximum impact.\n\nYou are built for leadership at scale: business, law, finance, real estate — any domain where big-picture thinking and precise execution can be fully deployed.\n\nYour growth is in the human dimension of power. The most enduring legacies are built not on strategy alone but on the loyalty of people who were genuinely seen and developed.` },

  9:  { label: 'The Wise Counsellor',         traits: ['Humanitarian','Philosophical','Tolerant','Universal','Artistic'],
        text: `Your Name Number is 9 — your name carries the energy of wisdom, compassion, and universal perspective. You were born with an instinctive understanding of the human condition — its pain, its beauty, and its potential.\n\nYou are drawn to work that transcends the personal: the arts, education, humanitarian work, philosophy — anywhere your gifts serve something that outlasts you.\n\nYour growth is in allowing yourself to receive as generously as you give. The 9 Name Number who learns to be served without guilt discovers that love is not finite — it only grows when it flows in both directions.` },

  11: { label: 'The Intuitive Visionary',     traits: ['Inspirational','Prophetic','Spiritual','Creative','Illuminating'],
        text: `Your Name Number is the Master 11 — your name carries a frequency that operates on an elevated level. You have an unusual combination of creative brilliance and spiritual sensitivity, an inner antenna that receives signals others cannot.\n\nYou are here to inspire at a larger scale: through art, teaching, spiritual guidance, or any creative work that opens hearts and expands people's sense of what is possible.\n\nThe gift and the challenge are the same: heightened sensitivity in a world that is often too loud. Learn to regulate your environment, and your capacity to inspire becomes unlimited.` },

  22: { label: 'The Visionary Builder',       traits: ['Practical Idealist','Architect','Large-scale','Grounded','Transformative'],
        text: `Your Name Number is the Master 22 — your name carries the rarest of energies: the ability to hold a vast vision and build it into something real. You combine big-picture thinking with the practical discipline of a master builder.\n\nYou are here to create things that change how people live — institutions, systems, communities that carry your blueprint long after you are gone.\n\nThe scale of your gifts can feel like pressure. Begin with what is in front of you. Every great structure starts with a single, carefully placed stone.` },
};

// ══════════════════════════════════════════════════════════════
//  SOUL URGE (1–9)
//  Vowels of name. Inner hunger, what the soul truly desires.
// ══════════════════════════════════════════════════════════════
const SOUL_URGE = {
  1: { label: 'Craves Autonomy',       text: `At your core, you crave independence and the freedom to do things your way. Your soul is most at peace when you are the author of your own story — when no one is waiting to approve your next move.\n\nYou are driven by a need to achieve something entirely yours. Not to prove yourself to others, but to satisfy a private inner standard you hold higher than anyone else would dare.\n\nWhat brings you joy is leading. What drains you is feeling dependent, overlooked, or constrained by others' smaller vision.` },
  2: { label: 'Craves Connection',     text: `At your core, you crave deep, reciprocal connection. Your soul is nourished by relationships where you are truly seen — where what you give is genuinely returned.\n\nYou are motivated by harmony. Not the shallow kind that avoids all friction, but the deep kind that emerges when two people actually hear each other. This is what you are always reaching for.\n\nWhat brings you joy is belonging. What drains you is loving someone who cannot quite meet you where you are.` },
  3: { label: 'Craves Expression',     text: `At your core, you crave the freedom to express. Your soul is not content to simply receive the world — it needs to respond to it, shape it, add something that was not there before.\n\nYou are most alive when you are making something: a conversation that sparks, a piece of writing, a room that feels beautiful, a laugh that breaks tension. The medium matters less than the act of creating itself.\n\nWhat brings you joy is creative freedom. What drains you is a life so scheduled that spontaneity becomes impossible.` },
  4: { label: 'Craves Security',       text: `At your core, you crave solid ground. Your soul is not asking for luxury — it is asking for stability: a home that feels safe, work that means something, relationships built on genuine trust.\n\nYou are motivated by the desire to build something real. Not a performance of success, but the actual thing: a business that works, a family that holds together, a reputation earned through consistent integrity.\n\nWhat brings you joy is the feeling of things in their right place. What drains you is chaos, broken commitments, and environments that shift without warning.` },
  5: { label: 'Craves Freedom',        text: `At your core, you crave freedom and the thrill of the new. Your soul is not built for sameness — it needs variety, movement, sensation, and the feeling of a horizon that keeps expanding.\n\nYou are motivated by experience itself. You want to have lived, not just to have existed. You want stories worth telling, and a life that surprises you.\n\nWhat brings you joy is discovery. What drains you is routine without meaning, or a life that stopped asking questions.` },
  6: { label: 'Craves Harmony & Love', text: `At your core, you crave love — not just romantic love, but the full, rich experience of belonging and being genuinely needed. Your soul is most at peace when the people you love are well.\n\nYou are motivated by devotion. You want to be the steady presence in a shifting world. In Indian family life, this is the quality that holds everything together — and you feel it as a calling.\n\nWhat brings you joy is a home that feels like sanctuary. What drains you is discord you cannot resolve, or love that goes unacknowledged.` },
  7: { label: 'Craves Understanding',  text: `At your core, you crave understanding — not information, but genuine insight. Your soul is not satisfied with knowing what; it needs to know why, and then the why behind the why.\n\nYou are motivated by the pursuit of truth beneath the surface of every experience. This is Ketu's influence felt at the soul level: a pull toward the spiritual, the philosophical, the genuinely mysterious.\n\nWhat brings you joy is the private thrill of an idea clicking into place, or a conversation that goes somewhere neither person expected. What drains you is noise, pretence, and compulsory small talk.` },
  8: { label: 'Craves Achievement',    text: `At your core, you crave achievement and the tangible evidence of your own power. Your soul is most alive when it is working toward something significant — a goal worthy of your full capacity.\n\nYou are motivated by impact. Not just comfort, but consequence — the knowledge that what you build matters, that you changed something in the world by being in it.\n\nWhat brings you joy is mastery: the moment years of effort produce undeniable results. What drains you is mediocrity — especially your own.` },
  9: { label: 'Craves Purpose',        text: `At your core, you crave meaning — not just personal fulfilment but the deep satisfaction of knowing your life served something beyond itself. Your soul is not content with private success; it wants to contribute.\n\nYou are motivated by compassion so broad that you sometimes feel it as a weight — a sense of responsibility to something larger than your own story.\n\nWhat brings you joy is the moment your work touches someone genuinely — not applause, but the quiet recognition that something you gave truly mattered.` },
};

// ══════════════════════════════════════════════════════════════
//  PERSONALITY (1–9)
//  Consonants of name. How the world perceives you.
// ══════════════════════════════════════════════════════════════
const PERSONALITY = {
  1: { label: 'Confident & Decisive',  text: `To the world, you appear confident, decisive, and quietly in charge. People sense before you have spoken that you have already thought the situation through — and they find this reassuring.\n\nYour presence communicates competence without effort. Even in unfamiliar territory, you project the calm that others interpret as experience.\n\nThis first impression can occasionally feel intimidating. When you soften it with warmth, your natural authority becomes magnetic rather than simply commanding.` },
  2: { label: 'Warm & Approachable',   text: `To the world, you appear warm, considerate, and genuinely interested in the people around you. You have a gift for making others feel noticed — a moment of real attention that quietly says: I see you.\n\nPeople trust you quickly because you do not seem to be performing. Your warmth is effortless because, for you, it largely is.\n\nThe impression you make can cause people to underestimate your strength. The gentleness they see is real, but it is not the whole picture. Let them discover your steel when the moment calls for it.` },
  3: { label: 'Vibrant & Engaging',    text: `To the world, you appear vibrant, expressive, and genuinely enjoyable to be around. People brighten in your presence — not because you perform, but because your natural energy is contagious.\n\nYou have a gift for conversation: you know how to draw people out, find humour in unexpected places, and make the ordinary feel interesting.\n\nThe impression creates an expectation that you are always "on." Give yourself permission to be quiet sometimes. The people who matter will not confuse your still moments with absence.` },
  4: { label: 'Steady & Reliable',     text: `To the world, you appear steady, competent, and dependable — the kind of person others instinctively call when they need the job done. You do not broadcast your capabilities; you demonstrate them.\n\nYour manner is grounded and direct. You say what you mean and follow through on what you promise. In a culture of overcommitment and underdelivery, this sets you apart.\n\nThe impression can feel cooler than you intend. Warmth and precision can coexist. When people see the care behind your competence, they stop just trusting you — they become loyal to you.` },
  5: { label: 'Dynamic & Interesting', text: `To the world, you appear dynamic, interesting, and impossible to fully predict — which makes you genuinely compelling to watch and even more compelling to know.\n\nYou move through social situations with a lightness others find refreshing. You are equally at ease in a formal boardroom and a chai stall conversation — this adaptability reads as real confidence.\n\nThe impression is energising, but it can feel temporary. People wonder if you will stay. Showing your depth — not just your range — is what converts admiration into trust.` },
  6: { label: 'Warm & Caring',         text: `To the world, you appear warm, caring, and genuinely invested in the people around you. People sense that your interest is not social performance — it is actual attention.\n\nYou often come across as slightly more composed than everyone else in the room — not because you try harder, but because your aesthetic sense extends naturally to how you present yourself.\n\nThe impression attracts people who need more than you have to give. Being warm and boundaried simultaneously is your ongoing social refinement — when you manage it, others admire not just your care but your wisdom.` },
  7: { label: 'Mysterious & Refined',  text: `To the world, you appear intelligent, private, and slightly unknowable — which creates a quiet intrigue that draws people toward you even as you maintain a slight distance.\n\nYou observe far more than you reveal. People often sense you have assessed the situation before they finished explaining it — and they are usually right.\n\nThe impression can feel cool or distant to those who do not know you. When you decide to let someone in — even a little — the effect is powerful. The contrast between your usual reserve and your moments of openness is one of your most compelling qualities.` },
  8: { label: 'Powerful & Capable',    text: `To the world, you appear powerful, competent, and worth paying attention to. You carry yourself with a quiet authority that communicates: I have thought this through, and I am not guessing.\n\nYou present yourself in ways that project success — not as performance, but because your standards extend naturally into your appearance and environment.\n\nThe impression opens doors others find closed. The challenge is ensuring what is behind the door matches what is on the front — not because you lack substance, but because your exterior is so polished that people hold you to the very highest standard.` },
  9: { label: 'Compassionate & Wise',  text: `To the world, you appear compassionate, broad-minded, and in possession of a gentle wisdom that feels rare. People often feel, in your company, that they are being seen more generously than they see themselves.\n\nYou carry yourself with a quiet grace that comes from genuinely not needing to compete. You are already where you are, and that settledness is visible.\n\nPeople sometimes mistake your acceptance for agreement, or your gentleness for a lack of convictions. When the moment calls for it, do not hesitate to let your depth show.` },
};

// ══════════════════════════════════════════════════════════════
//  MATURITY NUMBER (1–9)
//  Psychic + Destiny reduced. Who you are still becoming.
// ══════════════════════════════════════════════════════════════
const MATURITY = {
  1: { label: 'Maturing into Sovereignty', text: `As you move through the second half of your life, you will feel an increasing pull toward genuine independence and self-determination. The approval of others will matter progressively less; your own clear sense of direction will matter more.\n\nIn your mature years, you will find the courage to build something entirely, unapologetically yours — not because you have become selfish, but because you have finally become honest.` },
  2: { label: 'Maturing into Partnership', text: `As you grow into maturity, your relationships become the central and most rewarding theme. Partnerships — romantic, professional, creative — will be where your greatest growth and satisfaction live.\n\nThe older you get, the more you will value depth over breadth, presence over productivity, and genuine connection over impressive achievement. This wisdom, fully embraced, transforms everything.` },
  3: { label: 'Maturing into Expression',  text: `As you grow into maturity, your creative gifts will deepen and find their truest form. The scattered creativity of earlier years will focus into something more precise and more powerful.\n\nYou may feel called to share what you have learned — to teach, to write, to create in ways that leave something behind. This impulse is worth following fully.` },
  4: { label: 'Maturing into Mastery',     text: `As you grow into maturity, you will find deep satisfaction in mastery and the tangible results of sustained effort. The structures you have spent a lifetime building — in work, in family, in character — will show their durability.\n\nWhat you built slowly, carefully, and without shortcuts will outlast the quick constructions of others. This is your vindication and your legacy.` },
  5: { label: 'Maturing into Freedom',     text: `As you grow into maturity, your relationship with freedom will evolve. The restless seeking of earlier years will soften into something more deliberate — a freedom chosen rather than chased.\n\nYou may find that you have all the adventure you need in the depth of a single day, a single place, a single relationship fully explored. This is not limitation — it is the freedom of someone who no longer needs to run in order to feel free.` },
  6: { label: 'Maturing into Love',        text: `As you grow into maturity, love in its fullest expression becomes your primary domain. Your relationships, your home, your community — these will be where you find your deepest meaning and your greatest joy.\n\nGiving love without condition and receiving it without guilt — when you master this balance, you become one of the rarest things in the world: a person in whose presence others feel genuinely at home.` },
  7: { label: 'Maturing into Wisdom',      text: `As you grow into maturity, the searching quality of your earlier years will deepen into wisdom. The questions you have been asking your whole life will begin to reveal their answers — not all at once, but in a steady accumulation of clarity.\n\nYour inner life becomes your greatest resource. The depth cultivated in solitude becomes the very quality that makes you invaluable to others who are still searching.` },
  8: { label: 'Maturing into Power',       text: `As you grow into maturity, your relationship with power, abundance, and achievement comes into its fullest expression. What you were always capable of will finally have the platform it deserves.\n\nThe wisdom you have accumulated about how the world actually works becomes your greatest asset. Use it not just to build for yourself, but to build for others. This is where your legacy is made.` },
  9: { label: 'Maturing into Service',     text: `As you grow into maturity, your sense of universal compassion and service deepens into your primary mode of being. Personal ambitions give way to something larger and more generous.\n\nYou will begin to give your gifts most freely — not because you expect less in return, but because you no longer need the return. This is the mature expression of a life well-lived: giving from fullness, not from need.` },
};

// ══════════════════════════════════════════════════════════════
//  PERSONAL YEAR (1–9)
//  Current year cycle energy.
// ══════════════════════════════════════════════════════════════
const PERSONAL_YEAR = {
  1: { label: 'Year of New Beginnings', text: `This is a Personal Year 1 for you — a year of new beginnings and the planting of seeds that will grow for the next nine years. What you initiate now carries unusual momentum.\n\nThis year rewards courage. Begin the project, launch the idea, move toward the thing you have been circling. A Year 1 rewards action and punishes hesitation.\n\nWatch for: the temptation to wait until everything is perfect. It never is. Begin anyway.` },
  2: { label: 'Year of Partnership',    text: `This is a Personal Year 2 — a year of relationships, patience, and the quiet work of building trust. After the action of Year 1, this year asks you to slow down and tend to connections.\n\nCollaboration is favoured. Partnerships you invest in now will prove their value over years ahead. Listen more than you speak.\n\nWatch for: frustration at the slower pace. Year 2 is not passive — it is the deep work of laying relational foundations that Year 1's seeds need to grow.` },
  3: { label: 'Year of Expression',     text: `This is a Personal Year 3 — a year of creativity, social expansion, and the joy of expressing who you are. Opportunities arrive through people — new connections, creative collaborations, conversations that change direction.\n\nSay yes more than you say no. This is a year to enjoy.\n\nWatch for: scattered energy. The abundance of Year 3 can lead to overcommitment. Keep a few important projects at the centre while enjoying the expansion.` },
  4: { label: 'Year of Building',       text: `This is a Personal Year 4 — a year of hard work, structure, and the satisfaction of building something real. This is not a year for shortcuts. It rewards discipline and the willingness to do unglamorous work.\n\nWhat you build with integrity this year will last.\n\nWatch for: rigidity and overwork. The structures that last are built by people who know when to rest.` },
  5: { label: 'Year of Change',         text: `This is a Personal Year 5 — a year of change, freedom, and unexpected developments. Life is ready to move, and it will — whether or not you planned for it.\n\nThis year favours flexibility and a willingness to let the unexpected in. Embrace the instability — it is carrying you somewhere important.\n\nWatch for: recklessness. The energy of freedom is real, but not all changes are improvements. Choose your risks consciously.` },
  6: { label: 'Year of Responsibility', text: `This is a Personal Year 6 — a year centred on home, relationships, family, and responsibility. Life is asking you to settle, nurture, and attend to what genuinely matters.\n\nRelationship themes come to the foreground: deepening commitments, resolving tensions, reimagining what home and family mean to you.\n\nWatch for: over-giving. Year 6 attracts those who need your care. Give freely, but not at the expense of your own wellbeing.` },
  7: { label: 'Year of Reflection',     text: `This is a Personal Year 7 — a year of inner work, reflection, and the kind of self-understanding that only comes from genuine solitude. Life is offering you space.\n\nThis is not a year for aggressive external expansion. It is a year for reading, thinking, and attending to the inner world that your outer life runs on.\n\nWatch for: isolation and withdrawal. Reflection is good; retreat from life is not. Stay present to the people who matter, even as you go deep.` },
  8: { label: 'Year of Achievement',    text: `This is a Personal Year 8 — a year of achievement, financial focus, and tangible results. After the inner work of Year 7, you are ready to act, and the world is ready to reward you.\n\nOpportunities for advancement, financial gain, and recognition are more available in a Year 8 than almost any other year.\n\nWatch for: pursuing achievement at the expense of the people around you. Success without integrity is hollow. Build both.` },
  9: { label: 'Year of Completion',     text: `This is a Personal Year 9 — a year of endings, completion, and releasing what has served its purpose. You are approaching the end of a nine-year cycle.\n\nFinish, close, and clear. Projects, relationships, habits that no longer fit are asking to be released. Trust the process of completion.\n\nWatch for: clinging to what is ending. The grace of a Year 9 is proportional to your willingness to release. Let go generously, and your next Year 1 arrives with extraordinary clarity.` },
};

// ══════════════════════════════════════════════════════════════
//  PLANES OF EXPRESSION
// ══════════════════════════════════════════════════════════════
const PLANE_DOMINANT = {
  mental:    `Your chart shows a dominant Mental plane — you lead with your intellect. You process the world through analysis, ideas, and logic, and your best decisions come after careful, systematic thinking. The risk is over-analysis: living so much in the mind that you delay action or disconnect from your emotions.`,
  physical:  `Your chart shows a dominant Physical plane — you lead with action and practicality. You are at your best when building, doing, and producing tangible results. You trust what you can touch and measure, and others trust you because you deliver. The risk is neglecting the inner world; results without reflection can lead you in the wrong direction.`,
  emotional: `Your chart shows a dominant Emotional plane — you lead with feeling. Your empathy and sensitivity are your greatest assets; you understand people and situations at a depth others miss entirely. The risk is making decisions from the heart when the situation also calls for the head.`,
  intuitive: `Your chart shows a dominant Intuitive plane — you lead with inner knowing. You sense things before they happen, read between lines others cannot see, and navigate by a compass that defies rational explanation. The risk is difficulty communicating your insight to others who need logical explanation before they can trust a direction.`,
};

const PLANE_WEAKEST = {
  mental:    `Your least developed plane is the Mental — a reminder to slow down and think before acting. When logic and analysis feel like obstacles, that is precisely when they are most needed.`,
  physical:  `Your least developed plane is the Physical — a reminder that ideas must eventually become actions. Inspiration unrealised is just a dream. The world responds to what you build, not only to what you feel or think.`,
  emotional: `Your least developed plane is the Emotional — a reminder to check in with how you and others feel, not just what you or they think. The most precise decisions still carry human consequences.`,
  intuitive: `Your least developed plane is the Intuitive — a reminder to pause and listen to the quiet signal beneath the noise. Not everything worth knowing can be found by analysis or effort alone.`,
};

// ══════════════════════════════════════════════════════════════
//  KARMIC DEBT TEXT
// ══════════════════════════════════════════════════════════════
const KARMIC_DEBT = {
  13: `The karmic compound 13 tends to suggest a soul that may have avoided hard work or discipline in a previous cycle. In this life, it often manifests as a tendency to resist structure — until the moment you discover that mastery is not a prison but a liberation. Every time you complete something difficult, you are paying a debt forward with compound interest.`,
  14: `The karmic compound 14 tends to suggest a soul that may have overindulged in freedom or personal liberty in a previous cycle. In this life, the invitation is to embrace responsible freedom — to discover that the deepest adventures belong to those who have also learned restraint.`,
  16: `The karmic compound 16 tends to suggest a soul carrying themes of ego and the fall of pride. In this life, your most profound growth often arrives through humbling experiences — not as punishment, but as the universe ensuring that your considerable gifts are built on genuine wisdom rather than brittle certainty.`,
  19: `The karmic compound 19 tends to suggest a soul that may have misused power or independence at the expense of others. In this life, the lesson is interdependence: discovering that true strength is not self-sufficiency alone, but the courage to need and be needed in return.`,
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
  8: 'an ambition for impact and mastery that rarely sleeps — and a private knowledge that you are capable of far more than your current situation reflects',
  9: 'a compassion so broad and deep that you sometimes feel it as a weight — a sense of responsibility to something larger than your own story',
};

// ══════════════════════════════════════════════════════════════
//  MASTER NUMBER OPENER
// ══════════════════════════════════════════════════════════════
const MASTER_NUMBER_OPENER = {
  11: `There is something rare in your chart that announces itself immediately: a Master Number 11. In Chaldean numerology, this is not ordinary territory. The 11 marks a soul that carries both exceptional sensitivity and an unusual capacity to inspire — often without fully understanding why people are drawn to them the way they are.`,
  22: `Your chart opens with something extraordinary: a Master Number 22 — the rarest of the master numbers in Chaldean tradition. It marks a soul with both the vision to see what could be and the practical power to make it real. You are not here just to achieve — you are here to build things that outlast you.`,
  33: `Your chart carries the most selfless of the master numbers: 33. This number appears so rarely that many numerologists go their entire practice without seeing it in its pure form. It marks a soul whose calling is not personal success but something far larger — a life oriented toward love, teaching, and healing at scale.`,
};

// ══════════════════════════════════════════════════════════════
//  BUILD 8-CARD RESPONSE
// ══════════════════════════════════════════════════════════════
function buildCards(profile) {

  // ── Resolve all field names (Chaldean schema v3) ──────────
  const {
    name_used,
    psychic_number,
    psychic_compound,
    destiny_number,
    destiny_compound,
    name_number,
    name_compound,
    soul_urge_number,
    soul_urge_compound,
    personality_number,
    personality_compound,
    maturity_number,
    maturity_compound,
    power_number,
    life_path_number,
    personal_year_number,
    ruling_planet,
    pd_combination,
    master_numbers_found,
    karmic_debt_numbers,
    karmic_lessons,
    hidden_passions,
    missing_numbers,
    plane_mental_count    = 0,
    plane_physical_count  = 0,
    plane_emotional_count = 0,
    plane_intuitive_count = 0,
    dominant_plane        = 'mental',
    current_pinnacle,
    current_challenge,
    has_karmic_debt,
    pinnacle_1_end_age,
  } = profile;

  // firstName from name_used (not profile.name)
  const firstName = (name_used || '').trim().split(/\s+/)[0] || 'friend';

  // Master numbers
  const masterList    = Array.isArray(master_numbers_found) && master_numbers_found.length ? master_numbers_found : [];
  const hasMaster     = masterList.length > 0;
  const primaryMaster = masterList[0] || null;

  // Karmic debt
  const karmicDebtList = Array.isArray(karmic_debt_numbers) && karmic_debt_numbers.length ? karmic_debt_numbers : [];
  const hasKarmicDebt  = !!has_karmic_debt && karmicDebtList.length > 0;

  // Karmic lessons / missing numbers
  const karmicLessonsList  = Array.isArray(karmic_lessons)  && karmic_lessons.length  ? karmic_lessons  : [];
  const hiddenPassionsList  = Array.isArray(hidden_passions) && hidden_passions.length ? hidden_passions : [];
  const missingNumbersList  = Array.isArray(missing_numbers) && missing_numbers.length ? missing_numbers : [];

  // Planes — normalise dominant_plane to lowercase for lookups
  const dominantPlaneLower = (dominant_plane || 'mental').toLowerCase();
  const planeCounts = {
    mental:    plane_mental_count,
    physical:  plane_physical_count,
    emotional: plane_emotional_count,
    intuitive: plane_intuitive_count,
  };
  // Find weakest plane (lowest non-zero count, or zero if all zero)
  const sortedPlanes    = Object.entries(planeCounts).sort((a, b) => a[1] - b[1]);
  const weakestPlaneLow = sortedPlanes[0][0];

  // Table lookups using correct Chaldean field names
  const psychicEntry   = PSYCHIC[psychic_number]         || {};
  const destinyEntry   = DESTINY[destiny_number]         || {};
  const nameEntry      = NAME_NUM[name_number]           || {};
  const soulUrgeEntry  = SOUL_URGE[soul_urge_number]     || {};
  const personalityEnt = PERSONALITY[personality_number] || {};
  const maturityEntry  = MATURITY[maturity_number]       || {};
  const personalYrEnt  = PERSONAL_YEAR[personal_year_number] || {};

  // Compound helpers
  const psychicHasCompound  = psychic_compound  && psychic_compound  !== psychic_number;
  const destinyHasCompound  = destiny_compound  && destiny_compound  !== destiny_number;
  const nameHasCompound     = name_compound     && name_compound     !== name_number;
  const soulHasCompound     = soul_urge_compound && soul_urge_compound !== soul_urge_number;
  const personalityHasComp  = personality_compound && personality_compound !== personality_number;

  // ── CARD 1: Your Signature ─────────────────────────────────
  let card1Body = '';
  if (hasMaster && MASTER_NUMBER_OPENER[primaryMaster]) {
    card1Body = MASTER_NUMBER_OPENER[primaryMaster];
    card1Body += ` Combined with a Psychic Number of ${psychic_number} (${psychicEntry.label || ''}) — ruled by ${ruling_planet || 'your ruling planet'} — your chart carries an unusual tension between the visible self and the self that is still becoming. The path is not simple, but it is unmistakably yours.`;
  } else {
    const pdSame = psychic_number === destiny_number;
    if (pdSame) {
      card1Body = `There is a rare alignment in your chart that announces itself immediately: your Psychic Number and Destiny Number are both ${psychic_number}${psychicHasCompound ? ` (compound ${psychic_compound})` : ''} — ruled by ${ruling_planet || 'the same planet'}. When the number you were born with and the number you are moving toward are identical, the energy is amplified in every direction. This is not a neutral coincidence in Chaldean numerology — it is a signature.`;
    } else {
      card1Body = `Your chart opens with a specific combination that the Chaldean system recognises immediately: a Psychic Number ${psychic_number}${psychicHasCompound ? ` (compound ${psychic_compound})` : ''} — ${psychicEntry.label || ''}, ruled by ${ruling_planet || 'your ruling planet'} — meeting a Destiny Number ${destiny_number}${destinyHasCompound ? ` (compound ${destiny_compound})` : ''} — ${destinyEntry.label || ''}. These two numbers define the central tension and the central gift of your entire life: the person you are instinctively, and the person you are being asked to become.`;
    }
    card1Body += ` There is a quality in this combination — ${pd_combination || `${psychic_number}-${destiny_number}`} — that tends to produce someone who has always understood things slightly ahead of when they could fully explain them. This reading is an attempt to give language to what you have long already known.`;
  }

  const card1 = {
    card_number:   1,
    title:         hasMaster ? `The Master Number` : `${firstName}'s Signature`,
    subtitle:      hasMaster ? `A rare master number opens your chart` : `The combination that makes you unmistakably you`,
    body:          card1Body,
    accent_number: hasMaster ? primaryMaster : psychic_number,
    accent_label:  hasMaster ? 'Master Number' : 'Psychic Number',
  };

  // ── CARD 2: The Day You Were Born ─────────────────────────
  const card2Body = (psychicEntry.text ||
    `Your Psychic Number ${psychic_number}${psychicHasCompound ? ` (born on the ${psychic_compound}th)` : ''} — ${psychicEntry.label || ''} — is the most instinctive, unfiltered version of you. It existed before the world had a chance to teach you who to be. It is the energy you return to under pressure, and the gift you carry without effort.`);

  const card2 = {
    card_number:   2,
    title:         `The Day You Were Born`,
    subtitle:      `Psychic Number ${psychic_number}${psychicHasCompound ? ` · Born the ${psychic_compound}th` : ''} · ${psychicEntry.label || ''}`,
    body:          card2Body,
    accent_number: psychic_number,
    accent_label:  `Psychic Number`,
  };

  // ── CARD 3: Your Life's True Direction ────────────────────
  const card3Body = (destinyEntry.text ||
    `Your Destiny Number ${destiny_number}${destinyHasCompound ? ` (compound ${destiny_compound})` : ''} — ${destinyEntry.label || ''} — is the overarching current beneath everything you do. In Chaldean numerology, the Destiny is not who you are — it is who you are being asked to become. It shapes the kind of experiences that find you, and the kind of person you grow into through them.`);

  const card3 = {
    card_number:   3,
    title:         `Your Life's True Direction`,
    subtitle:      `Destiny Number ${destiny_number}${destinyHasCompound ? ` · Compound ${destiny_compound}` : ''} · ${destinyEntry.label || ''}`,
    body:          card3Body,
    accent_number: destiny_number,
    accent_label:  `Destiny Number`,
  };

  // ── CARD 4: The Name You Carry ────────────────────────────
  const nameText = nameEntry.text
    ? nameEntry.text.split('\n\n')[0]
    : `Your Name Number ${name_number}${nameHasCompound ? ` (compound ${name_compound})` : ''} — ${nameEntry.label || ''} — reveals the talents encoded in your daily-use name, the gifts you bring into every room without realising you are deploying them.`;

  const soulText = soulUrgeEntry.text
    ? soulUrgeEntry.text.split('\n\n')[0]
    : `Your Soul Urge ${soul_urge_number}${soulHasCompound ? ` (compound ${soul_urge_compound})` : ''} — ${soulUrgeEntry.label || ''} — reveals what you privately hunger for beneath all that outer talent.`;

  const tensionPairs = new Set(['1-2','2-1','1-9','9-1','3-4','4-3','5-4','4-5','7-3','3-7','8-2','2-8']);
  const hasTension   = tensionPairs.has(`${name_number}-${soul_urge_number}`);

  let card4Body = `${nameText} Meanwhile, your Soul Urge ${soul_urge_number}${soulHasCompound ? ` (compound ${soul_urge_compound})` : ''} — ${soulUrgeEntry.label || ''} — reveals a very different interior. ${soulText}`;
  if (hasTension) {
    card4Body += ` The gap between your Name Number ${name_number} and Soul Urge ${soul_urge_number} tends to create someone who presents one face to the world while quietly wanting something quite different — a tension that may feel familiar, and that your full blueprint explores in precise detail.`;
  } else {
    card4Body += ` In your case, what you show the world and what you privately crave move in the same direction — giving your actions an unusual coherence and authenticity that others find quietly magnetic.`;
  }

  const card4 = {
    card_number:   4,
    title:         `The Name You Carry`,
    subtitle:      `Name Number ${name_number} meets Soul Urge ${soul_urge_number}`,
    body:          card4Body,
    accent_number: name_number,
    accent_label:  `Name Number`,
  };

  // ── CARD 5: How the World Sees You ────────────────────────
  const card5Body = (personalityEnt.text ||
    `Your Personality Number ${personality_number}${personalityHasComp ? ` (compound ${personality_compound})` : ''} — ${personalityEnt.label || ''} — shapes the first impression you make before you have said a single word. It is the energy others feel when you walk into a room, the outer layer of self that the world encounters first.`);

  const card5 = {
    card_number:   5,
    title:         `How the World Sees You`,
    subtitle:      `Personality Number ${personality_number} · ${personalityEnt.label || ''}`,
    body:          card5Body,
    accent_number: personality_number,
    accent_label:  `Personality Number`,
  };

  // ── CARD 6: The Hidden Architecture (Planes + Cycles) ─────
  const dominantText = PLANE_DOMINANT[dominantPlaneLower] || `Your dominant plane is ${dominant_plane}.`;
  const weakestText  = PLANE_WEAKEST[weakestPlaneLow]     || `Your least active plane is ${weakestPlaneLow}.`;

  let card6Body = `${dominantText} ${weakestText} The distribution across your four planes (Mental: ${plane_mental_count}, Physical: ${plane_physical_count}, Emotional: ${plane_emotional_count}, Intuitive: ${plane_intuitive_count}) shapes not just how you make decisions, but which problems you solve naturally and which ones quietly accumulate.`;
  card6Body += ` Your Personal Year ${personal_year_number} — ${personalYrEnt.label || ''} — is also significant right now: ${personalYrEnt.text ? personalYrEnt.text.split('\n\n')[0] : `it governs the energy theme of this entire year of your life.`} Your full blueprint maps these timing cycles in precise detail.`;

  const card6 = {
    card_number:   6,
    title:         `The Hidden Architecture`,
    subtitle:      `Dominant: ${dominant_plane.charAt(0).toUpperCase() + dominant_plane.slice(1)} · Personal Year ${personal_year_number}`,
    body:          card6Body,
    accent_number: personal_year_number,
    accent_label:  `Personal Year`,
  };

  // ── CARD 7: Shadows and Gifts ─────────────────────────────
  let card7Body = '';
  let card7AccentNum   = null;
  let card7AccentLabel = null;

  if (hasKarmicDebt) {
    const debtNum  = karmicDebtList[0];
    const debtText = KARMIC_DEBT[debtNum] || `Your karmic compound of ${debtNum} carries a specific invitation to deep growth — a doorway, not a burden.`;
    card7Body        = debtText;
    card7AccentNum   = debtNum;
    card7AccentLabel = 'Karmic Compound';
  } else if (karmicLessonsList.length > 0) {
    card7Body = `Your chart shows karmic lessons around the energies of ${karmicLessonsList.join(', ')} — values that appear less frequently in your name, suggesting areas this lifetime tends to call you to develop rather than lean on naturally. These are not deficiencies; they are specific doors that life keeps knocking on, in different forms, until you open them.`;
  } else if (hiddenPassionsList.length > 0) {
    const passionDesc = hiddenPassionsList
      .map(n => HIDDEN_PASSION_TEXT[n] || `a deep affinity with the energy of ${n}`)
      .join('; and ');
    card7Body = `Beneath the numbers your name and birth date declare openly, your chart carries hidden passions: ${passionDesc}. These are drives so fundamental they rarely surface as conscious goals — they simply shape every significant choice, whether or not you have ever named them.`;
  } else {
    card7Body = `The deeper layers of your chart reveal a remarkably balanced distribution of energy — which carries its own distinctive quality. Balanced charts tend to produce people who are genuinely difficult to read: versatile, adaptive, capable of moving through very different worlds with equal ease. This versatility is a gift, and it comes with a specific challenge.`;
  }

  // Always add timing hook
  card7Body += ` There are timing dimensions in your chart — your current Pinnacle ${current_pinnacle ? `(${current_pinnacle})` : ''}${pinnacle_1_end_age ? ` active until age ${pinnacle_1_end_age}` : ''}, your Challenge Number ${current_challenge || ''}, and the deeper cycle patterns — that exist in your full blueprint and speak precisely to where you are right now and where you are heading in the next one to three years.`;

  const card7 = {
    card_number:   7,
    title:         `Shadows and Gifts`,
    subtitle:      hasKarmicDebt ? `A karmic compound as doorway to depth` : `The deeper currents beneath the surface`,
    body:          card7Body,
    accent_number: card7AccentNum,
    accent_label:  card7AccentLabel,
  };

  // ── CARD 8: What Lies Beneath (CTA card) ─────────────────
  const card8Body = `This reading has traced the essential shape of your Chaldean chart — your Psychic Number ${psychic_number}, Destiny Number ${destiny_number}, Name Number ${name_number}, and the energies currently active in your life. But it has only traced the outline. Your Maturity Number ${maturity_number}${maturity_compound && maturity_compound !== maturity_number ? ` (compound ${maturity_compound})` : ''} — ${maturityEntry.label || ''} — describes who you are still in the process of becoming, and it carries some of the most personally relevant insights in your entire chart. Your current Pinnacle ${current_pinnacle ? `(${current_pinnacle})` : ''} speaks directly to the specific opportunities and pressures of this exact chapter. And the deeper analysis of your Psychic-Destiny combination ${pd_combination || `${psychic_number}-${destiny_number}`} — how these two ruling energies interact, where they create flow and where they create friction — is the quiet engine behind your most significant choices. If any part of this reading has felt true, your full blueprint will feel like finally reading the book that was written about you.`;

  const card8 = {
    card_number:   8,
    title:         `What Lies Beneath`,
    subtitle:      `Your invitation to go deeper`,
    body:          card8Body,
    accent_number: maturity_number,
    accent_label:  `Maturity Number`,
  };

  // ── TRAITS ────────────────────────────────────────────────
  const rawTraits = [
    ...(psychicEntry.traits   || []),
    ...(destinyEntry.traits   || []),
    ...(nameEntry.traits      || []),
  ];
  const traits = [...new Set(rawTraits)].slice(0, 6);

  // ── DOMINANT THEME ────────────────────────────────────────
  const dominant_theme = `A ${psychicEntry.label || `Psychic ${psychic_number}`} (ruled by ${ruling_planet || 'their ruling planet'}) walking the ${destinyEntry.label || `Destiny ${destiny_number}`} path — ${hasMaster ? `charged with Master Number ${primaryMaster} energy` : hasKarmicDebt ? `carrying the karmic compound ${karmicDebtList[0]} as their deepest teacher` : `grounded in steady purpose`} — and expressing through a ${nameEntry.label || `Name Number ${name_number}`} that meets the world with ${(nameEntry.traits || ['depth'])[0]}.`;

  // ── CTA ───────────────────────────────────────────────────
  const cta = {
    headline: `${firstName}'s full Chaldean blueprint goes far deeper than these 8 cards`,
    teaser_lines: [
      `What your Maturity Number ${maturity_number} reveals about who you are still becoming — and when that shift tends to arrive most powerfully`,
      `Your complete Pinnacle and Challenge map: the specific opportunities and lessons for every phase of your life from now onward`,
      hasKarmicDebt
        ? `The full meaning of your karmic compound ${karmicDebtList[0]} — what it has already shaped in your life, and how to work with it rather than against it`
        : `The deeper analysis of your ${pd_combination || `${psychic_number}-${destiny_number}`} Psychic-Destiny combination and what it reveals about the central tension and gift of your life`,
    ],
    button_text: 'Unlock My Full Blueprint',
  };

  return {
    first_name:     firstName,
    cards:          [card1, card2, card3, card4, card5, card6, card7, card8],
    cta,
    traits,
    dominant_theme,
  };
}

// ══════════════════════════════════════════════════════════════
//  run() — called by dispatcher
// ══════════════════════════════════════════════════════════════
function run(service, profile) {
  return buildCards(profile);
}

module.exports = { run };