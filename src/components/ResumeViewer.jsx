import React from 'react';

const ResumeViewer = ({ candidate, onClose }) => {
  if (!candidate) return null;

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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden border border-gray-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">{candidate.name}</h2>
            <p className="text-gray-400">{candidate.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-3xl font-bold transition-colors duration-200"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Resume Content */}
            <div className="bg-gray-700 p-4 rounded-xl border border-gray-600">
              <h3 className="text-lg font-semibold mb-4 text-white">Resume Content</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-cyan-400 mb-2">Contact Information</h4>
                  <p className="text-gray-300">
                    {candidate.name}<br/>
                    {candidate.email}<br/>
                    {candidate.phone || '+1 (555) 123-4567'}<br/>
                    {candidate.location || 'New York, NY'}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-cyan-400 mb-2">Experience</h4>
                  <div className="text-gray-300">
                    <p className="font-medium text-white">Senior Frontend Developer</p>
                    <p className="text-gray-400">TechCorp Inc. | 2021 - Present</p>
                    <p className="text-xs mt-1">Developed responsive web applications using React, JavaScript, and modern CSS frameworks...</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-cyan-400 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {candidate.breakdown.skills.details.matched?.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-lg border border-green-700">
                        {skill}
                      </span>
                    ))}
                    {candidate.breakdown.skills.details.missing?.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-red-900/30 text-red-400 text-xs rounded-lg border border-red-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-cyan-400 mb-2">Education</h4>
                  <p className="text-gray-300">
                    Bachelor's in Computer Science<br/>
                    State University | 2017 - 2021
                  </p>
                </div>
              </div>
            </div>

            {/* Match Analysis */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Match Analysis</h3>
              <div className="space-y-4">
                <div className="text-center p-4 bg-gray-700 rounded-xl border border-gray-600">
                  <div className={`text-3xl font-bold ${getScoreTextColor(candidate.overallMatch)}`}>{candidate.overallMatch}%</div>
                  <p className="text-gray-400">Overall Match</p>
                </div>

                {Object.entries(candidate.breakdown).map(([category, data]) => (
                  <div key={category} className="border-b border-gray-700 pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium capitalize text-white">{category}</span>
                      <span className={`text-sm font-medium ${getScoreTextColor(data.score)}`}>{data.score}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${getScoreColor(data.score)}`}
                        style={{ width: `${data.score}%` }}
                      />
                    </div>
                    {data.details && (
                      <div className="text-sm mt-2">
                        {category === 'skills' && (
                          <div>
                            <p className="text-green-400">✓ Matched: {data.details.matched?.join(', ')}</p>
                            {data.details.missing?.length > 0 && (
                              <p className="text-red-400">✗ Missing: {data.details.missing.join(', ')}</p>
                            )}
                          </div>
                        )}
                        {category === 'experience' && (
                          <p className="text-gray-300">Candidate: {data.details.candidateYears} years | Required: {data.details.requiredYears} years</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-700 bg-gray-700/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
          >
            Close
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
            Shortlist Candidate
          </button>
          <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
            Schedule Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeViewer;