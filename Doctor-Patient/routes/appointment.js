import { Router } from "express";
import { body, validationResult } from "express-validator";
import { appointment } from "../models/appointment.js";
import { doctor } from "../models/doctor.js";
import { patient } from "../models/patient.js";
import { notification } from "../models/notification.js";
import { authenticate, authorize } from "../middleware/auth.js";
import moment from "moment";

const appointmentRouter = Router();

// Get appointments for a user
appointmentRouter.get("/", authenticate, async (req, res) => {
  try {
    const { userType, user } = req;
    let appointments;

    if (userType === 'patient') {
      appointments = await appointment.find({ patient: user._id })
        .populate('doctor', 'name email specialization phone')
        .populate('prescription')
        .sort({ appointmentDate: -1 });
    } else if (userType === 'doctor') {
      appointments = await appointment.find({ doctor: user._id })
        .populate('patient', 'name email phone age gender')
        .populate('prescription')
        .sort({ appointmentDate: -1 });
    } else if (userType === 'admin') {
      appointments = await appointment.find()
        .populate('patient', 'name email phone')
        .populate('doctor', 'name email specialization')
        .populate('prescription')
        .sort({ appointmentDate: -1 });
    }

    res.json({ appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new appointment
appointmentRouter.post("/", [
  authenticate,
  body('doctorId').isMongoId().withMessage('Valid doctor ID required'),
  body('appointmentDate').isISO8601().withMessage('Valid date required'),
  body('appointmentTime').notEmpty().withMessage('Appointment time required'),
  body('symptoms').isArray().withMessage('Symptoms must be an array'),
  body('type').isIn(['consultation', 'follow-up', 'emergency', 'routine-checkup']).withMessage('Valid appointment type required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { doctorId, appointmentDate, appointmentTime, symptoms, type, notes } = req.body;

    // Check if doctor exists and is approved
    const doctorUser = await doctor.findById(doctorId);
    if (!doctorUser || doctorUser.status !== 'approved') {
      return res.status(400).json({ error: 'Doctor not found or not approved' });
    }

    // Check if appointment time is in the future
    const appointmentDateTime = moment(`${appointmentDate} ${appointmentTime}`);
    if (appointmentDateTime.isBefore(moment())) {
      return res.status(400).json({ error: 'Appointment time must be in the future' });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await appointment.findOne({
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({ error: 'Time slot already booked' });
    }

    // Create appointment
    const newAppointment = new appointment({
      patient: req.user._id,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      symptoms,
      type,
      notes,
      amount: doctorUser.consultationFee,
    });

    await newAppointment.save();

    // Create notification for doctor
    await notification.create({
      recipient: doctorId,
      recipientType: 'doctor',
      title: 'New Appointment Request',
      message: `New appointment request from ${req.user.name} for ${appointmentDateTime.format('MMM DD, YYYY')} at ${appointmentTime}`,
      type: 'appointment',
      priority: 'medium',
      actionUrl: `/doctor/appointments/${newAppointment._id}`,
      metadata: {
        appointmentId: newAppointment._id,
        patientName: req.user.name,
        appointmentDate: appointmentDateTime.toISOString(),
      }
    });

    // Populate the appointment data
    await newAppointment.populate('doctor', 'name email specialization phone');
    await newAppointment.populate('patient', 'name email phone');

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: newAppointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update appointment status
appointmentRouter.patch("/:id/status", [
  authenticate,
  authorize('doctor', 'admin'),
  body('status').isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).withMessage('Valid status required'),
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
    if (req.userType === 'doctor' && appointmentDoc.doctor.toString() !== req.user._id.toString()) {
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

// Cancel appointment
appointmentRouter.patch("/:id/cancel", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointmentDoc = await appointment.findById(id);
    if (!appointmentDoc) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check authorization
    if (req.userType === 'patient' && appointmentDoc.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }

    if (req.userType === 'doctor' && appointmentDoc.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }

    // Check if appointment can be cancelled
    if (['completed', 'cancelled'].includes(appointmentDoc.status)) {
      return res.status(400).json({ error: 'Appointment cannot be cancelled' });
    }

    // Update appointment
    appointmentDoc.status = 'cancelled';
    if (reason) appointmentDoc.notes = (appointmentDoc.notes || '') + `\nCancellation reason: ${reason}`;

    await appointmentDoc.save();

    // Create notification
    const recipient = req.userType === 'patient' ? appointmentDoc.doctor : appointmentDoc.patient;
    const recipientType = req.userType === 'patient' ? 'doctor' : 'patient';
    const userName = req.userType === 'patient' ? req.user.name : req.user.name;

    await notification.create({
      recipient,
      recipientType,
      title: 'Appointment Cancelled',
      message: `Appointment has been cancelled by ${userName}`,
      type: 'appointment',
      priority: 'medium',
      actionUrl: `/${recipientType}/appointments/${appointmentDoc._id}`,
      metadata: {
        appointmentId: appointmentDoc._id,
        cancelledBy: req.userType,
        reason: reason,
      }
    });

    res.json({
      message: 'Appointment cancelled successfully',
      appointment: appointmentDoc
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get appointment by ID
appointmentRouter.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const appointmentDoc = await appointment.findById(id)
      .populate('patient', 'name email phone age gender')
      .populate('doctor', 'name email specialization phone')
      .populate('prescription');

    if (!appointmentDoc) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check authorization
    if (req.userType === 'patient' && appointmentDoc.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this appointment' });
    }

    if (req.userType === 'doctor' && appointmentDoc.doctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this appointment' });
    }

    res.json({ appointment: appointmentDoc });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Rate appointment
appointmentRouter.post("/:id/rate", [
  authenticate,
  authorize('patient'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isString().withMessage('Review must be a string'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { rating, review } = req.body;

    const appointmentDoc = await appointment.findById(id);
    if (!appointmentDoc) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check authorization
    if (appointmentDoc.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to rate this appointment' });
    }

    // Check if appointment is completed
    if (appointmentDoc.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed appointments' });
    }

    // Update appointment
    appointmentDoc.rating = rating;
    if (review) appointmentDoc.review = review;

    await appointmentDoc.save();

    // Update doctor's overall rating
    const doctorDoc = await doctor.findById(appointmentDoc.doctor);
    if (doctorDoc) {
      const allAppointments = await appointment.find({
        doctor: appointmentDoc.doctor,
        rating: { $exists: true }
      });

      const totalRating = allAppointments.reduce((sum, apt) => sum + apt.rating, 0);
      doctorDoc.rating = totalRating / allAppointments.length;
      doctorDoc.totalReviews = allAppointments.length;
      await doctorDoc.save();
    }

    res.json({
      message: 'Appointment rated successfully',
      appointment: appointmentDoc
    });
  } catch (error) {
    console.error('Rate appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default appointmentRouter;


