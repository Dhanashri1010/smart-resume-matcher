const use = require('@tensorflow-models/universal-sentence-encoder');
const tf = require('@tensorflow/tfjs');

const natural = require('natural');
const sw = require('stopword');
const stringSimilarity = require('string-similarity');

class NLPMatcher {
  constructor() {
    this.TfIdf = natural.TfIdf;
    this.model = null;
    this.loadModel();
  }

  async loadModel() {
    this.model = await use.load();
  }

  preprocessText(text) {
    if (!text) return [];

    const cleaned = text.toLowerCase().replace(/[^a-zA-Z0-9+#.\s]/g, ' ');
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(cleaned);
    const withoutStopWords = sw.removeStopwords(tokens);

    return withoutStopWords.filter(word => word.length > 2);
  }

  calculateTFIDF(resumeText, jobText) {
    const tfidf = new this.TfIdf();

    tfidf.addDocument(this.preprocessText(resumeText).join(' '));
    tfidf.addDocument(this.preprocessText(jobText).join(' '));

    const resumeVector = [];
    const jobVector = [];

    const allTerms = new Set();
    tfidf.listTerms(0).forEach(item => allTerms.add(item.term));
    tfidf.listTerms(1).forEach(item => allTerms.add(item.term));

    [...allTerms].forEach(term => {
      resumeVector.push(tfidf.tfidf(term, 0));
      jobVector.push(tfidf.tfidf(term, 1));
    });

    return { resumeVector, jobVector, terms: [...allTerms] };
  }

  cosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length || vectorA.length === 0) return 0;

    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (magnitudeA * magnitudeB);
  }

  async calculateSemanticSimilarity(resumeText, jobText) {
    try {
      if (!this.model) {
        await this.loadModel();
      }

      const embeddings = await this.model.embed([resumeText, jobText]);
      const embArray = await embeddings.array();

      return this.cosineSimilarity(embArray[0], embArray[1]);
    } catch (error) {
      // If TF/USE fails to load due to runtime/dependency mismatch,
      // continue with lexical scoring instead of failing whole analysis.
      console.error('Semantic similarity fallback:', error.message || error);
      return 0;
    }
  }

  // 🔥 FIXED FUNCTION
  calculateWeightedSkills(resumeTerms, jobTerms) {
    if (!resumeTerms.length || !jobTerms.length) return 0;

    const jobFrequency = {};

    jobTerms.forEach(term => {
      jobFrequency[term] = (jobFrequency[term] || 0) + 1;
    });

    let score = 0;
    let totalWeight = 0;

    Object.keys(jobFrequency).forEach(skill => {
      const weight = jobFrequency[skill] || 1;
      totalWeight += weight;

      if (resumeTerms.includes(skill)) {
        score += weight;
      }
    });

    if (totalWeight === 0) return 0;

    const result = score / totalWeight;

    // 🔥 PREVENT NaN
    return isNaN(result) ? 0 : result;
  }

  async calculateAdvancedMatch(resumeText, jobDescription) {
    try {
      if (!resumeText || resumeText.length < 20) {
        return {
          overallMatch: 0,
          tfidfSimilarity: 0,
          stringSimilarity: 0,
          skillsMatch: 0,
          semanticSimilarity: 0,
          matchedTerms: [],
          missingSkills: [],
          analysis: 'Invalid or empty resume text'
        };
      }

      const { resumeVector, jobVector, terms } =
        this.calculateTFIDF(resumeText, jobDescription);

      const tfidfSimilarity = this.cosineSimilarity(resumeVector, jobVector);

      const resumeTerms = this.preprocessText(resumeText);
      const jobTerms = this.preprocessText(jobDescription);

      const stringSim = stringSimilarity.compareTwoStrings(
        resumeTerms.join(' '),
        jobTerms.join(' ')
      );

      // 🔥 SAFE SKILLS MATCH
      const rawSkills = this.calculateWeightedSkills(resumeTerms, jobTerms);
      const skillsMatch = isNaN(rawSkills) ? 0 : rawSkills;

      const semanticSimilarity = await this.calculateSemanticSimilarity(
        resumeText,
        jobDescription
      );

      const hasSemantic = semanticSimilarity > 0;
      const finalScore = hasSemantic
        ? ((tfidfSimilarity * 0.25) +
          (skillsMatch * 0.25) +
          (stringSim * 0.15) +
          (semanticSimilarity * 0.35))
        : ((tfidfSimilarity * 0.4) +
          (skillsMatch * 0.4) +
          (stringSim * 0.2));

      return {
        overallMatch: Math.round((isNaN(finalScore) ? 0 : finalScore) * 100),
        tfidfSimilarity: Math.round(tfidfSimilarity * 100),
        stringSimilarity: Math.round(stringSim * 100),
        skillsMatch: Math.round(skillsMatch * 100),
        semanticSimilarity: Math.round(semanticSimilarity * 100),
        matchedTerms: this.getTopMatchedTerms(
          resumeVector,
          jobVector,
          terms
        ),
        missingSkills: this.getMissingSkills(resumeTerms, jobTerms),
        analysis: this.generateAnalysis(finalScore)
      };

    } catch (error) {
      console.error('NLP matching error:', error);
      return {
        overallMatch: 0,
        tfidfSimilarity: 0,
        stringSimilarity: 0,
        skillsMatch: 0,
        semanticSimilarity: 0,
        matchedTerms: [],
        missingSkills: [],
        analysis: 'Error in NLP analysis'
      };
    }
  }

  getMissingSkills(resumeTerms, jobTerms) {
    return jobTerms
      .filter(skill => !resumeTerms.includes(skill))
      .slice(0, 5);
  }

  getTopMatchedTerms(resumeVector, jobVector, terms) {
    return terms
      .map((term, i) => ({
        term,
        score: resumeVector[i] * jobVector[i]
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(item => item.term);
  }

  generateAnalysis(score) {
    if (score > 0.8) return 'Excellent match! Highly suitable candidate.';
    if (score > 0.6) return 'Good match. Candidate meets most requirements.';
    if (score > 0.4) return 'Average match. Some skills missing.';
    return 'Low match. Candidate needs improvement.';
  }
}

module.exports = new NLPMatcher();