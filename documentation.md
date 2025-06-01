# TimeTravelers Backend Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [API Reference](#api-reference)
4. [Authentication](#authentication)
5. [User Management](#user-management)
6. [AI Mentorship System](#ai-mentorship-system)
7. [Mission Command Center](#mission-command-center)
8. [Protocol Management](#protocol-management)
9. [Analytics and Reporting](#analytics-and-reporting)
10. [Admin Dashboard](#admin-dashboard)
11. [Configuration](#configuration)
12. [Troubleshooting](#troubleshooting)

## Introduction

The TimeTravelers backend is a Node.js application built with Express and MongoDB that powers the TimeTravelers career guidance platform. It provides a comprehensive API for user authentication, AI mentorship, mission management, analytics, and administration.

The backend is designed around the concept of experienced professionals ("Travelers") mentoring newcomers in various career fields through interactive missions and structured learning protocols.

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (v4.4+)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-org/timetravelers-backend.git
cd timetravelers-backend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file based on `.env.example`
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration

5. Start the server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on the port specified in your `.env` file (default: 5000).

### Directory Structure

```
timetravelers-backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── app.js          # Express application
├── tests/              # Test files
├── .env.example        # Environment variables template
├── package.json        # Project dependencies
└── README.md           # Project documentation
```

## API Reference

The API is organized around RESTful principles. All endpoints return JSON responses and use standard HTTP response codes.

Base URL: `http://localhost:5000/api/v1`

API documentation is available at `/api-docs` when the server is running.

### Common Parameters

- **Pagination**: Most list endpoints support `page` and `limit` query parameters
- **Filtering**: Many endpoints support filtering by specific fields
- **Sorting**: Use `sort` parameter with field name (prefix with `-` for descending order)

### Response Format

Successful responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... } // When applicable
}
```

Error responses follow this format:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "status": 400
  }
}
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. Social authentication with Google and Apple is also supported.

### Endpoints

#### Register a new user
```
POST /auth/register
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```
POST /auth/login
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

#### Refresh Token
```
POST /auth/refresh-token
```

Request body:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout
```
POST /auth/logout
```

#### Reset Password
```
POST /auth/forgot-password
```

Request body:
```json
{
  "email": "user@example.com"
}
```

```
POST /auth/reset-password
```

Request body:
```json
{
  "token": "reset-token-from-email",
  "password": "new-password"
}
```

#### Social Authentication
```
GET /auth/google
GET /auth/google/callback
GET /auth/apple
GET /auth/apple/callback
```

### Using Authentication

For protected endpoints, include the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## User Management

### User Profile

#### Get current user profile
```
GET /profile
```

#### Update user profile
```
PUT /profile
```

Request body:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Software developer with 5 years of experience",
  "location": "San Francisco, CA",
  "interests": ["programming", "machine learning"]
}
```

#### Upload profile image
```
POST /profile/image
```

Form data:
- `image`: Image file

### Career Goals

#### Get user career goals
```
GET /profile/goals
```

#### Create career goal
```
POST /profile/goals
```

Request body:
```json
{
  "title": "Become a Senior Developer",
  "description": "Advance to a senior developer position within 2 years",
  "targetDate": "2023-12-31",
  "milestones": [
    {
      "title": "Learn React",
      "targetDate": "2023-06-30"
    }
  ]
}
```

#### Update career goal
```
PUT /profile/goals/:goalId
```

#### Delete career goal
```
DELETE /profile/goals/:goalId
```

### Skills

#### Get user skills
```
GET /profile/skills
```

#### Add skill
```
POST /profile/skills
```

Request body:
```json
{
  "name": "JavaScript",
  "level": "intermediate",
  "yearsOfExperience": 2
}
```

#### Update skill
```
PUT /profile/skills/:skillId
```

#### Delete skill
```
DELETE /profile/skills/:skillId
```

### Learning Style Assessment

#### Get learning style
```
GET /profile/learning-style
```

#### Submit learning style assessment
```
POST /profile/learning-style
```

Request body:
```json
{
  "answers": [
    {
      "questionId": "1",
      "answer": "visual"
    },
    // More answers...
  ]
}
```

## AI Mentorship System

### AI Mentors

#### Get all mentors
```
GET /mentors
```

Query parameters:
- `careerField`: Filter by career field ID
- `specialization`: Filter by specialization
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### Get mentor by ID
```
GET /mentors/:id
```

#### Get recommended mentors
```
GET /mentors/recommended
```

### TELL Matching

#### Calculate TELL matching
```
POST /matching/calculate
```

#### Get top mentor matches
```
GET /matching/top
```

#### Get mentor match details
```
GET /matching/mentor/:mentorId
```

### Sessions

#### Create session
```
POST /sessions
```

Request body:
```json
{
  "mentorId": "60d21b4667d0d8992e610c85",
  "topic": "Career transition advice",
  "scheduledTime": "2023-07-15T14:00:00Z",
  "duration": 30
}
```

#### Get user sessions
```
GET /sessions
```

#### Get session by ID
```
GET /sessions/:id
```

#### Update session
```
PUT /sessions/:id
```

#### Cancel session
```
PUT /sessions/:id/cancel
```

#### Complete session
```
PUT /sessions/:id/complete
```

Request body:
```json
{
  "notes": "Discussed career transition strategies",
  "rating": 5,
  "feedback": "Very helpful session"
}
```

## Mission Command Center

### Mission Templates

#### Get all mission templates
```
GET /missions/templates
```

Query parameters:
- `search`: Search by title or description
- `careerField`: Filter by career field ID
- `difficulty`: Filter by difficulty level
- `type`: Filter by mission type
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### Get mission template by ID
```
GET /missions/templates/:id
```

#### Create mission template (Admin only)
```
POST /missions/templates
```

Request body:
```json
{
  "title": "Build a Portfolio Website",
  "description": "Create a personal portfolio website to showcase your projects",
  "type": "project",
  "difficulty": "intermediate",
  "estimatedDuration": {
    "value": 2,
    "unit": "weeks"
  },
  "careerFields": ["60d21b4667d0d8992e610c85"],
  "skills": ["HTML", "CSS", "JavaScript"],
  "steps": [
    {
      "order": 0,
      "title": "Plan your website",
      "description": "Decide on the structure and content of your portfolio",
      "completionCriteria": "Create a sitemap and wireframes"
    },
    // More steps...
  ],
  "rewards": {
    "experience": 100,
    "skillPoints": 50,
    "badges": ["web_developer"]
  }
}
```

#### Update mission template (Admin only)
```
PUT /missions/templates/:id
```

#### Delete mission template (Admin only)
```
DELETE /missions/templates/:id
```

### User Missions

#### Assign mission
```
POST /missions/assign
```

Request body:
```json
{
  "missionId": "60d21b4667d0d8992e610c85",
  "mentorId": "60d21b4667d0d8992e610c86" // Optional
}
```

#### Get user missions
```
GET /missions/user
```

Query parameters:
- `status`: Filter by status
- `isActive`: Filter by active status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### Get user mission by ID
```
GET /missions/:id
```

#### Update mission progress
```
PUT /missions/:id/progress
```

Request body:
```json
{
  "stepIndex": 0,
  "completed": true,
  "notes": "Completed the planning phase",
  "evidence": "https://example.com/sitemap.pdf"
}
```

#### Submit mission feedback
```
POST /missions/:id/feedback
```

Request body:
```json
{
  "rating": 5,
  "comments": "Great mission, learned a lot!"
}
```

#### Abandon mission
```
PUT /missions/:id/abandon
```

#### Get recommended missions
```
GET /missions/recommended
```

## Protocol Management

### Protocol Templates

#### Get all protocol templates
```
GET /protocols/templates
```

Query parameters:
- `search`: Search by title or description
- `careerField`: Filter by career field ID
- `targetLevel`: Filter by target level
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### Get protocol template by ID
```
GET /protocols/templates/:id
```

#### Create protocol template (Admin only)
```
POST /protocols/templates
```

Request body:
```json
{
  "title": "Become a Full Stack Developer",
  "description": "A comprehensive learning path to become a full stack developer",
  "careerFields": ["60d21b4667d0d8992e610c85"],
  "targetLevel": "intermediate",
  "estimatedDuration": {
    "value": 6,
    "unit": "months"
  },
  "phases": [
    {
      "title": "Frontend Fundamentals",
      "description": "Learn the basics of frontend development",
      "order": 0,
      "milestones": [
        {
          "title": "HTML & CSS Mastery",
          "description": "Learn the fundamentals of HTML and CSS",
          "order": 0,
          "missions": ["60d21b4667d0d8992e610c87", "60d21b4667d0d8992e610c88"]
        }
        // More milestones...
      ]
    }
    // More phases...
  ],
  "learningOutcomes": [
    "Build full stack web applications",
    "Deploy applications to production"
  ],
  "skillsGained": [
    {
      "name": "HTML",
      "level": "advanced"
    },
    {
      "name": "JavaScript",
      "level": "intermediate"
    }
    // More skills...
  ],
  "prerequisites": {
    "skills": [
      {
        "name": "Basic Programming",
        "level": "beginner"
      }
    ],
    "experience": "Some programming experience recommended",
    "other": "Computer with internet access"
  }
}
```

#### Update protocol template (Admin only)
```
PUT /protocols/templates/:id
```

#### Delete protocol template (Admin only)
```
DELETE /protocols/templates/:id
```

### User Protocols

#### Assign protocol
```
POST /protocols/assign
```

Request body:
```json
{
  "protocolId": "60d21b4667d0d8992e610c85",
  "mentorId": "60d21b4667d0d8992e610c86", // Optional
  "customizations": {
    "focusAreas": ["frontend", "react"],
    "pacePreference": "standard"
  }
}
```

#### Get user protocols
```
GET /protocols/user
```

Query parameters:
- `status`: Filter by status
- `isActive`: Filter by active status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### Get user protocol by ID
```
GET /protocols/:id
```

#### Update milestone completion
```
PUT /protocols/:id/milestone
```

Request body:
```json
{
  "phaseIndex": 0,
  "milestoneIndex": 0,
  "completed": true
}
```

#### Update protocol customizations
```
PUT /protocols/:id/customizations
```

Request body:
```json
{
  "customizations": {
    "focusAreas": ["frontend", "react", "typescript"],
    "pacePreference": "accelerated"
  }
}
```

#### Abandon protocol
```
PUT /protocols/:id/abandon
```

#### Get recommended protocols
```
GET /protocols/recommended
```

## Analytics and Reporting

### Event Tracking

#### Track analytics event
```
POST /analytics/events
```

Request body:
```json
{
  "eventType": "feature_used",
  "metadata": {
    "feature": "mission_search",
    "query": "javascript"
  },
  "sessionId": "user-session-123",
  "deviceInfo": {
    "type": "desktop",
    "browser": "Chrome",
    "os": "Windows",
    "screenSize": "1920x1080"
  },
  "location": {
    "page": "/missions",
    "component": "search",
    "section": "header"
  }
}
```

### Metrics

#### Get user engagement metrics (Admin only)
```
GET /analytics/engagement
```

Query parameters:
- `userId`: Filter by user ID (optional)
- `startDate`: Start date (ISO format)
- `endDate`: End date (ISO format)

#### Get mission completion metrics (Admin only)
```
GET /analytics/missions
```

Query parameters:
- `startDate`: Start date (ISO format)
- `endDate`: End date (ISO format)

#### Get protocol progress metrics (Admin only)
```
GET /analytics/protocols
```

Query parameters:
- `startDate`: Start date (ISO format)
- `endDate`: End date (ISO format)

#### Get user growth metrics (Admin only)
```
GET /analytics/growth
```

Query parameters:
- `startDate`: Start date (ISO format)
- `endDate`: End date (ISO format)

### Reports

#### Create analytics report (Admin only)
```
POST /analytics/reports
```

Request body:
```json
{
  "title": "Monthly User Engagement Report",
  "description": "Analysis of user engagement for the past month",
  "reportType": "user_engagement",
  "dateRange": {
    "start": "2023-06-01T00:00:00Z",
    "end": "2023-06-30T23:59:59Z"
  },
  "filters": {
    "userType": "active"
  },
  "isScheduled": true,
  "schedule": {
    "frequency": "monthly",
    "recipients": ["60d21b4667d0d8992e610c85"]
  },
  "isPublic": false
}
```

#### Get all analytics reports
```
GET /analytics/reports
```

#### Get analytics report by ID
```
GET /analytics/reports/:id
```

#### Update analytics report
```
PUT /analytics/reports/:id
```

#### Delete analytics report
```
DELETE /analytics/reports/:id
```

### Data Export

#### Export analytics data (Admin only)
```
GET /analytics/export
```

Query parameters:
- `dataType`: Type of data to export (events, users, missions, protocols, sessions)
- `format`: Export format (json, csv)
- `startDate`: Start date (ISO format)
- `endDate`: End date (ISO format)

## Admin Dashboard

### Dashboards

#### Create admin dashboard (Admin only)
```
POST /admin/dashboards
```

Request body:
```json
{
  "title": "User Growth Dashboard",
  "description": "Monitor user growth and engagement",
  "layout": "grid",
  "widgets": [
    {
      "title": "New Users",
      "type": "chart",
      "size": {
        "width": 2,
        "height": 1
      },
      "position": {
        "x": 0,
        "y": 0
      },
      "dataSource": {
        "type": "api",
        "endpoint": "/analytics/growth",
        "refreshInterval": 3600
      },
      "config": {
        "chartType": "line",
        "dataKey": "newUsersByDay"
      }
    }
    // More widgets...
  ],
  "isDefault": true
}
```

#### Get all admin dashboards (Admin only)
```
GET /admin/dashboards
```

#### Get admin dashboard by ID (Admin only)
```
GET /admin/dashboards/:id
```

#### Update admin dashboard (Admin only)
```
PUT /admin/dashboards/:id
```

#### Delete admin dashboard (Admin only)
```
DELETE /admin/dashboards/:id
```

### Widget Data

#### Get admin dashboard widget data (Admin only)
```
GET /admin/widget-data
```

Query parameters:
- `widgetType`: Type of widget (userStats, missionStats, etc.)
- `dataSource`: Data source identifier
- `timeRange`: Time range (today, yesterday, last7days, last30days, thisMonth, lastMonth)

### System Overview

#### Get system overview (Admin only)
```
GET /admin/system-overview
```

## Configuration

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

### Server Configuration
```
PORT=5000
NODE_ENV=development
API_PREFIX=/api/v1
```

### Database Configuration
```
MONGODB_URI=mongodb://localhost:27017/timetravelers
MONGODB_TEST_URI=mongodb://localhost:27017/timetravelers-test
```

### JWT Configuration
```
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d
```

### Email Configuration
```
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@timetravelers.app
```

### OAuth Configuration
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key
APPLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/apple/callback
```

### Storage Configuration
```
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./uploads
```

### AI Configuration
```
MANUS_AI_API_KEY=your-manus-ai-api-key
MANUS_AI_API_URL=https://api.manus.ai/v1
```

## Troubleshooting

### Common Issues

#### Connection to MongoDB failed
- Check if MongoDB is running
- Verify the connection string in `.env` file
- Ensure network connectivity to the database server

#### JWT token issues
- Check if JWT_SECRET is properly set in `.env` file
- Verify token expiration settings
- Clear browser cookies and local storage

#### Email sending fails
- Check email configuration in `.env` file
- Verify SMTP server is accessible
- Check for email sending limits

#### Social authentication fails
- Verify OAuth credentials in `.env` file
- Check callback URLs are correctly configured in OAuth provider dashboards
- Ensure redirect URIs are whitelisted

### Logging

The application uses Morgan for HTTP request logging and a custom logger for application logs. Logs are output to the console in development mode.

To enable more verbose logging, set the `LOG_LEVEL` environment variable:

```
LOG_LEVEL=debug
```

### Support

For additional support, please contact the development team at support@timetravelers.app or open an issue on the GitHub repository.
