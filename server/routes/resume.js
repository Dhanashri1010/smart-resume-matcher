const express = require('express');
const multer = require('multer');
const resumeParser = require('../utils/resumeParser');
const resumeProcessor = require('../services/resumeProcessor');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and images are allowed.'));
    }
  }
});

router.post('/extract', requireAuth, upload.single('resume'), async (req, res) => {
  try {
    console.log('=== RESUME UPLOAD STARTED ===');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { buffer, mimetype, originalname } = req.file;

    console.log('Extracting text...');
    let extractedText = '';

    try {
      extractedText = await resumeParser.extractText(buffer, mimetype, originalname);
    } catch (err) {
      console.error('Parser error:', err);
      extractedText = '';
    }

    // 🔥 SAFE HANDLING
    if (!extractedText || typeof extractedText !== 'string') {
      extractedText = '';
    }

    console.log('Text extracted length:', extractedText.length);

    const lowConfidence = extractedText.trim().length < 20;

    // 🔥 SAFE STORE (DON’T CRASH IF FAILS)
    let resumeProfile = null;

    try {
      resumeProfile = await resumeProcessor.processAndStore(
        req.session.userId,
        originalname,
        extractedText
      );
      console.log('Resume saved:', resumeProfile?._id);
    } catch (err) {
      console.error('Resume storage error:', err);
      // ❗ Don't crash — continue response
    }

    return res.json({
      success: true,
      text: extractedText,
      filename: originalname,
      fileType: mimetype,
      message: lowConfidence
        ? 'We could only read a small part of your resume from this file. A clearer PDF/image or a DOCX will give better results.'
        : 'Resume processed successfully',
      warning: lowConfidence
        ? 'We could only read a small part of your resume. For better matching, try uploading a clearer version (for example a higher quality PDF or image).'
        : null
    });

  } catch (error) {
    console.error('Resume extraction error:', error);

    return res.status(500).json({
      success: false,
      message: 'Resume processing failed'
    });
  }
});

module.exports = router;