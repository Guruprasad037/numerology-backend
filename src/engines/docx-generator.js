// ============================================================
//  src/engines/docx-generator.js
//  v2 — FIXED: Convert HTML → DOCX file properly
//
//  Input:  HTML string with embedded CSS and inline styles
//  Output: DOCX file as Buffer (base64 ready for DB storage)
//
//  Uses: html-docx-js library to preserve formatting
// ============================================================

const htmlDocx = require("html-docx-js");

const FILE = "src/engines/docx-generator.js";

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

// ────────────────────────────────────────────────────────────
// Main conversion function
// ────────────────────────────────────────────────────────────
async function htmlToDocx(htmlString, fileName = "report.docx") {
  log(1, "htmlToDocx() called", {
    htmlLength: htmlString ? htmlString.length : 0,
    fileName,
  });

  try {
    // Validate input
    if (!htmlString || typeof htmlString !== "string") {
      throw new Error("htmlString must be a non-empty string");
    }

    log(2, "HTML received", {
      length: htmlString.length,
      preview: htmlString.slice(0, 150),
    });

    // Convert HTML → DOCX using html-docx-js
    // ⚠️  IMPORTANT: asBlob() is async, must await
    log(3, "Converting HTML → DOCX using html-docx-js");
    const docx = await htmlDocx.asBlob(htmlString);

    log(4, "Conversion successful", {
      type: typeof docx,
      size: docx ? docx.size : 0,
    });

    // Convert Blob → Buffer
    const buffer = await blobToBuffer(docx);

    log(5, "Blob → Buffer conversion done", {
      bufferLength: buffer.length,
    });

    // Return both Buffer and base64 (for flexibility)
    const result = {
      buffer,
      base64: buffer.toString("base64"),
      fileName,
      size: buffer.length,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    log(6, "htmlToDocx() completed successfully", {
      size: result.size,
      fileName: result.fileName,
    });

    return result;
  } catch (err) {
    error(99, "htmlToDocx() failed", {
      message: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

// ────────────────────────────────────────────────────────────
// Helper: Convert Blob → Buffer (FIXED VERSION)
// ────────────────────────────────────────────────────────────
async function blobToBuffer(blob) {
  log("blob-to-buffer", "Converting Blob → Buffer");

  if (!blob) {
    throw new Error("Blob is null or undefined");
  }

  try {
    // FIXED: Use arrayBuffer() method (most reliable)
    // This works in Node.js 15+ and browser environments
    if (typeof blob.arrayBuffer === "function") {
      log("blob-to-buffer", "Using blob.arrayBuffer() method");
      const arrayBuffer = await blob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    // Fallback: If somehow it's already a Buffer
    if (Buffer.isBuffer(blob)) {
      log("blob-to-buffer", "Blob is already a Buffer");
      return blob;
    }

    // Last resort: Try direct conversion
    log("blob-to-buffer", "Attempting direct Buffer.from() conversion");
    return Buffer.from(blob);
  } catch (err) {
    error("blob-to-buffer", "Failed to convert Blob to Buffer", {
      message: err.message,
    });
    throw err;
  }
}

// ────────────────────────────────────────────────────────────
// Generate filename with timestamp
// ────────────────────────────────────────────────────────────
function generateFileName(subjectName) {
  const now = new Date();
  const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const time = now
    .toISOString()
    .split("T")[1]
    .split(".")[0]
    .replace(/:/g, ""); // HHMMSS

  const cleanName = (subjectName || "Report")
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special chars
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .slice(0, 30); // Limit length

  return `Report_${cleanName}_${date}_${time}.docx`;
}

module.exports = {
  htmlToDocx,
  generateFileName,
};