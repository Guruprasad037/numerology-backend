// ============================================================
//  src/engines/claude.js  v2
//
//  CHANGES from v1:
//    - run() now accepts either a plain string (legacy) OR an
//      object { system, user } from the updated prompt builders.
//      Plain strings still work — fully backward compatible.
//
//    - Added `system` parameter to the API call when provided.
//      This puts persona/rules in the correct bucket so Claude
//      follows them more reliably and consistently.
//
//    - Added `temperature: 0.3` — lower temperature means more
//      consistent JSON structure across different readings.
//      Default (~1.0) was too random for structured output.
//
//    - Added one automatic retry on JSON parse failure.
//      If Claude returns malformed JSON, we ask it to fix it
//      before throwing an error to the caller.
//
//    - Fixed success log — was checking for `cards` and `cta`
//      which don't exist in numerology reports. Now checks the
//      actual fields from the paid reading schema.
// ============================================================

const FILE = 'src/engines/claude.js';

function log(step, message, data = null) {
  console.log(
    `[${FILE}] STEP ${step} ${message}`,
    data ? JSON.stringify(data, null, 2) : ''
  );
}

function error(step, message, data = null) {
  console.error(
    `[${FILE}] ❌ STEP ${step} ${message}`,
    data ? JSON.stringify(data, null, 2) : ''
  );
}

// ── JSON cleaner ─────────────────────────────────────────────
// Strips markdown code fences Claude occasionally adds even
// when told not to, then parses the result.
function parseJSON(raw) {
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ── Single Claude API call ───────────────────────────────────
// Extracted so we can call it twice (original + retry).
async function callClaudeAPI(systemPrompt, userPrompt) {
  const body = {
    model:       'claude-sonnet-4-6',
    max_tokens:  12000,
    temperature: 0.3,   // lower = more consistent JSON structure
    messages: [
      { role: 'user', content: userPrompt }
    ],
  };

  // Only add the system field when we actually have a system prompt.
  // Sending an empty string causes an API validation error.
  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'x-api-key':       process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  return response;
}

// ── Main entry point ─────────────────────────────────────────
//
//  prompt can be:
//    (a) a plain string         — legacy behaviour, unchanged
//    (b) { system, user }       — new behaviour from v2 prompt builders
//
async function run(prompt) {
  log(1, 'run() called');
  log(1.1, 'environment check', {
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    model:     'claude-sonnet-4-6',
  });

  // ── Resolve system and user strings from whatever shape was passed ──
  let systemPrompt = null;
  let userPrompt   = null;

  if (prompt && typeof prompt === 'object' && prompt.user) {
    // New shape: { system, user }
    systemPrompt = prompt.system || null;
    userPrompt   = prompt.user;
    log(1.2, 'prompt shape: { system, user }', {
      systemLength: systemPrompt?.length ?? 0,
      userLength:   userPrompt.length,
    });
  } else if (typeof prompt === 'string') {
    // Legacy shape: one big string — everything goes to user
    userPrompt = prompt;
    log(1.2, 'prompt shape: legacy string', {
      promptLength: userPrompt.length,
    });
  } else {
    throw new Error('claude.run() received an invalid prompt argument');
  }

  log(2, 'Sending request to Claude API', {
    model:         'claude-sonnet-4-6',
    hasSystem:     !!systemPrompt,
    userPreview:   userPrompt?.slice(0, 300),
  });

  // ── First attempt ────────────────────────────────────────
  let response;
  try {
    response = await callClaudeAPI(systemPrompt, userPrompt);
  } catch (err) {
    error(3, 'Network error calling Claude API', {
      message: err.message,
      stack:   err.stack,
    });
    throw err;
  }

  log(4, 'Claude API responded', {
    status: response.status,
    ok:     response.ok,
  });

  if (!response.ok) {
    const errBody = await response.text();
    error(5, 'Claude API returned error response', {
      status: response.status,
      body:   errBody,
    });
    throw new Error(`Claude API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  log(6, 'Raw Claude response received', {
    type: typeof data,
    keys: Object.keys(data || {}),
  });

  const raw = data.content?.[0]?.text || '';
  if (!raw) {
    error(6.1, 'EMPTY response text from Claude', { data });
  }

  log(7, 'Extracted raw text', {
    length:      raw.length,
    preview:     raw.slice(0, 300),
    tailPreview: raw.slice(-200),
  });

  // ── First parse attempt ──────────────────────────────────
  try {
    const parsed = parseJSON(raw);
    log(8, 'JSON parse SUCCESS (first attempt)', {
      hasOpeningPortrait:  !!parsed?.opening_portrait,
      hasPsychic:          !!parsed?.psychic,
      hasDestiny:          !!parsed?.destiny,
      hasClosingSynthesis: !!parsed?.closing_synthesis,
    });
    return parsed;

  } catch (parseErr) {
    error(9, 'JSON parse FAILED on first attempt — will retry', {
      error:      parseErr.message,
      rawPreview: raw.slice(0, 500),
    });
  }

  // ── Retry: ask Claude to fix its own broken JSON ─────────
  // We send the broken output back and ask for a clean version.
  // This catches cases where Claude added a comment, missed a
  // closing brace, or put a trailing comma in the JSON.
  log(9.1, 'Sending retry request to fix malformed JSON');

  const fixPrompt = `The following text was supposed to be valid JSON but failed to parse.
Return ONLY the corrected, valid JSON. No explanation. No markdown fences. Just the JSON object.

BROKEN OUTPUT:
${raw.slice(0, 8000)}`; // cap at 8k chars to stay within limits

  let retryResponse;
  try {
    retryResponse = await callClaudeAPI(null, fixPrompt);
  } catch (retryNetErr) {
    error(9.2, 'Network error on retry', { message: retryNetErr.message });
    throw new Error(`Claude returned invalid JSON and retry network failed: ${raw.slice(0, 200)}`);
  }

  if (!retryResponse.ok) {
    const retryErrBody = await retryResponse.text();
    error(9.3, 'Claude API error on retry', {
      status: retryResponse.status,
      body:   retryErrBody,
    });
    throw new Error(`Claude returned invalid JSON and retry API failed (${retryResponse.status})`);
  }

  const retryData = await retryResponse.json();
  const retryRaw  = retryData.content?.[0]?.text || '';

  log(9.4, 'Retry raw text received', {
    length:  retryRaw.length,
    preview: retryRaw.slice(0, 300),
  });

  try {
    const parsed = parseJSON(retryRaw);
    log(10, 'JSON parse SUCCESS (after retry)', {
      hasOpeningPortrait:  !!parsed?.opening_portrait,
      hasPsychic:          !!parsed?.psychic,
      hasDestiny:          !!parsed?.destiny,
      hasClosingSynthesis: !!parsed?.closing_synthesis,
    });
    return parsed;

  } catch (retryParseErr) {
    error(10.1, 'JSON parse FAILED even after retry — giving up', {
      error:      retryParseErr.message,
      rawPreview: retryRaw.slice(0, 500),
    });
    throw new Error(
      `Claude returned invalid JSON on both attempts. First attempt: ${raw.slice(0, 200)}`
    );
  }
}

module.exports = { run };