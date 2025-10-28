import { Router } from "express";
import { body, validationResult } from "express-validator";
import { doctor } from "../models/doctor.js";
import { patient } from "../models/patient.js";
import { appointment } from "../models/appointment.js";
import { prescription } from "../models/prescription.js";
import { notification } from "../models/notification.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { 
  analyzeSymptoms, 
  getAllSymptoms, 
  getSymptomSuggestions,
  generateHealthRecommendation 
} from "../services/symptomAnalyzer.js";

const patientRouter = Router();

// Patient Dashboard
patientRouter.get('/', authenticate, authorize('patient'), async (req, res) => {
  try {
    const doctorArray = await doctor.find({ status: "approved" });
    
    // Get patient's recent appointments
    const recentAppointments = await appointment.find({ patient: req.user._id })
      .populate('doctor', 'name specialization email phone rating')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get patient's recent prescriptions
    const recentPrescriptions = await prescription.find({ patient: req.user._id })
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get unread notifications
    const unreadNotifications = await notification.countDocuments({
      recipient: req.user._id,
      recipientType: 'patient',
      isRead: false
    });

    res.render('patient', {
        doctors: doctorArray,
      patient: req.user,
      recentAppointments,
      recentPrescriptions,
      unreadNotifications
    });
  } catch (error) {
    console.error('Patient dashboard error:', error);
    res.status(500).json({ error: 'Failed to load patient dashboard' });
  }
});

// Get all doctors with filtering
patientRouter.get('/doctors', authenticate, authorize('patient'), async (req, res) => {
  try {
    const { specialization, search, sortBy = 'rating' } = req.query;
    
    const query = { status: 'approved' };
    
    if (specialization) {
      query.specialization = specialization;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    
    let doctors = await doctor.find(query).select('-password');
    
    // Sort doctors
    if (sortBy === 'rating') {
      doctors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'name') {
      doctors.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'fee') {
      doctors.sort((a, b) => a.consultationFee - b.consultationFee);
    }
    
    res.json({ doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// AI Symptom Analysis Endpoint
patientRouter.post('/analyze-symptoms', [
  authenticate,
  authorize('patient'),
  body('symptoms').isArray().withMessage('Symptoms must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { symptoms } = req.body;
    
    // Analyze symptoms using AI
    const analysis = analyzeSymptoms(symptoms);
    
    // Get recommended doctors based on analysis
    const recommendedDoctors = [];
    
    if (analysis.recommendedSpecializations.length > 0) {
      for (const rec of analysis.recommendedSpecializations) {
        const doctors = await doctor.find({
          specialization: rec.specialization.charAt(0).toUpperCase() + rec.specialization.slice(1),
          status: 'approved'
        }).select('-password').limit(5);
        
        recommendedDoctors.push({
          specialization: rec.specialization,
          confidence: rec.confidence,
          doctors
        });
      }
    } else {
      // No specific specialization, get general medicine doctors
      const generalDoctors = await doctor.find({
        $or: [
          { specialization: 'General Medicine' },
          { specialization: 'Family Medicine' }
        ],
        status: 'approved'
      }).select('-password').limit(5);
      
      recommendedDoctors.push({
        specialization: 'general_medicine',
        confidence: 50,
        doctors: generalDoctors
      });
    }

    // Generate health recommendation
    const recommendation = generateHealthRecommendation(
      analysis,
      req.user.age || 30,
      req.user.gender || 'other'
    );

    res.json({
      success: true,
      analysis,
      recommendedDoctors,
      recommendation
    });
  } catch (error) {
    console.error('Symptom analysis error:', error);
    res.status(500).json({ error: 'Server error during symptom analysis' });
  }
});

// Get symptom suggestions (autocomplete)
patientRouter.get('/symptom-suggestions', authenticate, authorize('patient'), (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }
    
    const suggestions = getSymptomSuggestions(query);
    res.json({ suggestions });
  } catch (error) {
    console.error('Get symptom suggestions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all available symptoms
patientRouter.get('/symptoms', authenticate, authorize('patient'), (req, res) => {
  try {
    const symptoms = getAllSymptoms();
    res.json({ symptoms });
  } catch (error) {
    console.error('Get symptoms error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create appointment with AI recommendation
patientRouter.post('/create-ai-appointment', [
  authenticate,
  authorize('patient'),
  body('symptoms').isArray().withMessage('Symptoms must be an array'),
  body('appointmentDate').isISO8601().withMessage('Valid date required'),
  body('appointmentTime').notEmpty().withMessage('Appointment time required'),
  body('type').isIn(['consultation', 'follow-up', 'emergency', 'routine-checkup']).withMessage('Valid appointment type required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { symptoms, appointmentDate, appointmentTime, type, notes } = req.body;

    // Analyze symptoms
    const analysis = analyzeSymptoms(symptoms);
    
    // Find the best matching doctor
    let selectedDoctor;
    
    if (analysis.recommendedSpecializations.length > 0) {
      const topSpecialization = analysis.recommendedSpecializations[0].specialization;
      const capitalizedSpecialization = topSpecialization.charAt(0).toUpperCase() + topSpecialization.slice(1);
      
      selectedDoctor = await doctor.findOne({
        specialization: capitalizedSpecialization,
        status: 'approved',
        isOnline: true
      });
      
      if (!selectedDoctor) {
        selectedDoctor = await doctor.findOne({
          specialization: capitalizedSpecialization,
          status: 'approved'
        }).sort({ rating: -1 });
      }
    }
    
    if (!selectedDoctor) {
      // No matching specialist found, use general medicine
      selectedDoctor = await doctor.findOne({
        $or: [
          { specialization: 'General Medicine' },
          { specialization: 'Family Medicine' }
        ],
        status: 'approved'
      }).sort({ rating: -1 });
    }

    if (!selectedDoctor) {
      return res.status(404).json({ error: 'No available doctors found for your symptoms' });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await appointment.findOne({
      doctor: selectedDoctor._id,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({ error: 'Time slot already booked. Please choose another time.' });
    }

    // Create appointment
    const newAppointment = new appointment({
      patient: req.user._id,
      doctor: selectedDoctor._id,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      symptoms,
      type,
      notes,
      amount: selectedDoctor.consultationFee,
    });

    await newAppointment.save();

    // Create notification for doctor
    await notification.create({
      recipient: selectedDoctor._id,
      recipientType: 'doctor',
      title: 'New AI-Recommended Appointment',
      message: `New appointment request from ${req.user.name}. AI-recommended based on symptoms analysis.`,
      type: 'appointment',
      priority: analysis.urgencyLevel === 'urgent' || analysis.urgencyLevel === 'emergency' ? 'high' : 'medium',
      actionUrl: `/doctor/appointments/${newAppointment._id}`,
      metadata: {
        appointmentId: newAppointment._id,
        patientName: req.user.name,
        symptoms,
        aiRecommendation: {
          recommendedSpecialization: analysis.recommendedSpecializations.length > 0 ? analysis.recommendedSpecializations[0].specialization : null,
          confidence: analysis.confidence,
          urgencyLevel: analysis.urgencyLevel
        }
      }
    });

    await newAppointment.populate('doctor', 'name email specialization phone rating');
    await newAppointment.populate('patient', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully with AI recommendation',
      appointment: newAppointment,
      aiAnalysis: analysis,
      recommendedDoctor: {
        name: selectedDoctor.name,
        specialization: selectedDoctor.specialization,
        rating: selectedDoctor.rating,
        reason: `Matched based on ${analysis.recommendedSpecializations.length > 0 ? analysis.recommendedSpecializations[0].specialization : 'general medicine'} specialization`
      }
    });
  } catch (error) {
    console.error('Create AI appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get patient's appointments
patientRouter.get('/appointments', authenticate, authorize('patient'), async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = { patient: req.user._id };
    if (status) {
      query.status = status;
    }
    
    const appointments = await appointment.find(query)
      .populate('doctor', 'name email specialization phone rating')
      .populate('prescription')
      .sort({ appointmentDate: -1 });
    
    res.json({ appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get patient's prescriptions
patientRouter.get('/prescriptions', authenticate, authorize('patient'), async (req, res) => {
  try {
    const prescriptions = await prescription.find({ patient: req.user._id })
      .populate('doctor', 'name email specialization')
      .populate('appointment', 'appointmentDate appointmentTime')
      .sort({ createdAt: -1 });
    
    res.json({ prescriptions });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get patient profile
patientRouter.get('/profile', authenticate, authorize('patient'), async (req, res) => {
  try {
    const patientProfile = await patient.findById(req.user._id).select('-password');
    res.json({ patient: patientProfile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update patient profile
patientRouter.patch('/profile', authenticate, authorize('patient'), async (req, res) => {
  try {
    const updateData = req.body;
    delete updateData.password; // Don't allow password updates from here
    
    const updatedPatient = await patient.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');
    
    res.json({
      message: 'Profile updated successfully',
      patient: updatedPatient
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default patientRouter;
