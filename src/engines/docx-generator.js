// ============================================================
//  src/engines/docx-generator.js
//  v1 — Convert HTML (with colors/styles) → DOCX file
//
//  Input:  HTML string with embedded CSS and inline styles
//  Output: DOCX file as Buffer
//
//  Uses: html-docx-js library to preserve formatting
// ============================================================

const htmlDocx = require("html-docx-js");
const fs = require("fs");

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
      preview: htmlString.slice(0, 200),
    });

    // Convert HTML → DOCX using html-docx-js
    // Returns a document object compatible with DOCX format
    log(3, "Converting HTML → DOCX using html-docx-js");
    const docx = htmlDocx.asBlob(htmlString);

    log(4, "Conversion successful", {
      type: typeof docx,
      size: docx ? docx.size : 0,
    });

    // Convert Blob → Buffer (for storing in DB or file system)
    const buffer = await blobToBuffer(docx);

    log(5, "Blob → Buffer conversion done", {
      bufferLength: buffer.length,
      bufferPreview: buffer.toString("base64").slice(0, 100),
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
// Helper: Convert Blob → Buffer
// ────────────────────────────────────────────────────────────
async function blobToBuffer(blob) {
  log("blob-to-buffer", "Converting Blob → Buffer");

  if (!blob) {
    throw new Error("Blob is null or undefined");
  }

  // html-docx-js returns a Blob-like object
  // We need to convert it to a Buffer
  if (typeof blob.stream === "function") {
    // Node 15+ Blob API
    const stream = blob.stream();
    const chunks = [];
    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  } else if (typeof blob.arrayBuffer === "function") {
    // Fallback: use arrayBuffer method
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } else if (Buffer.isBuffer(blob)) {
    // Already a Buffer
    return blob;
  } else {
    // Last resort: try to convert to Buffer directly
    return Buffer.from(blob);
  }
}

// ────────────────────────────────────────────────────────────
// Generate filename with timestamp
// ────────────────────────────────────────────────────────────
function generateFileName(subjectName) {
  const now = new Date();
  const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const time = now.toISOString().split("T")[1].split(".")[0].replace(/:/g, ""); // HHMMSS
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