// ============================================================
//  src/engines/openai.js
//  Sends a pre-built prompt to the OpenAI API and returns
//  a parsed interpretations object.
//
//  Same prompt contract as claude.js — JSON only response.
// ============================================================

async function run(prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model:       'gpt-4o',
      max_tokens:  2000,
      temperature: 0.7,
      messages: [
        {
          role:    'system',
          content: 'You are a skilled numerologist. Respond only with valid JSON. No preamble, no markdown, no explanation.',
        },
        {
          role:    'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw  = data.choices?.[0]?.message?.content || '';

  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    throw new Error(`OpenAI returned invalid JSON: ${raw.slice(0, 200)}`);
  }
}

module.exports = { run };