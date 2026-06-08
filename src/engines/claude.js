// ============================================================
//  src/engines/claude.js  v3
//
//  CHANGES from v2:
//    - Added 3-attempt network retry with 3s delay between
//      attempts. Handles transient "fetch failed" errors on
//      Render's free tier without falling back to hardcoded.
//    - max_tokens increased to 25000 to prevent report
//      truncation mid-content.
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
function parseJSON(raw) {
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ── Single Claude API call ───────────────────────────────────
async function callClaudeAPI(systemPrompt, userPrompt) {
  const body = {
    model:       'claude-sonnet-4-6',
    max_tokens:  25000,
    temperature: 0.3,
    messages: [
      { role: 'user', content: userPrompt }
    ],
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  return response;
}

// ── Main entry point ─────────────────────────────────────────
async function run(prompt) {
  log(1, 'run() called');
  log(1.1, 'environment check', {
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    model:     'claude-sonnet-4-6',
  });

  // ── Resolve system and user strings ──────────────────────
  let systemPrompt = null;
  let userPrompt   = null;

  if (prompt && typeof prompt === 'object' && prompt.user) {
    systemPrompt = prompt.system || null;
    userPrompt   = prompt.user;
    log(1.2, 'prompt shape: { system, user }', {
      systemLength: systemPrompt?.length ?? 0,
      userLength:   userPrompt.length,
    });
  } else if (typeof prompt === 'string') {
    userPrompt = prompt;
    log(1.2, 'prompt shape: legacy string', {
      promptLength: userPrompt.length,
    });
  } else {
    throw new Error('claude.run() received an invalid prompt argument');
  }

  log(2, 'Sending request to Claude API', {
    model:       'claude-sonnet-4-6',
    hasSystem:   !!systemPrompt,
    userPreview: userPrompt?.slice(0, 300),
  });

  // ── Network call with 3-attempt retry (changed to 1 attempt)────────────────────
  let response       = null;
  let lastNetworkErr = null;

  //for (let attempt = 1; attempt <= 3; attempt++) {
  for (let attempt = 1; attempt <= 1; attempt++) {
    try {
      response       = await callClaudeAPI(systemPrompt, userPrompt);
      lastNetworkErr = null;
      break; // success — exit retry loop
    } catch (err) {
      lastNetworkErr = err;
      if (attempt < 3) {
        log(`2.${attempt}`, `Network error on attempt ${attempt}/3 — retrying in 3s`, {
          message: err.message,
        });
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  if (lastNetworkErr) {
    error(3, 'Network error calling Claude API — all 3 attempts failed', {
      message: lastNetworkErr.message,
      stack:   lastNetworkErr.stack,
    });
    throw lastNetworkErr;
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
  log(9.1, 'Sending retry request to fix malformed JSON');

  const fixPrompt = `The following text was supposed to be valid JSON but failed to parse.
Return ONLY the corrected, valid JSON. No explanation. No markdown fences. Just the JSON object.

BROKEN OUTPUT:
${raw.slice(0, 8000)}`;

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