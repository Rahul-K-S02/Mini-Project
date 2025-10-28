import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { patient } from "../models/patient.js";
import { generateToken } from "../middleware/auth.js";
import { config } from "dotenv";
config();

// Only initialize Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALL_BACK_URL || "http://localhost:5000/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
        console.log('Google OAuth profile:', profile);
        try {
            let google_email = profile.emails[0].value;
            let googleId = profile.id;
            let patientUser = await patient.findOne({ email: google_email });
            
            if (!patientUser) {
                patientUser = new patient({
                    name: profile.displayName,
                    email: google_email,
                    googleId: googleId,
                    verified: 'google',
                    age: 0,
                    gender: 'other',
                    phone: ''
                });
                await patientUser.save();
            }

            const token = generateToken({
                userId: patientUser._id,
                userType: 'patient',
                email: patientUser.email
            });

            return done(null, { user: patientUser, token });
        } catch (error) {
            console.error('Google OAuth error:', error);
            return done(error, null);
        }
    }));
    
    console.log('✅ Google OAuth initialized');
} else {
    console.log('⚠️  Google OAuth not configured (CLIENT_ID or CLIENT_SECRET missing)');
}

// Serialize user for the session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((user, done) => {
    done(null, user);
});

export default passport;