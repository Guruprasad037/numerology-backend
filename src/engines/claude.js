// ============================================================
//  src/engines/claude.js
//  Sends a pre-built prompt to the Claude API and returns
//  a parsed interpretations object.
//
//  Expected prompt contract:
//    The prompt must instruct Claude to return ONLY valid JSON
//    with this shape:
//    {
//      birth, life_path, expression,
//      soul_urge, personality, maturity, personal_year
//    }
//    Each key: { number, label, traits[], text }
// ============================================================

async function run(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':         'application/json',
      'x-api-key':            process.env.ANTHROPIC_API_KEY,
      'anthropic-version':    '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 3500,
      messages: [
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw  = data.content?.[0]?.text || '';

  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    throw new Error(`Claude returned invalid JSON: ${raw.slice(0, 200)}`);
  }
}

module.exports = { run };