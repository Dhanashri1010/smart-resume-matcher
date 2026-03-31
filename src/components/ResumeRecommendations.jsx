import React from 'react';

const ResumeRecommendations = ({ recommendations }) => {
  if (!recommendations) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-white">
          Resume Recommendations
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-400">Apply to a job to get personalized recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
      <h3 className="text-xl font-bold mb-6 text-white">
        Resume Improvement Recommendations
      </h3>
      
      <div className="space-y-6">
        {/* Skills to Add */}
        {recommendations.skillsToAdd?.length > 0 && (
          <div className="bg-red-900/20 rounded-xl p-4 border-l-4 border-red-500">
            <h4 className="font-bold text-red-400 mb-3">
              Skills to Add
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {recommendations.skillsToAdd.map((skill, index) => (
                <span key={index} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-sm text-red-300 font-medium">
                Adding these skills will increase your match score by ~{recommendations.skillImpact}%
              </p>
            </div>
          </div>
        )}

        {/* Experience Recommendations */}
        {recommendations.experienceAdvice && (
          <div className="bg-yellow-900/20 rounded-xl p-4 border-l-4 border-yellow-500">
            <h4 className="font-bold text-yellow-400 mb-3">
              Experience Enhancement
            </h4>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-gray-300 font-medium">{recommendations.experienceAdvice}</p>
            </div>
          </div>
        )}

        {/* Education Recommendations */}
        {recommendations.educationAdvice && (
          <div className="bg-blue-900/20 rounded-xl p-4 border-l-4 border-blue-500">
            <h4 className="font-bold text-blue-400 mb-3">
              Education & Certifications
            </h4>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-gray-300 font-medium">{recommendations.educationAdvice}</p>
            </div>
          </div>
        )}

        {/* Keywords to Include */}
        {recommendations.keywordsToAdd?.length > 0 && (
          <div className="bg-green-900/20 rounded-xl p-4 border-l-4 border-green-500">
            <h4 className="font-bold text-green-400 mb-3">
              Keywords to Include
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {recommendations.keywordsToAdd.map((keyword, index) => (
                <span key={index} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
                  {keyword}
                </span>
              ))}
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-sm text-green-300 font-medium">
                Include these keywords naturally in your resume to improve ATS scanning
              </p>
            </div>
          </div>
        )}

        {/* Overall Advice */}
        {recommendations.overallAdvice && (
          <div className="bg-purple-900/20 rounded-xl p-4 border-l-4 border-purple-500">
            <h4 className="font-bold text-purple-400 mb-3">
              Overall Recommendation
            </h4>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-gray-300 font-medium">{recommendations.overallAdvice}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeRecommendations;