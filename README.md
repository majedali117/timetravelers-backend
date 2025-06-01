# TimeTravelers Backend Implementation

This repository contains the backend implementation for the TimeTravelers AI career guidance app. The backend is built with Node.js, Express, and MongoDB, providing a robust API for the mobile application.

## Project Structure

```
timetravelers-backend/
├── src/
│   ├── app.js                 # Main application entry point
│   ├── config/                # Configuration files
│   │   ├── config.js          # App configuration
│   │   └── passport.js        # Authentication strategies
│   ├── controllers/           # Request handlers
│   │   └── authController.js  # Authentication controller
│   ├── middleware/            # Custom middleware
│   │   └── authorize.js       # Role-based authorization
│   ├── models/                # Database models
│   │   ├── User.js            # User model
│   │   ├── AIMentor.js        # AI Mentor model
│   │   ├── CareerField.js     # Career Field model
│   │   ├── LearningStyle.js   # Learning Style model
│   │   ├── Session.js         # Session model
│   │   └── Mission.js         # Mission model
│   ├── routes/                # API routes
│   │   ├── authRoutes.js      # Authentication routes
│   │   ├── userRoutes.js      # User routes
│   │   ├── mentorRoutes.js    # AI Mentor routes
│   │   ├── careerFieldRoutes.js # Career Field routes
│   │   ├── learningStyleRoutes.js # Learning Style routes
│   │   ├── sessionRoutes.js   # Session routes
│   │   ├── missionRoutes.js   # Mission routes
│   │   └── index.js           # Route index
│   ├── tests/                 # Test files
│   │   └── auth.test.js       # Authentication tests
│   └── utils/                 # Utility functions
│       ├── helpers.js         # Helper functions
│       └── sendEmail.js       # Email utility
├── .env.example               # Environment variables example
├── .gitignore                 # Git ignore file
├── package.json               # Project dependencies
└── README.md                  # Project documentation
```

## Features

### Work Package 1: User Authentication System
- JWT-based authentication
- Email verification
- Social authentication (Google, Apple)
- User registration and login
- Role-based authorization
- Password reset functionality
- Secure session management

### Work Package 2: Database Schema and ORM Models
- User model with profile information
- AI Mentor model for virtual mentors
- Career Field model for different professional domains
- Learning Style model for personalized learning
- Session model for mentoring interactions
- Mission model for career development tasks
- Relationships between all models

## API Documentation

The API is documented using Swagger/OpenAPI. When running the server, you can access the documentation at:

```
http://localhost:5000/api-docs
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/timetravelers-backend.git
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

   **IMPORTANT**: The following environment variables are required for the server to start properly:
   
   ```
   # Database Configuration
   MONGODB_URI=your_mongodb_connection_string
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   
   # OAuth Configuration (Required for social authentication)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   APPLE_CLIENT_ID=your_apple_client_id
   APPLE_TEAM_ID=your_apple_team_id
   APPLE_KEY_ID=your_apple_key_id
   APPLE_PRIVATE_KEY=path_to_your_apple_private_key
   
   # Email Configuration (Required for email verification and password reset)
   EMAIL_SERVICE=your_email_service
   EMAIL_USER=your_email_username
   EMAIL_PASSWORD=your_email_password
   ```
   
   If you don't need social authentication (Google/Apple), you can temporarily disable it by commenting out the relevant sections in `src/config/passport.js`.

5. Start the server
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `GET /api/v1/auth/verify-email/:token` - Verify email address
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh-token` - Refresh JWT token
- `POST /api/v1/auth/forgot-password` - Send password reset email
- `POST /api/v1/auth/reset-password/:token` - Reset password
- `GET /api/v1/auth/google` - Google OAuth authentication
- `GET /api/v1/auth/google/callback` - Google OAuth callback
- `GET /api/v1/auth/apple` - Apple OAuth authentication
- `POST /api/v1/auth/apple/callback` - Apple OAuth callback
- `POST /api/v1/auth/logout` - Logout user

### Users
- `GET /api/v1/users/profile` - Get current user profile
- `PUT /api/v1/users/profile` - Update user profile
- `POST /api/v1/users/change-password` - Change user password
- `GET /api/v1/users` - Get all users (admin only)

### AI Mentors
- `GET /api/v1/mentors` - Get all AI mentors
- `GET /api/v1/mentors/:id` - Get AI mentor by ID
- `POST /api/v1/mentors` - Create a new AI mentor (admin only)
- `PUT /api/v1/mentors/:id` - Update AI mentor (admin only)
- `DELETE /api/v1/mentors/:id` - Delete AI mentor (admin only)

### Career Fields
- `GET /api/v1/career-fields` - Get all career fields
- `GET /api/v1/career-fields/:id` - Get career field by ID
- `POST /api/v1/career-fields` - Create a new career field (admin only)
- `PUT /api/v1/career-fields/:id` - Update career field (admin only)
- `DELETE /api/v1/career-fields/:id` - Delete career field (admin only)

### Learning Styles
- `GET /api/v1/learning-styles` - Get all learning styles
- `GET /api/v1/learning-styles/:id` - Get learning style by ID
- `POST /api/v1/learning-styles` - Create a new learning style (admin only)
- `PUT /api/v1/learning-styles/:id` - Update learning style (admin only)
- `DELETE /api/v1/learning-styles/:id` - Delete learning style (admin only)

### Sessions
- `GET /api/v1/sessions` - Get user's sessions
- `GET /api/v1/sessions/:id` - Get session by ID
- `POST /api/v1/sessions` - Create a new session
- `PUT /api/v1/sessions/:id/start` - Start a session
- `POST /api/v1/sessions/:id/message` - Add a message to a session
- `PUT /api/v1/sessions/:id/complete` - Complete a session
- `POST /api/v1/sessions/:id/feedback` - Add feedback to a completed session
- `PUT /api/v1/sessions/:id/cancel` - Cancel a session

### Missions
- `GET /api/v1/missions` - Get available missions
- `GET /api/v1/missions/my-missions` - Get user's assigned missions
- `GET /api/v1/missions/:id` - Get mission by ID
- `POST /api/v1/missions/:id/assign` - Assign mission to current user
- `PUT /api/v1/missions/:id/start` - Start an assigned mission
- `PUT /api/v1/missions/:id/progress` - Update mission progress
- `PUT /api/v1/missions/:id/abandon` - Abandon a mission
- `POST /api/v1/missions/:id/feedback` - Add feedback to a completed mission
- `POST /api/v1/missions` - Create a new mission (admin only)

## Testing

Run tests with:
```bash
npm test
```

## Future Enhancements

- Integration with Manus AI API for AI mentor responses
- Real-time chat using WebSockets
- Analytics dashboard for user progress
- Recommendation engine for personalized missions
- Mobile push notifications

## License

This project is licensed under the MIT License.
