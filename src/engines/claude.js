// ============================================================
//  src/engines/claude.js  v5
//
//  CHANGES from v4:
//    - Replaced raw fetch() with official Anthropic SDK.
//
//  WHY THE SDK:
//    Previous versions used Node's built-in fetch() to call
//    the Anthropic API. For short requests this works fine.
//    But the full paid reading takes 3-5 minutes to generate.
//    Node's built-in fetch (undici internally) drops the TLS
//    socket mid-stream for long connections — giving the error:
//      "TypeError: terminated — at TLSSocket.onHttpSocketClose"
//
//    The official Anthropic SDK (@anthropic-ai/sdk) handles all
//    connection management internally — keepalive, reconnection,
//    TLS, timeouts. It is specifically built and tested for
//    long-running generations like ours. Using it removes the
//    connection management problem entirely.
//
//  WHAT THE SDK DOES DIFFERENTLY:
//    - Manages the TLS connection lifecycle properly
//    - Handles keepalive so the connection never times out
//    - Uses client.messages.stream() which is purpose-built
//      for streaming long responses
//    - Maintained by Anthropic — always up to date
//
//  WHAT DIDN'T CHANGE:
//    - JSON parsing logic (first attempt + fix-retry)
//    - System + user prompt shape handling ({ system, user } or string)
//    - All logging steps
//    - Error handling — dispatcher still catches errors and
//      falls back to hardcoded engine if Claude fails
//
//  INSTALL:
//    npm install @anthropic-ai/sdk
//    (already added to package.json)
// ============================================================

const Anthropic = require('@anthropic-ai/sdk');

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

// ── Anthropic SDK client ──────────────────────────────────────
// Created once at module load time and reused for all calls.
// The SDK reads ANTHROPIC_API_KEY from the environment variable
// automatically — no need to pass it manually.
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Stream Claude response using SDK ─────────────────────────
//
// Uses client.messages.stream() which:
//   - Sends the request to Anthropic
//   - Streams the response chunk by chunk
//   - Handles all TLS / keepalive / reconnection internally
//   - Waits for the full response before resolving
//
// We collect all text chunks into a single string and return it.
// This is the same result as before — a complete JSON string —
// but now the connection is managed reliably by the SDK.
// ─────────────────────────────────────────────────────────────
async function callClaudeSDK(systemPrompt, userPrompt) {
  const params = {
    model:      'claude-sonnet-4-6',
    max_tokens: 25000,
    messages:   [{ role: 'user', content: userPrompt }],
  };

  // Add system prompt if provided
  // (paid_reading_v2.0 uses { system, user } shape)
  if (systemPrompt) {
    params.system = systemPrompt;
  }

  let raw = '';
  let totalChunks = 0;

  // client.messages.stream() returns an async iterable.
  // Each chunk is a streaming event from Anthropic.
  // We only care about content_block_delta events which
  // carry the actual text being generated.
  const stream = await client.messages.stream(params);

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta?.type === 'text_delta' &&
      chunk.delta?.text
    ) {
      raw += chunk.delta.text;
      totalChunks++;
    }
  }

  // finalMessage() waits for the stream to fully complete
  // and returns the final message object with usage stats.
  // This ensures we have the complete response before continuing.
  const finalMsg = await stream.finalMessage();

  log('2.stream', 'Stream complete via SDK', {
    totalChunks,
    rawLength:    raw.length,
    inputTokens:  finalMsg.usage?.input_tokens,
    outputTokens: finalMsg.usage?.output_tokens,
    preview:      raw.slice(0, 100),
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

  log(2, 'Sending request to Claude via Anthropic SDK', {
    model:       'claude-sonnet-4-6',
    hasSystem:   !!systemPrompt,
    userPreview: userPrompt?.slice(0, 300),
  });

  // ── Single call — no retry ────────────────────────────────
  // No retry loop. Retrying on failure wastes Anthropic credits
  // because each attempt is charged even if it fails.
  // If this call fails, the dispatcher catches the error and
  // falls back to the hardcoded engine automatically.
  let raw = null;

  try {
    raw = await callClaudeSDK(systemPrompt, userPrompt);
  } catch (err) {
    error(3, 'Anthropic SDK error', {
      message: err.message,
      status:  err.status,
      stack:   err.stack,
    });
    throw err; // dispatcher catches this and falls back to hardcoded
  }

  // Guard against empty response
  if (!raw) {
    error(6.1, 'EMPTY response from Claude — stream returned nothing');
    throw new Error('Claude returned empty response');
  }

  log(7, 'Full text received', {
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
    error(9, 'JSON parse FAILED — asking Claude to fix it', {
      error:      parseErr.message,
      rawPreview: raw.slice(0, 500),
    });
  }

  // ── Ask Claude to fix its own broken JSON ────────────────
  // Claude occasionally outputs valid content with minor JSON
  // formatting errors (trailing comma, unescaped quote, etc).
  // We send the broken output back and ask for corrected JSON.
  // This is a second SDK call but only fires if the first
  // response was malformed — which is rare.
  log(9.1, 'Sending JSON fix request to Claude');

  const fixPrompt = `The following text was supposed to be valid JSON but failed to parse.
Return ONLY the corrected, valid JSON. No explanation. No markdown fences. Just the JSON object.

BROKEN OUTPUT:
${raw.slice(0, 8000)}`;

  let retryRaw = '';

  try {
    const fixStream = await client.messages.stream({
      model:      'claude-sonnet-4-6',
      max_tokens: 25000,
      messages:   [{ role: 'user', content: fixPrompt }],
    });

    for await (const chunk of fixStream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta?.type === 'text_delta' &&
        chunk.delta?.text
      ) {
        retryRaw += chunk.delta.text;
      }
    }

    await fixStream.finalMessage();

  } catch (retryErr) {
    error(9.2, 'JSON fix request failed', { message: retryErr.message });
    throw new Error(`Claude returned invalid JSON and fix call failed: ${retryErr.message}`);
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