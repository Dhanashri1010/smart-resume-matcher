const nlpMatcher = require('./nlpMatcher');

async function calculateAdvancedMatchScore(resumeText, job) {
  try {
    if (!resumeText || resumeText.trim().length < 10) {
      return {
        overall: 0,
        skills: 0,
        experience: 0,
        education: 0,
        keywords: 0,
        nlpAnalysis: {}
      };
    }

    const jobSkills = Array.isArray(job.skills) ? job.skills : [];
    const jobText = `${job.title || ''} ${job.description || ''} ${jobSkills.join(' ')} ${job.requirements || ''}`;

    const nlpResult = await nlpMatcher.calculateAdvancedMatch(resumeText, jobText);

    const legacySkillsScore = calculateLegacySkillsMatch(resumeText, jobSkills);
    const keywordCoverageScore = calculateKeywordCoverageScore(resumeText, jobText);
    const experienceDetails = getExperienceDetails(resumeText, job.experience);
    const educationDetails = getEducationDetails(resumeText, job.education || job.description);
    const experienceScore = experienceDetails.score;
    const educationScore = educationDetails.score;

    const safeSkillsMatch = Number(nlpResult?.skillsMatch) || 0;
    const safeOverall = Number(nlpResult?.overallMatch) || 0;
    const safeKeywords = Math.max(
      Number(nlpResult?.semanticSimilarity) || 0,
      keywordCoverageScore
    );
    const safeSkills = Math.min(Math.max(legacySkillsScore, safeSkillsMatch), 100);

    const weightedOverall = Math.round(
      (safeSkills * 0.4) +
      (safeKeywords * 0.25) +
      (experienceScore * 0.2) +
      (educationScore * 0.15)
    );

    return {
      overall: Math.min(Math.max(weightedOverall, safeOverall), 100),
      skills: safeSkills,
      experience: experienceScore,
      education: educationScore,
      keywords: Math.min(safeKeywords, 100),
      nlpAnalysis: {
        tfidfSimilarity: 0,
        stringSimilarity: Number(nlpResult?.stringSimilarity) || 0,
        semanticSimilarity: Number(nlpResult?.semanticSimilarity) || 0,
        matchedTerms: nlpResult?.matchedTerms || [],
        missingSkills: nlpResult?.missingSkills || [],
        experienceDetails,
        educationDetails,
        analysis: nlpResult?.analysis || ''
      }
    };

  } catch (error) {
    console.error('NLP failed, fallback used:', error);
    return calculateSimpleMatchScore(resumeText, job);
  }
}

// Legacy skills match
function calculateLegacySkillsMatch(resumeText, jobSkills) {
  const resume = resumeText.toLowerCase();
  const skills = jobSkills.map(skill => skill.toLowerCase());

  let matches = 0;
  skills.forEach(skill => {
    if (resume.includes(skill)) matches++;
  });

  return skills.length > 0 ? Math.round((matches / skills.length) * 100) : 0;
}

function calculateKeywordCoverageScore(resumeText, jobText) {
  const resumeTokens = new Set(tokenize(resumeText));
  const jobTokens = tokenize(jobText).filter(token => token.length >= 3);
  if (!jobTokens.length) return 0;

  const uniqueJobTokens = [...new Set(jobTokens)];
  const covered = uniqueJobTokens.filter(token => resumeTokens.has(token)).length;
  return Math.round((covered / uniqueJobTokens.length) * 100);
}

// Experience score
function extractExperienceScore(resumeText, requiredExperienceText = '') {
  return getExperienceDetails(resumeText, requiredExperienceText).score;
}

function getExperienceDetails(resumeText, requiredExperienceText = '') {
  const resumeYears = extractYearsFromText(resumeText);
  const requiredYears = extractYearsFromText(requiredExperienceText);

  // If JD has no explicit years, fallback to evidence-based keyword score.
  if (!requiredYears) {
    const text = resumeText.toLowerCase();
    const keywords = ['experience', 'years', 'worked', 'employed', 'position'];
    const matches = keywords.filter(k => text.includes(k)).length;
    return {
      score: Math.min(50 + (matches * 10), 100),
      candidateYears: resumeYears || 0,
      requiredYears: 0
    };
  }

  if (!resumeYears) {
    return { score: 30, candidateYears: 0, requiredYears };
  }
  if (resumeYears >= requiredYears) {
    return { score: 100, candidateYears: resumeYears, requiredYears };
  }

  return {
    score: Math.max(30, Math.round((resumeYears / requiredYears) * 100)),
    candidateYears: resumeYears,
    requiredYears
  };
}

// Education score
function extractEducationScore(resumeText, jobDescription = '') {
  return getEducationDetails(resumeText, jobDescription).score;
}

function getEducationDetails(resumeText, jobDescription = '') {
  const text = resumeText.toLowerCase();
  const jd = (jobDescription || '').toLowerCase();

  const levels = [
    { name: 'phd', score: 100, tokens: ['phd', 'doctorate'] },
    { name: 'master', score: 85, tokens: ['master', 'm.tech', 'mba', 'msc', 'm.s'] },
    { name: 'bachelor', score: 70, tokens: ['bachelor', 'b.tech', 'be', 'bsc', 'b.s'] },
    { name: 'diploma', score: 55, tokens: ['diploma'] }
  ];

  const required = levels.find(level => level.tokens.some(token => jd.includes(token)));
  const candidate = levels.find(level => level.tokens.some(token => text.includes(token)));

  if (required && candidate) {
    if (candidate.score >= required.score) {
      return { score: 100, candidateLevel: candidate.name, requiredLevel: required.name };
    }
    return {
      score: Math.max(40, Math.round((candidate.score / required.score) * 100)),
      candidateLevel: candidate.name,
      requiredLevel: required.name
    };
  }

  if (candidate) {
    return {
      score: Math.max(60, candidate.score),
      candidateLevel: candidate.name,
      requiredLevel: required?.name || 'not specified'
    };
  }
  return {
    score: 35,
    candidateLevel: 'not found',
    requiredLevel: required?.name || 'not specified'
  };
}

// Fallback simple match
function calculateSimpleMatchScore(resumeText, job) {
  const resume = resumeText.toLowerCase();
  const jobDesc = job.description.toLowerCase();
  const jobSkills = job.skills.map(skill => skill.toLowerCase());

  let skillMatches = 0;
  jobSkills.forEach(skill => {
    if (resume.includes(skill)) skillMatches++;
  });

  const skillsScore = jobSkills.length > 0 ? (skillMatches / jobSkills.length) * 100 : 0;

  return {
    overall: Math.round(skillsScore),
    skills: Math.round(skillsScore),
    experience: 60,
    education: 60,
    keywords: 50
  };
}

function extractYearsFromText(text = '') {
  const normalized = String(text).toLowerCase();
  const rangeMatch = normalized.match(/(\d+)\s*[-to]{1,3}\s*(\d+)\s*\+?\s*(years|yrs|year|yr)?/);
  if (rangeMatch) {
    const minYears = Number(rangeMatch[1]);
    const maxYears = Number(rangeMatch[2]);
    return Math.round((minYears + maxYears) / 2);
  }

  const singleMatch = normalized.match(/(\d+)\s*\+?\s*(years|yrs|year|yr)/);
  if (singleMatch) return Number(singleMatch[1]);

  return 0;
}

function tokenize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9+#.]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

module.exports = {
  calculateAdvancedMatchScore
};
