const express = require('express');
const { body, validationResult } = require('express-validator');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { requireAuth } = require('../middleware/auth');
const { calculateAdvancedMatchScore } = require('../utils/scoring');

const router = express.Router();

// Create job (recruiters only)
router.post('/', 
  requireAuth,
  [
    body('title').notEmpty().withMessage('Job title is required'),
    body('company').notEmpty().withMessage('Company name is required')
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

      if (req.session.userType !== 'recruiter') {
        return res.status(403).json({
          success: false,
          message: 'Only recruiters can post jobs'
        });
      }

      const { title, company, description, skills, experience, location, education } = req.body;
      
      const job = new Job({
        title,
        company,
        description: description || `We are looking for a talented ${title} to join our team at ${company}.`,
        skills: skills ? skills.split(',').map(s => s.trim()).filter(s => s) : [],
        experience: experience || 'Not specified',
        education: education || 'Not specified',
        location: location || 'Not specified',
        recruiterId: req.session.userId
      });

      await job.save();

      res.status(201).json({
        success: true,
        message: 'Job posted successfully',
        job
      });
    } catch (error) {
      console.error('Job creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating job'
      });
    }
  }
);

// Get all active jobs (for applicants)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true })
      .populate('recruiterId', 'profile.company')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jobs'
    });
  }
});

// Get recruiter's jobs
router.get('/my-jobs', requireAuth, async (req, res) => {
  try {
    if (req.session.userType !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Only recruiters can access this endpoint'
      });
    }

    const jobs = await Job.find({ recruiterId: req.session.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jobs'
    });
  }
});

// Get recommended jobs for applicant based on resume text
router.post(
  '/recommendations',
  requireAuth,
  [body('resumeText').notEmpty().withMessage('Resume text is required')],
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
          message: 'Only applicants can get recommendations'
        });
      }

      const { resumeText } = req.body;

      const [jobs, existingApplications] = await Promise.all([
        Job.find({ isActive: true }).sort({ createdAt: -1 }),
        Application.find({ applicantId: req.session.userId }).select('jobId')
      ]);

      const appliedJobIds = new Set(existingApplications.map((app) => String(app.jobId)));

      const scoredJobs = await Promise.all(
        jobs.map(async (job) => {
          const jobSkills = Array.isArray(job.skills) ? job.skills : [];
          const jobText = `${job.title || ''} ${job.description || ''} ${jobSkills.join(' ')} ${job.experience || ''} ${job.education || ''}`;
          const matchScore = await calculateAdvancedMatchScore(resumeText, job);

          return {
            jobId: job._id,
            title: job.title,
            company: job.company,
            description: job.description,
            skills: jobSkills,
            experience: job.experience,
            education: job.education,
            location: job.location,
            postedDate: job.createdAt,
            alreadyApplied: appliedJobIds.has(String(job._id)),
            match: {
              overall: matchScore.overall || 0,
              skills: matchScore.skills || 0,
              keywords: matchScore.keywords || 0,
              analysis: matchScore.nlpAnalysis.analysis || '',
              matchedTerms: matchScore.nlpAnalysis.matchedTerms || [],
              missingSkills: matchScore.nlpAnalysis.missingSkills || []
            }
          };
        })
      );

      const recommendations = scoredJobs
        .filter((job) => !job.alreadyApplied)
        .sort((a, b) => b.match.overall - a.match.overall)
        .slice(0, 10);

      res.json({
        success: true,
        recommendations
      });
    } catch (error) {
      console.error('Job recommendations error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while generating job recommendations'
      });
    }
  }
);

// Get applications for a job (recruiters only)
router.get('/:jobId/applications', requireAuth, async (req, res) => {
  try {
    if (req.session.userType !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Only recruiters can view applications'
      });
    }

    const job = await Job.findOne({ 
      _id: req.params.jobId, 
      recruiterId: req.session.userId 
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('applicantId', 'email profile')
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