const axios = require('axios');
const ManusAIConfig = require('../models/ManusAIConfig');

class ManusAIClient {
  constructor() {
    this.config = null;
    this.axiosInstance = null;
    this.requestsThisMinute = 0;
    this.requestsToday = 0;
    this.tokensUsedToday = 0;
    this.lastMinuteReset = Date.now();
    this.lastDayReset = Date.now();
  }

  /**
   * Initialize the Manus AI client with configuration from database
   */
  async initialize() {
    try {
      // Get active configuration from database
      const config = await ManusAIConfig.findOne({ isActive: true })
        .select('+apiKey'); // Include the apiKey field which is hidden by default
      
      if (!config) {
        throw new Error('No active Manus AI configuration found');
      }
      
      this.config = config;
      
      // Create axios instance with default configuration
      this.axiosInstance = axios.create({
        baseURL: this.config.apiEndpoint,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });
      
      // Add request interceptor for rate limiting
      this.axiosInstance.interceptors.request.use(
        async (config) => {
          await this.checkRateLimits();
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );
      
      // Add response interceptor for error handling
      this.axiosInstance.interceptors.response.use(
        (response) => {
          // Update usage metrics
          this.updateUsageMetrics(response);
          return response;
        },
        async (error) => {
          if (error.response) {
            // Handle API errors
            const status = error.response.status;
            
            if (status === 429) {
              // Rate limit exceeded, retry after delay
              return this.handleRateLimitExceeded(error, error.config);
            } else if (status >= 500) {
              // Server error, retry with backoff
              return this.handleServerError(error, error.config);
            }
          }
          
          return Promise.reject(error);
        }
      );
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Manus AI client:', error);
      throw error;
    }
  }

  /**
   * Check rate limits before making a request
   */
  async checkRateLimits() {
    const now = Date.now();
    
    // Reset minute counter if a minute has passed
    if (now - this.lastMinuteReset > 60000) {
      this.requestsThisMinute = 0;
      this.lastMinuteReset = now;
    }
    
    // Reset daily counter if a day has passed
    if (now - this.lastDayReset > 86400000) {
      this.requestsToday = 0;
      this.tokensUsedToday = 0;
      this.lastDayReset = now;
    }
    
    // Check if rate limits are exceeded
    if (this.requestsThisMinute >= this.config.rateLimit.requestsPerMinute) {
      const delayMs = 60000 - (now - this.lastMinuteReset);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return this.checkRateLimits(); // Recursive check after delay
    }
    
    if (this.requestsToday >= this.config.rateLimit.requestsPerDay) {
      throw new Error('Daily request limit exceeded');
    }
    
    // Increment request counters
    this.requestsThisMinute++;
    this.requestsToday++;
    
    return true;
  }

  /**
   * Update usage metrics after a successful request
   */
  updateUsageMetrics(response) {
    // Extract token usage from response if available
    const tokenUsage = response.data?.usage?.total_tokens || 0;
    this.tokensUsedToday += tokenUsage;
    
    return true;
  }

  /**
   * Handle rate limit exceeded error with retry
   */
  async handleRateLimitExceeded(error, config) {
    // Extract retry-after header or use default
    const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
    const delayMs = retryAfter * 1000;
    
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    // Retry the request
    return this.axiosInstance(config);
  }

  /**
   * Handle server error with exponential backoff retry
   */
  async handleServerError(error, config) {
    // Get retry count from config or initialize
    const retryCount = config.__retryCount || 0;
    
    // Check if max retries reached
    if (retryCount >= this.config.retrySettings.maxRetries) {
      return Promise.reject(error);
    }
    
    // Increment retry count
    config.__retryCount = retryCount + 1;
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.retrySettings.initialDelayMs * Math.pow(2, retryCount),
      this.config.retrySettings.maxDelayMs
    );
    
    // Wait for the calculated delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry the request
    return this.axiosInstance(config);
  }

  /**
   * Get AI mentor by ID
   */
  async getMentor(mentorId) {
    try {
      const response = await this.axiosInstance.get(`/mentors/${mentorId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting mentor ${mentorId}:`, error);
      throw error;
    }
  }

  /**
   * Get all available AI mentors
   */
  async getAllMentors(filters = {}) {
    try {
      const response = await this.axiosInstance.get('/mentors', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error getting all mentors:', error);
      throw error;
    }
  }

  /**
   * Create a new session with an AI mentor
   */
  async createSession(mentorId, userId, sessionData) {
    try {
      const response = await this.axiosInstance.post('/sessions', {
        mentor_id: mentorId,
        user_id: userId,
        ...sessionData
      });
      return response.data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Send a message in an existing session
   */
  async sendMessage(sessionId, message, context = {}) {
    try {
      const response = await this.axiosInstance.post(`/sessions/${sessionId}/messages`, {
        content: message,
        context
      });
      return response.data;
    } catch (error) {
      console.error(`Error sending message in session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get session history
   */
  async getSessionHistory(sessionId) {
    try {
      const response = await this.axiosInstance.get(`/sessions/${sessionId}/history`);
      return response.data;
    } catch (error) {
      console.error(`Error getting session history for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * End a session
   */
  async endSession(sessionId) {
    try {
      const response = await this.axiosInstance.post(`/sessions/${sessionId}/end`);
      return response.data;
    } catch (error) {
      console.error(`Error ending session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Generate career advice based on user profile
   */
  async generateCareerAdvice(userProfile) {
    try {
      const response = await this.axiosInstance.post('/generate/career-advice', {
        user_profile: userProfile
      });
      return response.data;
    } catch (error) {
      console.error('Error generating career advice:', error);
      throw error;
    }
  }

  /**
   * Generate personalized learning plan
   */
  async generateLearningPlan(userId, careerGoals, currentSkills) {
    try {
      const response = await this.axiosInstance.post('/generate/learning-plan', {
        user_id: userId,
        career_goals: careerGoals,
        current_skills: currentSkills
      });
      return response.data;
    } catch (error) {
      console.error('Error generating learning plan:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats() {
    return {
      requestsThisMinute: this.requestsThisMinute,
      requestsToday: this.requestsToday,
      tokensUsedToday: this.tokensUsedToday,
      minuteLimit: this.config.rateLimit.requestsPerMinute,
      dailyLimit: this.config.rateLimit.requestsPerDay,
      tokenLimit: this.config.quotaSettings.maxTokensPerDay
    };
  }
}

// Create singleton instance
const manusAIClient = new ManusAIClient();

module.exports = manusAIClient;
