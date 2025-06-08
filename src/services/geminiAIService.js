const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/config');

class GeminiAIService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.requestsThisMinute = 0;
    this.requestsToday = 0;
    this.lastMinuteReset = Date.now();
    this.lastDayReset = Date.now();
    this.isInitialized = false;
  }

  /**
   * Initialize the Google Gemini AI service
   */
  async initialize() {
    try {
      if (!config.gemini.apiKey) {
        throw new Error('Google Gemini API key is not configured');
      }

      this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: config.gemini.model,
        generationConfig: {
          maxOutputTokens: config.gemini.maxTokens,
          temperature: config.gemini.temperature,
        },
      });

      this.isInitialized = true;
      console.log('Google Gemini AI service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Gemini AI service:', error);
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
      this.lastDayReset = now;
    }
    
    // Check if rate limits are exceeded
    if (this.requestsThisMinute >= config.gemini.rateLimit.requestsPerMinute) {
      const delayMs = 60000 - (now - this.lastMinuteReset);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return this.checkRateLimits(); // Recursive check after delay
    }
    
    if (this.requestsToday >= config.gemini.rateLimit.requestsPerDay) {
      throw new Error('Daily request limit exceeded');
    }
    
    // Increment request counters
    this.requestsThisMinute++;
    this.requestsToday++;
    
    return true;
  }

  /**
   * Generate content using Gemini AI
   */
  async generateContent(prompt) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await this.checkRateLimits();

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating content with Gemini:', error);
      throw error;
    }
  }

  /**
   * Get all available AI mentors (static data since we can't sync from external service)
   */
  async getAllMentors(filters = {}) {
    try {
      // Return predefined mentor profiles
      const mentors = [
        {
          id: 'mentor_001',
          name: 'Dr. Sarah Johnson',
          specialization: 'Software Engineering',
          bio: 'Experienced software engineer with 15+ years in full-stack development, specializing in JavaScript, Python, and cloud technologies. Former tech lead at major tech companies.',
          profile_image: '/assets/mentors/sarah-johnson.jpg',
          experience_level: 'expert',
          skills: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker'],
          teaching_style: 'mentoring',
          communication_style: 'supportive'
        },
        {
          id: 'mentor_002',
          name: 'Prof. Michael Chen',
          specialization: 'Data Science',
          bio: 'Data science professor and consultant with expertise in machine learning, statistical analysis, and big data technologies. Published researcher in AI/ML.',
          profile_image: '/assets/mentors/michael-chen.jpg',
          experience_level: 'expert',
          skills: ['Python', 'R', 'Machine Learning', 'Statistics', 'TensorFlow', 'PyTorch'],
          teaching_style: 'theoretical',
          communication_style: 'analytical'
        },
        {
          id: 'mentor_003',
          name: 'Lisa Rodriguez',
          specialization: 'UX/UI Design',
          bio: 'Senior UX/UI designer with 12+ years of experience creating user-centered designs for web and mobile applications. Expert in design thinking and user research.',
          profile_image: '/assets/mentors/lisa-rodriguez.jpg',
          experience_level: 'expert',
          skills: ['Figma', 'Sketch', 'Adobe Creative Suite', 'User Research', 'Prototyping', 'Design Systems'],
          teaching_style: 'practical',
          communication_style: 'expressive'
        },
        {
          id: 'mentor_004',
          name: 'David Kim',
          specialization: 'Product Management',
          bio: 'Product management leader with experience at startups and Fortune 500 companies. Expert in product strategy, roadmap planning, and cross-functional team leadership.',
          profile_image: '/assets/mentors/david-kim.jpg',
          experience_level: 'expert',
          skills: ['Product Strategy', 'Agile', 'Analytics', 'User Stories', 'Roadmapping', 'Stakeholder Management'],
          teaching_style: 'coaching',
          communication_style: 'direct'
        },
        {
          id: 'mentor_005',
          name: 'Dr. Emily Watson',
          specialization: 'Cybersecurity',
          bio: 'Cybersecurity expert with 10+ years in information security, penetration testing, and security architecture. CISSP certified with government and private sector experience.',
          profile_image: '/assets/mentors/emily-watson.jpg',
          experience_level: 'expert',
          skills: ['Penetration Testing', 'Security Architecture', 'Risk Assessment', 'Compliance', 'Incident Response', 'Cryptography'],
          teaching_style: 'practical',
          communication_style: 'direct'
        },
        {
          id: 'mentor_006',
          name: 'James Thompson',
          specialization: 'Digital Marketing',
          bio: 'Digital marketing strategist with expertise in SEO, content marketing, social media, and paid advertising. Helped numerous companies scale their online presence.',
          profile_image: '/assets/mentors/james-thompson.jpg',
          experience_level: 'expert',
          skills: ['SEO', 'Content Marketing', 'Google Ads', 'Social Media', 'Analytics', 'Email Marketing'],
          teaching_style: 'practical',
          communication_style: 'supportive'
        }
      ];

      // Apply filters if provided
      let filteredMentors = mentors;
      
      if (filters.specialization) {
        filteredMentors = filteredMentors.filter(mentor => 
          mentor.specialization.toLowerCase().includes(filters.specialization.toLowerCase())
        );
      }
      
      if (filters.experience_level) {
        filteredMentors = filteredMentors.filter(mentor => 
          mentor.experience_level === filters.experience_level
        );
      }

      return {
        success: true,
        mentors: filteredMentors,
        total: filteredMentors.length
      };
    } catch (error) {
      console.error('Error getting mentors:', error);
      throw error;
    }
  }

  /**
   * Get AI mentor by ID
   */
  async getMentor(mentorId) {
    try {
      const mentorsData = await this.getAllMentors();
      const mentor = mentorsData.mentors.find(m => m.id === mentorId);
      
      if (!mentor) {
        throw new Error('Mentor not found');
      }

      return {
        success: true,
        mentor
      };
    } catch (error) {
      console.error(`Error getting mentor ${mentorId}:`, error);
      throw error;
    }
  }

  /**
   * Generate career advice based on user profile
   */
  async generateCareerAdvice(userProfile) {
    try {
      const prompt = `As an experienced career mentor, provide personalized career advice for a professional with the following profile:

Current Role: ${userProfile.currentRole || 'Not specified'}
Experience Level: ${userProfile.experienceLevel || 'Not specified'}
Skills: ${userProfile.skills ? userProfile.skills.join(', ') : 'Not specified'}
Career Goals: ${userProfile.careerGoals || 'Not specified'}
Industry: ${userProfile.industry || 'Not specified'}
Education: ${userProfile.education || 'Not specified'}

Please provide:
1. Specific career advancement recommendations
2. Skills to develop or improve
3. Potential career paths to consider
4. Networking and professional development suggestions
5. Timeline and actionable next steps

Keep the advice practical, actionable, and tailored to their specific situation.`;

      const advice = await this.generateContent(prompt);
      
      return {
        success: true,
        advice: {
          content: advice,
          generatedAt: new Date().toISOString(),
          userProfile: userProfile
        }
      };
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
      const prompt = `Create a comprehensive learning plan for someone with the following profile:

Career Goals: ${Array.isArray(careerGoals) ? careerGoals.join(', ') : careerGoals}
Current Skills: ${Array.isArray(currentSkills) ? currentSkills.join(', ') : currentSkills}

Please create a structured learning plan that includes:

1. **Learning Objectives**: Clear, measurable goals
2. **Skill Gaps**: Identify what skills need to be developed
3. **Learning Path**: Step-by-step progression from current level to goals
4. **Resources**: Specific courses, books, tutorials, or platforms
5. **Timeline**: Realistic timeframes for each learning milestone
6. **Practice Projects**: Hands-on projects to apply new skills
7. **Assessment Methods**: How to measure progress and success

Structure the plan in phases (beginner, intermediate, advanced) and provide specific, actionable recommendations.`;

      const plan = await this.generateContent(prompt);
      
      return {
        success: true,
        plan: {
          content: plan,
          generatedAt: new Date().toISOString(),
          userId: userId,
          careerGoals: careerGoals,
          currentSkills: currentSkills
        }
      };
    } catch (error) {
      console.error('Error generating learning plan:', error);
      throw error;
    }
  }

  /**
   * Create a session with an AI mentor (simulated)
   */
  async createSession(mentorId, userId, sessionData) {
    try {
      const mentor = await this.getMentor(mentorId);
      
      if (!mentor.success) {
        throw new Error('Mentor not found');
      }

      // Generate a session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        session: {
          id: sessionId,
          mentorId: mentorId,
          userId: userId,
          mentorName: mentor.mentor.name,
          specialization: mentor.mentor.specialization,
          createdAt: new Date().toISOString(),
          status: 'active',
          ...sessionData
        }
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Send a message in a session (AI-powered conversation)
   */
  async sendMessage(sessionId, message, context = {}) {
    try {
      const prompt = `You are an AI mentor having a conversation with a mentee. 

Context: ${JSON.stringify(context)}
Session ID: ${sessionId}
Mentee's message: "${message}"

Respond as a helpful, knowledgeable mentor. Provide guidance, ask clarifying questions when needed, and offer practical advice. Keep responses conversational but professional.`;

      const response = await this.generateContent(prompt);
      
      return {
        success: true,
        message: {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sessionId: sessionId,
          content: response,
          sender: 'mentor',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`Error sending message in session ${sessionId}:`, error);
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
      minuteLimit: config.gemini.rateLimit.requestsPerMinute,
      dailyLimit: config.gemini.rateLimit.requestsPerDay,
      isInitialized: this.isInitialized,
      model: config.gemini.model
    };
  }
}

// Create singleton instance
const geminiAIService = new GeminiAIService();

module.exports = geminiAIService;

