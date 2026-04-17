const express = require('express');
const { body, validationResult } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { requireAuth } = require('../middleware/auth');
const { calculateAdvancedMatchScore } = require('../utils/scoring');

const router = express.Router();

// Apply to job (applicants only)
router.post('/',
  requireAuth,
  [
    body('jobId').notEmpty().withMessage('Job ID is required'),
    body('resumeText').notEmpty().withMessage('Resume text is required'),
    body('resumeFileName').notEmpty().withMessage('Resume file name is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      if (req.session.userType !== 'applicant') {
        return res.status(403).json({
          success: false,
          message: 'Only applicants can apply to jobs'
        });
      }

      const { jobId, resumeText, resumeFileName } = req.body;

      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      const existingApplication = await Application.findOne({
        applicantId: req.session.userId,
        jobId
      });

      if (existingApplication) {
        return res.status(400).json({
          success: false,
          message: 'You have already applied to this job'
        });
      }

      // ✅ SAFE MATCH SCORE
      let matchScore = await calculateAdvancedMatchScore(resumeText, job);

      // ✅ FINAL SAFETY (NO NaN)
      matchScore = {
        overall: Number(matchScore.overall) || 0,
        skills: Number(matchScore.skills) || 0,
        experience: Number(matchScore.experience) || 0,
        education: Number(matchScore.education) || 0,
        keywords: Number(matchScore.keywords) || 0,
        nlpAnalysis: matchScore.nlpAnalysis || {}
      };

      const application = new Application({
        applicantId: req.session.userId,
        jobId,
        resumeText,
        resumeFileName,
        matchScore
      });

      await application.save();

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        application: {
          id: application._id,
          matchScore: application.matchScore,
          status: application.status
        }
      });

    } catch (error) {
      console.error('Application error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while submitting application'
      });
    }
  }
);

// Get user's applications
router.get('/my-applications', requireAuth, async (req, res) => {
  try {
    if (req.session.userType !== 'applicant') {
      return res.status(403).json({
        success: false,
        message: 'Only applicants can view their applications'
      });
    }

    const applications = await Application.find({ applicantId: req.session.userId })
      .populate('jobId', 'title company location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching applications'
    });
  }
});



module.exports = router;