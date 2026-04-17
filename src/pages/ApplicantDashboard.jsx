import React, { useState, useEffect } from 'react';
import JobCard from '../components/JobCard';
import MatchAnalysis from '../components/MatchAnalysis';
import ResumeRecommendations from '../components/ResumeRecommendations';
import apiService from '../services/api';

const ApplicantDashboard = () => {
  const [uploadedResume, setUploadedResume] = useState(() => {
    const saved = localStorage.getItem('uploadedResume');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedJob, setSelectedJob] = useState(() => {
    const saved = localStorage.getItem('selectedJob');
    return saved ? JSON.parse(saved) : null;
  });
  const [matchData, setMatchData] = useState(() => {
    const saved = localStorage.getItem('matchData');
    return saved ? JSON.parse(saved) : null;
  });
  const [recommendations, setRecommendations] = useState(() => {
    const saved = localStorage.getItem('recommendations');
    return saved ? JSON.parse(saved) : null;
  });
  const [jobs, setJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState(() => {
    const saved = localStorage.getItem('recommendedJobs');
    return saved ? JSON.parse(saved) : [];
  });
  const [uploadWarning, setUploadWarning] = useState('');

  useEffect(() => {
    if (!uploadWarning) return undefined;

    const timeoutId = setTimeout(() => {
      setUploadWarning('');
    }, 7000);

    return () => clearTimeout(timeoutId);
  }, [uploadWarning]);

  const convertImageToPngFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Unable to process image for OCR.'));
            return;
          }

          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Unable to convert image to PNG.'));
              return;
            }

            const baseName = file.name.replace(/\.[^/.]+$/, '');
            resolve(new File([blob], `${baseName}.png`, { type: 'image/png' }));
          }, 'image/png');
        };
        img.onerror = () => reject(new Error('Invalid image file.'));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error('Could not read image file.'));
      reader.readAsDataURL(file);
    });

  // Fetch real jobs from API
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/jobs');
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs.map(job => ({
          id: job._id,
          title: job.title,
          company: job.company,
          description: job.description,
          skills: job.skills,
          experience: job.experience,
          location: job.location,
          postedDate: new Date(job.createdAt).toLocaleDateString()
        })));
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchJobRecommendations = async (resumeText) => {
    try {
      const response = await apiService.getJobRecommendations(resumeText);
      if (response.success) {
        const mapped = response.recommendations.map((item) => ({
          id: item.jobId,
          title: item.title,
          company: item.company,
          description: item.description,
          skills: item.skills,
          experience: item.experience,
          location: item.location,
          postedDate: new Date(item.postedDate).toLocaleDateString(),
          match: item.match
        }));
        setRecommendedJobs(mapped);
        localStorage.setItem('recommendedJobs', JSON.stringify(mapped));
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setRecommendedJobs([]);
      localStorage.setItem('recommendedJobs', JSON.stringify([]));
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    
    if (file && allowedTypes.includes(file.type)) {
      try {
        let uploadFile = file;
        if (file.type.startsWith('image/')) {
          // Normalize browser screenshots (often WEBP) to PNG for stable OCR.
          uploadFile = await convertImageToPngFile(file);
        }

        // Extract text from resume
        const response = await apiService.extractResumeText(uploadFile);
        
        if (response.success) {
          const fileData = {
            name: uploadFile.name,
            size: uploadFile.size,
            type: uploadFile.type,
            lastModified: uploadFile.lastModified,
            extractedText: response.text
          };
          
          setUploadedResume(fileData);
          localStorage.setItem('uploadedResume', JSON.stringify(fileData));
          await fetchJobRecommendations(response.text);

          if (response.warning) {
            setUploadWarning(response.warning);
          } else {
            setUploadWarning('');
            alert('Resume uploaded and processed successfully!');
          }
        }
      } catch (error) {
        console.error('Resume processing error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        setUploadWarning('');
        alert('Error processing resume: ' + error.message);
      }
    } else {
      alert('Please upload a PDF, DOCX, JPG, PNG, or WEBP file');
    }
  };

  const handleJobApply = async (job) => {
    if (!uploadedResume) {
      alert('Please upload your resume first');
      return;
    }

    if (!uploadedResume.extractedText) {
      alert('Resume text not extracted. Please re-upload your resume.');
      return;
    }

    try {
      setSelectedJob(job);
      localStorage.setItem('selectedJob', JSON.stringify(job));
      
      // Apply to job with extracted text
      const response = await apiService.applyToJob(job.id, uploadedResume.extractedText, uploadedResume.name);
      
      if (response.success) {
        const nlpAnalysis = response.application.matchScore.nlpAnalysis || {};
        const experienceDetails = nlpAnalysis.experienceDetails || {};
        const educationDetails = nlpAnalysis.educationDetails || {};
        // Set match data from response
        const matchData = {
          overallMatch: response.application.matchScore.overall,
          analysis: nlpAnalysis.analysis || '',
          breakdown: {
            skills: {
              score: response.application.matchScore.skills,
              details: {
                matched: nlpAnalysis.matchedTerms || [],
                missing: nlpAnalysis.missingSkills || []
              }
            },
            experience: {
              score: response.application.matchScore.experience,
              details: {
                candidateYears: experienceDetails.candidateYears ?? 'N/A',
                requiredYears: experienceDetails.requiredYears ?? 'N/A'
              }
            },
            education: {
              score: response.application.matchScore.education,
              details: {
                match: `Candidate: ${educationDetails.candidateLevel || 'N/A'} | Required: ${educationDetails.requiredLevel || 'N/A'}`
              }
            }
          }
        };
        
        setMatchData(matchData);
        localStorage.setItem('matchData', JSON.stringify(matchData));
        
        // Generate recommendations based on match score
        const recommendations = generateRecommendations(response.application.matchScore);
        setRecommendations(recommendations);
        localStorage.setItem('recommendations', JSON.stringify(recommendations));
        
        alert(`Application submitted successfully! Match score: ${response.application.matchScore.overall}%`);
      }
    } catch (error) {
      if (error.message.includes('already applied')) {
        alert('You have already applied to this job!');
      } else {
        console.error('Application error:', error);
        alert('Error submitting application. Please try again.');
      }
    }
  };
  
  const generateRecommendations = (matchScore) => {
    const recommendations = [];
    
    if (matchScore.skills < 70) {
      recommendations.push({
        type: 'skills',
        title: 'Improve Technical Skills',
        description: 'Consider learning the key technologies mentioned in the job description.',
        priority: 'high'
      });
    }
    
    if (matchScore.experience < 60) {
      recommendations.push({
        type: 'experience',
        title: 'Highlight Relevant Experience',
        description: 'Emphasize projects and work experience that align with the job requirements.',
        priority: 'medium'
      });
    }
    
    if (matchScore.keywords < 50) {
      recommendations.push({
        type: 'keywords',
        title: 'Optimize Resume Keywords',
        description: 'Include more industry-specific keywords from the job description.',
        priority: 'medium'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'general',
        title: 'Great Match!',
        description: 'Your resume shows strong alignment with this position. Consider applying to similar roles.',
        priority: 'low'
      });
    }
    
    return recommendations;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">
            Applicant Dashboard
          </h1>
          <p className="text-gray-400 text-lg">Find your perfect job match with AI-powered analysis</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Resume Upload & Job Listings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resume Upload Section */}
            <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">
                Upload Resume
              </h2>
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center bg-gray-700/50 hover:bg-gray-700 transition-colors duration-300">
                <input
                  type="file"
                  accept=".pdf,.docx,.jpg,.jpeg,.png"
                  onChange={handleResumeUpload}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg inline-block"
                >
                  Choose Resume
                </label>
                <p className="text-gray-400 mt-3 font-medium">PDF, DOCX, or image files</p>
              </div>
              {uploadedResume && (
                <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded-xl">
                  <div className="flex justify-between items-center">
                    <p className="text-green-400 font-semibold">
                      ✓ {uploadedResume.name} uploaded successfully!
                    </p>
                    <button
                      onClick={() => {
                        setUploadedResume(null);
                        setUploadWarning('');
                        localStorage.removeItem('uploadedResume');
                      }}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors duration-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              {uploadWarning && (
                <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
                  {uploadWarning}
                </div>
              )}
            </div>

            {/* Job Listings */}
            <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
              {recommendedJobs.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Top Recommended Jobs</h2>
                    <span className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                      {recommendedJobs.length}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {recommendedJobs.slice(0, 3).map((job) => (
                      <div key={`rec-${job.id}`} className="bg-gray-700/60 border border-green-700/40 rounded-xl p-4">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <p className="text-white font-semibold">{job.title}</p>
                            <p className="text-gray-400 text-sm">{job.company}</p>
                            <p className="text-gray-400 text-xs mt-1">{job.location} | {job.experience}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-400">{job.match?.overall || 0}%</p>
                            <p className="text-xs text-gray-400">Match</p>
                          </div>
                        </div>

                        {job.match?.analysis && (
                          <p className="text-sm text-green-200 mt-2">{job.match.analysis}</p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {(job.match?.matchedTerms || []).slice(0, 6).map((term, i) => (
                            <span key={`${job.id}-term-${i}`} className="px-2 py-1 text-xs rounded bg-green-900/30 text-green-300 border border-green-800">
                              {term}
                            </span>
                          ))}
                        </div>

                        <div className="mt-3">
                          <button
                            onClick={() => handleJobApply(job)}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            Apply to this job
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  Available Jobs
                </h2>
                <span className="bg-cyan-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                  {jobs.length}
                </span>
              </div>
              <div className="space-y-6">
                {jobs.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onApply={handleJobApply}
                    showApplyButton={true}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Match Analysis & Recommendations */}
          <div className="space-y-6">
            <MatchAnalysis matchData={matchData} />
            <ResumeRecommendations recommendations={recommendations} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDashboard;