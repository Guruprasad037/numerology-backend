// ============================================================
//  src/engines/hardcoded.js  v4
//
//  CHANGES from v3:
//    - run(service, profile) removed
//    - runFreeReading(profile) — returns card JSON for frontend
//    - runPaidReading(profile) — returns HTML string for DOCX
//    - All lookup tables and buildCards() logic unchanged
// ============================================================

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
//  Shared data extraction helper
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
    // derived
    firstName, masterList, hasMaster,
    karmicDebtList, hasKarmic,
    missingList, hiddenList, lessonList,
    pyEntry, currentYear, pdSame,
  };
}

// ─────────────────────────────────────────────────────────────
//  FREE READING — returns card JSON for frontend display
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
    c8 += `${firstName}, hidden within your name are what Chaldean numerology calls Hidden Passions — values that appear 3 or more times in your name letters, creating an almost compulsive energy.\n\nYour Hidden Passion${hiddenList.length>1?'s are':'  is'} the number${hiddenList.length>1?'s':''} ${hiddenList.join(' and ')}: ${hiddenList.map(n=>hpDesc[n]||`the energy of ${n}`).join('; and ')}.\n\n`;
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
      { card_number:4,  title:`Name ${name_number} meets Soul Urge ${soul_urge_number}`,                   subtitle:`${NAME_LABEL[name_number]||''} · ${hasTension?'An inner tension worth knowing':'Aligned energies'}`, body:c4, accent_number:null, accent_label:null },
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
//  PAID READING — returns HTML string for DOCX conversion
// ─────────────────────────────────────────────────────────────
function buildPaidReadingHTML(profile) {
  const f = extractFields(profile);
  const {
    firstName, hasMaster, masterList, hasKarmic, karmicDebtList,
    hiddenList, lessonList, pyEntry, currentYear,
    dob_fmt,
    psychic_number, psychic_compound, ruling_planet,
    destiny_number, destiny_compound,
    name_number, soul_urge_number, soul_urge_compound,
    personality_number,
    maturity_number, maturity_compound,
    power_number, power_compound,
    life_path_number,
    personal_year_number, personal_month_number,
    current_pinnacle, current_challenge,
    pinnacle_1, pinnacle_1_end_age,
    pinnacle_2, pinnacle_2_end_age,
    pinnacle_3, pinnacle_3_end_age,
    pinnacle_4,
    challenge_1, challenge_2, challenge_3, challenge_4,
    cornerstone, capstone, first_vowel,
    cornerstone_value, capstone_value, first_vowel_value,
    subconscious_self, essence_number,
    has_karmic_debt, karmic_debt_locations,
    dominant_plane,
    plane_mental_count, plane_physical_count,
    plane_emotional_count, plane_intuitive_count,
    soul_expression_bridge, life_personality_bridge,
    rational_thought_number, balance_number,
    physical_transit, mental_transit, spiritual_transit,
    physical_transit_value, mental_transit_value, spiritual_transit_value,
    has_master_11, has_master_22, has_master_33,
    missing_numbers,
  } = f;

  // Colour palette
  const C = {
    dark:    '#2c3e50',
    blue:    '#3498db',
    gold:    '#f39c12',
    header:  '#34495e',
    alt:     '#ecf0f1',
    insight: '#e8f4f8',
    white:   '#ffffff',
  };

  // Reuse prose generators from the lookup tables
  const pEntry  = PSYCHIC[psychic_number]  || {};
  const dEntry  = DESTINY[destiny_number]  || {};
  const psychicProse  = pEntry.text  ? pEntry.text(firstName, psychic_number, ruling_planet, psychic_compound)  : `Psychic Number ${psychic_number}, ruled by ${ruling_planet||'your planet'}.`;
  const destinyProse  = dEntry.text  ? dEntry.text(firstName, destiny_number, destiny_compound)                 : `Destiny Number ${destiny_number}.`;

  const suKey   = soul_urge_compound && [13,14,16,19].includes(soul_urge_compound) ? soul_urge_compound : soul_urge_number;
  const suDesc  = SOUL_URGE_DESC[suKey]        || `driven by a deep inner hunger`;
  const persDesc= PERSONALITY_DESC[personality_number] || `carries the energy of ${personality_number}`;
  const pyTip   = pyEntry.tip || '';

  const masterMentions = [has_master_11&&'11', has_master_22&&'22', has_master_33&&'33'].filter(Boolean);
  const karmicText = hasKarmic ? (KARMIC_DEBT_TEXT[karmicDebtList[0]] || '') : '';

  const totalLetters = (plane_mental_count||0)+(plane_physical_count||0)+(plane_emotional_count||0)+(plane_intuitive_count||0);
  const pct = (n) => totalLetters ? Math.round((n||0)/totalLetters*100) : 0;

  // Helper to convert newlines in prose to <p> tags
  const prose = (text) => text
    .split('\n\n')
    .filter(s => s.trim())
    .map(s => `<p style="margin:0 0 12px 0;line-height:1.7;">${s.replace(/\n/g,' ')}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0; padding: 20px;
    color: ${C.dark}; font-size: 14px;
  }
  .cover {
    background: ${C.dark}; color: ${C.white};
    padding: 35px 30px; text-align: center;
    margin-bottom: 0;
  }
  .cover h1 { margin: 0 0 8px 0; font-size: 28px; letter-spacing: 1px; }
  .cover p  { margin: 4px 0; font-size: 15px; opacity: 0.85; }
  .subtitle-bar {
    background: ${C.blue}; color: ${C.white};
    padding: 10px 30px; text-align: center;
    font-size: 14px; margin-bottom: 25px;
  }
  .section {
    background: ${C.blue}; color: ${C.white};
    padding: 10px 16px; font-size: 17px; font-weight: bold;
    margin: 28px 0 14px 0;
    border-left: 5px solid ${C.dark};
  }
  .subsection {
    font-size: 15px; font-weight: bold; color: ${C.dark};
    border-bottom: 2px solid ${C.blue};
    margin: 20px 0 8px 0; padding-bottom: 4px;
  }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 20px 0; }
  th {
    background: ${C.header}; color: ${C.white};
    padding: 10px 12px; text-align: left; font-size: 13px;
  }
  td { padding: 10px 12px; border-bottom: 1px solid #ddd; font-size: 13px; }
  tr:nth-child(even) td { background: ${C.alt}; }
  .num {
    background: ${C.gold}; color: ${C.white};
    padding: 2px 8px; border-radius: 3px;
    font-weight: bold; font-size: 13px;
  }
  .insight {
    background: ${C.insight};
    border-left: 4px solid ${C.blue};
    padding: 14px 16px; margin: 12px 0 20px 0;
    font-size: 13px; line-height: 1.7;
  }
  .prose { font-size: 13px; line-height: 1.7; margin-bottom: 16px; }
  .two-col { display: table; width: 100%; margin-bottom: 20px; }
  .col { display: table-cell; width: 50%; vertical-align: top; padding-right: 12px; }
  .col:last-child { padding-right: 0; padding-left: 12px; }
  .footer {
    text-align: center; color: #999; font-size: 11px;
    margin-top: 35px; padding-top: 15px;
    border-top: 1px solid #ddd;
  }
  .badge {
    display: inline-block;
    background: ${C.gold}; color: ${C.white};
    font-size: 11px; font-weight: bold;
    padding: 2px 8px; border-radius: 10px;
    margin-left: 6px; vertical-align: middle;
  }
</style>
</head>
<body>

<!-- ── COVER ── -->
<div class="cover">
  <h1>✨ Complete Numerology Reading</h1>
  <p><strong>${f.name_used || firstName}</strong></p>
  <p>Date of Birth: ${dob_fmt || profile.dob_used || ''}</p>
  ${hasMaster ? `<p>⭐ Master Number ${masterList[0]} detected in chart</p>` : ''}
</div>
<div class="subtitle-bar">
  Ruling Planet: ${ruling_planet || '—'} &nbsp;|&nbsp;
  PD Combination: ${f.pd_combination || `${psychic_number}-${destiny_number}`} &nbsp;|&nbsp;
  Chaldean System
</div>

<!-- ── SECTION 1: CORE NUMBERS ── -->
<div class="section">🔢 Section 1 — Core Numbers</div>
<table>
  <tr>
    <th>Number</th><th>Type</th><th>Compound</th><th>Label</th>
  </tr>
  <tr><td>Psychic</td>     <td><span class="num">${psychic_number}</span></td>   <td>${psychic_compound || '—'}</td>  <td>${PSYCHIC[psychic_number]?.label || '—'} · ${ruling_planet || '—'}</td></tr>
  <tr><td>Destiny</td>     <td><span class="num">${destiny_number}</span></td>   <td>${destiny_compound || '—'}</td>  <td>${DESTINY[destiny_number]?.label || '—'}</td></tr>
  <tr><td>Name</td>        <td><span class="num">${name_number}</span></td>      <td>${f.name_compound || '—'}</td>   <td>${NAME_LABEL[name_number] || '—'}</td></tr>
  <tr><td>Soul Urge</td>   <td><span class="num">${soul_urge_number}</span></td> <td>${soul_urge_compound || '—'}</td><td>Inner motivation</td></tr>
  <tr><td>Personality</td> <td><span class="num">${personality_number}</span></td><td>${f.personality_compound || '—'}</td><td>Outer expression</td></tr>
  <tr><td>Life Path</td>   <td><span class="num">${life_path_number || destiny_number}</span></td><td>—</td><td>Soul's journey</td></tr>
  <tr><td>Maturity</td>    <td><span class="num">${maturity_number}</span></td>  <td>${maturity_compound || '—'}</td><td>${MATURITY_LABEL[maturity_number] || '—'}</td></tr>
  <tr><td>Power</td>       <td><span class="num">${power_number}</span></td>     <td>${power_compound || '—'}</td>   <td>Highest potential</td></tr>
</table>

<!-- ── PSYCHIC INTERPRETATION ── -->
<div class="subsection">Psychic Number ${psychic_number} — ${PSYCHIC[psychic_number]?.label || ''}</div>
<div class="prose">${prose(psychicProse)}</div>

<!-- ── DESTINY INTERPRETATION ── -->
<div class="subsection">Destiny Number ${destiny_number} — ${DESTINY[destiny_number]?.label || ''}</div>
<div class="prose">${prose(destinyProse)}</div>

<!-- ── NAME + SOUL URGE ── -->
<div class="subsection">Name Number ${name_number} & Soul Urge ${soul_urge_number}</div>
<div class="insight">
  <strong>Name Number ${name_number}</strong> — ${NAME_LABEL[name_number] || ''}. This is what your daily-use name projects outward: the talent the world sees before you have explained yourself.<br><br>
  <strong>Soul Urge ${soul_urge_number}</strong> — At your core you are ${suDesc}.
</div>

<!-- ── PERSONALITY ── -->
<div class="subsection">Personality Number ${personality_number}</div>
<div class="insight">
  To the world you appear <strong>${persDesc}</strong>. Your Psychic Number ${psychic_number} is who you are privately. Your Personality Number ${personality_number} is who the world experiences first.
</div>

<!-- ── SECTION 2: NAME ANALYSIS ── -->
<div class="section">🔤 Section 2 — Name Analysis</div>
<table>
  <tr><th>Element</th><th>Letter</th><th>Value</th><th>Significance</th></tr>
  <tr><td>Cornerstone (first letter)</td><td><span class="num">${cornerstone || '—'}</span></td><td>${cornerstone_value || '—'}</td><td>How you initiate and begin things</td></tr>
  <tr><td>Capstone (last letter)</td>    <td><span class="num">${capstone || '—'}</span></td>   <td>${capstone_value || '—'}</td>  <td>How you complete and close things</td></tr>
  <tr><td>First Vowel</td>               <td><span class="num">${first_vowel || '—'}</span></td><td>${first_vowel_value || '—'}</td><td>Instinctive emotional response</td></tr>
  <tr><td>Subconscious Self</td>         <td>—</td><td><span class="num">${subconscious_self || '—'}</span></td><td>Resourcefulness under pressure (scale 1–8)</td></tr>
</table>

<!-- ── SECTION 3: PLANES OF EXPRESSION ── -->
<div class="section">🌊 Section 3 — Planes of Expression</div>
<table>
  <tr><th>Plane</th><th>Letter Count</th><th>Percentage</th></tr>
  <tr><td>Mental</td>    <td>${plane_mental_count || 0}</td>    <td>${pct(plane_mental_count)}%</td></tr>
  <tr><td>Physical</td>  <td>${plane_physical_count || 0}</td>  <td>${pct(plane_physical_count)}%</td></tr>
  <tr><td>Emotional</td> <td>${plane_emotional_count || 0}</td> <td>${pct(plane_emotional_count)}%</td></tr>
  <tr><td>Intuitive</td> <td>${plane_intuitive_count || 0}</td> <td>${pct(plane_intuitive_count)}%</td></tr>
</table>
<div class="insight"><strong>Dominant Plane: ${(dominant_plane||'').charAt(0).toUpperCase()+(dominant_plane||'').slice(1)}</strong> — This is the primary mode through which you process the world.</div>

<!-- ── SECTION 4: HIDDEN PATTERNS ── -->
<div class="section">⚡ Section 4 — Hidden Patterns</div>
<div class="insight">
  <strong>Hidden Passions:</strong> ${hiddenList.length ? hiddenList.join(', ') : 'None — balanced name energy'}<br><br>
  <strong>Missing Numbers (Karmic Lessons):</strong> ${Array.isArray(missing_numbers) && missing_numbers.length ? missing_numbers.join(', ') : 'None — complete name'}<br><br>
  <strong>Karmic Debt:</strong> ${hasKarmic ? `Yes — compound ${karmicDebtList.join(', ')}` : 'No karmic debt numbers found'}<br><br>
  <strong>Master Numbers:</strong> ${masterMentions.length ? masterMentions.join(', ') : 'None detected'}
</div>
${hasKarmic && karmicText ? `<div class="prose">${prose(karmicText)}</div>` : ''}

<!-- ── SECTION 5: LIFE CYCLES & TIMING ── -->
<div class="section">📅 Section 5 — Life Cycles &amp; Timing</div>

<div class="subsection">Personal Year &amp; Month</div>
<table>
  <tr><th>Cycle</th><th>Number</th><th>Theme</th></tr>
  <tr><td>Personal Year ${currentYear}</td> <td><span class="num">${personal_year_number}</span></td><td>${PERSONAL_YEAR[personal_year_number]?.label || '—'}</td></tr>
  <tr><td>Personal Month</td>               <td><span class="num">${personal_month_number || '—'}</span></td><td>Monthly energy</td></tr>
</table>
<div class="insight"><strong>Personal Year ${personal_year_number} Guidance:</strong> ${pyTip}</div>

<div class="subsection">Pinnacles</div>
<table>
  <tr><th>Pinnacle</th><th>Number</th><th>End Age</th></tr>
  <tr><td>Pinnacle 1</td><td><span class="num">${pinnacle_1 || '—'}</span></td><td>${pinnacle_1_end_age || '—'}</td></tr>
  <tr><td>Pinnacle 2</td><td><span class="num">${pinnacle_2 || '—'}</span></td><td>${pinnacle_2_end_age || '—'}</td></tr>
  <tr><td>Pinnacle 3</td><td><span class="num">${pinnacle_3 || '—'}</span></td><td>${f.pinnacle_3_end_age || '—'}</td></tr>
  <tr><td>Pinnacle 4</td><td><span class="num">${pinnacle_4 || '—'}</span></td><td>Life</td></tr>
  <tr style="background:#fff3cd;"><td><strong>Current Pinnacle</strong></td><td><span class="num">${current_pinnacle}</span></td><td>Active now</td></tr>
</table>

<div class="subsection">Challenges</div>
<table>
  <tr><th>Challenge</th><th>Number</th></tr>
  <tr><td>Challenge 1</td><td><span class="num">${challenge_1 || '—'}</span></td></tr>
  <tr><td>Challenge 2</td><td><span class="num">${challenge_2 || '—'}</span></td></tr>
  <tr><td>Challenge 3</td><td><span class="num">${challenge_3 || '—'}</span></td></tr>
  <tr><td>Challenge 4</td><td><span class="num">${challenge_4 || '—'}</span></td></tr>
  <tr style="background:#fff3cd;"><td><strong>Current Challenge</strong></td><td><span class="num">${current_challenge}</span></td></tr>
</table>

<!-- ── SECTION 6: TRANSITS & ESSENCE ── -->
<div class="section">🔄 Section 6 — Letter Transits &amp; Essence</div>
<table>
  <tr><th>Transit</th><th>Letter</th><th>Value</th></tr>
  <tr><td>Physical Transit</td> <td>${physical_transit || '—'}</td> <td>${physical_transit_value || '—'}</td></tr>
  <tr><td>Mental Transit</td>   <td>${mental_transit || '—'}</td>   <td>${mental_transit_value || '—'}</td></tr>
  <tr><td>Spiritual Transit</td><td>${spiritual_transit || '—'}</td><td>${spiritual_transit_value || '—'}</td></tr>
</table>
<div class="insight">
  <strong>Essence Number: <span class="num">${essence_number || '—'}</span></strong> — The overarching karmic theme of your current life period (sum of all three transit values).
</div>

<!-- ── SECTION 7: BRIDGE & ADDITIONAL NUMBERS ── -->
<div class="section">🌉 Section 7 — Bridge &amp; Additional Numbers</div>
<table>
  <tr><th>Number</th><th>Value</th><th>Meaning</th></tr>
  <tr><td>Soul–Expression Bridge</td>   <td><span class="num">${soul_expression_bridge ?? '—'}</span></td><td>Gap between Soul Urge and Name expression</td></tr>
  <tr><td>Life–Personality Bridge</td>  <td><span class="num">${life_personality_bridge ?? '—'}</span></td><td>Gap between Destiny and Personality</td></tr>
  <tr><td>Rational Thought Number</td>  <td><span class="num">${rational_thought_number ?? '—'}</span></td><td>How you think and process information</td></tr>
  <tr><td>Balance Number</td>           <td><span class="num">${balance_number ?? '—'}</span></td><td>How you restore equilibrium under stress</td></tr>
</table>

<div class="footer">
  Generated by NumeroSoul &nbsp;·&nbsp;
  ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })} &nbsp;·&nbsp;
  Chaldean Numerology System
</div>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────────────────────
module.exports = {
  // Free reading — card JSON for frontend
  runFreeReading:  (profile) => buildCards(profile),

  // Paid reading — HTML string for DOCX conversion
  runPaidReading:  (profile) => buildPaidReadingHTML(profile),
};