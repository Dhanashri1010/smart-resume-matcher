import React from 'react';

const MatchAnalysis = ({ matchData }) => {
  if (!matchData) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-white">
          Match Analysis
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-400">Upload a resume and apply to a job to see match analysis</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 animate-slideInRight">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white animate-slideInLeft">
          Match Analysis
        </h3>
        <div className={`text-4xl font-bold ${getScoreTextColor(matchData.overallMatch)} animate-bounceIn animation-delay-500`}>
          {matchData.overallMatch}%
        </div>
      </div>
      
      <div className="space-y-6">
        {matchData.analysis && (
          <div className="bg-cyan-900/20 border border-cyan-700 rounded-xl p-3 text-sm text-cyan-200">
            {matchData.analysis}
          </div>
        )}

        {Object.entries(matchData.breakdown).map(([category, data], index) => (
          <div key={category} className="bg-gray-700/50 rounded-xl p-4 border border-gray-600 animate-slideInUp hover:bg-gray-700/70 transition-all duration-300" style={{animationDelay: `${600 + index * 200}ms`}}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold capitalize text-white animate-slideInLeft" style={{animationDelay: `${700 + index * 200}ms`}}>
                {category}
              </span>
              <span className={`text-lg font-bold ${getScoreTextColor(data.score)} animate-bounceIn`} style={{animationDelay: `${800 + index * 200}ms`}}>
                {data.score}%
              </span>
            </div>
            
            <div className="w-full bg-gray-600 rounded-full h-3 mb-3 overflow-hidden">
              <div 
                className={`h-3 rounded-full ${getScoreColor(data.score)} transition-all duration-1500 ease-out animate-slideInLeft`}
                style={{ width: `${data.score}%`, animationDelay: `${900 + index * 200}ms` }}
              />
            </div>
            
            <div className="text-sm">
              {data.details && (
                <div className="space-y-2">
                  {category === 'skills' && (
                    <>
                      <div className="flex flex-wrap gap-1 items-center animate-fadeIn" style={{animationDelay: `${1000 + index * 200}ms`}}>
                        <span className="text-green-400 font-medium">✓ Matched:</span>
                        {data.details.matched?.map((skill, skillIndex) => (
                          <span key={skillIndex} className="bg-green-900/30 text-green-400 px-2 py-1 rounded-lg text-xs font-medium border border-green-700 animate-bounceIn hover:scale-110 transition-transform duration-200" style={{animationDelay: `${1100 + index * 200 + skillIndex * 100}ms`}}>
                            {skill}
                          </span>
                        ))}
                      </div>
                      {data.details.missing?.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center animate-fadeIn" style={{animationDelay: `${1200 + index * 200}ms`}}>
                          <span className="text-red-400 font-medium">✗ Missing:</span>
                          {data.details.missing.map((skill, skillIndex) => (
                            <span key={skillIndex} className="bg-red-900/30 text-red-400 px-2 py-1 rounded-lg text-xs font-medium border border-red-700 animate-bounceIn hover:scale-110 transition-transform duration-200" style={{animationDelay: `${1300 + index * 200 + skillIndex * 100}ms`}}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {category === 'experience' && (
                    <p className="text-gray-300 font-medium">
                      You have <span className="text-cyan-400">{data.details.candidateYears} years</span> | 
                      Required: <span className="text-yellow-400">{data.details.requiredYears} years</span>
                    </p>
                  )}
                  {category === 'education' && (
                    <p className="text-gray-300 font-medium">
                      {data.details.match}
                    </p>
                  )}

                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchAnalysis;