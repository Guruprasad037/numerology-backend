// ============================================================
//  src/engines/claude.js
// ============================================================

const FILE = "src/engines/claude.js";

function log(step, message, data = null) {
  console.log(
    `[${FILE}] STEP ${step} ${message}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
}

function error(step, message, data = null) {
  console.error(
    `[${FILE}] ❌ STEP ${step} ${message}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
}

async function run(prompt) {
  log(1, "run() called");

  log(1.1, "environment check", {
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    model: "claude-sonnet-4-20250514",
  });

  log(2, "Sending request to Claude API", {
    model: "claude-sonnet-4-20250514",
    promptLength: prompt?.length,
    promptPreview: prompt?.slice(0, 300),
  });

  let response;

  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3500,
        messages: [
          { role: "user", content: prompt }
        ],
      }),
    });
  } catch (err) {
    error(3, "Network error calling Claude API", {
      message: err.message,
      stack: err.stack,
    });
    throw err;
  }

  log(4, "Claude API responded", {
    status: response.status,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries()),
  });

  if (!response.ok) {
    const err = await response.text();

    error(5, "Claude API returned error response", {
      status: response.status,
      body: err,
    });

    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();

  log(6, "Raw Claude response received", {
    type: typeof data,
    keys: Object.keys(data || {}),
  });

  const raw = data.content?.[0]?.text || "";

  if (!raw) {
    error(6.1, "EMPTY response text from Claude", { data });
  }

  log(7, "Extracted raw text", {
    length: raw.length,
    preview: raw.slice(0, 300),
    tailPreview: raw.slice(-200),
  });

  try {
    const clean = raw.replace(/```json|```/g, "").trim();

    log(7.1, "Cleaned JSON string ready for parse", {
      length: clean.length,
      preview: clean.slice(0, 200),
    });

    const parsed = JSON.parse(clean);

    log(8, "JSON parse SUCCESS", {
      hasCards: !!parsed?.cards,
      cardCount: parsed?.cards?.length,
      hasCTA: !!parsed?.cta,
    });

    return parsed;
  } catch (err) {
    error(9, "JSON parse FAILED", {
      error: err.message,
      rawPreview: raw.slice(0, 500),
    });

    throw new Error(
      `Claude returned invalid JSON: ${raw.slice(0, 200)}`
    );
  }
}

module.exports = { run };