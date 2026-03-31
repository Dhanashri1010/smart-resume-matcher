const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');

class ResumeParser {
  async runOcr(buffer, label = 'OCR') {
    try {
      const result = await Tesseract.recognize(buffer, 'eng', {
        logger: (m) => {
          if (m?.status === 'recognizing text') return;
          if (m?.status) console.log(`${label}: ${m.status}`);
        }
      });

      return result?.data?.text || "";
    } catch (error) {
      console.error(`${label} failed:`, error.message || error);
      return "";
    }
  }


  // Minimal file signature checks so we don't send garbage buffers to OCR.
  // (Prevents tesseract worker crashes on mislabeled/invalid images.)
  isJPEG(buffer) {
    if (!buffer || buffer.length < 2) return false;
    return buffer[0] === 0xff && buffer[1] === 0xd8; // FF D8
  }

  isPNG(buffer) {
    if (!buffer || buffer.length < 8) return false;
    return buffer
      .slice(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  // 🔥 MAIN FUNCTION
  async extractText(buffer, mimeType, filename) {
    try {
      console.log(`Processing file: ${filename}`);

      let text = "";

      if (mimeType === 'application/pdf') {
        text = await this.extractFromPDF(buffer);
      } 
      else if (mimeType.includes('word')) {
        text = await this.extractFromDOCX(buffer);
      } 
      else if (mimeType.startsWith('image/')) {
        text = await this.extractFromImage(buffer);
      }

      // ❗ FINAL CHECK
      if (!text || text.trim().length < 10) {
        throw new Error("No readable text found in resume");
      }

      return this.cleanText(text);

    } catch (error) {
      console.error("Resume parsing error:", error.message);
      throw new Error("Resume text extraction failed");
    }
  }

  // ✅ PDF (FIXED - ONLY ONE FUNCTION)
  async extractFromPDF(buffer) {
    try {
      const data = await pdfParse(buffer);

      let text = data?.text || "";

      console.log("PDF text length:", text.length);

      // ✅ If normal PDF
      if (text && text.trim().length > 50) {
        return text;
      }

      // 🔥 If scanned → OCR
      console.log("⚠️ Using OCR for scanned PDF...");

      return await this.runOcr(buffer, 'PDF OCR');

    } catch (error) {
      console.error("PDF parse failed, trying OCR:", error);
      return await this.runOcr(buffer, 'PDF OCR fallback');
    }
  }

  // ✅ DOCX
  async extractFromDOCX(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });

      return result.value || "";

    } catch (error) {
      console.error("DOCX Error:", error);
      return "";
    }
  }

  // ✅ IMAGE OCR
  async extractFromImage(buffer) {
    try {
      console.log('Starting OCR for image...');

      // Guard: if the buffer doesn't look like an actual image, don't OCR.
      // Some clients upload mislabeled files (e.g. .jpg with non-jpg content).
      if (!this.isJPEG(buffer) && !this.isPNG(buffer)) {
        console.error('Image OCR skipped: buffer is not a valid JPEG/PNG');
        return "";
      }

      return await this.runOcr(buffer, 'Image OCR');

    } catch (error) {
      console.error("Image OCR Error:", error);
      return "";
    }
  }

  // ✅ CLEAN TEXT
  cleanText(text) {
    return text
      .replace(/\r/g, '')
      .replace(/\n+/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = new ResumeParser();