const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const config = require('./config/config');
const routes = require('./routes');
const passport = require('./config/passport');


// Initialize Express app
const app = express();

// Connect to MongoDB
mongoose.connect(config.db.uri, config.db.options)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Security middleware
app.use(helmet());
// app.use(cors(config.cors));
app.use(cors({ origin: 'https://agentivebuddy.com:5001' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Initialize Passport
app.use(passport.initialize());

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TimeTravelers API',
      version: '1.0.0',
      description: 'API documentation for TimeTravelers application',
      contact: {
        name: 'API Support',
        email: 'support@timetravelers.app'
      }
    },
    servers: [
      {
        url: `http://0.0.0.0:${config.app.port}${config.app.apiPrefix}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// API routes
app.use(config.app.apiPrefix, routes);

// Health check endpoint
app.get(`${config.app.apiPrefix}/health`, (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// Error handling middleware
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  res.status(statusCode).json({
    error: {
      message: error.message,
      status: statusCode,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  });
});

// Start server
const PORT = config.app.port || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
