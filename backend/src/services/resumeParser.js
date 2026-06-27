const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const WordExtractor = require('word-extractor');

const MAX_TEXT_LENGTH = 20000; // guards against feeding huge documents to the LLM later

async function parsePdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function parseDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function parseDoc(buffer) {
  const extractor = new WordExtractor();
  const doc = await extractor.extract(buffer);
  return doc.getBody();
}

// Extracts plain text from an uploaded resume file. Only the extracted text is
// ever persisted — the raw file buffer is discarded once parsed, so this needs
// no file/blob storage.
async function parseResumeFile(buffer, originalFilename) {
  const ext = (originalFilename.split('.').pop() || '').toLowerCase();

  let text;
  if (ext === 'pdf') text = await parsePdf(buffer);
  else if (ext === 'docx') text = await parseDocx(buffer);
  else if (ext === 'doc') text = await parseDoc(buffer);
  else throw new Error('Unsupported file type — only .pdf, .doc, and .docx are accepted');

  return text.trim().slice(0, MAX_TEXT_LENGTH);
}

module.exports = { parseResumeFile, MAX_TEXT_LENGTH };
