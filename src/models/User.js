const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  password: {
    type: String,
    required: function() {
      // Password is required only for local authentication
      return this.authMethod === 'local';
    },
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false, // Don't return password in queries by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  profilePicture: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  authMethod: {
    type: String,
    enum: ['local', 'google', 'apple'],
    default: 'local',
  },
  googleId: String,
  appleId: String,
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  refreshToken: String,
  careerField: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CareerField',
  },
  learningStyle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningStyle',
  },
  careerStage: {
    type: String,
    enum: ['student', 'early_career', 'mid_career', 'senior'],
    default: 'student',
  },
  careerGoals: [String],
  skills: [{
    name: String,
    level: {
      type: Number,
      min: 1,
      max: 5,
    }
  }],
  lastActive: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Apply the uniqueValidator plugin to userSchema
userSchema.plugin(uniqueValidator, { message: '{PATH} already exists' });

// Pre-save hook to hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate verification token
userSchema.methods.generateVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = token;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = token;
  this.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
  return token;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
