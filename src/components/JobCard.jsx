import React from 'react';

const JobCard = ({ job, onApply, showApplyButton = true }) => {
  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl animate-slideInUp">
      <div className="flex justify-between items-start mb-4">
        <div className="animate-slideInLeft">
          <h3 className="text-xl font-bold text-white hover:text-cyan-400 transition-colors duration-200">
            {job.title}
          </h3>
          <p className="text-gray-400 font-medium mt-1 animate-fadeIn animation-delay-200">
            {job.company}
          </p>
        </div>
        <div className="bg-gray-700 px-3 py-1 rounded-lg border border-gray-600 animate-slideInRight">
          <span className="text-sm text-gray-300 font-medium">
            {job.postedDate}
          </span>
        </div>
      </div>
      
      <div className="mb-4 animate-fadeIn animation-delay-300">
        <p className="text-gray-300 line-clamp-3 leading-relaxed">{job.description}</p>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4 animate-slideInUp animation-delay-400">
        {job.skills && job.skills.map((skill, index) => (
          <span 
            key={index} 
            className="px-3 py-1 bg-cyan-600/20 text-cyan-400 text-sm font-medium rounded-lg border border-cyan-600/30 hover:bg-cyan-600/40 transition-all duration-200 transform hover:scale-110 animate-bounceIn"
            style={{animationDelay: `${500 + index * 100}ms`}}
          >
            {skill}
          </span>
        ))}
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400 space-y-1">
          <div>
            <span className="font-medium">Experience: {job.experience}</span>
          </div>
          {job.location && (
            <div>
              <span className="font-medium">Location: {job.location}</span>
            </div>
          )}
        </div>
        {showApplyButton && (
          <button
            onClick={() => onApply(job)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 animate-pulse hover:animate-none"
          >
            Apply Now
          </button>
        )}
      </div>
    </div>
  );
};

export default JobCard;