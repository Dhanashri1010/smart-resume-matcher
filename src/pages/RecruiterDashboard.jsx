import React, { useState, useEffect } from 'react';
import CandidateCard from '../components/CandidateCard';
import ResumeViewer from '../components/ResumeViewer';

const RecruiterDashboard = () => {
  const [activeTab, setActiveTab] = useState('candidates');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJobForCandidates, setSelectedJobForCandidates] = useState(null);
  const [jobData, setJobData] = useState(() => {
    const saved = localStorage.getItem('jobFormData');
    return saved ? JSON.parse(saved) : {
      title: '',
      company: '',
      description: '',
      experience: '',
      location: '',
      skills: ''
    };
  });
  const [uploadedImage, setUploadedImage] = useState(() => {
    const saved = localStorage.getItem('uploadedImage');
    return saved ? JSON.parse(saved) : null;
  });
  const [imagePreview, setImagePreview] = useState(() => {
    return localStorage.getItem('imagePreview') || null;
  });

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      };
      setUploadedImage(fileData);
      localStorage.setItem('uploadedImage', JSON.stringify(fileData));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        localStorage.setItem('imagePreview', e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a valid image file');
    }
  };

  const extractTextFromImage = () => {
    // Mock OCR extraction - in real app, use OCR service
    const mockExtractedText = `Job Title: ${jobData.title || 'Software Engineer'}

Responsibilities:
• Develop and maintain web applications
• Collaborate with cross-functional teams
• Write clean, maintainable code
• Participate in code reviews

Requirements:
• ${jobData.experience || '3+ years'} of experience
• Proficiency in ${jobData.skills || 'JavaScript, React, Node.js'}
• Strong problem-solving skills
• Bachelor's degree in Computer Science or related field

Benefits:
• Competitive salary
• Health insurance
• Flexible working hours
• Professional development opportunities`;
    
    setJobData({...jobData, description: mockExtractedText});
  };
  const [sortBy, setSortBy] = useState('overall');

  // Fetch recruiter's jobs and candidates
  useEffect(() => {
    fetchMyJobs();
  }, []);
  
  useEffect(() => {
    if (activeTab === 'candidates' && myJobs.length > 0 && !selectedJobForCandidates) {
      setSelectedJobForCandidates(myJobs[0]);
      fetchCandidatesForJob(myJobs[0]._id);
    }
  }, [activeTab, myJobs]);

  const fetchMyJobs = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/jobs/my-jobs', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setMyJobs(data.jobs);
        if (data.jobs.length > 0) {
          setSelectedJobForCandidates(data.jobs[0]);
          fetchCandidatesForJob(data.jobs[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching my jobs:', error);
    }
  };

  const fetchCandidatesForJob = async (jobId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/jobs/${jobId}/applications`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        const formattedCandidates = data.applications.map(app => ({
          nlpAnalysis: app.matchScore?.nlpAnalysis || {},
          id: app._id,
          name: `${app.applicantId.profile?.firstName || ''} ${app.applicantId.profile?.lastName || ''}`.trim() || 'Anonymous',
          email: app.applicantId.email,
          phone: app.applicantId.profile?.phone || 'Not provided',
          location: 'Not specified',
          jobTitle: selectedJobForCandidates?.title || 'Job Applicant',
          resumeName: app.resumeFileName,
          appliedDate: new Date(app.createdAt).toLocaleDateString(),
          overallMatch: app.matchScore.overall,
          breakdown: {
            skills: {
              score: app.matchScore.skills,
              details: {
                matched: app.matchScore?.nlpAnalysis?.matchedTerms || [],
                missing: app.matchScore?.nlpAnalysis?.missingSkills || []
              }
            },
            experience: {
              score: app.matchScore.experience,
              details: {
                candidateYears: app.matchScore?.nlpAnalysis?.experienceDetails?.candidateYears ?? 'N/A',
                requiredYears: app.matchScore?.nlpAnalysis?.experienceDetails?.requiredYears ?? 'N/A'
              }
            },
            education: {
              score: app.matchScore.education,
              details: {
                match: `Candidate: ${app.matchScore?.nlpAnalysis?.educationDetails?.candidateLevel || 'N/A'} | Required: ${app.matchScore?.nlpAnalysis?.educationDetails?.requiredLevel || 'N/A'}`
              }
            },
            keywords: {
              score: app.matchScore.keywords,
              details: {
                tfidf: app.matchScore?.nlpAnalysis?.tfidfSimilarity || 0,
                stringSimilarity: app.matchScore?.nlpAnalysis?.stringSimilarity || 0,
                semanticSimilarity: app.matchScore?.nlpAnalysis?.semanticSimilarity || 0
              }
            }
          }
        }));
        setCandidates(formattedCandidates);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidates([]);
    }
  };

  const handleInputChange = (e) => {
    const newJobData = {
      ...jobData,
      [e.target.name]: e.target.value
    };
    setJobData(newJobData);
    localStorage.setItem('jobFormData', JSON.stringify(newJobData));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (jobData.title && jobData.company) {
      try {
        // Auto-generate description if not provided
        let description = jobData.description;
        if (!description) {
          description = `We are looking for a talented ${jobData.title} to join our team at ${jobData.company}. ${jobData.experience ? `The ideal candidate should have ${jobData.experience} of experience ` : ''}${jobData.skills ? `with expertise in ${jobData.skills}. ` : ''}${jobData.location ? `This position is ${jobData.location === 'Remote' ? 'fully remote' : `based in ${jobData.location}`}. ` : ''}Join us to work on exciting projects and grow your career in a dynamic environment.`;
        }

        const response = await fetch('http://localhost:5001/api/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: jobData.title.trim(),
            company: jobData.company.trim(),
            description: description.trim(),
            skills: jobData.skills ? jobData.skills.trim() : '',
            experience: jobData.experience ? jobData.experience.trim() : '',
            location: jobData.location ? jobData.location.trim() : ''
          })
        });

        const data = await response.json();
        if (data.success) {
          alert('Job posted successfully!');
          const emptyJobData = { title: '', company: '', description: '', experience: '', location: '', skills: '' };
          setJobData(emptyJobData);
          setUploadedImage(null);
          setImagePreview(null);
          
          // Clear localStorage
          localStorage.setItem('jobFormData', JSON.stringify(emptyJobData));
          localStorage.removeItem('uploadedImage');
          localStorage.removeItem('imagePreview');
          
          fetchMyJobs(); // Refresh jobs list
          setActiveTab('my-jobs'); // Switch to my jobs tab
        } else {
          alert('Error posting job: ' + data.message);
        }
      } catch (error) {
        console.error('Error posting job:', error);
        alert('Error posting job. Please try again.');
      }
    } else {
      alert('Please fill in job title and company name');
    }
  };

  const handleViewResume = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const sortedCandidates = [...candidates].sort((a, b) => {
    if (sortBy === 'overall') return b.overallMatch - a.overallMatch;
    if (sortBy === 'skills') return b.breakdown.skills.score - a.breakdown.skills.score;
    if (sortBy === 'experience') return b.breakdown.experience.score - a.breakdown.experience.score;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-400 mb-8">Recruiter Dashboard</h1>
        
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('candidates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'candidates'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Applied Candidates ({candidates.length})
              </button>
              <button
                onClick={() => setActiveTab('my-jobs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-jobs'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                My Jobs ({myJobs.length})
              </button>
              <button
                onClick={() => setActiveTab('post-job')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'post-job'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Post New Job
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'candidates' && (
          <div>
            {/* Job Selection and Sort Controls */}
            <div className="mb-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Applied Candidates</h2>
                <div className="flex items-center space-x-4">
                  <label className="text-sm text-gray-400">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                  >
                    <option value="overall">Overall Match</option>
                    <option value="skills">Skills Match</option>
                    <option value="experience">Experience Match</option>
                  </select>
                </div>
              </div>
              
              {/* Job Selection */}
              {myJobs.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <label className="block text-sm text-gray-400 mb-2">Select Job to View Candidates:</label>
                  <select
                    value={selectedJobForCandidates?._id || ''}
                    onChange={(e) => {
                      const job = myJobs.find(j => j._id === e.target.value);
                      setSelectedJobForCandidates(job);
                      fetchCandidatesForJob(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {myJobs.map(job => (
                      <option key={job._id} value={job._id}>
                        {job.title} at {job.company} ({new Date(job.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  {selectedJobForCandidates && (
                    <div className="mt-3 text-sm text-gray-400">
                      <p><strong>Location:</strong> {selectedJobForCandidates.location}</p>
                      <p><strong>Experience:</strong> {selectedJobForCandidates.experience}</p>
                      <p><strong>Skills:</strong> {selectedJobForCandidates.skills.join(', ') || 'Not specified'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Candidates List */}
            {myJobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-4">No jobs posted yet</div>
                <p className="text-gray-500">Post your first job to start receiving applications!</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-4">No applications yet</div>
                <p className="text-gray-500">Applications for this job will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedCandidates.map(candidate => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onViewDetails={handleViewResume}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-jobs' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">My Posted Jobs</h2>
              <button
                onClick={() => setActiveTab('post-job')}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Post New Job
              </button>
            </div>
            
            {myJobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-4">No jobs posted yet</div>
                <p className="text-gray-500 mb-6">Start by posting your first job to attract candidates!</p>
                <button
                  onClick={() => setActiveTab('post-job')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Post Your First Job
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {myJobs.map(job => (
                  <div key={job._id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
                        <p className="text-gray-400 mb-2">{job.company}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>📍 {job.location}</span>
                          <span>💼 {job.experience}</span>
                          <span>📅 {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-cyan-600/20 text-cyan-400 px-3 py-1 rounded-lg text-sm font-medium mb-2">
                          {job.isActive ? 'Active' : 'Inactive'}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedJobForCandidates(job);
                            fetchCandidatesForJob(job._id);
                            setActiveTab('candidates');
                          }}
                          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors duration-200"
                        >
                          View Applications
                        </button>
                      </div>
                    </div>
                    
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-lg">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-gray-300 text-sm line-clamp-3">{job.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'post-job' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6">
                <h2 className="text-2xl font-bold text-white mb-2">Job Builder</h2>
                <p className="text-cyan-100">Create your job posting by selecting options</p>
              </div>
              
              <div className="p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Builder Section */}
                  <div className="space-y-6">
                    {/* Job Templates */}
                    <div>
                      <h3 className="text-cyan-400 font-semibold mb-3">Quick Start Templates</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { title: 'Frontend Developer', skills: ['React', 'JavaScript', 'CSS'], exp: '2-4 years' },
                          { title: 'Backend Developer', skills: ['Node.js', 'Python', 'SQL'], exp: '3-5 years' },
                          { title: 'Full Stack Developer', skills: ['React', 'Node.js', 'MongoDB'], exp: '4-6 years' },
                          { title: 'Data Scientist', skills: ['Python', 'Machine Learning', 'SQL'], exp: '2-5 years' }
                        ].map((template, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              const newJobData = {
                                ...jobData,
                                title: template.title,
                                skills: template.skills.join(', '),
                                experience: template.exp
                              };
                              setJobData(newJobData);
                              localStorage.setItem('jobFormData', JSON.stringify(newJobData));
                            }}
                            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-cyan-500 transition-all duration-200 text-left"
                          >
                            <div className="text-white font-medium text-sm">{template.title}</div>
                            <div className="text-gray-400 text-xs">{template.exp}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Job Title Builder */}
                    <div>
                      <h3 className="text-cyan-400 font-semibold mb-3">Job Title</h3>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {['Senior', 'Junior', 'Lead', 'Principal'].map(level => (
                            <button
                              key={level}
                              onClick={() => setJobData({...jobData, title: `${level} ${jobData.title.replace(/^(Senior|Junior|Lead|Principal)\s/, '')}`})}
                              className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${
                                jobData.title.includes(level) 
                                  ? 'bg-cyan-600 text-white' 
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['Software Engineer', 'Developer', 'Designer', 'Product Manager', 'Data Analyst'].map(role => (
                            <button
                              key={role}
                              onClick={() => setJobData({...jobData, title: jobData.title.replace(/\b(Software Engineer|Developer|Designer|Product Manager|Data Analyst)\b/, role)})}
                              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors duration-200"
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Skills Selector */}
                    <div>
                      <h3 className="text-cyan-400 font-semibold mb-3">Required Skills</h3>
                      <div className="space-y-3">
                        {[
                          { category: 'Frontend', skills: ['React', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript', 'CSS', 'HTML'] },
                          { category: 'Backend', skills: ['Node.js', 'Python', 'Java', 'PHP', 'Ruby', 'Go', 'C#'] },
                          { category: 'Database', skills: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase'] },
                          { category: 'Tools', skills: ['Git', 'Docker', 'AWS', 'Jenkins', 'Kubernetes'] }
                        ].map(group => (
                          <div key={group.category}>
                            <h4 className="text-gray-300 text-sm font-medium mb-2">{group.category}</h4>
                            <div className="flex flex-wrap gap-2">
                              {group.skills.map(skill => {
                                const isSelected = jobData.skills?.includes(skill);
                                return (
                                  <button
                                    key={skill}
                                    onClick={() => {
                                      const currentSkills = jobData.skills ? jobData.skills.split(', ').filter(s => s) : [];
                                      const newSkills = isSelected 
                                        ? currentSkills.filter(s => s !== skill)
                                        : [...currentSkills, skill];
                                      setJobData({...jobData, skills: newSkills.join(', ')});
                                    }}
                                    className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                                      isSelected
                                        ? 'bg-cyan-600 text-white border border-cyan-500'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                                    }`}
                                  >
                                    {skill}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Experience & Location */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-cyan-400 font-semibold mb-3">Experience</h3>
                        <div className="space-y-2">
                          {['0-1 years', '2-3 years', '4-6 years', '7-10 years', '10+ years'].map(exp => (
                            <button
                              key={exp}
                              onClick={() => setJobData({...jobData, experience: exp})}
                              className={`w-full p-2 rounded-lg text-sm transition-colors duration-200 ${
                                jobData.experience === exp
                                  ? 'bg-cyan-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              {exp}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-cyan-400 font-semibold mb-3">Location</h3>
                        <div className="space-y-2">
                          {['Remote', 'New York, NY', 'San Francisco, CA', 'Austin, TX', 'Hybrid'].map(loc => (
                            <button
                              key={loc}
                              onClick={() => setJobData({...jobData, location: loc})}
                              className={`w-full p-2 rounded-lg text-sm transition-colors duration-200 ${
                                jobData.location === loc
                                  ? 'bg-cyan-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              {loc}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Company Name Input */}
                    <div>
                      <h3 className="text-cyan-400 font-semibold mb-3">Company Name</h3>
                      <input
                        type="text"
                        name="company"
                        value={jobData.company}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white placeholder-gray-400"
                        placeholder="Enter your company name"
                      />
                    </div>
                  </div>

                  {/* Preview Section */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-cyan-400 font-semibold mb-3">Live Preview</h3>
                      <div className="bg-gray-700 rounded-xl p-6 border border-gray-600">
                        <h4 className="text-xl font-bold text-white mb-2">{jobData.title || 'Job Title'}</h4>
                        <p className="text-gray-400 mb-4">{jobData.company || 'Company Name'}</p>
                        
                        {jobData.skills && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {jobData.skills.split(',').map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-cyan-600/20 text-cyan-400 text-sm rounded-lg border border-cyan-600/30">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-400 space-y-1">
                          {jobData.experience && <div>Experience: {jobData.experience}</div>}
                          {jobData.location && <div>Location: {jobData.location}</div>}
                        </div>
                      </div>
                    </div>

                    {/* Image Upload Option */}
                    <div>
                      <h3 className="text-cyan-400 font-semibold mb-3">Upload Job Description Image</h3>
                      <div className="bg-gray-700 rounded-xl p-4 border-2 border-dashed border-gray-600 hover:border-cyan-500 transition-colors duration-200">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="job-image-upload"
                        />
                        <label
                          htmlFor="job-image-upload"
                          className="cursor-pointer flex flex-col items-center justify-center py-4"
                        >
                          {imagePreview ? (
                            <div className="w-full">
                              <img 
                                src={imagePreview} 
                                alt="Job description" 
                                className="w-full max-h-48 object-contain rounded-lg mb-3"
                              />
                              <p className="text-cyan-400 text-sm text-center">Click to change image</p>
                            </div>
                          ) : (
                            <>
                              <div className="text-4xl text-gray-500 mb-2">📷</div>
                              <p className="text-cyan-400 font-medium">Upload Job Description Image</p>
                              <p className="text-gray-400 text-sm mt-1">PNG, JPG, or PDF supported</p>
                            </>
                          )}
                        </label>
                      </div>
                      
                      {uploadedImage && (
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={extractTextFromImage}
                            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            Extract Text from Image
                          </button>
                          <button
                            onClick={() => {
                              setUploadedImage(null);
                              setImagePreview(null);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Auto-generated Description */}
                    <div>
                      <h3 className="text-cyan-400 font-semibold mb-3">Job Description</h3>
                      <div className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                        {jobData.description ? (
                          <div className="space-y-2">
                            <pre className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                              {jobData.description}
                            </pre>
                            <div className="flex space-x-2 pt-2">
                              <button
                                onClick={() => setJobData({...jobData, description: ''})}
                                className="text-red-400 hover:text-red-300 text-sm transition-colors duration-200"
                              >
                                Clear
                              </button>
                              <button
                                onClick={() => {
                                  const textarea = document.createElement('textarea');
                                  textarea.value = jobData.description;
                                  document.body.appendChild(textarea);
                                  textarea.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textarea);
                                  alert('Description copied to clipboard!');
                                }}
                                className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors duration-200"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">
                            {jobData.title && jobData.company ? (
                              `We are looking for a talented ${jobData.title} to join our team at ${jobData.company}. 
                              ${jobData.experience ? `The ideal candidate should have ${jobData.experience} of experience ` : ''}
                              ${jobData.skills ? `with expertise in ${jobData.skills}. ` : ''}
                              ${jobData.location ? `This position is ${jobData.location === 'Remote' ? 'fully remote' : `based in ${jobData.location}`}. ` : ''}
                              Join us to work on exciting projects and grow your career in a dynamic environment.`
                            ) : (
                              'Select options above or upload an image to generate job description.'
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                      {!jobData.description && (
                        <button
                          onClick={() => {
                            const description = jobData.title && jobData.company ? 
                              `We are looking for a talented ${jobData.title} to join our team at ${jobData.company}. ${jobData.experience ? `The ideal candidate should have ${jobData.experience} of experience ` : ''}${jobData.skills ? `with expertise in ${jobData.skills}. ` : ''}${jobData.location ? `This position is ${jobData.location === 'Remote' ? 'fully remote' : `based in ${jobData.location}`}. ` : ''}Join us to work on exciting projects and grow your career in a dynamic environment.` : '';
                            setJobData({...jobData, description});
                          }}
                          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                          Generate Description from Options
                        </button>
                      )}
                      
                      <button
                        onClick={handleSubmit}
                        disabled={!jobData.title || !jobData.company}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:shadow-none"
                      >
                        Publish Job
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resume Viewer Modal */}
      {selectedCandidate && (
        <ResumeViewer
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
};

export default RecruiterDashboard;