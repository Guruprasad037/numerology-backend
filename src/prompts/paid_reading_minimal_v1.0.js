// ============================================================
//  src/prompts/paid_reading_minimal_v1.0.js
//  v1 — Minimal prompt for paid readings (~100 words)
//
//  OUTPUT: HTML with embedded CSS and colors
//  - Claude decides structure, formatting, colors, tables
//  - Backend just converts HTML → DOCX
//  - Result: Professional colored document ready to send
// ============================================================

const FILE = "src/prompts/paid_reading_minimal_v1.0.js";

function log(message) {
  console.log(`[${FILE}] ${message}`);
}

module.exports = function buildPrompt(profile) {
  log("Building minimal paid reading prompt for: " + profile.name);

  const colors = {
    primary_dark: "#2c3e50",
    primary_blue: "#3498db",
    accent_gold: "#f39c12",
    table_header: "#34495e",
    table_alt_row: "#ecf0f1",
    insight_bg: "#e8f4f8",
  };

  const prompt = `
You are a professional numerology report generator. Your task is to create a brief, beautiful HTML-formatted numerology reading that is ready to send to a customer.

CRITICAL REQUIREMENTS:
1. Output ONLY valid HTML5 with embedded CSS in <style> tags
2. Do NOT include any markdown, plain text, or explanations outside HTML
3. Do NOT include code fences (\`\`\`html) — just raw HTML

COLOR SCHEME (use these colors in your design):
- Primary dark background: ${colors.primary_dark}
- Section headings: ${colors.primary_blue}
- Number highlights: ${colors.accent_gold}
- Table header background: ${colors.table_header}
- Table alternating rows: white and ${colors.table_alt_row}
- Insight box background: ${colors.insight_bg}

DOCUMENT STRUCTURE:
1. Large centered title with dark background color, white text
2. Subheading with customer name and date of birth
3. "Core Numbers" section with an HTML TABLE:
   - 3 columns: Number Type | Value | Meaning
   - Highlight all number values with gold background
   - Use alternating row colors (white, light gray)
4. One short paragraph with key personality insight
5. Professional footer with timestamp
6. Use semantic HTML: <h1>, <h2>, <p>, <table>, <strong>, <em>, etc.
7. Include emoji for visual interest

CSS GUIDANCE:
- Use box-shadow for depth
- Use padding/margins for whitespace
- Make table header bold and styled
- Color table rows with alternating background
- Style insight boxes with border-left and background color
- Professional sans-serif font

NUMEROLOGY DATA:
- Subject Name: ${profile.name}
- Date of Birth: ${profile.dob_fmt}
- Psychic Number: ${profile.psychic_number}
- Destiny Number: ${profile.destiny_number}
- Name Number: ${profile.name_number}
- Soul Urge Number: ${profile.soul_urge_number}
- Personality Number: ${profile.personality_number}
- Life Path Number: ${profile.life_path_number}

Generate the complete HTML document now (no explanations, just HTML):
`;

  log("Prompt built, length: " + prompt.length + " chars");
  return prompt;
};