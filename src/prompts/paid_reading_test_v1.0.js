// ============================================================
//  src/prompts/paid_reading_test_v1.0.js
//
//  SHORT TEST PROMPT — same as paid_reading_v2.0.js but asks
//  for only 1 paragraph per section instead of 4-5.
//  Costs ~$0.02 instead of $0.30.
//
//  TO ACTIVATE:   in reading.settings.js set:
//                 paid_reading: 'paid_reading_test_v1.0.js'
//
//  TO DEACTIVATE: in reading.settings.js set:
//                 paid_reading: 'paid_reading_v2.0.js'
// ============================================================

const FILE = 'src/prompts/paid_reading_test_v1.0.js';

function buildPrompt(profile) {
  console.log(`[${FILE}] Building TEST paid reading prompt for: ${profile.name_used}`);

  const system = `You are an expert Chaldean numerologist writing a short test report.

Return ONLY a valid JSON object. No markdown fences. No explanation. Just the JSON.

Keep every single text field to exactly ONE short paragraph (2-3 sentences maximum).
This is a test — brevity is the goal.

Use the exact same JSON schema as a full report.`;

  const user = `Write a SHORT TEST Chaldean numerology report for the subject below.
One paragraph per field. No more. Output ONLY the JSON object.

NAME: ${profile.name_used}
DOB:  ${profile.dob_fmt}

NUMBERS:
  Psychic: ${profile.psychic_number} | Destiny: ${profile.destiny_number} | Name: ${profile.name_number}
  Soul Urge: ${profile.soul_urge_number} | Personality: ${profile.personality_number}
  Ruling Planet: ${profile.ruling_planet} | PD Combination: ${profile.pd_combination}
  Personal Year: ${profile.personal_year_number} | Current Pinnacle: ${profile.current_pinnacle}
  Karmic Debt: ${profile.has_karmic_debt ? profile.karmic_debt_numbers.join(', ') : 'none'}
  Master Numbers: ${profile.master_numbers_found?.length ? profile.master_numbers_found.join(', ') : 'none'}

Return this exact JSON structure. One short paragraph per field:

{
  "subject_name": "${profile.name_used}",
  "dob": "${profile.dob_fmt}",
  "opening_portrait": "...",
  "psychic": {
    "interpretation": "...",
    "gift": "...",
    "shadow": "...",
    "vedic_context": "..."
  },
  "destiny": {
    "interpretation": "...",
    "compound_meaning": "...",
    "soul_direction": "..."
  },
  "pd_combination": {
    "interpretation": "...",
    "tension_or_flow": "..."
  },
  "name_soul_urge": {
    "name_interpretation": "...",
    "soul_urge_interpretation": "...",
    "gap_analysis": "..."
  },
  "personality": {
    "interpretation": "...",
    "mask_vs_self": "..."
  },
  "name_letters": {
    "cornerstone": "...",
    "capstone": "...",
    "first_vowel": "...",
    "synthesis": "..."
  },
  "planes": {
    "interpretation": "...",
    "dominant_meaning": "...",
    "subconscious_self": "..."
  },
  "hidden_patterns": {
    "hidden_passions": "...",
    "karmic_lessons": "...",
    "synthesis": "..."
  },
  "karmic_debt": null,
  "master_numbers": null,
  "life_cycles": {
    "pinnacle_map": "...",
    "current_pinnacle": "...",
    "challenge_map": "...",
    "current_challenge": "..."
  },
  "timing": {
    "personal_year": "...",
    "universal_year": "...",
    "year_synthesis": "..."
  },
  "transits": {
    "physical": "...",
    "mental": "...",
    "spiritual": "...",
    "essence": "...",
    "period_synthesis": "..."
  },
  "bridge_numbers": {
    "soul_expression": "...",
    "life_personality": "...",
    "how_to_close": "..."
  },
  "maturity_power": {
    "maturity": "...",
    "power": "...",
    "synthesis": "..."
  },
  "closing_synthesis": "..."
}`;

  return { system, user };
}

module.exports = buildPrompt;