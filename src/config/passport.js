const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AppleStrategy = require('passport-apple');
const User = require('../models/User');
const config = require('./config');

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.secret,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Find the user by id from the JWT payload
      const user = await User.findById(payload.id);
      
      if (!user) {
        return done(null, false);
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Local Strategy (email & password)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        // Find the user with the given email
        const user = await User.findOne({ email }).select('+password');
        
        // If user doesn't exist
        if (!user) {
          return done(null, false, { message: 'Email not registered' });
        }
        
        // Check if the user is using local authentication
        if (user.authMethod !== 'local') {
          return done(null, false, { 
            message: `This account uses ${user.authMethod} authentication. Please sign in with ${user.authMethod}.` 
          });
        }
        
        // Check if password is correct
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
          return done(null, false, { message: 'Invalid password' });
        }
        
        // Check if email is verified
        if (!user.isEmailVerified) {
          return done(null, false, { message: 'Please verify your email address' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
          return done(null, user);
        }
        
        // Check if user exists with the same email
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Update existing user with Google ID
          user.googleId = profile.id;
          user.authMethod = 'google';
          user.isEmailVerified = true; // Google verifies emails
          
          if (!user.profilePicture && profile.photos && profile.photos.length > 0) {
            user.profilePicture = profile.photos[0].value;
          }
          
          await user.save();
          return done(null, user);
        }
        
        // Create new user
        const newUser = new User({
          email: profile.emails[0].value,
          firstName: profile.name.givenName || profile.displayName.split(' ')[0],
          lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' '),
          profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
          googleId: profile.id,
          authMethod: 'google',
          isEmailVerified: true, // Google verifies emails
        });
        
        await newUser.save();
        return done(null, newUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Apple OAuth Strategy
if (config.apple.clientID && config.apple.teamID && config.apple.keyID && config.apple.privateKeyLocation) {
  passport.use(
    new AppleStrategy(
      {
        clientID: config.apple.clientID,
        teamID: config.apple.teamID,
        keyID: config.apple.keyID,
        privateKeyLocation: config.apple.privateKeyLocation,
        callbackURL: config.apple.callbackURL,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, idToken, profile, done) => {
        try {
          // Apple doesn't provide much profile info, so we extract from the idToken
          const { sub: appleId, email } = idToken;
          
          // Check if user already exists with this Apple ID
          let user = await User.findOne({ appleId });
          
          if (user) {
            return done(null, user);
          }
          
          // Check if user exists with the same email
          if (email) {
            user = await User.findOne({ email });
            
            if (user) {
              // Update existing user with Apple ID
              user.appleId = appleId;
              user.authMethod = 'apple';
              user.isEmailVerified = true; // Apple verifies emails
              
              await user.save();
              return done(null, user);
            }
          }
          
          // For new users, we need name from the request body (Apple sends it only once)
          const firstName = req.body.firstName || 'Apple';
          const lastName = req.body.lastName || 'User';
          
          // Create new user
          const newUser = new User({
            email: email || `${appleId}@privaterelay.appleid.com`, // Apple may use private relay
            firstName,
            lastName,
            appleId,
            authMethod: 'apple',
            isEmailVerified: true, // Apple verifies emails
          });
          
          await newUser.save();
          return done(null, newUser);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

module.exports = passport;
