import { Router } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import { doctor } from "../models/doctor.js";
import { patient } from "../models/patient.js";
import { admin } from "../models/admin.js";
import { generateToken, verifyToken } from "../middleware/auth.js";
import passport from "../services/googleAuth.js";

const authRouter = Router();

// Patient Registration
authRouter.post("/register/patient", [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('age').isInt({ min: 0, max: 120 }).withMessage('Valid age required'),
  body('phone').isMobilePhone().withMessage('Valid phone number required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, age, phone, gender, address } = req.body;

    // Check if patient already exists
    const existingPatient = await patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ error: 'Patient already exists with this email' });
    }

    // Create new patient
    const newPatient = new patient({
      name,
      email,
      password,
      age,
      phone,
      gender,
      address: address || {},
    });

    await newPatient.save();

    // Generate token
    const token = generateToken({
      userId: newPatient._id,
      userType: 'patient',
      email: newPatient.email
    });

    res.status(201).json({
      message: 'Patient registered successfully',
      token,
      user: {
        id: newPatient._id,
        name: newPatient.name,
        email: newPatient.email,
        userType: 'patient'
      }
    });
  } catch (error) {
    console.error('Patient registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Doctor Registration
authRouter.post("/register/doctor", [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').isMobilePhone().withMessage('Valid phone number required'),
  body('specialization').notEmpty().withMessage('Specialization required'),
  body('experience').isInt({ min: 0 }).withMessage('Valid experience required'),
  body('qualification').notEmpty().withMessage('Qualification required'),
  body('consultationFee').isFloat({ min: 0 }).withMessage('Valid consultation fee required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, email, password, phone, gender, specialization, 
      experience, qualification, consultationFee, bio 
    } = req.body;

    // Check if doctor already exists
    const existingDoctor = await doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ error: 'Doctor already exists with this email' });
    }

    // Generate doctor ID
    const doctorid = generateCode();

    // Create new doctor
    const newDoctor = new doctor({
      name,
      email,
      password,
      phone,
      gender,
      specialization,
      experience,
      qualification,
      consultationFee,
      bio,
      doctorid,
      status: 'pending'
    });

    await newDoctor.save();

    res.status(201).json({
      message: 'Doctor registered successfully. Please wait for admin approval.',
      doctor: {
        id: newDoctor._id,
        name: newDoctor.name,
        email: newDoctor.email,
        doctorid: newDoctor.doctorid,
        status: newDoctor.status
      }
    });
  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Patient Login
authRouter.post("/login/patient", [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find patient
    const patientUser = await patient.findOne({ email });
    if (!patientUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await patientUser.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    patientUser.lastLogin = new Date();
    await patientUser.save();

    // Generate token
    const token = generateToken({
      userId: patientUser._id,
      userType: 'patient',
      email: patientUser.email
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: patientUser._id,
        name: patientUser.name,
        email: patientUser.email,
        userType: 'patient'
      }
    });
  } catch (error) {
    console.error('Patient login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Doctor Login
authRouter.post("/login/doctor", [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find doctor
    const doctorUser = await doctor.findOne({ email });
    if (!doctorUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await doctorUser.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if doctor is approved
    if (doctorUser.status !== 'approved') {
      return res.status(403).json({ 
        error: 'Account not approved yet. Please wait for admin approval.' 
      });
    }

    // Update last login and online status
    doctorUser.lastActive = new Date();
    doctorUser.isOnline = true;
    await doctorUser.save();

    // Generate token
    const token = generateToken({
      userId: doctorUser._id,
      userType: 'doctor',
      email: doctorUser.email
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: doctorUser._id,
        name: doctorUser.name,
        email: doctorUser.email,
        userType: 'doctor',
        specialization: doctorUser.specialization,
        status: doctorUser.status
      }
    });
  } catch (error) {
    console.error('Doctor login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Admin Login
authRouter.post("/login/admin", [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // For now, using hardcoded admin credentials
    // In production, you should have a proper admin model
    if (email === "admin@medicare.com" && password === "admin123") {
      const token = generateToken({
        userId: 'admin',
        userType: 'admin',
        email: email
      });

      res.json({
        message: 'Admin login successful',
        token,
        user: {
          id: 'admin',
          name: 'Admin',
          email: email,
          userType: 'admin'
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid admin credentials' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Google OAuth routes
authRouter.get("/google", passport.authenticate("google", { 
  scope: ["profile", "email"],
  session: false 
}));

authRouter.get("/google/callback", 
  passport.authenticate("google", { 
    session: false, 
    failureRedirect: "/login?error=google_auth_failed" 
  }),
  async (req, res) => {
    try {
      const { id, displayName, emails } = req.user;
      
      // Check if patient exists
      let patientUser = await patient.findOne({ googleId: id });
      
      if (!patientUser) {
        // Create new patient
        patientUser = new patient({
          name: displayName,
          email: emails[0].value,
          googleId: id,
          verified: 'google',
          age: 0, // Default age, can be updated later
          gender: 'other', // Default gender, can be updated later
          phone: '', // Can be updated later
        });
        await patientUser.save();
      }

      // Update last login
      patientUser.lastLogin = new Date();
      await patientUser.save();

      // Generate token
      const token = generateToken({
        userId: patientUser._id,
        userType: 'patient',
        email: patientUser.email
      });

      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
    }
  }
);

// Logout
authRouter.post("/logout", (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Verify token
authRouter.get("/verify", verifyToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user,
    userType: req.userType 
  });
});

export default authRouter;


