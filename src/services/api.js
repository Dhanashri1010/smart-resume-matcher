const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // 🔥 required for sessions
      ...options,
    };

    // Convert body to JSON (except FormData)
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    // Remove Content-Type for FormData
    if (config.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    let response;
    try {
      response = await fetch(url, config);
    } catch (networkError) {
      console.error('Network request failed:', networkError);
      throw new Error(`Cannot reach server at ${this.baseURL}. Make sure backend is running.`);
    }

    // Safe JSON parse for both success/error payloads
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data;
  }

  // 🔐 AUTH METHODS
  async login(email, password, userType) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { email, password, userType },
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // 📄 RESUME
  async extractResumeText(file) {
    const formData = new FormData();
    formData.append('resume', file);

    return this.request('/resume/extract', {
      method: 'POST',
      body: formData,
    });
  }

  // 📊 APPLICATIONS
  async applyToJob(jobId, resumeText, resumeFileName) {
    return this.request('/applications', {
      method: 'POST',
      body: { jobId, resumeText, resumeFileName },
    });
  }

  async getMyApplications() {
    return this.request('/applications/my-applications');
  }

  async getJobRecommendations(resumeText) {
    return this.request('/jobs/recommendations', {
      method: 'POST',
      body: { resumeText },
    });
  }

  //  HEALTH CHECK
  async healthCheck() {
    return this.request('/health');
  }
}

export default new ApiService();