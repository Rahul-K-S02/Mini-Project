import { Router } from "express";
import { body, validationResult } from "express-validator";
import { doctor } from "../models/doctor.js";
import { appointment } from "../models/appointment.js";
import { prescription } from "../models/prescription.js";
import { notification } from "../models/notification.js";
import { authenticate, authorize } from "../middleware/auth.js";
import multer from "multer";

const doctorRouter = Router();

// Doctor Registration Success Page
doctorRouter.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration Successful - MediCare Hub</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50 min-h-screen flex items-center justify-center">
      <div class="bg-white rounded-xl shadow-2xl p-8 max-w-2xl">
        <div class="text-center">
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-check text-green-600 text-3xl"></i>
          </div>
          <h1 class="text-3xl font-bold text-gray-800 mb-4">Registration Successful!</h1>
          <p class="text-gray-600 mb-6">Your information has been submitted successfully. An admin will verify your details and approve your account.</p>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p class="text-blue-800"><strong>What's next?</strong></p>
            <ul class="text-left text-blue-700 space-y-2 mt-2">
              <li><i class="fas fa-check-circle mr-2"></i> You'll receive an email notification once approved</li>
              <li><i class="fas fa-check-circle mr-2"></i> Check your email for approval status</li>
              <li><i class="fas fa-check-circle mr-2"></i> You can login once your account is approved</li>
            </ul>
          </div>
          <a href="/" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg">
            Return to Home Page
          </a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Get doctor dashboard
doctorRouter.get('/dashboard', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const doctorUser = req.user;

    // Get upcoming appointments
    const upcomingAppointments = await appointment.find({
      doctor: req.user._id,
      status: { $in: ['scheduled', 'confirmed'] },
      appointmentDate: { $gte: new Date() }
    })
      .populate('patient', 'name email phone age gender')
      .sort({ appointmentDate: 1 })
      .limit(10);

    // Get today's appointments
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayAppointments = await appointment.find({
      doctor: req.user._id,
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
    })
      .populate('patient', 'name email phone age gender')
      .sort({ appointmentTime: 1 });

    // Get recent prescriptions
    const recentPrescriptions = await prescription.find({ doctor: req.user._id })
      .populate('patient', 'name email phone')
      .populate('appointment', 'appointmentDate appointmentTime')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get statistics
    const totalAppointments = await appointment.countDocuments({ doctor: req.user._id });
    const totalPrescriptions = await prescription.countDocuments({ doctor: req.user._id });
    const completedAppointments = await appointment.countDocuments({
      doctor: req.user._id,
      status: 'completed'
    });

    res.json({
      doctor: doctorUser,
      upcomingAppointments,
      todayAppointments,
      recentPrescriptions,
      stats: {
        totalAppointments,
        totalPrescriptions,
        completedAppointments
      }
    });
  } catch (error) {
    console.error('Doctor dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get doctor's appointments
doctorRouter.get('/appointments', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { status } = req.query;

    const query = { doctor: req.user._id };
    if (status) {
      query.status = status;
    }

    const appointments = await appointment.find(query)
      .populate('patient', 'name email phone age gender')
      .populate('prescription')
      .sort({ appointmentDate: -1 });

    res.json({ appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get doctor's prescriptions
doctorRouter.get('/prescriptions', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const prescriptions = await prescription.find({ doctor: req.user._id })
      .populate('patient', 'name email phone age gender')
      .populate('appointment', 'appointmentDate appointmentTime symptoms')
      .sort({ createdAt: -1 });

    res.json({ prescriptions });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update appointment status
doctorRouter.patch('/appointments/:id/status', [
  authenticate,
  authorize('doctor'),
  body('status').isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
    .withMessage('Valid status required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    const appointmentDoc = await appointment.findById(id);
    if (!appointmentDoc) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check authorization
    if (appointmentDoc.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }

    // Update appointment
    appointmentDoc.status = status;
    if (notes) appointmentDoc.notes = notes;

    await appointmentDoc.save();

    // Create notification for patient
    await notification.create({
      recipient: appointmentDoc.patient,
      recipientType: 'patient',
      title: 'Appointment Status Updated',
      message: `Your appointment status has been updated to ${status}`,
      type: 'appointment',
      priority: 'medium',
      actionUrl: `/patient/appointments/${appointmentDoc._id}`,
      metadata: {
        appointmentId: appointmentDoc._id,
        status: status,
      }
    });

    res.json({
      message: 'Appointment status updated successfully',
      appointment: appointmentDoc
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get doctor profile
doctorRouter.get('/profile', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const doctorProfile = await doctor.findById(req.user._id).select('-password');
    res.json({ doctor: doctorProfile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update doctor profile
doctorRouter.patch('/profile', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const updateData = req.body;
    delete updateData.password; // Don't allow password updates from here
    delete updateData.status; // Don't allow status changes
    delete updateData.doctorid; // Don't allow doctor ID changes

    const updatedDoctor = await doctor.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update availability
doctorRouter.patch('/availability', [
  authenticate,
  authorize('doctor'),
  body('availability').isObject().withMessage('Availability must be an object'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { availability } = req.body;

    const updatedDoctor = await doctor.findByIdAndUpdate(
      req.user._id,
      { availability },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Availability updated successfully',
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle online status
doctorRouter.post('/toggle-online', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const doctorDoc = await doctor.findById(req.user._id);
    doctorDoc.isOnline = !doctorDoc.isOnline;
    doctorDoc.lastActive = new Date();
    await doctorDoc.save();

    res.json({
      message: 'Online status updated',
      isOnline: doctorDoc.isOnline
    });
  } catch (error) {
    console.error('Toggle online status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default doctorRouter;
