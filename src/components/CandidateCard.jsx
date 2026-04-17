import React, { useState } from 'react';

const CandidateCard = ({ candidate, onViewDetails }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400 bg-green-900/30 border-green-700';
    if (score >= 60) return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
    return 'text-red-400 bg-red-900/30 border-red-700';
  };

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 animate-slideInUp hover:shadow-2xl hover:scale-105 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="animate-slideInLeft">
          <h3 className="text-xl font-semibold text-white hover:text-cyan-400 transition-colors duration-200">{candidate.name}</h3>
          <p className="text-gray-400 animate-fadeIn animation-delay-200">{candidate.email}</p>
          <p className="text-sm text-gray-500 animate-fadeIn animation-delay-300">Applied: {candidate.appliedDate}</p>
        </div>
        <div className={`px-3 py-2 rounded-lg font-bold text-lg border ${getScoreColor(candidate.overallMatch)} animate-bounceIn animation-delay-500 hover:scale-110 transition-transform duration-200`}>
          {candidate.overallMatch}%
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-300 mb-2">Applied for: <span className="font-medium text-cyan-400">{candidate.jobTitle}</span></p>
        <p className="text-sm text-gray-400">Resume: {candidate.resumeName}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {Object.entries(candidate.breakdown).map(([category, data], index) => (
          <div key={category} className="text-center animate-bounceIn hover:scale-110 transition-transform duration-200" style={{animationDelay: `${600 + index * 100}ms`}}>
            <div className={`text-sm font-medium px-2 py-1 rounded-lg border ${getScoreColor(data.score)} hover:shadow-lg transition-shadow duration-200`}>
              {data.score}%
            </div>
            <p className="text-xs text-gray-400 mt-1 capitalize">{category}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center animate-slideInUp animation-delay-800">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-all duration-200 hover:scale-110"
        >
          {showDetails ? 'Hide Details' : 'View Details'}
        </button>
        <div className="space-x-2">
          <button
            onClick={() => onViewDetails(candidate)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
          >
            View Resume
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 transform hover:scale-105 hover:shadow-lg">
            Shortlist
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-700 animate-slideInDown">
          <div className="space-y-3">
            {Object.entries(candidate.breakdown).map(([category, data], index) => (
              <div key={category} className="animate-fadeIn" style={{animationDelay: `${index * 150}ms`}}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium capitalize text-white">{category}</span>
                  <span className="text-sm text-gray-400">{data.score}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full ${getProgressColor(data.score)} transition-all duration-1000 ease-out`}
                    style={{ width: `${data.score}%` }}
                  />
                </div>
                {data.details && (
                  <div className="text-sm mt-1">
                    {category === 'skills' && (
                      <>
                        <span className="text-green-400">✓ {data.details.matched?.join(', ')}</span>
                        {data.details.missing?.length > 0 && (
                          <span className="text-red-400 ml-2">✗ {data.details.missing.join(', ')}</span>
                        )}
                      </>
                    )}
                    {category === 'experience' && (
                      <span className="text-gray-300">{data.details.candidateYears} years | Required: {data.details.requiredYears} years</span>
                    )}
                    {category === 'education' && (
                      <span className="text-gray-300">{data.details.match}</span>
                    )}

                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateCard;