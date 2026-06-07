// ============================================================
//  src/engines/hardcoded.js  v5
//
//  CHANGES from v4:
//    - buildPaidReadingHTML() completely rewritten
//      Uses the same HTML template as paid-reading.js (Claude engine)
//      so both engines produce identical-looking reports.
//    - New lookup tables added for paid reading depth:
//      HC_PSYCHIC_FULL, HC_DESTINY_FULL, HC_PERSONAL_YEAR_FULL,
//      HC_PINNACLE_FULL, HC_KARMIC, HC_C (colour palette), etc.
//    - Added require for buildPaidHTMLFromClaudeJSON from paid-reading.js
//    - All free reading logic (buildCards, extractFields, PSYCHIC,
//      DESTINY, etc.) completely unchanged.
// ============================================================

const { buildPaidHTMLFromClaudeJSON } = require('../services/paid-reading');

// ─────────────────────────────────────────────────────────────
//  FREE READING LOOKUP TABLES  (unchanged)
// ─────────────────────────────────────────────────────────────

const PSYCHIC = {
  1:{ label:'The Pioneer',    planet:'Sun',     traits:['Leader','Independent','Ambitious','Self-reliant','Determined'],
      text:(fn,n,planet,comp)=>`${fn}, your Psychic Number is ${n}${comp&&comp!==n?` (compound ${comp})`:''}${planet?`, ruled by the ${planet}`:''}.\n\nYou carry the energy of the pioneer — someone who leads not by appointment but by nature. Before you have spoken, people sense you have already decided. You think independently and trust your own instincts above collective opinion. In the Vedic tradition, the Sun governs authority, visibility, and the self that cannot be hidden.\n\nYour instinctive response to any situation is to take ownership of it. This is both your greatest strength and your most demanding teacher.` },
  2:{ label:'The Peacemaker', planet:'Moon',    traits:['Diplomatic','Sensitive','Cooperative','Intuitive','Harmonious'],
      text:(fn,n,planet,comp)=>`${fn}, your Psychic Number is ${n}${comp&&comp!==n?` (compound ${comp})`:''}${planet?`, ruled by the ${planet}`:''}.\n\nYou are wired for connection. You read the emotional temperature of a room before most people have even sat down — sensing what others feel before they have named it themselves. This is not sensitivity in the fragile sense. It is intelligence of a rare kind.\n\nThe Moon governs the mind, emotions, and the tides of feeling. You are its expression: fluid, perceptive, and capable of extraordinary attunement to other people's inner worlds.` },
  3:{ label:'The Creator',    planet:'Jupiter', traits:['Creative','Expressive','Optimistic','Communicative','Joyful'],
      text:(fn,n,planet,comp)=>`${fn}, your Psychic Number is ${n}${comp&&comp!==n?` (compound ${comp})`:''}${planet?`, ruled by ${planet}`:''}.\n\nYou carry the energy of expansion and expression. Ideas arrive in bursts; words flow naturally; people feel more alive in your presence. Jupiter — the Guru of the planets in Vedic tradition — blesses you with an optimism that is not naivety but genuine wisdom about what is possible.\n\nYour challenge is focus. Jupiter's abundance can scatter gifts across too many directions. The version of you that commits fully to one canvas is the one that changes things.` },
  4:{ label:'The Builder',    planet:'Rahu',    traits:['Grounded','Disciplined','Reliable','Methodical','Enduring'],
      text:(fn,n,planet,comp)=>`${fn}, your Psychic Number is ${n}${comp&&comp!==n?` (compound ${comp})`:''}${planet?`, ruled by ${planet}`:''}.\n\nYou understand, at a bone-deep level, that lasting things require patient, unglamorous work. Rahu — the shadow planet of ambition and karmic acceleration — gives you a hunger to break convention even while building something solid.\n\nYou are not content with the traditional path if a better one exists. You will find it, then build it better than anyone expected.` },
  5:{ label:'The Explorer',   planet:'Mercury', traits:['Adaptable','Curious','Magnetic','Quick-minded','Versatile'],
      text:(fn,n,planet,comp)=>`${fn}, your Psychic Number is ${n}${comp&&comp!==n?` (compound ${comp})`:''}${planet?`, ruled by ${planet}`:''}.\n\nMercury — the planet of intelligence, communication, and rapid movement — governs your instinctive self. You adapt faster than almost anyone around you. In any new environment, you orient and find your footing before others have stopped feeling lost.\n\nYour deepest lesson is stillness. Mercury's speed can become restlessness. Some of your most important discoveries will come from sitting long enough with what is already here.` },
  6:{ label:'The Nurturer',   planet:'Venus',   traits:['Devoted','Compassionate','Responsible','Harmonious','Aesthetic'],
      text:(fn,n,planet,comp)=>`${fn}, your Psychic Number is ${n}${comp&&comp!==n?` (compound ${comp})`:''}${planet?`, ruled by ${planet}`:''}.\n\nVenus governs your instinctive world — love, beauty, harmony, and the deep pull toward protecting what matters. You feel a calling to nurture: your family, your relationships, the spaces and people you have claimed as your own.\n\nYour challenge is learning to receive as generously as you give — love that flows only outward eventually runs dry.` },
  7:{ label:'The Seeker',     planet:'Ketu',    traits:['Analytical','Introspective','Spiritual','Perceptive','Solitary'],
      text:(fn,n,planet,comp)=>`${fn}, your Psychic Number is ${n}${comp&&comp!==n?` (compound ${comp})`:''}${planet?`, ruled by ${planet}`:''}.\n\nKetu — the south node, the most spiritual of all Vedic planetary influences — governs your instinctive self. You are not here for surface answers. You observe more than you speak, think in layers, and carry what feels like memories of questions you have been asking across lifetimes.\n\nIn a world that rewards confident noise, your quiet discernment is mistaken for aloofness. Those who know you understand that you see things others simply cannot.` },
  8:{ label:'The Powerhouse', planet:'Saturn',  traits:['Ambitious','Strategic','Authoritative','Resilient','Masterful'],
      text:(fn,n,planet,comp)=>`${fn}, your Psychic Number is ${n}${comp&&comp!==n?` (compound ${comp})`:''}${planet?`, ruled by ${planet}`:''}.\n\nSaturn — the planet of karma, discipline, and earned rewards — governs your instinctive self. You are built for mastery. Not the performance of power, but the real thing: the authority that comes from having done the work others walked away from.\n\nSaturn's blessing is delayed but profound. The 8 who does the work — honestly, patiently, without shortcuts — receives returns that compound over time.` },
  9:{ label:'The Old Soul',   planet:'Mars',    traits:['Compassionate','Wise','Generous','Idealistic','Universal'],
      text:(fn,n,planet,comp)=>`${fn}, your Psychic Number is ${n}${comp&&comp!==n?` (compound ${comp})`:''}${planet?`, ruled by ${planet}`:''}.\n\nIn Chaldean tradition, 9 is the sacred number — the completion of the cycle. Mars gives you the courage to act on what you feel, rather than merely carry it. You feel the weight of other people's suffering as if it were your own, and you are wired to do something about it.\n\nYour challenge is release. The 9 holds on — to grief, to people, to what should have been. Your greatest freedom arrives when you learn that letting go is not loss.` },
};

const DESTINY = {
  1: { label:'The Independent Leader',    traits:['Self-starter','Courageous','Original','Driven'],
       text:(fn,n,comp)=>`${fn}, your Destiny Number is ${n}${comp&&comp!==n?` — compound ${comp}`:''}. This is the overarching direction of your entire life: not who you are instinctively, but who you are being asked to become.\n\nA Destiny 1 is a life oriented around independence, initiation, and the courage to forge your own path. Every challenge that finds you is, at its core, an invitation to discover how resourceful you actually are.\n\nThe shadow of this Destiny is isolation: the belief that strength means needing no one. Your growth arrives when you discover that the most powerful leaders are also the most open learners.` },
  2: { label:'The Harmoniser',            traits:['Empathic','Collaborative','Patient','Perceptive'],
       text:(fn,n,comp)=>`${fn}, your Destiny Number is ${n}${comp&&comp!==n?` — compound ${comp}`:''}.\n\nA life built around partnership, sensitivity, and the quiet art of bringing people together. You feel things more deeply than the people around you realise — this is not weakness, it is a form of intelligence that perceives what others miss entirely.\n\nYour growth edge: harmony cannot always be maintained, and sometimes the most loving thing you can do is allow conflict to surface so it can be genuinely resolved.` },
  3: { label:'The Communicator',          traits:['Expressive','Playful','Inspiring','Creative'],
       text:(fn,n,comp)=>`${fn}, your Destiny Number is ${n}${comp&&comp!==n?` — compound ${comp}`:''}.\n\nA life of expression, creativity, and the gift of making the inner world shareable. You are here to communicate — to translate the invisible into something others can hold. This is a form of service, even when it looks like play.\n\nYour challenge is depth over breadth. One expression, fully committed to, will multiply beyond anything you imagined from the outside.` },
  4: { label:'The Foundation Maker',      traits:['Structured','Loyal','Methodical','Honest'],
       text:(fn,n,comp)=>`${fn}, your Destiny Number is ${n}${comp&&comp!==n?` — compound ${comp}`:''}.\n\nA life oriented around building, dedication, and the creation of things that outlast you. You understand at a bone-deep level that real things take real time. In a world addicted to shortcuts, your commitment to quality is quietly radical.\n\nYour shadow is rigidity. Adaptability is not failure — it is advanced engineering.` },
  5: { label:'The Freedom Seeker',        traits:['Dynamic','Versatile','Fearless','Progressive'],
       text:(fn,n,comp)=>`${fn}, your Destiny Number is ${n}${comp&&comp!==n?` — compound ${comp}`:''}.\n\nA life of transformation, experience, and the full unfiltered range of what it means to be alive. Change is not something that happens to you — you carry it with you wherever you go.\n\nYour deepest lesson: true freedom is not the absence of commitment. It is choosing, with full awareness, what you are committed to.` },
  6: { label:'The Caretaker',             traits:['Loving','Protective','Harmonious','Responsible'],
       text:(fn,n,comp)=>`${fn}, your Destiny Number is ${n}${comp&&comp!==n?` — compound ${comp}`:''}.\n\nA life of love, service, and the creation of beauty and belonging. You have an extraordinary capacity for love — the kind that shows up, remembers, stays when others leave.\n\nYour lesson: love given from compulsion or fear depletes. The 6 who learns to give freely discovers that genuine love is infinite.` },
  7: { label:'The Truth Seeker',          traits:['Introspective','Analytical','Spiritual','Wise'],
       text:(fn,n,comp)=>`${fn}, your Destiny Number is ${n}${comp&&comp!==n?` — compound ${comp}`:''}.\n\nA life of depth, solitude, and the relentless pursuit of truth beneath the surface. You are most alive in genuine questions — the kind that cannot be rushed or answered quickly.\n\nYour challenge: the wall. The 7 Destiny who only analyses without trusting eventually becomes isolated in their own precision. Wisdom only changes things when it is shared.` },
  8: { label:'The Manifestor',            traits:['Ambitious','Authoritative','Executive','Resilient'],
       text:(fn,n,comp)=>`${fn}, your Destiny Number is ${n}${comp&&comp!==n?` — compound ${comp}`:''}.\n\nA life of power, abundance, and mastery of how the material world actually works. You have an instinct for leverage. When this gift is aligned with integrity, what you build becomes something that is still standing long after you are gone.\n\nThe shadow: the belief that more is always better. Your greatest power lies in knowing when enough is enough.` },
  9: { label:'The Humanitarian',          traits:['Selfless','Visionary','Compassionate','Universal'],
       text:(fn,n,comp)=>`${fn}, your Destiny Number is ${n}${comp&&comp!==n?` — compound ${comp}`:''}.\n\nA life of completion, giving, and service to something larger than personal ambition. The 9 holds all other numbers within it, and you feel that weight.\n\nYour lesson: release. The 9 Destiny asks you to love without possessing, give without needing credit, and allow endings so beginnings can arrive.` },
  11:{ label:'The Inspired Messenger',    traits:['Visionary','Intuitive','Illuminating','Sensitive'],
       text:(fn,n,comp)=>`${fn}, your Destiny is the Master Number 11${comp&&comp!==n?` — compound ${comp}`:''}.\n\nOne of the most spiritually charged journeys in all of Chaldean numerology. You are here as a bridge between the invisible world of intuition and the visible world of human experience. The 11 is not designed for average output — you are here to inspire, elevate, and reveal what shimmers beneath the surface of the everyday.\n\nYour greatest challenge is your greatest gift: extreme sensitivity that allows insight but makes the noise of the world genuinely overwhelming.` },
  22:{ label:'The Master Builder',        traits:['Visionary','Disciplined','Powerful','Transformative'],
       text:(fn,n,comp)=>`${fn}, your Destiny is the Master Number 22${comp&&comp!==n?` — compound ${comp}`:''}.\n\nThe rarest and most powerful Destiny in Chaldean numerology. You are here to turn the most ambitious visions into concrete reality — not personal achievement, but structures that reshape how people live.\n\nYour challenge is the weight of your own potential. Begin. The vision clarifies in motion.` },
  13:{ label:'The Transformer (13/4)',     traits:['Disciplined','Determined','Transformative','Karmic'],
       text:(fn,n,comp)=>`${fn}, your Destiny carries the karmic compound 13, reducing to 4.\n\nThe energy of transformation through sustained effort. Every time you complete something difficult, you are settling a karmic debt and building genuine mastery simultaneously. The 13 is not a punishment — it is accelerated growth for a soul that once avoided the work.\n\nThe 13/4 Destiny often produces people who become extraordinary precisely because they had to earn everything.` },
  14:{ label:'The Freedom Earner (14/5)', traits:['Adaptable','Disciplined','Freedom-seeking','Karmic'],
       text:(fn,n,comp)=>`${fn}, your Destiny carries the karmic compound 14, reducing to 5.\n\nThe energy of freedom that must be earned through responsibility. In a previous karmic cycle there may have been a pattern of overindulgence in personal liberty at the expense of others.\n\nIn this life, the invitation is to discover what responsible freedom actually looks like: adventure with awareness, change with integrity.` },
  16:{ label:'The Spiritual Rebuilder (16/7)', traits:['Introspective','Humble','Spiritual','Karmic'],
       text:(fn,n,comp)=>`${fn}, your Destiny carries the karmic compound 16, reducing to 7.\n\nOne of the most spiritually significant compounds in Chaldean numerology — the energy of the fall of ego and the rebuilding of something more genuine. Your most profound growth arrives through experiences of loss or humbling.\n\nWhat emerges is extraordinary: a spiritual depth and authentic humility that no other path produces.` },
  19:{ label:'The Independent Spirit (19/1)', traits:['Courageous','Self-reliant','Independent','Karmic'],
       text:(fn,n,comp)=>`${fn}, your Destiny carries the karmic compound 19, reducing to 1.\n\nThe energy of independence that must be balanced with genuine care for others. In this life, the invitation is to discover that true strength includes the willingness to need people, and to allow them to need you in return.\n\nThe 19/1 Destiny often produces the most inspiring leaders — people whose authority is genuine because it was forged in understanding that power without compassion is just control.` },
};

const NAME_LABEL = {
  1:'Natural Leader', 2:'Collaborator', 3:'Expressive Artist', 4:'Systems Builder',
  5:'Versatile Communicator', 6:'Devoted Healer', 7:'Analytical Mystic',
  8:'The Executive', 9:'Wise Counsellor', 11:'Inspired Messenger', 22:'Visionary Builder',
};

const SOUL_URGE_DESC = {
  1:`craving autonomy and the freedom to do things entirely your way`,
  2:`craving deep reciprocal connection — to be truly seen by the people who matter`,
  3:`craving the freedom to express — your soul needs to respond to the world, to add something that was not there before`,
  4:`craving solid ground — not luxury, but stability, integrity, and things built to last`,
  5:`craving freedom and the thrill of the new — your soul is not built for sameness`,
  6:`craving love in its fullest expression — belonging, being genuinely needed, making a home`,
  7:`craving understanding — not information, but genuine insight into why things are the way they are`,
  8:`craving achievement and the tangible evidence of your own power`,
  9:`craving meaning — the deep satisfaction of knowing your life served something beyond itself`,
  14:`craving freedom so intensely it carries a karmic weight. The compound 14 means this craving is your deepest lesson as much as your deepest desire`,
};

const PERSONALITY_DESC = {
  1:`confident and decisive — someone who has already thought through the situation before others finish explaining it`,
  2:`warm, considerate, and genuinely interested in the people around you`,
  3:`vibrant, expressive, and genuinely enjoyable to be around — people brighten in your presence`,
  4:`steady, competent, and dependable — the person others call when they need the job done`,
  5:`dynamic, interesting, and impossible to fully predict — which makes you compelling to know`,
  6:`warm, caring, and genuinely invested in the people around you`,
  7:`intelligent, private, and slightly unknowable — creating a quiet intrigue that draws people toward you`,
  8:`powerful, competent, and worth paying attention to — you carry quiet authority`,
  9:`compassionate, broad-minded, and possessed of a gentle wisdom that feels rare`,
};

const MATURITY_LABEL = {
  1:'Maturing into Sovereignty', 2:'Maturing into Partnership', 3:'Maturing into Expression',
  4:'Maturing into Mastery', 5:'Maturing into Freedom', 6:'Maturing into Love',
  7:'Maturing into Wisdom', 8:'Maturing into Power', 9:'Maturing into Service',
  11:'Maturing into Inspired Wisdom', 22:'Maturing into Mastery at Scale', 33:'Maturing into Unconditional Love',
};

const PERSONAL_YEAR = {
  1:{ label:'New Beginnings',  tip:`Initiate. Plant seeds. Begin the thing you have been circling. Year 1 rewards action and punishes hesitation.` },
  2:{ label:'Partnership',     tip:`Slow down. Tend to connections. Collaborate rather than push alone. The foundations built now carry the next seven years.` },
  3:{ label:'Expression',      tip:`Socialise, create, communicate, enjoy. Opportunities arrive through people. Say yes more than you say no.` },
  4:{ label:'Building',        tip:`Hard work and structure. Not glamorous — but what you build with integrity this year will last.` },
  5:{ label:'Change',          tip:`Embrace flexibility. Change is coming whether or not you planned for it. The instability is carrying you somewhere important.` },
  6:{ label:'Responsibility',  tip:`Home, relationships, and love come to the foreground. Tend to what matters. Give freely but not at the expense of your own wellbeing.` },
  7:{ label:'Reflection',      tip:`Go inward. Read, think, learn. This is not a year for aggressive external expansion.` },
  8:{ label:'Achievement',     tip:`Act boldly. Financial and professional opportunities are more available now than in almost any other year.` },
  9:{ label:'Completion',      tip:`Finish, close, and release. The grace of Year 9 is proportional to your willingness to let go.` },
};

const KARMIC_DEBT_TEXT = {
  13:`The karmic compound 13 in your chart suggests a soul that may have avoided discipline in a previous cycle. Every time you complete something difficult in this life, you settle a karmic debt and build genuine mastery simultaneously.`,
  14:`The karmic compound 14 carries the energy of freedom that must be earned through responsibility. Your deepest craving and your deepest lesson live in the same place — this is not accidental, it is precisely designed.`,
  16:`The karmic compound 16 carries the energy of the fall of ego and the rebuilding of something more genuine. Your most profound growth arrives through humbling experiences — not as punishment, but as the universe ensuring your gifts are built on wisdom rather than pride.`,
  19:`The karmic compound 19 carries the energy of independence that must be balanced with genuine care for others. True strength is not self-sufficiency alone — it is the courage to need and be needed in return.`,
};

// ─────────────────────────────────────────────────────────────
//  PAID READING LOOKUP TABLES  (new — for buildPaidReadingHTML)
// ─────────────────────────────────────────────────────────────

const HC_PSYCHIC_FULL = {
  1: {
    interp: `{fn}, your Psychic Number is 1 — ruled by the Sun in Vedic tradition. This is the number of the pioneer: someone who leads not by appointment but by nature. Before you have spoken, people sense you have already decided. You think independently, trust your own instincts above collective opinion, and carry a quiet certainty that rarely announces itself and rarely doubts itself either.\n\nThe Sun governs authority, visibility, and the self that cannot be hidden. In Chaldean numerology, the Psychic Number describes who you are before the world shaped you — the factory settings of the self. For you, those settings include a deep need for autonomy, a natural assumption of responsibility, and an almost biological resistance to being told what to do when you already know.\n\nYour instinctive response to any situation is to take ownership of it. In moments of crisis, this is exactly what is needed. In moments requiring collaboration, it can close the conversation before it has opened.`,
    gift: `Your greatest gift is the capacity to begin. While others deliberate, you act. While others wait for permission, you have already started. This is not recklessness — it is a genuine talent for cutting through the noise of collective uncertainty and moving. The world needs people who can initiate. You are one of them.\n\nYou also carry an uncommon integrity. The Sun does not pretend to be what it is not. You have little patience for performance, and almost no ability to remain somewhere that asks you to be less than fully yourself.`,
    shadow: `The shadow of independence is isolation. The shadow of certainty is rigidity. When the Psychic 1 operates unconsciously, it can interpret every disagreement as a challenge to be defeated, every boundary offered by others as an obstacle rather than information.\n\nThe version of you that believes strength means needing no one is the version that will eventually find itself in a room alone, having mistaken solitude for sovereignty.`,
    vedic: `In Vedic astrology, the Sun (Surya) is the atmakaraka — the significator of the soul. It governs the father, authority figures, government, and the public self. For you, {fn}, these themes run through everything: your relationship with authority, your capacity to embody it, and the lifelong question of how you hold power without letting it separate you from the people who matter.`,
  },
  2: {
    interp: `{fn}, your Psychic Number is 2 — ruled by the Moon. You are wired for connection. You read the emotional temperature of a room before most people have even sat down — sensing what others feel before they have named it themselves. This is not sensitivity in the fragile sense. It is intelligence of a rare kind.\n\nThe Moon governs the mind, the emotions, and the cycles of feeling. It is the planet most associated with the inner world — with what is experienced rather than what is done. Your Psychic 2 means your instinctive relationship with life is relational: you understand things through their effect on people, and you process the world through the quality of connection it contains.\n\nYou are most yourself in genuine partnership. When the people around you are settled, you are settled. When they are disturbed, you feel it.`,
    gift: `Your gift is attunement. You understand people at a depth that others find both comforting and occasionally unsettling — you know things about them they have not said. In any group, you are the one who holds the relational fabric together: sensing tension before it surfaces, creating ease before it is asked for, remembering what others forgot to notice.\n\nThis is not a small thing. The world is held together by people who pay attention to other people. You are one of them.`,
    shadow: `The shadow of deep sensitivity is the blurring of self. When the Psychic 2 operates without awareness, it becomes impossible to know where your feelings end and another person's begin. You may find yourself carrying emotional weight that does not belong to you, adjusting your position so frequently to keep peace that you eventually lose the thread of your own perspective.\n\nThe Moon has no light of its own — it reflects the Sun. The Psychic 2's deepest work is learning to be genuinely responsive without becoming a mirror.`,
    vedic: `The Moon (Chandra) in Vedic tradition governs the mind — not the intellect, but the manas, the experiencing mind. It governs what we take in, how we digest experience, and the quality of our emotional life. For you, {fn}, the Moon's influence means your inner life is rich, changeable, and deeply responsive to your environment. Cycles matter to you more than to most.`,
  },
  3: {
    interp: `{fn}, your Psychic Number is 3 — ruled by Jupiter, the Guru of the planets in Vedic tradition. You carry the energy of expansion and expression. Ideas arrive in bursts; words flow naturally; people feel more alive and more optimistic in your presence. This is not charm as a technique — it is an energetic quality you were born with.\n\nJupiter blesses with abundance, which means your instinctive relationship with life is generous. You tend to see what is possible rather than what is fixed, to add rather than subtract, to say yes before you say no. In a world that teaches scarcity and caution from an early age, this is genuinely unusual.\n\nYour challenge is the shadow side of abundance: the difficulty of choosing. Jupiter's gifts are many, which means the Psychic 3 must learn the deeper abundance of committing fully to one thing at a time.`,
    gift: `You give people hope. Not through hollow reassurance, but through genuine enthusiasm for what is possible. Your gift for communication — written, spoken, or simply through your presence — creates an atmosphere where others feel able to attempt things they would not have attempted without you.\n\nCreativity is not something you do; it is how you breathe. The need to make, express, and contribute something new is not optional for you. It is the condition of being fully alive.`,
    shadow: `The shadow of Jupiter is excess. The Psychic 3 that operates without awareness can scatter its gifts across too many directions, begin more than it completes, and use enthusiasm as a way of avoiding the discipline that any single gift requires to become mastery.\n\nThe other shadow is performance. The 3 that has learned to be entertaining rather than genuine has found the most sophisticated hiding place available.`,
    vedic: `Jupiter (Brihaspati) is the Guru — the teacher of the gods in Vedic cosmology. It governs wisdom, dharma, children, generosity, and the impulse toward the higher. For you, {fn}, Jupiter's influence means you carry an innate sense that life is meant to be more than it currently is — a constant, healthy dissatisfaction with the ceiling that drives expansion.`,
  },
  4: {
    interp: `{fn}, your Psychic Number is 4 — governed by Rahu, the shadow planet of ambition and karmic acceleration in the Vedic tradition. The 4 is the builder: someone who understands at a bone-deep level that lasting things require patient, unglamorous work. You trust what is solid, what is tested, what can be verified against reality.\n\nRahu's influence gives the Psychic 4 an unusual edge — you are not content with the conventional path simply because it is conventional. You will examine it, challenge it, and if a better way exists, you will find it. Then you will build it more carefully than anyone expected.\n\nYour instinctive response to the world is methodical. Before you act, you have already mapped the terrain. This is not caution born of fear — it is the precision of someone who takes results seriously.`,
    gift: `You finish what you start. In a world of beginners and enthusiasts, you are a completer — someone who does what they said they would do, delivers what they promised, and does not require external validation to maintain effort. This is rarer than it sounds.\n\nYou also have an uncommon ability to create systems. Where others see chaos, you see a problem waiting to be organised. The gift of the Psychic 4 is that you can take something shapeless and give it the structure it needs to function.`,
    shadow: `The shadow of structure is rigidity. The Psychic 4 that operates unconsciously can mistake its methods for the only methods, its timeline for the only timeline, its way of doing things for the right way.\n\nThe other shadow is the withholding of trust. The 4 that has been disappointed by unpredictability can begin to prefer systems to people, certainty to relationship, control to connection. The work is learning that some things cannot be built — only grown.`,
    vedic: `Rahu is the north node of the Moon — a shadow planet with no physical form but immense karmic weight. In Vedic tradition, Rahu governs worldly ambition, unconventional paths, foreign influence, and the breaking of inherited patterns. For you, {fn}, Rahu's energy means you are here to build something genuinely new — not merely to replicate what came before.`,
  },
  5: {
    interp: `{fn}, your Psychic Number is 5 — ruled by Mercury, the planet of intelligence, communication, and rapid movement. You adapt faster than almost anyone around you. In any new environment, you orient and find your footing before others have stopped feeling lost. This is your native intelligence — not just the ability to think, but the ability to move.\n\nThe 5 is the most curious number in the Chaldean system. Your instinctive relationship with life is one of inquiry: what is this, how does it work, what else is possible? You are drawn to variety not out of superficiality but out of genuine hunger to understand the full range of what exists.\n\nPeople find you magnetic precisely because you are genuinely interested. Real curiosity is rare, and others can feel it.`,
    gift: `Your gift is versatility that feels effortless. You can move between contexts, people, disciplines, and registers of conversation with a fluency that most spend years trying to develop. The Psychic 5 carries an almost translating function — you can explain one world to another, connect people who would otherwise never meet, and find the common thread between apparently unrelated things.\n\nYou are also uncommonly good at seeing opportunity. Mercury's quick eye means you often notice the opening before the room has registered a change.`,
    shadow: `The shadow of Mercury is restlessness. The 5 that has not learned stillness can exhaust itself — and the people who love it — through the constant need for movement and novelty. The deepest relationships, the deepest mastery, the deepest satisfaction all require staying in one place long enough for something real to develop.\n\nThe other shadow is using wit as a distance mechanism. The Psychic 5 is extraordinarily good at keeping things light. Sometimes the most important things are not light.`,
    vedic: `Mercury (Budha) in Vedic tradition governs intellect, discrimination, speech, commerce, and the capacity for learning. It is the most neutral of the Vedic planets — it takes on the quality of whatever it is associated with. For you, {fn}, Mercury's influence means your intelligence is relational and contextual: you think best in conversation, in movement, in response to the living world.`,
  },
  6: {
    interp: `{fn}, your Psychic Number is 6 — ruled by Venus, the planet of love, beauty, and the deep pull toward protecting what matters. You feel a calling to nurture: your family, your relationships, the spaces and people you have claimed as your own. This is not something you decided. It was already operating before you were old enough to name it.\n\nVenus governs the aesthetic as much as the relational — the Psychic 6 has an innate sense of what is beautiful, what is harmonious, what is off. You may not call yourself an artist, but you curate your environment, your relationships, and your life with an artist's eye for what fits and what doesn't.\n\nYour instinctive response to the world is protective. When something or someone you love is threatened, the warmth of the 6 becomes the fierce loyalty of the 6 — a quality that surprises people who only know the softer side.`,
    gift: `Your gift is the creation of belonging. Wherever you go, you make people feel at home in a way that is not technique but genuine warmth. You remember what matters to people. You tend to the small things that others overlook. You understand, without being told, what someone needs.\n\nYou also carry an extraordinary capacity for commitment. When the Psychic 6 chooses something — a person, a project, a cause — it does not choose lightly, and it does not leave easily. This depth of loyalty is one of the most sustaining forces in any life or organisation it touches.`,
    shadow: `The shadow of the nurturer is the assumption that loving someone means managing them. The Psychic 6 can find it genuinely difficult to allow the people it loves to struggle, to fail, to find their own way — because the urge to help is so immediate and so strong that waiting feels like abandonment.\n\nThe other shadow is martyrdom: giving so consistently and so completely that resentment accumulates where gratitude was expected. The 6's deepest lesson is learning that receiving is also a form of love — that allowing others to give is a gift, not a weakness.`,
    vedic: `Venus (Shukra) in Vedic tradition is the guru of the asuras — the teacher of desire, beauty, and worldly wisdom. It governs love, marriage, the arts, luxuries, and the understanding of what makes life genuinely worth living. For you, {fn}, Venus's influence means your deepest intelligence is relational and aesthetic — you understand quality, connection, and the texture of a life well-lived.`,
  },
  7: {
    interp: `{fn}, your Psychic Number is 7 — governed by Ketu, the south node, the most spiritual of all Vedic planetary influences. You are not here for surface answers. You observe more than you speak, think in layers, and carry what feels like memories of questions you have been asking across lifetimes.\n\nThe 7 is the seeker — the number of the inner journey, the pursuit of truth beneath the surface of things. Your instinctive relationship with life is investigative: why is this the way it is, what is actually happening beneath what is being said, what does this mean at the deepest level? You are constitutionally unable to accept easy answers.\n\nIn a world that rewards confident noise, your quiet discernment is frequently mistaken for aloofness or disinterest. Those who know you understand that you are present — more present than most — simply on a frequency that not everyone can receive.`,
    gift: `Your gift is perception. You see what others overlook, sense what others dismiss, and arrive at understanding through routes that bypass the obvious. This makes you an extraordinary analyst, counsellor, researcher, or creative — anyone who needs someone to go further than the evidence suggests.\n\nYou also carry a natural authority in the domain of inner truth. People bring you their real questions, not the performative ones, because they sense you will not give them a comfortable answer when an honest one is needed.`,
    shadow: `The shadow of the seeker is the ivory tower. The Psychic 7 that has retreated fully into the inner world can become unreachable — not because it is cold, but because it has decided that genuine understanding is impossible with most people, and so it has stopped trying.\n\nThe other shadow is analysis as avoidance. The 7 that thinks instead of feels, that investigates instead of participates, that understands instead of risking, has found a very sophisticated way of not being present for its own life.`,
    vedic: `Ketu is the south node of the Moon — representing liberation, past-life wisdom, and the spiritual path that leads away from worldly attachment. In Vedic tradition, Ketu is associated with moksha, with the cutting of karmic threads, and with the gifts that have already been earned in previous lifetimes. For you, {fn}, Ketu's influence means you carry knowledge that feels older than your years — an inner compass that was calibrated somewhere else.`,
  },
  8: {
    interp: `{fn}, your Psychic Number is 8 — ruled by Saturn, the planet of karma, discipline, and earned rewards. You are built for mastery. Not the performance of power, but the real thing: the authority that comes from having done the work others walked away from, understood the system others found too complex, and stayed in the room after everyone else had left.\n\nSaturn does not give easily or quickly. But what it gives, it gives permanently. The Psychic 8 carries this planetary energy as an instinct — you know, somewhere in your cells, that nothing real is free. And rather than resentment at this knowledge, you feel something closer to satisfaction: the work is the point.\n\nYour instinctive response to the world is strategic. You see the long game before others have finished celebrating the short one. You are playing for a different timeline than most of the people around you.`,
    gift: `Your gift is resilience that looks like power. The Psychic 8 can absorb pressure that would break most people, learn from failure in ways that most cannot, and return from setback with something that was not there before the setback. Saturn's most extraordinary gift is the capacity to be improved by difficulty — and you carry this capacity in abundance.\n\nYou also have an uncommon instinct for how the material world works: how resources move, how power concentrates, how systems can be navigated by someone who understands their logic.`,
    shadow: `The shadow of Saturn is the belief that control equals safety. The Psychic 8 that has been hurt by unpredictability can begin to equate emotional expression with vulnerability it cannot afford, softness with weakness, and need with dependency. The armour becomes indistinguishable from the person.\n\nSaturn also carries the shadow of the delayed life — the sense that real living will begin when the work is done, when the achievement is secured, when the threshold is crossed. The Psychic 8's deepest work is learning that the life is now, not after.`,
    vedic: `Saturn (Shani) is the most karmic of the Vedic planets — the great taskmaster, the lord of time, the planet that rules cause and effect across lifetimes. In Vedic tradition, a strong Saturn in the chart indicates a soul that is serious about its purpose, that came here to earn what it receives, and that will not be deflected by shortcuts. For you, {fn}, Saturn's influence means your deepest satisfaction comes not from what is given but from what is built.`,
  },
  9: {
    interp: `{fn}, your Psychic Number is 9 — ruled by Mars, the planet of courage and the warrior impulse. In Chaldean numerology, 9 is the sacred number — the number of completion, of the full cycle, of the soul that has seen enough of human experience to feel its weight. You carry this weight. You feel the fullness of human suffering and human possibility in a way that others do not — and you are wired to do something about it.\n\nMars gives you the courage to act on what you feel rather than merely carry it. The Psychic 9 is not passive compassion — it is mobilised compassion, the kind that rolls up its sleeves and gets involved. You do not observe injustice from a distance. It activates you.\n\nYour instinctive relationship with life is universal. Your circle of concern tends to be wider than most people's. This is both your greatest gift and your most significant challenge.`,
    gift: `Your gift is the kind of compassion that changes things. Not sentiment, but genuine engagement with the reality of other people's suffering and a willingness to act from that engagement. The Psychic 9 at its best is not just kind — it is effective, because Mars ensures that the feeling is translated into movement.\n\nYou also carry a natural wisdom that feels earned across multiple lifetimes. People come to you with their deepest questions because they sense, correctly, that you have already been there and already thought about this.`,
    shadow: `The shadow of the 9 is holding on. Everything — grief, people, experiences, identities — longer than is healthy. The Psychic 9 has a profound capacity for love, which means it also has a profound capacity for the specific pain of having to let go of what it loves. The work of the 9 is release: learning that endings are not failures, that letting go is not abandonment, and that every completion makes space for a beginning.\n\nThe other shadow is the saviour complex — the belief that it is your responsibility to fix what is broken in everyone around you. Mars can make the 9's compassion forceful in ways that remove other people's agency.`,
    vedic: `Mars (Mangal) in Vedic tradition governs courage, action, will, the warrior impulse, and the ability to cut through what is no longer needed. It is the planet of initiative and decisive action. For you, {fn}, Mars's influence means your compassion is not passive — it has teeth. You feel deeply and you act from what you feel. This combination, when conscious, produces the rarest kind of human being: someone who is both genuinely caring and genuinely effective.`,
  },
};

const HC_DESTINY_FULL = {
  1:  { interp: `Your Destiny Number is 1 — a life oriented around independence, initiation, and the courage to forge your own path. In Chaldean numerology, the Destiny Number is not who you are but who you are being asked to become across the arc of your entire life. For a 1 Destiny, that arc bends toward sovereignty: the development of genuine self-reliance, original thought, and the leadership that emerges from knowing, rather than merely asserting, that you have something real to contribute.\n\nEvery significant challenge in a 1 Destiny life is, at its core, an invitation to discover how resourceful you actually are. The situations that remove your supports, the relationships that ask you to stand without leaning, the professional moments that require an original response — these are not obstacles. They are the curriculum.\n\nThe Destiny 1 does not usually arrive fully formed. It tends to emerge through a series of experiences that strip away borrowed certainty and leave only what is genuinely yours. What remains after this stripping is the real foundation of a 1 Destiny life.`, soul: `You are here to discover that the authority you have been seeking from outside has always been available from inside. The 1 Destiny's central question — "Can I trust my own judgment?" — is answered not through a single decision but through the accumulated evidence of a life lived from genuine self-direction.\n\nAt its highest, the Destiny 1 becomes not just independent but inspiring — someone whose refusal to do what is expected creates permission for others to do the same.` },
  2:  { interp: `Your Destiny Number is 2 — a life built around partnership, sensitivity, and the quiet art of bringing people together. Where the Psychic Number describes instinct, the Destiny Number describes the purpose that life is moving you toward. For a 2 Destiny, that purpose is relational: the development of genuine collaboration, diplomatic intelligence, and the capacity to create connection across difference.\n\nThe 2 Destiny is not a passive life. It requires extraordinary skill — the skill of holding space for multiple perspectives simultaneously, of being genuinely present for other people's experience without losing the thread of your own, of creating harmony that is real rather than performed.\n\nYou feel things more deeply than the people around you realise. This depth of perception is the core gift of the 2 Destiny — and it requires learning to work with rather than against the sensitivity that comes with it.`, soul: `You are here to demonstrate that strength and softness are not opposites. The 2 Destiny's contribution to the world is not achieved through force or dominance but through the patient, skilled work of genuine connection. At its highest, the Destiny 2 becomes a kind of living bridge — someone whose presence makes cooperation possible where conflict existed before.` },
  3:  { interp: `Your Destiny Number is 3 — a life of expression, creativity, and the gift of making the inner world shareable. The Destiny 3 is here to communicate: to translate the invisible into something others can hold, experience, and be changed by. This is a form of service, even when it looks like play.\n\nJupiter governs the 3 Destiny's expansive trajectory. The themes of growth, generosity, and the reaching-beyond-the-current-ceiling run through the significant events of this life. Every time a Destiny 3 is pushed to express more fully, to share more honestly, to create something that requires real vulnerability — that is the Destiny at work.\n\nThe challenge of the 3 Destiny is depth over breadth. Jupiter's abundance can scatter gifts across too many surfaces. The version of this life that commits fully — one expression, one discipline, one creative pursuit taken all the way — is the version that produces something genuinely lasting.`, soul: `You are here to add something to the world that was not there before. Not to report on what exists, but to create what does not yet exist. The 3 Destiny's contribution is always generative: new understanding, new beauty, new ways of seeing.` },
  4:  { interp: `Your Destiny Number is 4 — a life oriented around building, dedication, and the creation of things that outlast their maker. The Destiny 4 understands at the deepest level that real things take real time, that quality requires patience, and that the glamour of the beginning is meaningless without the discipline of the middle.\n\nRahu's influence on the 4 Destiny adds an unconventional edge: you are not here to build what has already been built. You are here to build it differently — to find the structure that actually works rather than merely the structure that is expected.\n\nIn a world addicted to shortcuts and quick results, the Destiny 4's commitment to genuine craftsmanship is quietly radical. What you build tends to last precisely because you refused to rush it.`, soul: `You are here to demonstrate that patience is not the absence of ambition but its highest expression. The 4 Destiny's deepest contribution is the proof that something extraordinary can be built by ordinary, sustained, unglamorous effort applied over enough time.` },
  5:  { interp: `Your Destiny Number is 5 — a life of transformation, experience, and the full, unfiltered range of what it means to be alive. The Destiny 5 is not designed for a single track. It requires the full curriculum: multiple contexts, multiple disciplines, multiple ways of understanding the world. Change is not something that happens to the 5 Destiny — it is the medium through which this life learns.\n\nMercury governs the 5 Destiny's restless intelligence. The capacity to understand different worlds, to translate between them, to find the common thread — this is what this life is building toward. The Destiny 5's contribution to others is often the bridge it provides between things that seemed separate.\n\nThe deepest lesson of the 5 Destiny is that true freedom is not the absence of commitment. It is choosing, with full awareness, what you are committed to — and discovering that genuine commitment does not reduce freedom but deepens it.`, soul: `You are here to experience widely and distil wisely. The 5 Destiny gathers understanding from many places and many lives and eventually arrives at something that could not have been reached any other way — a wisdom born of genuine breadth.` },
  6:  { interp: `Your Destiny Number is 6 — a life of love, service, and the creation of beauty and belonging. The Destiny 6 carries an extraordinary capacity for love: the kind that shows up, remembers, stays when others leave, and attends to the small things that make a life genuinely liveable rather than merely functional.\n\nVenus governs the 6 Destiny's orientation toward beauty and harmony. This is not decoration — it is the understanding that the quality of an environment, a relationship, a community directly affects the quality of the lives within it. The Destiny 6 builds homes: physical ones, relational ones, emotional ones.\n\nThe lesson of the 6 Destiny is the distinction between love offered freely and love offered from obligation or fear. The highest version of this life gives without calculation — and discovers that this kind of love is, in fact, inexhaustible.`, soul: `You are here to demonstrate what genuine care looks like at scale. The 6 Destiny's contribution is the model of love as a practice rather than a feeling — love as something you do, every day, regardless of whether it is returned in kind.` },
  7:  { interp: `Your Destiny Number is 7 — a life of depth, solitude, and the relentless pursuit of truth beneath the surface. The Destiny 7 is the most inward of all Destiny Numbers — not antisocial, but genuinely nourished by depth in a way that requires time alone to process experience fully.\n\nKetu governs the 7 Destiny's spiritual trajectory. This is a life that is being asked to go further into understanding than is comfortable, to sit with questions longer than most people can, and to develop an inner authority that does not require external validation.\n\nThe most alive version of the Destiny 7 is not the one that has all the answers — it is the one that has learned to live inside the questions with grace. This life tends to produce wisdom that is genuinely hard-won and therefore genuinely useful to others.`, soul: `You are here to go deep and come back and tell people what you found. The 7 Destiny's contribution is the report from the depths — the understanding that can only be acquired through the willingness to descend.` },
  8:  { interp: `Your Destiny Number is 8 — a life of power, mastery, and the understanding of how the material world actually works. The Destiny 8 is built for scale: for understanding how resources move, how systems function, how lasting structures are built and maintained.\n\nSaturn governs the 8 Destiny's trajectory through karma and earned authority. What this life produces is not given but earned — through sustained effort, through the willingness to understand how things actually work rather than how they should work, and through the patience to operate on Saturn's timeline rather than desire's.\n\nThe gift of the Destiny 8, fully realised, is not personal wealth but the capacity to create conditions in which others can thrive. The 8 that has understood its own Destiny uses its power to build something that outlasts it.`, soul: `You are here to demonstrate that material mastery and spiritual integrity are not opposites. The highest Destiny 8 wields power with wisdom — understanding that authority is most powerful when it is most accountable.` },
  9:  { interp: `Your Destiny Number is 9 — a life of completion, giving, and service to something larger than personal ambition. In Chaldean numerology, 9 contains all other numbers within it — the 9 Destiny carries the accumulated understanding of every number that came before it.\n\nMars governs the 9 Destiny's capacity for action. This is not a passive life of self-sacrifice — it is a life of mobilised compassion, of genuine engagement with the world's pain, of the willingness to act from what is felt rather than merely to feel it.\n\nThe deepest lesson of the 9 Destiny is release: the willingness to love without possessing, give without needing credit, complete without holding on to what has been built. The grace of the 9 Destiny is proportional to this willingness.`, soul: `You are here to give what you have accumulated — understanding, compassion, wisdom, skill — in the service of something beyond yourself. The 9 Destiny's greatest legacy is not what it built but what it made possible for others.` },
  11: { interp: `Your Destiny is Master Number 11 — one of the most spiritually charged journeys in Chaldean numerology. Fewer than 8% of charts carry a Master Number in the Destiny position. You are here as a bridge: between the invisible world of intuition and the visible world of human experience, between what is and what could be, between the individual and the collective.\n\nThe 11 Destiny is not designed for ordinary output. You are here to inspire, to elevate, to make visible what shimmers beneath the surface of the everyday. This requires the development of an extraordinary inner life — because you cannot transmit what you have not yourself received.\n\nThe deepest challenge of the 11 Destiny is the sensitivity that makes the gift possible. The same attunement that allows you to perceive what others cannot also makes the noise and violence of the ordinary world genuinely overwhelming.`, soul: `You are here to demonstrate that inner truth, when lived with enough courage and clarity, becomes a resource for everyone who encounters it. The 11 Destiny's contribution is not the brilliant idea — it is the lived example.` },
  22: { interp: `Your Destiny is Master Number 22 — the rarest and most architecturally powerful Destiny in Chaldean numerology. Fewer than 3% of charts carry this number. You are here to build at a scale that changes how people live — not personal achievement, but the creation of structures, systems, and contributions that reshape the fabric of collective experience.\n\nThe 22 Destiny operates at the intersection of the visionary and the practical. The Master Builder is not a dreamer — it is someone who can hold the largest vision and simultaneously manage the detail required to bring it into physical reality.\n\nThe challenge of the 22 Destiny is the weight of its own potential. The gap between what this life could produce and what has been produced so far can become a source of paralysis rather than motivation. Begin. The vision clarifies in motion.`, soul: `You are here to build something that will still be standing after you are gone — something that serves not just the people you know but the people who come after.` },
};

const HC_PERSONAL_YEAR_FULL = {
  1: `Personal Year 1 is the opening chapter of a new nine-year cycle. Everything that was completed, released, or ended in your Year 9 has created the space for something genuinely new to take root. This is the year to plant seeds, to initiate, to begin the thing you have been circling.\n\nYear 1 rewards action and punishes hesitation. The energy of this year is not interested in careful deliberation — it is interested in the first step. What begins now has the potential to shape the next nine years of your life. Plant deliberately.\n\nThe invitation of Personal Year 1: be willing to begin before you feel ready. Independence and self-initiation are the themes. The new path will not appear fully formed — it reveals itself step by step, to those who are already moving.`,
  2: `Personal Year 2 asks you to slow down and tend to what Year 1 planted. This is not a year of dramatic forward movement — it is a year of relationship, cooperation, and the patient work of letting things develop at their own pace.\n\nConnections matter more than individual achievement in a 2 year. The foundations built in relationships — professional, personal, creative — carry the seeds of the next phase. Do not mistake the year's gentler pace for stagnation.\n\nThe invitation of Personal Year 2: allow. Collaborate rather than compete. Tend to your existing connections with genuine attention. What grows slowly in a 2 year tends to last.`,
  3: `Personal Year 3 is one of the most socially and creatively alive years in the cycle. Opportunities arrive through people, through conversations, through saying yes to invitations that the previous year's interiority might have declined. Communication, creativity, and expression are the currencies of this year.\n\nThis is a year to enjoy — to socialise more than you think you need to, to create more than you think you have time for, to express more freely than feels entirely safe. The energy of a 3 year rewards generosity and penalises hoarding.\n\nThe invitation of Personal Year 3: let yourself be seen. Share what you have been keeping private. Connect. Create. The expansion available in a 3 year is proportional to the willingness to engage.`,
  4: `Personal Year 4 is the year of honest, unglamorous work. After the social expansion of Year 3, this year asks for structure, discipline, and the building of foundations that will support everything that comes after. This is not an exciting year — it is an important one.\n\nHealth, finances, work structures, and practical systems all benefit from attention in a 4 year. What is built here with genuine care tends to last through the entire cycle. What is skipped tends to create problems in Years 7, 8, and 9.\n\nThe invitation of Personal Year 4: do the work. Build carefully. Attend to the practical dimensions of your life with seriousness. The reward is not immediate — it is the stability that allows Years 5, 6, and 7 to be lived fully.`,
  5: `Personal Year 5 is a year of movement, change, and the unexpected. After the discipline of Year 4, life opens up — sometimes dramatically, sometimes uncomfortably. Travel, new people, changed circumstances, and the loosening of structures that had become too tight are all signatures of a 5 year.\n\nThe invitation is not to manufacture change but to receive it gracefully — to work with the instability rather than against it, understanding that something is being liberated even when it feels like disruption.\n\nThe invitation of Personal Year 5: stay flexible. Resist the urge to control the direction of this year's movement. Trust that the instability is carrying something important — a new freedom, a new possibility, or the removal of what was no longer serving the life you are building.`,
  6: `Personal Year 6 brings home, relationships, family, and love to the foreground. After the movement of Year 5, this year asks you to settle, to commit, to tend to the people and responsibilities that matter most.\n\nThe 6 year often brings important decisions about home, family, and intimate relationships. It can also bring an increased sense of responsibility — for others, for commitments, for the quality of the environment you create around you.\n\nThe invitation of Personal Year 6: give freely, but not at the expense of your own wellbeing. Tend to what matters with genuine care. The 6 year rewards presence and attention — not performance, but genuine showing up.`,
  7: `Personal Year 7 is the most inward year of the cycle — a year for deep reflection, study, spiritual development, and the kind of inner work that cannot be done in the middle of external activity. After the responsibilities of Year 6, Year 7 asks for retreat, for quiet, for the replenishment that only genuine solitude can provide.\n\nThis is not a year for aggressive external expansion. Plans made in a 7 year rarely produce what was expected — not because the year is bad, but because its gifts are interior. What is understood about yourself in a 7 year becomes the foundation for the achievement of Years 8 and 9.\n\nThe invitation of Personal Year 7: go inward. Study. Meditate. Write. The world will wait. What you discover about yourself in this year is the most valuable thing you will produce.`,
  8: `Personal Year 8 is the harvest year — the year when the work of the previous seven years can produce its most significant material and professional results. Financial opportunities, career advancement, recognition, and the exercise of genuine authority are all signatures of a well-used 8 year.\n\nThis is the year to act boldly on the professional and material front. The energy of an 8 year amplifies what is invested in it — both effort and intention. It is also a year of karmic accounting: what was built honestly tends to flourish, and what was built on a shaky foundation tends to be revealed.\n\nThe invitation of Personal Year 8: step into your power. Ask for what you have earned. Invest with genuine intention. The 8 year does not produce results without effort — but with effort, it produces results that no other year can match.`,
  9: `Personal Year 9 is the final chapter of this nine-year cycle — a year of completion, release, and the graceful letting go of what has run its course. People, situations, identities, and commitments that no longer serve the life you are building will naturally come to their conclusion in a 9 year.\n\nThe grace of a 9 year is proportional to the willingness to release. What is held on to past its time becomes heavy; what is allowed to complete itself creates extraordinary space for Year 1's new beginning.\n\nThe invitation of Personal Year 9: complete what needs completing. Release what is ready to go. This is a year of endings — not failure, but the natural close of a chapter. The space you create now is exactly the space that Year 1 will fill.`,
};

const HC_PINNACLE_FULL = {
  1:  `Pinnacle 1 is a chapter governed by independence, initiation, and the development of genuine self-reliance. During this phase, life tends to provide situations that ask you to stand on your own authority, to trust your own judgment, and to discover what you are genuinely capable of when external supports are removed or reduced. This is not a comfortable Pinnacle — it is a clarifying one. The question it asks, in a hundred different forms, is: "Do you trust yourself?" The answer is built through action, not reflection.`,
  2:  `Pinnacle 2 is a chapter of partnership, patience, and the development of relational intelligence. During this phase, the most significant growth happens through connection — through learning to collaborate genuinely, to receive as well as give, and to develop the sensitivity that makes real partnership possible. This is a quieter chapter than some, and its gifts are often not recognised until they are tested in the chapters that follow.`,
  3:  `Pinnacle 3 is a chapter of creative expression, social expansion, and the development of the communicative gifts. During this phase, opportunities tend to arrive through people and through the willingness to express what has been kept inside. This is a chapter that rewards generosity, creative risk, and genuine engagement with the world. What is expressed honestly during a 3 Pinnacle tends to reach further than expected.`,
  4:  `Pinnacle 4 is a chapter of building, discipline, and the development of the capacity for sustained, patient effort. During this phase, the most significant growth happens through the willingness to do unglamorous, necessary work over long periods. The structures built during a 4 Pinnacle — in career, in relationships, in personal practice — tend to outlast every other chapter.`,
  5:  `Pinnacle 5 is a chapter of change, freedom, and the development of adaptability. During this phase, life tends to move faster than expected — bringing new people, new situations, and new possibilities that require genuine flexibility. The Pinnacle 5 can feel unstable from the inside while producing extraordinary breadth and variety of experience. What is learned during this chapter through genuine engagement with the unexpected becomes a permanent resource.`,
  6:  `Pinnacle 6 is a chapter of love, responsibility, and the development of the capacity for genuine commitment. During this phase, relationships, family, and home tend to take centre stage. The most significant growth happens through the willingness to care for others with consistency and depth — and through learning the difference between love given freely and love given from obligation.`,
  7:  `Pinnacle 7 is a chapter of inner development, solitude, and the pursuit of deeper understanding. During this phase, the most significant growth happens in private — through study, reflection, spiritual practice, and the willingness to go further into the inner world than is entirely comfortable. The external world may seem to move more slowly during a 7 Pinnacle; the inner world, if attended to honestly, moves with extraordinary richness.`,
  8:  `Pinnacle 8 is a chapter of material and professional achievement, and the development of genuine authority. During this phase, the themes of power, money, and mastery come to the foreground — not as distractions but as the specific curriculum of this life chapter. What is built during an 8 Pinnacle with genuine integrity tends to produce lasting results. Saturn's rewards are earned, never given — but they are permanent.`,
  9:  `Pinnacle 9 is a chapter of completion, service, and the generous giving of accumulated wisdom. During this phase, the themes of release and contribution come to the foreground. Life tends to provide situations that ask for the giving of what has been earned — in service, in generosity, in the willingness to complete what needs completing and release what is ready to go.`,
  11: `Pinnacle 11 is a chapter governed by Master Number energy — heightened intuition, inspired creativity, and the call to connect the inner world with the outer in a way that uplifts others. This is one of the most significant Pinnacles in the Chaldean system — a chapter in which the ordinary rules of what is possible tend to feel less fixed. The challenge is the same as the gift: extreme sensitivity that allows perception and can produce overwhelm in equal measure.`,
  22: `Pinnacle 22 is governed by the Master Builder energy — a chapter in which the capacity for building at the largest scale becomes available. During this phase, ambitions that seemed impossible become genuinely achievable — but only through the combination of the visionary and the disciplined that the 22 requires. This is a chapter that can produce extraordinary results for those willing to work at its frequency.`,
};

const HC_KARMIC = {
  13: `The karmic compound 13 carries the Chaldean meaning of transformation through sustained effort — the compound associated with a soul that, in a previous cycle, may have chosen the easier path at the expense of genuine growth. In this life, the invitation is the opposite: every act of discipline, every completed commitment, every unglamorous effort carried through to its conclusion settles a karmic debt and simultaneously builds a capacity for mastery that no other path produces.\n\nThe 13 is not a punishment. It is the curriculum of a soul that has chosen to accelerate its development. The people who carry it and work with it tend to develop an extraordinary reliability — not the reliability born of rigidity, but the reliability born of having genuinely done the work.\n\nWhat the 13 asks is simple and demanding in equal measure: finish what you start. The things that matter — complete them. Every time you do, you become more fully yourself.`,
  14: `The karmic compound 14 is the compound of freedom that must be earned through responsibility — associated with a soul that, in a previous cycle, may have exercised personal liberty at the expense of others, or pursued sensation and experience without regard for consequence.\n\nIn this life, the invitation is to discover what responsible freedom actually looks like — adventure with awareness, change with integrity, the full aliveness of the 5 energy (to which 14 reduces) expressed through a life that also honours commitment and the impact of choices on others.\n\nThe 14 sitting at a deep level of the chart means this tension between freedom and responsibility is not occasional but constant, not external but internal. The soul craves freedom. The soul also knows it has some unfinished business with accountability. The integration of these two truths is the central work.`,
  16: `The karmic compound 16 carries the energy of what esotericists call "the fall of ego and the rebuilding of something more genuine." In practical terms, this often manifests as experiences of significant loss, humbling, or the collapse of something that was built on pride or false foundation — not as punishment, but as the universe's method of ensuring that your gifts are built on wisdom rather than on ego.\n\nThe 16 compound does not remove your gifts. It purifies them. What remains after the humbling tends to be extraordinarily real — an authenticity and depth of character that people who have not been through this process simply do not possess.\n\nThe invitation of the 16 is not to avoid loss but to allow it to do its work — to let the things that need to fall, fall, and to build what comes after on the foundation of genuine understanding rather than on the foundation of what looked impressive.`,
  19: `The karmic compound 19 is the compound of independence that must be balanced with genuine care for others. The 19 carries the energy of a soul that, in a previous cycle, may have prioritised its own path so absolutely that others were genuinely harmed or abandoned.\n\nIn this life, the invitation is to discover that true strength includes the willingness to need people — and to allow them to need you in return. This does not ask you to abandon your independence (the 19 reduces to 1, the most independent of all numbers), but to exercise it within the context of genuine relationship and genuine care.\n\nThe 19 compound often produces the most inspiring leaders — people whose authority is genuine precisely because it was forged in the understanding that power without compassion is simply control.`,
};

// ─────────────────────────────────────────────────────────────
//  Shared data extraction helper  (unchanged)
// ─────────────────────────────────────────────────────────────
function extractFields(profile) {
  const {
    name_used, dob_fmt,
    psychic_number, psychic_compound,
    destiny_number, destiny_compound,
    name_number, name_compound,
    soul_urge_number, soul_urge_compound,
    personality_number, personality_compound,
    maturity_number, maturity_compound,
    power_number, power_compound,
    ruling_planet, pd_combination,
    personal_year_number,
    current_pinnacle, current_challenge,
    pinnacle_1, pinnacle_1_end_age,
    pinnacle_2, pinnacle_2_end_age,
    pinnacle_3, pinnacle_4,
    challenge_1, challenge_2, challenge_3, challenge_4,
    cornerstone, capstone, first_vowel,
    cornerstone_value, capstone_value, first_vowel_value,
    hidden_passions, karmic_lessons, missing_numbers, subconscious_self,
    has_karmic_debt, karmic_debt_numbers, karmic_debt_locations,
    has_master_11, has_master_22, has_master_33, master_numbers_found,
    dominant_plane,
    plane_mental_count, plane_physical_count,
    plane_emotional_count, plane_intuitive_count,
    soul_expression_bridge, life_personality_bridge,
    rational_thought_number, balance_number, essence_number,
    physical_transit, mental_transit, spiritual_transit,
    physical_transit_value, mental_transit_value, spiritual_transit_value,
    current_life_period, life_period_2_end_age,
    universal_year_number,
    life_path_number,
    pinnacle_2_start_age, pinnacle_3_start_age, pinnacle_3_end_age,
    pinnacle_4_start_age,
    personal_month_number,
  } = profile;

  const _parts    = (name_used || '').trim().split(/\s+/);
  const firstName = (_parts[0] && _parts[0].length === 1 && _parts[1]) ? _parts[1] : (_parts[0] || 'friend');
  const masterList     = Array.isArray(master_numbers_found) && master_numbers_found.length ? master_numbers_found : [];
  const hasMaster      = masterList.length > 0;
  const karmicDebtList = Array.isArray(karmic_debt_numbers) && karmic_debt_numbers.length ? karmic_debt_numbers : [];
  const hasKarmic      = !!has_karmic_debt && karmicDebtList.length > 0;
  const missingList    = Array.isArray(missing_numbers)  && missing_numbers.length  ? missing_numbers  : [];
  const hiddenList     = Array.isArray(hidden_passions)  && hidden_passions.length  ? hidden_passions  : [];
  const lessonList     = Array.isArray(karmic_lessons)   && karmic_lessons.length   ? karmic_lessons   : [];
  const pyEntry        = PERSONAL_YEAR[personal_year_number] || { label:`Year ${personal_year_number}`, tip:'' };
  const currentYear    = new Date().getFullYear();
  const pdSame         = psychic_number === destiny_number;

  return {
    name_used, dob_fmt,
    psychic_number, psychic_compound,
    destiny_number, destiny_compound,
    name_number, name_compound,
    soul_urge_number, soul_urge_compound,
    personality_number, personality_compound,
    maturity_number, maturity_compound,
    power_number, power_compound,
    ruling_planet, pd_combination,
    personal_year_number, personal_month_number,
    current_pinnacle, current_challenge,
    pinnacle_1, pinnacle_1_end_age,
    pinnacle_2, pinnacle_2_start_age, pinnacle_2_end_age,
    pinnacle_3, pinnacle_3_start_age, pinnacle_3_end_age,
    pinnacle_4, pinnacle_4_start_age,
    challenge_1, challenge_2, challenge_3, challenge_4,
    cornerstone, capstone, first_vowel,
    cornerstone_value, capstone_value, first_vowel_value,
    hidden_passions, karmic_lessons, missing_numbers, subconscious_self,
    has_karmic_debt, karmic_debt_numbers, karmic_debt_locations,
    has_master_11, has_master_22, has_master_33, master_numbers_found,
    dominant_plane,
    plane_mental_count, plane_physical_count,
    plane_emotional_count, plane_intuitive_count,
    soul_expression_bridge, life_personality_bridge,
    rational_thought_number, balance_number, essence_number,
    physical_transit, mental_transit, spiritual_transit,
    physical_transit_value, mental_transit_value, spiritual_transit_value,
    current_life_period, life_period_2_end_age,
    universal_year_number,
    life_path_number,
    // derived
    firstName, masterList, hasMaster,
    karmicDebtList, hasKarmic,
    missingList, hiddenList, lessonList,
    pyEntry, currentYear, pdSame,
  };
}

// ─────────────────────────────────────────────────────────────
//  FREE READING — returns card JSON for frontend  (unchanged)
// ─────────────────────────────────────────────────────────────
function buildCards(profile) {
  const f = extractFields(profile);
  const {
    firstName, masterList, hasMaster, karmicDebtList, hasKarmic,
    hiddenList, lessonList, pyEntry, currentYear, pdSame,
    psychic_number, psychic_compound, ruling_planet,
    destiny_number, destiny_compound,
    name_number, name_compound,
    soul_urge_number, soul_urge_compound,
    personality_number, personality_compound,
    maturity_number, maturity_compound,
    power_number, power_compound,
    pd_combination,
    personal_year_number,
    current_pinnacle, current_challenge,
    pinnacle_1, pinnacle_1_end_age,
    pinnacle_2, pinnacle_2_end_age,
    pinnacle_3, pinnacle_4,
    cornerstone, capstone, first_vowel,
    cornerstone_value, capstone_value, first_vowel_value,
    subconscious_self,
    has_karmic_debt, karmic_debt_locations,
    dominant_plane,
    plane_mental_count, plane_physical_count,
    plane_emotional_count, plane_intuitive_count,
    soul_expression_bridge, life_personality_bridge,
    rational_thought_number, balance_number, essence_number,
    physical_transit, mental_transit, spiritual_transit,
    physical_transit_value, mental_transit_value, spiritual_transit_value,
    missing_numbers,
  } = f;

  // ── CARD 1 — Curiosity Hook ─────────────────────────────
  let c1 = `Most people think numerology is just two numbers — your birth date and your name. ${firstName}, your complete Chaldean chart contains over 90 distinct numbers, each measuring a different dimension of who you are.\n\n`;
  if (hasMaster) {
    c1 += `Your chart opens with something rare: a Master Number ${masterList[0]} in your core numbers. In Chaldean numerology, master numbers appear in fewer than 8% of charts — and yours carries one in a significant position.\n\n`;
  } else if (pdSame) {
    c1 += `Your chart opens with a rare alignment: your Psychic Number and Destiny Number are both ${psychic_number}${ruling_planet ? ` — both ruled by ${ruling_planet}` : ''}. When the number you were born with and the number your life is moving toward are identical, the energy amplifies in every direction. This appears in roughly 3% of charts.\n\n`;
  } else {
    c1 += `Your chart opens with the Psychic-Destiny combination ${pd_combination || `${psychic_number}-${destiny_number}`}. Every combination tells a different story about the central tension and gift of a life — and yours has a specific one worth understanding.\n\n`;
  }
  c1 += `In the next 11 cards we will take you through the numbers that matter most — not just the obvious ones, but the ones that usually stay hidden: the letters governing your current year, the gap between your inner desires and outer expression, the karmic compounds that explain why certain patterns keep repeating.\n\nBy Card 11 you will understand why your chart is unlike anyone else's.`;

  // ── CARD 2 — Psychic Number ─────────────────────────────
  const pEntry = PSYCHIC[psychic_number] || {};
  const c2 = pEntry.text
    ? pEntry.text(firstName, psychic_number, ruling_planet, psychic_compound)
    : `${firstName}, your Psychic Number is ${psychic_number}${psychic_compound&&psychic_compound!==psychic_number?` (compound ${psychic_compound})`:''}${ruling_planet?`, ruled by ${ruling_planet}`:''}.`;

  // ── CARD 3 — Destiny Number ─────────────────────────────
  const dEntry = DESTINY[destiny_number] || {};
  const c3 = dEntry.text
    ? dEntry.text(firstName, destiny_number, destiny_compound)
    : `${firstName}, your Destiny Number is ${destiny_number}${destiny_compound&&destiny_compound!==destiny_number?` — compound ${destiny_compound}`:''}. This is the overarching direction of your entire life.`;

  // ── CARD 4 — Name + Soul Urge ───────────────────────────
  const suKey  = soul_urge_compound && [13,14,16,19].includes(soul_urge_compound) ? soul_urge_compound : soul_urge_number;
  const suDesc = SOUL_URGE_DESC[suKey] || `driven by a deep inner hunger that your outer name does not always reveal`;
  const tensionPairs = new Set(['1-2','2-1','1-9','9-1','3-4','4-3','5-4','4-5','7-3','3-7','8-2','2-8']);
  const hasTension   = tensionPairs.has(`${name_number}-${soul_urge_number}`);

  let c4 = `${firstName}, your Name Number is ${name_number}${name_compound&&name_compound!==name_number?` (compound ${name_compound})`:''} — ${NAME_LABEL[name_number] || `the energy of ${name_number}`}. This is what your daily-use name projects outward: the talent the world sees before you have explained yourself.\n\n`;
  c4 += `But beneath that outer expression, your Soul Urge Number is ${soul_urge_number}${soul_urge_compound&&soul_urge_compound!==soul_urge_number?` (compound ${soul_urge_compound})`:''}. At your core you are ${suDesc}.\n\n`;
  if (hasTension) {
    c4 += `The gap between Name ${name_number} and Soul Urge ${soul_urge_number} creates a recognisable tension: you present one energy to the world while privately wanting something quite different. Many of your most significant choices can be traced back to this single dynamic.`;
  } else {
    c4 += `What you show the world and what you privately crave move in the same direction — giving your actions an unusual coherence and authenticity that others find quietly magnetic.`;
  }

  // ── CARD 5 — Personality Number ────────────────────────
  const persDesc = PERSONALITY_DESC[personality_number] || `someone whose outer presence carries the energy of ${personality_number}`;
  const c5 = `${firstName}, your Personality Number is ${personality_number}${personality_compound&&personality_compound!==personality_number?` (compound ${personality_compound})`:''}.\n\nTo the world you appear ${persDesc}.\n\nThis is the mask — not in the deceptive sense, but the face you naturally present before people know you. Your Psychic Number ${psychic_number} is who you are privately. Your Personality Number ${personality_number} is who the world experiences first. The distance between them, and how consciously you navigate it, is one of the most telling patterns in your chart.`;

  // ── CARD 6 — Name Letter Patterns ──────────────────────
  let c6 = `${firstName}, most readings stop at Name Number and Soul Urge. But in Chaldean numerology the individual letters of your name carry meanings that most numerologists never reach.\n\n`;
  if (cornerstone) {
    c6 += `Your Cornerstone is ${cornerstone} (Chaldean value ${cornerstone_value||'?'}) — the first letter of your name, revealing how you approach new beginnings and start things. `;
    const cstoneMap = { R:'Value 2 — Moon energy. You start things by observing and listening before acting.', A:'Value 1 — Sun energy. You start things boldly and directly.', G:'Value 3 — Jupiter energy. You start things with enthusiasm and creative energy.', S:'Value 3 — you begin with expressive, communicative energy.', M:'Value 4 — Rahu energy. You start with structure and unconventional angles.', P:'Value 8 — Saturn energy. You start with seriousness and long-term thinking.' };
    c6 += (cstoneMap[cornerstone] || `Value ${cornerstone_value||'?'} shapes how you initiate.`) + '\n\n';
  }
  if (capstone) {
    c6 += `Your Capstone is ${capstone} (value ${capstone_value||'?'}) — the last letter, revealing how you complete things and close chapters. `;
    const capMap = { D:'Value 4 — Rahu energy. You finish with structure and thoroughness. You are a completer.', A:'Value 1 — Sun energy. You finish with confidence and decisiveness.', N:'Value 5 — Mercury energy. You finish by moving on and beginning the next thing.', R:'Value 2 — Moon energy. You close things gently and relationally.' };
    c6 += (capMap[capstone] || `Value ${capstone_value||'?'} shapes how you finish.`) + '\n\n';
  }
  if (first_vowel) {
    c6 += `Your First Vowel is ${first_vowel} (value ${first_vowel_value||'?'}) — the first vowel in your name, revealing your instinctive emotional response before the mind engages. `;
    const fvMap = { U:'Value 6 — Venus energy. Your emotional first response is warm, caring, and oriented toward harmony and beauty.', A:'Value 1 — Sun energy. Your emotional first response is confident and action-oriented.', I:'Value 1 — Sun energy. Your inner emotional response is quietly self-directed.', E:'Value 5 — Mercury energy. Your emotional first response is curious and mentally alive.', O:'Value 7 — Ketu energy. Your inner emotional response is deep, private, and spiritually tinged.' };
    c6 += (fvMap[first_vowel] || `Value ${first_vowel_value||'?'} — this shapes how you feel before you think.`);
  }

  // ── CARD 7 — Planes of Expression ──────────────────────
  const totalLetters = (plane_mental_count||0)+(plane_physical_count||0)+(plane_emotional_count||0)+(plane_intuitive_count||0);
  const pct = (n) => totalLetters ? Math.round((n||0)/totalLetters*100) : 0;
  const domPlane = (dominant_plane||'mental').toLowerCase();

  let c7 = `${firstName}, in Chaldean numerology each letter of your name belongs to one of four planes — Mental, Physical, Emotional, or Intuitive. The distribution reveals which mode you naturally process the world through.\n\n`;
  c7 += `Your name contains ${totalLetters} letters: ${plane_mental_count||0} Mental (${pct(plane_mental_count)}%), ${plane_physical_count||0} Physical (${pct(plane_physical_count)}%), ${plane_emotional_count||0} Emotional (${pct(plane_emotional_count)}%), ${plane_intuitive_count||0} Intuitive (${pct(plane_intuitive_count)}%).\n\n`;
  const domDesc = { mental:`analysis, ideas, and intellectual understanding. Your best decisions come after careful thinking. The risk: living so much in the mind that action is perpetually deferred.`, physical:`action and tangible results. You trust what you can build and measure. The risk: neglecting the inner world that your outer results depend on.`, emotional:`feeling and empathy. You understand people at a depth others miss. The risk: making decisions from the heart when the head is also needed.`, intuitive:`inner knowing. You sense things before they happen. The risk: difficulty explaining your insights to others who need logic before they can trust a direction.` };
  c7 += `Your dominant plane is ${domPlane.charAt(0).toUpperCase()+domPlane.slice(1)} — you process the world primarily through ${domDesc[domPlane] || 'your dominant mode.'}\n\n`;
  if (subconscious_self !== undefined && subconscious_self !== null) {
    c7 += `Your Subconscious Self number is ${subconscious_self} (scale of 1–8) — measuring how resourcefully you respond under pressure. ${subconscious_self>=6 ? 'You have most energy types encoded in your name, meaning you respond to crises with reasonable instinct and resourcefulness.' : subconscious_self>=4 ? 'You have several energy types available under pressure, but certain situations will expose the gaps.' : 'Fewer energy types are in your name — under extreme pressure some situations may find you without the instinctive tools to respond.'}`;
  }

  // ── CARD 8 — Hidden Passions + Karmic Lessons ──────────
  let c8 = '';
  if (hiddenList.length > 0) {
    const hpDesc = { 1:'an almost compulsive drive toward leadership and independence', 2:'an extraordinary attunement to other people and a deep drive toward meaningful partnership', 3:'a creative restlessness that cannot be suppressed — the need to express is not a choice, it is a necessity', 4:'a deep compulsion to build things that last — temporary solutions feel genuinely painful', 5:'a hunger for experience and freedom that makes conventional paths feel like slow erosion', 6:'a devotion to love and beauty so fundamental it colours every relationship and every space you inhabit', 7:'a quiet obsession with truth and understanding that makes surface answers feel like an insult', 8:'an ambition for impact and mastery that rarely sleeps', 9:'a compassion so broad you sometimes feel it as a weight — a responsibility to the whole human story' };
    c8 += `${firstName}, hidden within your name are what Chaldean numerology calls Hidden Passions — values that appear 3 or more times in your name letters, creating an almost compulsive energy.\n\nYour Hidden Passion${hiddenList.length>1?'s are':' is'} the number${hiddenList.length>1?'s':''} ${hiddenList.join(' and ')}: ${hiddenList.map(n=>hpDesc[n]||`the energy of ${n}`).join('; and ')}.\n\n`;
  }
  if (lessonList.length > 0) {
    c8 += `Your name is missing the energy of ${lessonList.join(' and ')} — Chaldean Karmic Lessons. Not weaknesses, but specific doors that life keeps knocking on in different forms until you open them.\n\n`;
    if (lessonList.includes(5)) c8 += `Missing 5 means life keeps sending situations that ask you to embrace freedom, adaptability, and the unknown.\n`;
    if (lessonList.includes(7)) c8 += `Missing 7 means life keeps sending situations that ask you to go deeper — to trust solitude and inner knowing even when the outer world demands action.\n`;
    if (lessonList.includes(1)) c8 += `Missing 1 means life keeps inviting you to stand on your own authority — to lead and initiate without waiting for permission.\n`;
    if (lessonList.includes(8)) c8 += `Missing 8 means life keeps presenting lessons around power, money, and material achievement.\n`;
  }
  if (hasKarmic) {
    c8 += `\n${KARMIC_DEBT_TEXT[karmicDebtList[0]]||''}`;
    if (karmic_debt_locations && karmic_debt_locations.length) {
      c8 += ` This compound sits in your ${karmic_debt_locations.join(' and ')} — ${karmic_debt_locations.includes('soul_urge')?'the deepest possible location, inside your private desires.':karmic_debt_locations.includes('name')?'your public name expression.':'a significant position in your chart.'}`;
    }
  }
  if (!c8.trim()) {
    c8 = `${firstName}, your name has a remarkably balanced distribution of Chaldean values — all energy types are present. Balanced charts produce people who are genuinely difficult to read: versatile, adaptive, and capable of moving through very different worlds with equal ease. The challenge of balance is that it can become a lack of defining intensity.`;
  }

  // ── CARD 9 — Timing Right Now ───────────────────────────
  const pinnacleDesc = { 1:'a Sun chapter — independence, new beginnings, and the courage to lead.', 2:'a Moon chapter — partnerships, sensitivity, and cooperative endeavours.', 3:'a Jupiter chapter — expansion, creativity, and social growth.', 4:'a Rahu chapter — building, structure, and unconventional paths.', 5:'a Mercury chapter — change, freedom, and dynamic movement.', 6:'a Venus chapter — relationships, home, love, and responsibility.', 7:'a Ketu chapter — inner work, spiritual depth, and the quieting of external ambition.', 8:'a Saturn chapter — hard work, earned rewards, and material achievement. Saturn does not give easily, but what it gives, it keeps.', 9:'a completion chapter — service, release, and the generous giving of what you have accumulated.', 11:'a Master 11 chapter — your intuitive and creative gifts are amplified. You are being asked to inspire at a larger scale.' };
  const challengeDesc = { 0:'Challenge 0 is rare — all challenges are in play simultaneously.', 1:'keeps asking: can you stand on your own authority without confusing independence with isolation?', 2:'keeps asking: can you hold your ground while remaining open and connected?', 3:'keeps asking: can you commit your creative gifts to something that lasts?', 4:'keeps asking: can you build with patience and not cut corners when the going is slow?', 5:'keeps asking: can you embrace change without running from the things that matter?', 6:'keeps asking: can you give love and care without losing yourself in the process?', 7:'keeps asking: can you trust your inner knowing without needing external verification for everything?', 8:'keeps asking: can you pursue power and achievement without compromising your integrity?' };

  let c9 = `${firstName}, this card applies not to your life in general but to right now, in ${currentYear}.\n\n`;
  c9 += `You are currently in Personal Year ${personal_year_number} — ${pyEntry.label}. ${pyEntry.tip}\n\n`;
  c9 += `Your active Pinnacle is ${current_pinnacle} — ${pinnacleDesc[current_pinnacle]||`the energy of ${current_pinnacle}.`}${pinnacle_1_end_age?` This phase runs until age ${current_pinnacle===pinnacle_1?pinnacle_1_end_age:pinnacle_2_end_age||''}.`:''}\n\n`;
  c9 += `Your current Challenge is ${current_challenge} — this is the recurring test of this life chapter. Challenge ${current_challenge} ${challengeDesc[current_challenge]||`keeps presenting the same lesson in different forms until it is mastered.`}`;

  // ── CARD 10 — Transits ──────────────────────────────────
  const transitDesc = { 1:'Sun energy — independence and new beginnings govern this domain.', 2:'Moon energy — cooperation, intuition, and relational sensitivity shape this area.', 3:'Jupiter energy — expansion, optimism, and creative opportunity flow here.', 4:'Rahu energy — karmic acceleration and unconventional experiences in this domain.', 5:'Mercury energy — change, communication, and quick movement characterise this area.', 6:'Venus energy — love, beauty, and harmony govern this domain.', 7:'Ketu energy — this domain is being drawn inward, toward depth and spiritual understanding.', 8:'Saturn energy — discipline, karma, and earned rewards operate here.' };

  let c10 = `${firstName}, this is the most time-specific number in your entire chart — it changes every few years and applies only to you in this exact period.\n\n`;
  c10 += `In Chaldean numerology, the letters of your name cycle through your life one at a time, each letter governing a span of years equal to its value. Right now, three different letters are simultaneously active:\n\n`;
  if (physical_transit) c10 += `Physical Transit — letter ${physical_transit} (value ${physical_transit_value||'?'}) from your first name: ${transitDesc[physical_transit_value]||`Value ${physical_transit_value} governs your outer world.`}\n\n`;
  if (mental_transit)   c10 += `Mental Transit — letter ${mental_transit} (value ${mental_transit_value||'?'}) governs your inner mental life right now: ${transitDesc[mental_transit_value]||`Value ${mental_transit_value} colours your thinking.`}\n\n`;
  if (spiritual_transit)c10 += `Spiritual Transit — letter ${spiritual_transit} (value ${spiritual_transit_value||'?'}) governs your karmic and spiritual experiences: ${transitDesc[spiritual_transit_value]||`Value ${spiritual_transit_value} shapes your spiritual experiences.`}\n\n`;
  if (essence_number)   c10 += `The sum of these three transit values gives your Essence Number: ${essence_number}. This is the overarching karmic theme of your current period. ${essence_number===9?'Essence 9 means you are in a period of completion and service — finishing what needs finishing, releasing what is ready to go.':essence_number===7?'Essence 7 means deep inner work and spiritual inquiry govern this entire period.':essence_number===8?'Essence 8 means material achievement and karmic reckoning are the dominant energies.':essence_number===1?'Essence 1 means new beginnings and independence define this karmic chapter.':essence_number===6?'Essence 6 means love, responsibility, and relational growth are the dominant karmic themes.':essence_number===3?'Essence 3 means creative expression and social expansion are the karmic themes.':essence_number===11?'Essence 11 — a master number essence — means this is a period of heightened intuition and potential inspiration.':essence_number===5?'Essence 5 means freedom, change, and dynamic movement are the karmic themes right now.':`Essence ${essence_number} marks the karmic theme of this exact period of your life.`}`;

  // ── CARD 11 — FOMO / 90+ Numbers ───────────────────────
  let c11 = `${firstName}, what you have seen across these 10 cards represents roughly 15–20 of your 90+ Chaldean numbers.\n\nThe numbers that remain in your complete reading include:\n\n`;
  c11 += `Your Maturity Number ${maturity_number}${maturity_compound&&maturity_compound!==maturity_number?` (compound ${maturity_compound})`:''}  —  ${MATURITY_LABEL[maturity_number]||''}. The energy that becomes dominant after your mid-30s — describing who you are still growing into. This is one of the most personally relevant numbers for anyone in the second quarter of their life.\n\n`;
  c11 += `Your Power Number ${power_number}${power_compound&&power_compound!==power_number?` (compound ${power_compound})`:''}  —  the combined potential available when your Name energy and Destiny work together. What you are actually capable of at your highest functioning.\n\n`;
  c11 += `Your complete Pinnacle map  —  four life chapters${pinnacle_1&&pinnacle_2&&pinnacle_3&&pinnacle_4?` (${pinnacle_1}, ${pinnacle_2}, ${pinnacle_3}, ${pinnacle_4})`:', each with its specific energy'}, with exact start ages, end ages, and what each one asks of you. You are currently in Pinnacle ${current_pinnacle}.\n\n`;
  c11 += `Your Bridge Numbers (${soul_expression_bridge!==undefined?soul_expression_bridge:'?'} and ${life_personality_bridge!==undefined?life_personality_bridge:'?'})  —  the exact gap between your Soul Urge and Name expression, and between your Destiny and Personality. Bridge numbers reveal precisely how to close the internal conflicts your chart contains.\n\n`;
  c11 += `Your Rational Thought Number ${rational_thought_number!==undefined?rational_thought_number:'?'}  —  HOW you think and process information. Your Balance Number ${balance_number!==undefined?balance_number:'?'}  —  how you restore equilibrium when life destabilises you.\n\n`;
  c11 += `And the full interpretation of all of these in combination — not as isolated numbers, but as a coherent portrait of a specific, irreplaceable person. That is what the Full Reading contains.`;

  // ── TRAITS ──────────────────────────────────────────────
  const traitMap = { 1:['Leader','Independent','Ambitious','Self-reliant'], 2:['Diplomatic','Sensitive','Cooperative','Intuitive'], 3:['Creative','Expressive','Optimistic','Joyful'], 4:['Grounded','Disciplined','Reliable','Methodical'], 5:['Adaptable','Curious','Magnetic','Quick-minded'], 6:['Devoted','Compassionate','Responsible','Harmonious'], 7:['Analytical','Introspective','Spiritual','Perceptive'], 8:['Ambitious','Strategic','Authoritative','Resilient'], 9:['Compassionate','Wise','Generous','Universal'], 11:['Visionary','Intuitive','Illuminating','Sensitive'], 22:['Disciplined','Powerful','Transformative','Grounded'] };
  const traits = [...new Set([...(traitMap[psychic_number]||[]),...(traitMap[destiny_number]||[])])].slice(0,6);

  // ── DOMINANT THEME ───────────────────────────────────────
  const dominant_theme = `Psychic ${psychic_number} (${PSYCHIC[psychic_number]?.label||ruling_planet||''}) × Destiny ${destiny_number} (${DESTINY[destiny_number]?.label||''}) — ${hasMaster?`charged with Master Number ${masterList[0]}`:hasKarmic?`carrying karmic compound ${karmicDebtList[0]}`:'grounded in steady purpose'} — expressed as Name Number ${name_number} (${NAME_LABEL[name_number]||''}).`;

  // ── CTA ──────────────────────────────────────────────────
  const hasTensionForCTA = tensionPairs.has(`${name_number}-${soul_urge_number}`);
  const cta = {
    headline: `${firstName}'s complete Chaldean blueprint — all 90+ numbers decoded`,
    teaser_lines: [
      `Your Maturity Number ${maturity_number} (${MATURITY_LABEL[maturity_number]||''}) — who you are still becoming, and when this shift arrives most powerfully`,
      `Your complete Pinnacle and Challenge map across all four life phases with specific ages and what each phase asks of you`,
      hasKarmic
        ? `The full interpretation of your karmic compound ${karmicDebtList[0]} — what it has already shaped and exactly how to work with it`
        : `Your Bridge Numbers (${soul_expression_bridge} and ${life_personality_bridge}) — exactly how to close the internal tensions your chart contains`,
    ],
    button_text: 'Unlock My Full Reading — ₹999',
  };

  return {
    first_name: firstName,
    cards: [
      { card_number:1,  title:`${firstName}, your chart is not what most people expect`,   subtitle: hasMaster?`Master Number ${masterList[0]} detected`:pdSame?`Rare ${pd_combination} double alignment`:`The ${pd_combination} combination`, body:c1,  accent_number:null, accent_label:null },
      { card_number:2,  title:`Psychic Number ${psychic_number} — ${PSYCHIC[psychic_number]?.label||''}`,  subtitle:`Ruled by ${ruling_planet||'your planet'} · The instinctive self`,           body:c2,  accent_number:null, accent_label:null },
      { card_number:3,  title:`Destiny Number ${destiny_number} — ${DESTINY[destiny_number]?.label||''}`,  subtitle:`Compound ${destiny_compound} · The life direction`,                         body:c3,  accent_number:null, accent_label:null },
      { card_number:4,  title:`Name ${name_number} meets Soul Urge ${soul_urge_number}`,                   subtitle:`${NAME_LABEL[name_number]||''} · ${hasTensionForCTA?'An inner tension worth knowing':'Aligned energies'}`, body:c4, accent_number:null, accent_label:null },
      { card_number:5,  title:`Personality Number ${personality_number} — How the World Sees You`,         subtitle:`The outer mask · Your first impression`,                                    body:c5,  accent_number:null, accent_label:null },
      { card_number:6,  title:`The Letters in Your Name`,                                                   subtitle:`Cornerstone ${cornerstone||'?'} · Capstone ${capstone||'?'} · First Vowel ${first_vowel||'?'}`, body:c6, accent_number:null, accent_label:null },
      { card_number:7,  title:`Your Planes of Expression`,                                                  subtitle:`${pct(plane_mental_count)}% Mental · ${pct(plane_physical_count)}% Physical · ${pct(plane_intuitive_count)}% Intuitive`, body:c7, accent_number:null, accent_label:null },
      { card_number:8,  title:`Hidden Passions & Karmic Lessons`,                                           subtitle:`What your name letters reveal beneath the numbers`,                         body:c8,  accent_number:null, accent_label:null },
      { card_number:9,  title:`Your Timing in ${currentYear}`,                                             subtitle:`Personal Year ${personal_year_number} · Pinnacle ${current_pinnacle} · Challenge ${current_challenge}`, body:c9, accent_number:null, accent_label:null },
      { card_number:10, title:`Your Three Active Transits`,                                                 subtitle:`${physical_transit||'?'} · ${mental_transit||'?'} · ${spiritual_transit||'?'} · Essence ${essence_number||'?'}`, body:c10, accent_number:null, accent_label:null },
      { card_number:11, title:`The Numbers Still Unrevealed`,                                               subtitle:`What your complete blueprint contains`, body:c11, accent_number:null, accent_label:null },
    ],
    cta,
    traits,
    dominant_theme,
  };
}

// ─────────────────────────────────────────────────────────────
//  PAID READING — builds sections JSON, passes to shared
//  HTML template in paid-reading.js
// ─────────────────────────────────────────────────────────────
function buildPaidReadingHTML(profile) {
  const f = extractFields(profile);
  const fn = f.firstName;

  // ── Helper: replace {fn} placeholder in lookup text ────
  const fill = (text) => (text || '').replace(/\{fn\}/g, fn);

  // ── Helper: convert \\n\\n text to paragraph string ────
  const paragraphs = (text) => (text || '').trim();

  // ── Fetch psychic entries ───────────────────────────────
  const pFull  = HC_PSYCHIC_FULL[f.psychic_number]  || {};
  const dFull  = HC_DESTINY_FULL[f.destiny_number]  || {};
  const pyFull = HC_PERSONAL_YEAR_FULL[f.personal_year_number] || `Personal Year ${f.personal_year_number} brings its specific energy and lessons to ${fn}'s life in ${f.currentYear}.`;
  const pinFull= HC_PINNACLE_FULL[f.current_pinnacle] || `Pinnacle ${f.current_pinnacle} governs this chapter of ${fn}'s life.`;

  // ── Karmic debt prose ───────────────────────────────────
  const karmicProse = f.hasKarmic
    ? f.karmicDebtList.map(k => HC_KARMIC[k] || `Karmic compound ${k} carries specific soul-level lessons.`).join('\n\n')
    : null;

  // ── Opening portrait ────────────────────────────────────
  const openingPortrait = (() => {
    let text = `${fn}, a complete Chaldean numerology chart contains over ninety distinct numbers — each one measuring a different dimension of who you are, how you think, what you want, what you are here to build, and where you are in the arc of this lifetime. Most people encounter two or three of these numbers. This reading will take you through the ones that matter most for your specific chart.\n\n`;

    text += `The opening note of your chart is the ${f.pd_combination || `${f.psychic_number}-${f.destiny_number}`} combination — your Psychic Number ${f.psychic_number} meeting your Destiny Number ${f.destiny_number}. `;

    if (f.hasMaster) {
      text += `Your chart also carries Master Number ${f.masterList.join(' and ')} — present in fewer than 8% of charts. This is not a decoration. It is an assignment: a higher-frequency responsibility that asks more of you in exchange for more access to the extraordinary. `;
    }
    if (f.hasKarmic) {
      text += `The karmic compound ${f.karmicDebtList.join(' and ')} sits in your ${(Array.isArray(f.karmic_debt_locations) ? f.karmic_debt_locations : []).join(' and ')} — one of the most significant positions it can occupy. This is not a flaw in your chart. It is a depth that most charts do not contain. `;
    }
    if (f.psychic_number === f.destiny_number) {
      text += `\n\nThe rare ${f.pd_combination} alignment — Psychic and Destiny carrying the same number — appears in roughly 3% of charts. When the instinctive self and the life direction operate at the same frequency, the result is a life of unusual coherence and intensity.`;
    }

    text += `\n\nWhat follows is a complete interpretation of this chart — not as a collection of isolated numbers, but as a coherent portrait of a specific, irreplaceable person. Each section builds on the one before it. By the closing synthesis, the numbers will have dissolved into something that feels less like data and more like recognition.`;

    return text;
  })();

  // ── PD Combination prose ────────────────────────────────
  const pdComboProse = (() => {
    if (f.psychic_number === f.destiny_number) {
      return `The ${f.pd_combination} double alignment is rare — fewer than 3% of charts carry this configuration. When the instinctive self (Psychic ${f.psychic_number}) and the life direction (Destiny ${f.destiny_number}) carry the same energy, the result is a life of unusual coherence and intensity. You are not being pulled in two directions by competing energies — there is a single, consistent note running through everything.\n\nThe gift of this alignment is focused, unwavering purpose. The challenge is the absence of relief — no alternative energy to retreat into when the primary frequency becomes too demanding. The ${f.psychic_number}-${f.destiny_number} double asks for the development of genuine range within a single key.\n\nIn daily life, this manifests as a person who is immediately recognisable for a specific quality — the ${f.psychic_number} energy is not occasional but constant, not performed but inherent. Those who resonate with it find ${fn} deeply consistent. Those who need something different may find the intensity of a single-note chart difficult to navigate.`;
    }
    return `The ${f.pd_combination || `${f.psychic_number}-${f.destiny_number}`} combination sits at the heart of ${fn}'s chart — the meeting point between instinctive self (Psychic ${f.psychic_number}) and life direction (Destiny ${f.destiny_number}). The Psychic Number describes who you are without effort; the Destiny Number describes who you are being asked to become. The relationship between these two energies shapes more of the experience of daily life than almost any other pairing in the chart.\n\nFor ${fn}, the tension between Psychic ${f.psychic_number} and Destiny ${f.destiny_number} creates a specific dynamic. The instinctive energy of the ${f.psychic_number} approaches situations in one way; the Destiny ${f.destiny_number} is being called to develop capacities that the ${f.psychic_number} alone would not necessarily choose. This is not a conflict to be resolved — it is a creative tension to be worked with.\n\nIn daily life, this combination tends to produce a person who is privately one thing and publicly becoming another. The gap between who ${fn} is instinctively and who ${fn} is being asked to become is exactly the space in which this life's most meaningful growth occurs.`;
  })();

  // ── Name & Soul Urge prose ──────────────────────────────
  const suKey = f.soul_urge_compound && [13,14,16,19].includes(f.soul_urge_compound) ? f.soul_urge_compound : f.soul_urge_number;
  const suDesc = SOUL_URGE_DESC[suKey] || `driven by a deep inner hunger`;
  const nameSoulProse = `Name Number ${f.name_number}${f.name_compound && f.name_compound !== f.name_number ? ` (compound ${f.name_compound})` : ''} is what ${fn}'s daily-use name projects into the world — the talent and energy that others perceive before they know this person deeply. This is the outer face of competence, the first note others hear.\n\n${fn}'s Soul Urge ${f.soul_urge_number}${f.soul_urge_compound && f.soul_urge_compound !== f.soul_urge_number ? ` (compound ${f.soul_urge_compound})` : ''} is the deep motivational current beneath the outer presentation — ${suDesc}. Most people who know ${fn} well will recognise this energy, even if they cannot name it.\n\n${f.name_number === f.soul_urge_number ? `For ${fn}, Name and Soul Urge carry the same number — a rare alignment that produces unusual coherence between what is shown and what is felt. What you present to the world and what you privately want move in the same direction.` : `The gap between Name ${f.name_number} and Soul Urge ${f.soul_urge_number} (Bridge: ${f.soul_expression_bridge ?? '—'}) creates a familiar tension in how ${fn} presents versus what actually satisfies. This dynamic, once understood, explains many of the recurring choices and internal conflicts in this life.`}`;

  // ── Personality prose ───────────────────────────────────
  const persDesc = PERSONALITY_DESC[f.personality_number] || `carries the energy of ${f.personality_number}`;
  const personalityProse = `Personality Number ${f.personality_number}${f.personality_compound && f.personality_compound !== f.personality_number ? ` (compound ${f.personality_compound})` : ''} is the first impression ${fn} makes — the outer face that appears before anyone knows the full person. In Jungian terms, this is the Persona: not a deception, but the natural presentation of the self in social context.\n\nTo someone meeting ${fn} for the first time, the Personality ${f.personality_number} is what registers — ${persDesc}.\n\n${f.personality_number === f.psychic_number ? `For ${fn}, Personality and Psychic Number carry the same energy — what you show is what you are. This alignment produces an unusual transparency: people tend to get what they expect, and what they expect tends to be accurate.` : `For ${fn}, the Personality ${f.personality_number} and the Psychic ${f.psychic_number} carry different energies. The world's first impression — ${f.personality_number} — and who ${fn} actually is inside — Psychic ${f.psychic_number} — operate at different frequencies. Those who know ${fn} well understand that the outer presentation is real but incomplete.`}`;

  // ── Name letters prose ──────────────────────────────────
  const cornerstoneProse = `The Cornerstone — letter ${f.cornerstone || '?'} (value ${f.cornerstone_value || '?'}) — is the first letter of ${fn}'s name, governing how new beginnings are approached. This letter sets the tone for every initiation: how ${fn} starts projects, enters relationships, and responds to unfamiliar situations. The Chaldean value ${f.cornerstone_value || '?'} carries ${f.cornerstone_value === 1 ? 'Sun energy — bold, direct, self-starting' : f.cornerstone_value === 2 ? 'Moon energy — observant, relational, careful' : f.cornerstone_value === 3 ? 'Jupiter energy — enthusiastic, expressive, generous' : f.cornerstone_value === 4 ? 'Rahu energy — structured, methodical, thorough' : f.cornerstone_value === 5 ? 'Mercury energy — curious, adaptable, quick' : f.cornerstone_value === 6 ? 'Venus energy — warm, considerate, relational' : f.cornerstone_value === 7 ? 'Ketu energy — quiet, perceptive, depth-seeking' : f.cornerstone_value === 8 ? 'Saturn energy — serious, strategic, purposeful' : `the specific quality of value ${f.cornerstone_value}`} as the mode of initiation.`;

  const capstoneProse = `The Capstone — letter ${f.capstone || '?'} (value ${f.capstone_value || '?'}) — is the last letter of ${fn}'s name, governing how things are completed and closed. This letter reveals whether ${fn} is a natural completer or tends to leave things unfinished — and why. Value ${f.capstone_value || '?'} suggests ${f.capstone_value === 1 ? 'decisive, final closings — completed decisions are not second-guessed' : f.capstone_value === 2 ? 'gentle, relational endings — closings done with care for the people involved' : f.capstone_value === 3 ? 'expressive completions — finishing by naming and communicating what happened' : f.capstone_value === 4 ? 'thorough, careful completions — a genuine finisher who attends to detail' : f.capstone_value === 5 ? 'forward-moving closings — finishing by beginning the next thing' : f.capstone_value === 6 ? 'responsible, relational endings — attending to the human dimensions of closing' : f.capstone_value === 7 ? 'reflective completions — processing and understanding before moving forward' : f.capstone_value === 8 ? 'permanent, serious closings — when this person closes something, it tends to stay closed' : `a closing quality specific to value ${f.capstone_value}`}.`;

  const firstVowelProse = `The First Vowel — ${f.first_vowel || '?'} (value ${f.first_vowel_value || '?'}) — reveals the instinctive emotional response that arises before the mind has engaged. Vowels carry the breath sounds, the inner sounds, the emotional texture. For ${fn}, the first vowel ${f.first_vowel || '?'} means the emotional temperature that arises instinctively — before thought, before social adjustment — carries the quality of value ${f.first_vowel_value || '?'}: ${f.first_vowel_value === 1 ? 'confident, self-directed, quietly certain' : f.first_vowel_value === 2 ? 'sensitive, relational, attuned to others' : f.first_vowel_value === 3 ? 'expressive, warm, enthusiastically responsive' : f.first_vowel_value === 4 ? 'grounded, cautious, structurally aware' : f.first_vowel_value === 5 ? 'curious, excited, immediately alert to novelty' : f.first_vowel_value === 6 ? 'warm, caring, oriented toward harmony' : f.first_vowel_value === 7 ? 'deep, private, spiritually tinged' : f.first_vowel_value === 8 ? 'serious, strategic, already calculating' : `carrying the quality of value ${f.first_vowel_value}`}.`;

  // ── Planes prose ────────────────────────────────────────
  const totalLetters = (f.plane_mental_count||0)+(f.plane_physical_count||0)+(f.plane_emotional_count||0)+(f.plane_intuitive_count||0);
  const pct = n => totalLetters ? Math.round((n||0)/totalLetters*100) : 0;
  const domPlaneName = (f.dominant_plane || 'mental').toLowerCase();
  const domPlaneDesc = {
    mental:   `analysis, ideas, and intellectual understanding. You process the world through thought before feeling or action. At its best this produces extraordinary insight; the risk is living so completely in the mind that action is perpetually deferred.`,
    physical: `action, results, and tangible output. You understand things through doing them. At its best this produces remarkable effectiveness; the risk is neglecting the inner world that outer results depend on.`,
    emotional:`feeling, empathy, and relational intelligence. You understand people at a depth others miss. At its best this produces extraordinary human understanding; the risk is allowing feeling to override both thinking and practical reality.`,
    intuitive:`inner knowing, sensing before thinking. You know things before you understand how you know them. At its best this produces extraordinary insight and foresight; the risk is difficulty explaining your knowing to others who need a rational path.`,
  };
  const planesProse = `${fn}'s name contains ${totalLetters} letters distributed as: ${f.plane_mental_count || 0} Mental (${pct(f.plane_mental_count)}%), ${f.plane_physical_count || 0} Physical (${pct(f.plane_physical_count)}%), ${f.plane_emotional_count || 0} Emotional (${pct(f.plane_emotional_count)}%), ${f.plane_intuitive_count || 0} Intuitive (${pct(f.plane_intuitive_count)}%).\n\nThe dominant plane is ${domPlaneName.charAt(0).toUpperCase()+domPlaneName.slice(1)} — ${fn} processes the world primarily through ${domPlaneDesc[domPlaneName] || `the ${domPlaneName} mode.`}\n\nSubconscious Self ${f.subconscious_self ?? '—'}/8 measures how many energy types are encoded in ${fn}'s name — the instinctive toolkit available under genuine pressure. ${(f.subconscious_self ?? 0) >= 6 ? `A score of ${f.subconscious_self} means most energy types are present. Under pressure, ${fn} has a broad range of instinctive responses.` : (f.subconscious_self ?? 0) >= 4 ? `A score of ${f.subconscious_self} means several energy types are available, but certain crisis situations will expose the gaps.` : `A score of ${f.subconscious_self} means fewer energy types are encoded — under extreme pressure, specific situations may find ${fn} without the instinctive tools to respond, requiring more conscious effort.`}`;

  // ── Hidden patterns prose ───────────────────────────────
  const hiddenStr  = f.hiddenList.length  ? f.hiddenList.join(', ')  : 'None';
  const lessonStr  = f.lessonList.length  ? f.lessonList.join(', ')  : 'None';
  const missingStr = f.missingList.length ? f.missingList.join(', ') : 'None';
  const hiddenPatternsProse = `${hiddenStr !== 'None' ? `Hidden Passions ${hiddenStr} — these values appear three or more times in ${fn}'s name letters, creating drives that are not chosen but compulsive. These energies cannot help but express themselves regardless of external circumstances. They are the frequencies at which this chart is most intensely encoded.\n\n` : `${fn}'s name has a balanced distribution — no single value dominates. This produces genuine versatility and adaptability, with the tradeoff that the defining intensity of a dominant passion is harder to access.\n\n`}${lessonStr !== 'None' ? `Karmic Lessons ${lessonStr} — these values are absent from ${fn}'s name letters. These are the doors that life keeps knocking on: situations, relationships, and challenges requiring these specific energies keep appearing until the associated capacities are genuinely developed. They are not weaknesses — they are the specific soul curriculum of this life.\n\n` : `All values 1–8 are present in ${fn}'s name — no Karmic Lessons. This complete encoding means all energy types are available as natural instincts.\n\n`}The relationship between these patterns — what is compulsively present and what is structurally absent — reveals the deepest shape of ${fn}'s soul curriculum in this lifetime.`;

  // ── Life cycles prose ───────────────────────────────────
  const pinnacleMapProse = `${fn}'s life moves through four distinct Pinnacle chapters. Pinnacle 1 (${f.pinnacle_1 || '—'}, birth to age ${f.pinnacle_1_end_age || '—'}) establishes the foundational theme of the early life. Pinnacle 2 (${f.pinnacle_2 || '—'}, ages ${f.pinnacle_2_start_age || '—'}–${f.pinnacle_2_end_age || '—'}) introduces a shift in emphasis and new developmental demands. Pinnacle 3 (${f.pinnacle_3 || '—'}, ages ${f.pinnacle_3_start_age || '—'}–${f.pinnacle_3_end_age || '—'}) deepens and extends the journey.\n\nThe fourth and final Pinnacle (${f.pinnacle_4 || '—'}, from age ${f.pinnacle_4_start_age || '—'} onward) is the culminating chapter — the energy that governs the second half of life. This is also the most permanent: it cannot be departed from or moved beyond. It is the note on which this life resolves.`;

  const currentChallengeProse = `Challenge ${f.current_challenge} is the recurring test of this chapter of ${fn}'s life — the pattern that keeps appearing in different forms until it has been genuinely met and integrated. This is not an obstacle to overcome once and forget. It is the recurring test of a specific soul curriculum.\n\n${f.current_challenge === 0 ? `Challenge 0 is rare — it means all challenges are active simultaneously. Life presents the full range of tests without the narrowing focus of a single number. This demands the broadest possible inner resources.` : f.current_challenge === 1 ? `Challenge 1 asks: can you stand on your own authority without confusing independence with isolation? The recurring situations require ${fn} to decide without external validation and hold that decision under pressure.` : f.current_challenge === 2 ? `Challenge 2 asks: can you hold your ground while remaining genuinely open and connected? The recurring situations pit self-assertion against accommodation, asking for the genuine balance of both.` : f.current_challenge === 3 ? `Challenge 3 asks: can you commit your creative gifts to something that lasts? The recurring tension is between breadth and depth, between beginning and finishing, between expression and commitment.` : f.current_challenge === 4 ? `Challenge 4 asks: can you build with patience and not cut corners when the going is slow? The recurring situations require sustained effort without immediate reward.` : f.current_challenge === 5 ? `Challenge 5 asks: can you embrace change without running from the things that matter? The recurring situations require both the willingness to move and the willingness to stay.` : f.current_challenge === 6 ? `Challenge 6 asks: can you give love and care without losing yourself in the process? The recurring situations ask for the balance between genuine devotion and genuine self-respect.` : f.current_challenge === 7 ? `Challenge 7 asks: can you trust your inner knowing without needing external verification for everything? The recurring situations require acting from genuine inner authority rather than waiting for permission.` : f.current_challenge === 8 ? `Challenge 8 asks: can you pursue power and achievement without compromising your integrity? The recurring situations present moments where the efficient path and the ethical path are not the same.` : `Challenge ${f.current_challenge} carries its specific lesson through the recurring situations of this life chapter.`}`;

  // ── Timing prose ────────────────────────────────────────
  const timingProse = `${pyFull}\n\nUniversal Year ${f.universal_year_number} governs the collective experience of ${f.currentYear} — the themes that everyone is working with simultaneously. For ${fn}, Personal Year ${f.personal_year_number} playing out against Universal Year ${f.universal_year_number} creates a specific dynamic. ${f.personal_year_number === f.universal_year_number ? 'The personal and universal energies are aligned — what you are individually working with is amplified by the collective current.' : `The individual and collective energies move at different rhythms — what ${fn} is personally navigating may feel somewhat out of step with the collective mood, which can produce useful independence of perspective.`}`;

  // ── Transits prose ──────────────────────────────────────
  const TRANSIT_VALS = { 1:'Sun energy — independence and new beginnings', 2:'Moon energy — sensitivity, cooperation, and emotional attunement', 3:'Jupiter energy — expansion, optimism, and creative opportunity', 4:'Rahu energy — karmic acceleration and unconventional paths', 5:'Mercury energy — change, communication, and rapid movement', 6:'Venus energy — love, beauty, and harmony', 7:'Ketu energy — inward movement and spiritual depth', 8:'Saturn energy — discipline, karmic reckoning, and earned rewards' };
  const transitsProse = `In Chaldean numerology, each letter of the name governs a span of years equal to its value — cycling through the name, one letter at a time, across the entire lifetime. Right now, three letters are simultaneously active for ${fn}.\n\nPhysical Transit — ${f.physical_transit || '?'} (value ${f.physical_transit_value || '?'}): ${TRANSIT_VALS[f.physical_transit_value] || `value ${f.physical_transit_value}`} governs the outer world — circumstances, body, material reality.\n\nMental Transit — ${f.mental_transit || '?'} (value ${f.mental_transit_value || '?'}): ${TRANSIT_VALS[f.mental_transit_value] || `value ${f.mental_transit_value}`} governs inner mental life — the themes that occupy thinking right now.\n\nSpiritual Transit — ${f.spiritual_transit || '?'} (value ${f.spiritual_transit_value || '?'}): ${TRANSIT_VALS[f.spiritual_transit_value] || `value ${f.spiritual_transit_value}`} governs the karmic and spiritual dimension of this period.\n\nEssence Number ${f.essence_number || '?'} — the sum of all three transit values — is the overarching karmic theme of this entire period of ${fn}'s life. This specific combination of three active letters will not repeat for many years. The period ${fn} is in right now is singular.`;

  // ── Bridge prose ────────────────────────────────────────
  const bridgeProse = `The Soul–Expression Bridge (${f.soul_expression_bridge ?? '—'}) measures the gap between Soul Urge ${f.soul_urge_number} and Name ${f.name_number}. ${(f.soul_expression_bridge ?? 0) <= 1 ? 'A bridge of 0 or 1 indicates close alignment — inner desire and outer expression move in similar directions.' : (f.soul_expression_bridge ?? 0) <= 3 ? `A bridge of ${f.soul_expression_bridge} indicates a moderate gap — a recognisable tension between what is shown and what is privately wanted.` : `A bridge of ${f.soul_expression_bridge} indicates a significant gap — the distance between what ${fn} shows the world and what genuinely satisfies is substantial. This tension, while sometimes uncomfortable, is also a source of depth and complexity.`}\n\nThe Life–Personality Bridge (${f.life_personality_bridge ?? '—'}) measures the gap between Destiny ${f.destiny_number} and Personality ${f.personality_number}. Closing these bridges — not eliminating the gap but learning to move fluidly between outer presentation and inner direction — is one of the most rewarding practices available.\n\nRational Thought Number ${f.rational_thought_number ?? '—'} reveals HOW ${fn} thinks and processes information. Balance Number ${f.balance_number ?? '—'} reveals how ${fn} instinctively restores equilibrium under stress — the default return-to-centre when life becomes destabilising.`;

  // ── Maturity & Power prose ──────────────────────────────
  const maturityProse = `Maturity Number ${f.maturity_number}${f.maturity_compound && f.maturity_compound !== f.maturity_number ? ` (compound ${f.maturity_compound})` : ''} is the energy that begins to emerge with real force in the mid-30s and becomes increasingly dominant through the second half of life. It represents the soul's intended direction of development — the qualities that will deepen as the earlier urgencies of establishing oneself give way to the deeper question of what this life is actually for.\n\nPower Number ${f.power_number}${f.power_compound && f.power_compound !== f.power_number ? ` (compound ${f.power_compound})` : ''} represents the combined potential available when ${fn}'s Name energy and Destiny work in genuine alignment — not who this person is every day, but what becomes accessible when operating at the highest functioning. This is the answer to the question: "What is ${fn} actually capable of at their absolute best?"`;

  // ── Closing synthesis ───────────────────────────────────
  const closingSynthesis = `${fn}, a numerology chart is not a verdict. It is a map — and like all maps, it is most useful when you already know where you are and are trying to understand how to get where you want to go.\n\nThe central pattern of this chart is not located in any single number. It is located in the relationship between them: the tension between the Psychic ${f.psychic_number}'s instinctive energy and the Destiny ${f.destiny_number}'s call to become something beyond the instinctive self. The gap between Soul Urge ${f.soul_urge_number} and Name ${f.name_number}. The distance between who ${fn} appears to be (Personality ${f.personality_number}) and who ${fn} is when no one is watching. These gaps are not problems to be solved. They are the creative space in which this actual life is lived.\n\n${f.hasKarmic ? `The karmic compound ${f.karmicDebtList.join(' and ')} is not a footnote — it is a central thread. The soul that carries this compound has accepted an accelerated curriculum. What is built, once the lesson is understood, will be built on a foundation that cannot be shaken. ` : ''}${f.hasMaster ? `The Master Number ${f.masterList.join(' and ')} is not a guarantee of anything. It is an invitation to a more demanding and more extraordinary version of this life. The invitation can be accepted or declined in a thousand small daily choices. ` : ''}You are in Personal Year ${f.personal_year_number}, inside Pinnacle ${f.current_pinnacle}, with the letters ${f.physical_transit || '?'}, ${f.mental_transit || '?'}, ${f.spiritual_transit || '?'} simultaneously active in your transits — writing a chapter specific to this exact period of your life.\n\nNumbers do not decide anything. They describe tendencies, patterns, and possibilities. The life is yours — every irreplaceable, specific, unrepeatable day of it. This reading has tried to see it clearly. What you do with what you have seen is entirely and always your own.`;

  // ── Build sections object matching buildPaidHTMLFromClaudeJSON schema ──
  const sections = {
    subject_name:    f.name_used,
    dob:             f.dob_fmt,
    opening_portrait: paragraphs(openingPortrait),
    psychic: {
      interpretation: paragraphs(fill(pFull.interp || `Psychic Number ${f.psychic_number}, ruled by ${f.ruling_planet || 'your planet'}.`)),
      gift:           paragraphs(fill(pFull.gift   || '')),
      shadow:         paragraphs(fill(pFull.shadow || '')),
      vedic_context:  paragraphs(fill(pFull.vedic  || '')),
    },
    destiny: {
      interpretation:   paragraphs(dFull.interp || `Destiny Number ${f.destiny_number}.`),
      compound_meaning: paragraphs(dFull.interp || ''),
      soul_direction:   paragraphs(dFull.soul   || ''),
    },
    pd_combination: {
      interpretation:  paragraphs(pdComboProse),
      tension_or_flow: paragraphs(pdComboProse),
    },
    name_soul_urge: {
      name_interpretation:    paragraphs(nameSoulProse),
      soul_urge_interpretation: paragraphs(nameSoulProse),
      gap_analysis:           paragraphs(nameSoulProse),
    },
    personality: {
      interpretation: paragraphs(personalityProse),
      mask_vs_self:   paragraphs(personalityProse),
    },
    name_letters: {
      cornerstone: paragraphs(cornerstoneProse),
      capstone:    paragraphs(capstoneProse),
      first_vowel: paragraphs(firstVowelProse),
      synthesis:   `The Cornerstone ${f.cornerstone || '?'}, Capstone ${f.capstone || '?'}, and First Vowel ${f.first_vowel || '?'} together describe how ${fn} moves through experience — beginning with the quality of ${f.cornerstone_value || '?'}, feeling through the instinct of ${f.first_vowel_value || '?'}, and completing with the quality of ${f.capstone_value || '?'}.`,
    },
    planes: {
      interpretation:   paragraphs(planesProse),
      dominant_meaning: paragraphs(planesProse),
      subconscious_self: paragraphs(planesProse),
    },
    hidden_patterns: {
      hidden_passions: paragraphs(hiddenPatternsProse),
      karmic_lessons:  paragraphs(hiddenPatternsProse),
      synthesis:       paragraphs(hiddenPatternsProse),
    },
    karmic_debt:   f.hasKarmic ? paragraphs(karmicProse) : null,
    master_numbers: f.hasMaster
      ? `${fn}'s chart carries Master Number${f.masterList.length > 1 ? 's' : ''} ${f.masterList.join(' and ')} — present in fewer than ${f.masterList.includes(22) ? '3%' : '8%'} of charts. Master Numbers carry both heightened gifts and heightened responsibility. They are not signs of superiority — they are assignments of heightened frequency that demand more and make more available simultaneously.\n\nMaster ${f.masterList.includes(11) ? '11 is the bridge between the intuitive and the rational — profound sensitivity that, when harnessed, becomes an extraordinary capacity for inspiration. The challenge is the same as the gift: a level of inner responsiveness that can become overwhelming when the world\'s noise is too high.' : ''}${f.masterList.includes(22) ? '22 is the Master Builder — the capacity to turn the largest visions into concrete reality. The rarest Destiny in Chaldean numerology. The challenge is the weight of the potential itself: the gap between what this life could produce and what has been produced can become paralysing rather than motivating. Begin. The vision clarifies in motion.' : ''}${f.masterList.includes(33) ? '33 is the Master Teacher — unconditional love as a life path. Service at the deepest level, not from sacrifice but from genuine overflow. The challenge is that this frequency demands the complete integration of personal self before it can be truly expressed outward.' : ''}`
      : null,
    life_cycles: {
      pinnacle_map:       paragraphs(pinnacleMapProse),
      current_pinnacle:   paragraphs(pinFull),
      challenge_map:      `The four Challenges — ${f.challenge_1 ?? '—'}, ${f.challenge_2 ?? '—'}, ${f.challenge_3 ?? '—'}, ${f.challenge_4 ?? '—'} — are the recurring patterns that each life phase keeps presenting. Each Challenge is not a one-time test but a recurring curriculum that appears in different forms until it is mastered.`,
      current_challenge:  paragraphs(currentChallengeProse),
    },
    timing: {
      personal_year:  paragraphs(timingProse),
      universal_year: paragraphs(timingProse),
      year_synthesis: paragraphs(timingProse),
    },
    transits: {
      physical:         paragraphs(transitsProse),
      mental:           paragraphs(transitsProse),
      spiritual:        paragraphs(transitsProse),
      essence:          paragraphs(transitsProse),
      period_synthesis: paragraphs(transitsProse),
    },
    bridge_numbers: {
      soul_expression:  paragraphs(bridgeProse),
      life_personality: paragraphs(bridgeProse),
      how_to_close:     paragraphs(bridgeProse),
    },
    maturity_power: {
      maturity:  paragraphs(maturityProse),
      power:     paragraphs(maturityProse),
      synthesis: paragraphs(maturityProse),
    },
    closing_synthesis: paragraphs(closingSynthesis),
  };

  // Pass through the shared HTML template in paid-reading.js
  return buildPaidHTMLFromClaudeJSON(sections, profile);
}

// ─────────────────────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────────────────────
module.exports = {
  runFreeReading: (profile) => buildCards(profile),
  runPaidReading: (profile) => ({ _html: buildPaidReadingHTML(profile) }),
};