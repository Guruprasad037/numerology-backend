// ============================================================
//  src/engines/claude.js
// ============================================================

const FILE = "src/engines/claude.js";

function log(step, message, data = null) {
  console.log(
    `[${FILE}] STEP ${step} ${message}`,
    data ? JSON.stringify(data) : ""
  );
}

async function run(prompt) {
  log(1, "run() called");

  log(2, "Sending request to Claude API", {
    model: "claude-sonnet-4-20250514",
    promptPreview: prompt?.slice(0, 200),
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
    log(3, "Network error calling Claude API", { error: err.message });
    throw err;
  }

  log(4, "Claude API responded", {
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    const err = await response.text();
    log(5, "Claude API error response", {
      status: response.status,
      error: err,
    });
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();

  log(6, "Raw Claude response received", {
    keys: Object.keys(data || {}),
  });

  const raw = data.content?.[0]?.text || "";

  log(7, "Extracted raw text", {
    preview: raw.slice(0, 200),
  });

  try {
    const clean = raw.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(clean);

    log(8, "JSON parse success");

    return parsed;
  } catch (err) {
    log(9, "JSON parse FAILED", {
      error: err.message,
      rawPreview: raw.slice(0, 300),
    });

    throw new Error(
      `Claude returned invalid JSON: ${raw.slice(0, 200)}`
    );
  }
}

module.exports = { run };