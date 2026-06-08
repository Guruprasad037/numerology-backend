// ============================================================
//  src/engines/claude.js  v5
//
//  CHANGES from v4:
//    - Removed retry loop entirely.
//
//  WHY NO RETRY:
//    Each failed attempt charges Anthropic credits even if the
//    response never arrives. Retrying 3 times on a real failure
//    burns 3x credits for nothing. One attempt is enough —
//    if it fails, the dispatcher falls back to hardcoded.
//
//  CHANGES from v3:
//    - Switched from non-streaming to STREAMING API call.
//
//  WHY STREAMING IS NEEDED:
//    The full paid reading prompt (paid_reading_v2.0.js) generates
//    a 17-section personalised report. Claude takes 3-5 minutes.
//    With the old non-streaming approach, the server opened one
//    silent connection and waited. Render kills silent connections
//    after ~30 seconds — causing "fetch failed" even though
//    Claude was working and DID charge credits.
//
//    With streaming, Claude sends text chunk by chunk as it
//    generates. The connection stays active (data flows
//    continuously), so Render never kills it. We collect all
//    chunks and join them into the full JSON at the end.
//
//  HOW STREAMING WORKS:
//    1. Request is sent with stream: true
//    2. Claude replies with Server-Sent Events (SSE)
//    3. Each SSE line: data: {"type":"content_block_delta","delta":{"text":"..."}}
//    4. We read each chunk, extract the text, append to raw string
//    5. When stream ends, raw contains the complete JSON
//    6. Parse raw as JSON — same as before
//
//  WHAT DIDN'T CHANGE:
//    - JSON parsing (first attempt + fix-retry if malformed)
//    - System + user prompt shape handling
//    - All logging steps
//    - Error handling and dispatcher fallback behaviour
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
// Claude sometimes wraps JSON in ```json fences even when told
// not to. This strips them before parsing.
function parseJSON(raw) {
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ── Claude API call (STREAMING) ──────────────────────────────
//
// Sends the request with stream:true and reads the response as
// a stream of Server-Sent Events (SSE).
//
// Each SSE line looks like:
//   data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}
//
// We extract the text from each delta and append to a string.
// When the stream ends we return the complete accumulated text.
//
// This keeps the HTTP connection alive for the full 3-5 minutes
// Claude needs to generate the report, preventing Render from
// dropping it due to inactivity.
// ─────────────────────────────────────────────────────────────
async function callClaudeAPI(systemPrompt, userPrompt) {
  const body = {
    model:       'claude-sonnet-4-6',
    max_tokens:  25000,
    temperature: 0.3,
    stream:      true,  // enables streaming — KEY CHANGE from v3
    messages: [
      { role: 'user', content: userPrompt }
    ],
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  // Make the HTTP request
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  // If Anthropic returned a 4xx or 5xx error, read the body and
  // throw — don't try to stream an error response
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errBody}`);
  }

  // ── Read the stream chunk by chunk ───────────────────────
  // response.body is a ReadableStream. We pull chunks out one
  // at a time as they arrive from Anthropic.
  const reader      = response.body.getReader();
  const decoder     = new TextDecoder();
  let raw           = '';  // accumulated full response text
  let totalChunks   = 0;   // for logging only

  while (true) {
    const { done, value } = await reader.read();

    // Stream has ended — exit loop
    if (done) break;

    totalChunks++;

    // Decode binary chunk to string.
    // { stream: true } handles partial multi-byte characters
    // at chunk boundaries correctly.
    const chunk = decoder.decode(value, { stream: true });

    // Each chunk may contain multiple SSE lines separated by \n
    const lines = chunk.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and non-data lines (e.g. "event: ...")
      if (!trimmed.startsWith('data: ')) continue;

      // Extract JSON part after "data: "
      const jsonStr = trimmed.slice(6).trim();

      // "[DONE]" is the special end-of-stream marker — skip it
      if (jsonStr === '[DONE]') continue;

      // Parse the SSE event
      let event;
      try {
        event = JSON.parse(jsonStr);
      } catch {
        // Malformed SSE line — skip silently
        // Can happen at chunk boundaries
        continue;
      }

      // Only content_block_delta events carry actual text.
      // Other event types (message_start, ping, message_stop)
      // are ignored.
      if (
        event.type === 'content_block_delta' &&
        event.delta?.type === 'text_delta' &&
        event.delta?.text
      ) {
        raw += event.delta.text;
      }
    }
  }

  log('2.stream', 'Stream complete', {
    totalChunks,
    rawLength: raw.length,
    preview:   raw.slice(0, 100),
  });

  return raw;
}

// ── Main entry point ─────────────────────────────────────────
async function run(prompt) {
  log(1, 'run() called');
  log(1.1, 'environment check', {
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    model:     'claude-sonnet-4-6',
  });

  // ── Resolve system and user strings ──────────────────────
  // Prompt may arrive as:
  //   (a) { system: "...", user: "..." }  — paid_reading_v2.0+
  //   (b) "plain string"                  — legacy / free reading
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

  log(2, 'Sending streaming request to Claude API', {
    model:       'claude-sonnet-4-6',
    hasSystem:   !!systemPrompt,
    userPreview: userPrompt?.slice(0, 300),
  });

  // ── Single network call — no retry ───────────────────────
  // No retry loop. Retrying on failure wastes Anthropic credits
  // because each attempt is charged even if the response never
  // arrives. One attempt is correct — if it fails, the dispatcher
  // catches the error and falls back to the hardcoded engine.
  let raw = null;

  try {
    raw = await callClaudeAPI(systemPrompt, userPrompt);
  } catch (err) {
    error(3, 'Network error calling Claude API', {
      message: err.message,
      stack:   err.stack,
    });
    throw err; // dispatcher catches this and falls back to hardcoded
  }

  // Empty response — guard against blank stream
  if (!raw) {
    error(6.1, 'EMPTY response from Claude — stream returned nothing');
    throw new Error('Claude streaming returned empty response');
  }

  log(7, 'Full text received from stream', {
    length:      raw.length,
    preview:     raw.slice(0, 300),
    tailPreview: raw.slice(-200),
  });

  // ── First JSON parse attempt ──────────────────────────────
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
    error(9, 'JSON parse FAILED on first attempt — will ask Claude to fix it', {
      error:      parseErr.message,
      rawPreview: raw.slice(0, 500),
    });
  }

  // ── Ask Claude to fix its own broken JSON ────────────────
  // Claude occasionally outputs valid content with minor JSON
  // formatting errors (trailing comma, unescaped quote, etc).
  // We send the broken output back and ask for a corrected version.
  // This is a second Claude call but only fires if the first
  // response was malformed — which is rare.
  log(9.1, 'Sending fix request to Claude for malformed JSON');

  const fixPrompt = `The following text was supposed to be valid JSON but failed to parse.
Return ONLY the corrected, valid JSON. No explanation. No markdown fences. Just the JSON object.

BROKEN OUTPUT:
${raw.slice(0, 8000)}`;

  let retryRaw;
  try {
    retryRaw = await callClaudeAPI(null, fixPrompt);
  } catch (retryNetErr) {
    error(9.2, 'Network error on JSON fix call', { message: retryNetErr.message });
    throw new Error(`Claude returned invalid JSON and fix call failed: ${raw.slice(0, 200)}`);
  }

  log(9.4, 'Fix response received', {
    length:  retryRaw.length,
    preview: retryRaw.slice(0, 300),
  });

  // ── Second JSON parse attempt ─────────────────────────────
  try {
    const parsed = parseJSON(retryRaw);
    log(10, 'JSON parse SUCCESS (after fix)', {
      hasOpeningPortrait:  !!parsed?.opening_portrait,
      hasPsychic:          !!parsed?.psychic,
      hasDestiny:          !!parsed?.destiny,
      hasClosingSynthesis: !!parsed?.closing_synthesis,
    });
    return parsed;
  } catch (retryParseErr) {
    error(10.1, 'JSON parse FAILED even after fix — giving up', {
      error:      retryParseErr.message,
      rawPreview: retryRaw.slice(0, 500),
    });
    throw new Error(
      `Claude returned invalid JSON on both attempts. First: ${raw.slice(0, 200)}`
    );
  }
}

module.exports = { run };