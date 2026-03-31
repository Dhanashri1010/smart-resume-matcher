const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  resumeText: {
    type: String,
    required: true
  },
  resumeFileName: {
    type: String,
    required: true
  },
  matchScore: {
    overall: { type: Number, default: 0 },
    skills: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    education: { type: Number, default: 0 },
    keywords: { type: Number, default: 0 },
    nlpAnalysis: {
      tfidfSimilarity: { type: Number, default: 0 },
      stringSimilarity: { type: Number, default: 0 },
      semanticSimilarity: { type: Number, default: 0 },
      matchedTerms: [{ type: String }],
      missingSkills: [{ type: String }],
      analysis: { type: String, default: '' }
    }
  },
  status: {
    type: String,
    enum: ['applied', 'reviewed', 'shortlisted', 'rejected'],
    default: 'applied'
  }
}, {
  timestamps: true
});

// Prevent duplicate applications
applicationSchema.index({ applicantId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);