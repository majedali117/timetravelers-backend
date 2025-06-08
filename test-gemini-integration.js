/**
 * Test script for Google Gemini AI integration
 * This script tests all the main functionality of the Gemini AI service
 */

const geminiAIService = require('./src/services/geminiAIService');
const config = require('./src/config/config');

// Test configuration
const testConfig = {
  testUserProfile: {
    currentRole: 'Junior Software Developer',
    experienceLevel: 'beginner',
    skills: ['JavaScript', 'HTML', 'CSS'],
    careerGoals: 'Become a full-stack developer',
    industry: 'Technology',
    education: 'Computer Science Degree'
  },
  testCareerGoals: ['Full-stack development', 'Cloud computing', 'DevOps'],
  testCurrentSkills: ['JavaScript', 'React', 'Node.js'],
  testUserId: 'test_user_123'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(testName, passed, error = null) {
  const result = {
    name: testName,
    passed,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName} - PASSED`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName} - FAILED: ${error ? error.message : 'Unknown error'}`);
  }
}

// Test 1: Service Initialization
async function testInitialization() {
  try {
    console.log('\n🧪 Testing Gemini AI Service Initialization...');
    
    if (!config.gemini.apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is not set');
    }
    
    await geminiAIService.initialize();
    const stats = await geminiAIService.getUsageStats();
    
    if (stats.isInitialized) {
      logTest('Service Initialization', true);
    } else {
      throw new Error('Service not properly initialized');
    }
  } catch (error) {
    logTest('Service Initialization', false, error);
  }
}

// Test 2: Get All Mentors
async function testGetAllMentors() {
  try {
    console.log('\n🧪 Testing Get All Mentors...');
    
    const result = await geminiAIService.getAllMentors();
    
    if (result.success && result.mentors && result.mentors.length > 0) {
      console.log(`   Found ${result.mentors.length} mentors`);
      logTest('Get All Mentors', true);
    } else {
      throw new Error('No mentors returned or invalid response');
    }
  } catch (error) {
    logTest('Get All Mentors', false, error);
  }
}

// Test 3: Get Specific Mentor
async function testGetMentor() {
  try {
    console.log('\n🧪 Testing Get Specific Mentor...');
    
    const result = await geminiAIService.getMentor('mentor_001');
    
    if (result.success && result.mentor) {
      console.log(`   Found mentor: ${result.mentor.name}`);
      logTest('Get Specific Mentor', true);
    } else {
      throw new Error('Mentor not found or invalid response');
    }
  } catch (error) {
    logTest('Get Specific Mentor', false, error);
  }
}

// Test 4: Generate Career Advice
async function testGenerateCareerAdvice() {
  try {
    console.log('\n🧪 Testing Generate Career Advice...');
    
    const result = await geminiAIService.generateCareerAdvice(testConfig.testUserProfile);
    
    if (result.success && result.advice && result.advice.content) {
      console.log(`   Generated advice (${result.advice.content.length} characters)`);
      console.log(`   Preview: ${result.advice.content.substring(0, 100)}...`);
      logTest('Generate Career Advice', true);
    } else {
      throw new Error('No career advice generated or invalid response');
    }
  } catch (error) {
    logTest('Generate Career Advice', false, error);
  }
}

// Test 5: Generate Learning Plan
async function testGenerateLearningPlan() {
  try {
    console.log('\n🧪 Testing Generate Learning Plan...');
    
    const result = await geminiAIService.generateLearningPlan(
      testConfig.testUserId,
      testConfig.testCareerGoals,
      testConfig.testCurrentSkills
    );
    
    if (result.success && result.plan && result.plan.content) {
      console.log(`   Generated plan (${result.plan.content.length} characters)`);
      console.log(`   Preview: ${result.plan.content.substring(0, 100)}...`);
      logTest('Generate Learning Plan', true);
    } else {
      throw new Error('No learning plan generated or invalid response');
    }
  } catch (error) {
    logTest('Generate Learning Plan', false, error);
  }
}

// Test 6: Create Session
async function testCreateSession() {
  try {
    console.log('\n🧪 Testing Create Session...');
    
    const result = await geminiAIService.createSession(
      'mentor_001',
      testConfig.testUserId,
      { topic: 'Career guidance' }
    );
    
    if (result.success && result.session && result.session.id) {
      console.log(`   Created session: ${result.session.id}`);
      logTest('Create Session', true);
      return result.session.id; // Return session ID for next test
    } else {
      throw new Error('Session not created or invalid response');
    }
  } catch (error) {
    logTest('Create Session', false, error);
    return null;
  }
}

// Test 7: Send Message
async function testSendMessage(sessionId) {
  try {
    console.log('\n🧪 Testing Send Message...');
    
    if (!sessionId) {
      throw new Error('No session ID available from previous test');
    }
    
    const result = await geminiAIService.sendMessage(
      sessionId,
      'Hello, I need advice on transitioning to full-stack development.',
      { userProfile: testConfig.testUserProfile }
    );
    
    if (result.success && result.message && result.message.content) {
      console.log(`   Received response (${result.message.content.length} characters)`);
      console.log(`   Preview: ${result.message.content.substring(0, 100)}...`);
      logTest('Send Message', true);
    } else {
      throw new Error('No message response or invalid response');
    }
  } catch (error) {
    logTest('Send Message', false, error);
  }
}

// Test 8: Usage Statistics
async function testUsageStats() {
  try {
    console.log('\n🧪 Testing Usage Statistics...');
    
    const stats = await geminiAIService.getUsageStats();
    
    if (stats && typeof stats.requestsThisMinute === 'number') {
      console.log(`   Requests this minute: ${stats.requestsThisMinute}`);
      console.log(`   Requests today: ${stats.requestsToday}`);
      console.log(`   Model: ${stats.model}`);
      logTest('Usage Statistics', true);
    } else {
      throw new Error('Invalid usage statistics response');
    }
  } catch (error) {
    logTest('Usage Statistics', false, error);
  }
}

// Test 9: Rate Limiting (optional - only if we want to test limits)
async function testRateLimiting() {
  try {
    console.log('\n🧪 Testing Rate Limiting (making multiple requests)...');
    
    // Make several requests quickly to test rate limiting
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(geminiAIService.generateContent('Test prompt ' + i));
    }
    
    const results = await Promise.all(promises);
    
    if (results.every(result => typeof result === 'string')) {
      console.log(`   Successfully handled ${results.length} concurrent requests`);
      logTest('Rate Limiting', true);
    } else {
      throw new Error('Rate limiting test failed');
    }
  } catch (error) {
    logTest('Rate Limiting', false, error);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Google Gemini AI Integration Tests...');
  console.log('================================================');
  
  const startTime = Date.now();
  
  // Run all tests
  await testInitialization();
  await testGetAllMentors();
  await testGetMentor();
  await testGenerateCareerAdvice();
  await testGenerateLearningPlan();
  
  const sessionId = await testCreateSession();
  await testSendMessage(sessionId);
  
  await testUsageStats();
  await testRateLimiting();
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Duration: ${duration}s`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   - ${test.name}: ${test.error}`);
      });
  }
  
  // Save test results to file
  const fs = require('fs');
  const testReport = {
    timestamp: new Date().toISOString(),
    duration: duration,
    summary: {
      total: testResults.passed + testResults.failed,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)
    },
    tests: testResults.tests,
    environment: {
      nodeVersion: process.version,
      model: config.gemini.model,
      maxTokens: config.gemini.maxTokens,
      temperature: config.gemini.temperature
    }
  };
  
  fs.writeFileSync(
    './test-results.json',
    JSON.stringify(testReport, null, 2)
  );
  
  console.log('\n📄 Test results saved to test-results.json');
  
  return testResults.failed === 0;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testResults
};

