import { Router } from "express";
import { body, validationResult } from "express-validator";
import { prescription } from "../models/prescription.js";
import { appointment } from "../models/appointment.js";
import { doctor } from "../models/doctor.js";
import { patient } from "../models/patient.js";
import { notification } from "../models/notification.js";
import { authenticate, authorize } from "../middleware/auth.js";

const prescriptionRouter = Router();

// Get prescriptions for a user
prescriptionRouter.get("/", authenticate, async (req, res) => {
  try {
    const { userType, user } = req;
    let prescriptions;

    if (userType === 'patient') {
      prescriptions = await prescription.find({ patient: user._id })
        .populate('doctor', 'name email specialization')
        .populate('appointment', 'appointmentDate appointmentTime')
        .sort({ createdAt: -1 });
    } else if (userType === 'doctor') {
      prescriptions = await prescription.find({ doctor: user._id })
        .populate('patient', 'name email phone age gender')
        .populate('appointment', 'appointmentDate appointmentTime')
        .sort({ createdAt: -1 });
    } else if (userType === 'admin') {
      prescriptions = await prescription.find()
        .populate('patient', 'name email phone')
        .populate('doctor', 'name email specialization')
        .populate('appointment', 'appointmentDate appointmentTime')
        .sort({ createdAt: -1 });
    }

    res.json({ prescriptions });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new prescription
prescriptionRouter.post("/", [
  authenticate,
  authorize('doctor'),
  body('appointmentId').isMongoId().withMessage('Valid appointment ID required'),
  body('diagnosis').notEmpty().withMessage('Diagnosis required'),
  body('medications').isArray().withMessage('Medications must be an array'),
  body('medications.*.name').notEmpty().withMessage('Medication name required'),
  body('medications.*.dosage').notEmpty().withMessage('Medication dosage required'),
  body('medications.*.frequency').notEmpty().withMessage('Medication frequency required'),
  body('medications.*.duration').notEmpty().withMessage('Medication duration required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      appointmentId, 
      diagnosis, 
      symptoms, 
      medications, 
      instructions, 
      followUpDate, 
      followUpRequired,
      labTests 
    } = req.body;

    // Check if appointment exists and belongs to the doctor
    const appointmentDoc = await appointment.findById(appointmentId);
    if (!appointmentDoc) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointmentDoc.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to create prescription for this appointment' });
    }

    // Check if appointment is completed or in-progress
    if (!['in-progress', 'completed'].includes(appointmentDoc.status)) {
      return res.status(400).json({ error: 'Can only create prescription for completed or in-progress appointments' });
    }

    // Create prescription
    const newPrescription = new prescription({
      appointment: appointmentId,
      patient: appointmentDoc.patient,
      doctor: req.user._id,
      diagnosis,
      symptoms: symptoms || [],
      medications,
      instructions,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      followUpRequired: followUpRequired || false,
      labTests: labTests || [],
    });

    await newPrescription.save();

    // Update appointment with prescription reference
    appointmentDoc.prescription = newPrescription._id;
    if (appointmentDoc.status === 'in-progress') {
      appointmentDoc.status = 'completed';
    }
    await appointmentDoc.save();

    // Create notification for patient
    await notification.create({
      recipient: appointmentDoc.patient,
      recipientType: 'patient',
      title: 'New Prescription Available',
      message: `Your prescription is ready from Dr. ${req.user.name}`,
      type: 'prescription',
      priority: 'high',
      actionUrl: `/patient/prescriptions/${newPrescription._id}`,
      metadata: {
        prescriptionId: newPrescription._id,
        doctorName: req.user.name,
        diagnosis: diagnosis,
      }
    });

    // Populate the prescription data
    await newPrescription.populate('patient', 'name email phone');
    await newPrescription.populate('doctor', 'name email specialization');
    await newPrescription.populate('appointment', 'appointmentDate appointmentTime');

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription: newPrescription
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get prescription by ID
prescriptionRouter.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const prescriptionDoc = await prescription.findById(id)
      .populate('patient', 'name email phone age gender')
      .populate('doctor', 'name email specialization phone')
      .populate('appointment', 'appointmentDate appointmentTime symptoms');

    if (!prescriptionDoc) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Check authorization
    if (req.userType === 'patient' && prescriptionDoc.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this prescription' });
    }

    if (req.userType === 'doctor' && prescriptionDoc.doctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this prescription' });
    }

    res.json({ prescription: prescriptionDoc });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update prescription
prescriptionRouter.patch("/:id", [
  authenticate,
  authorize('doctor'),
  body('diagnosis').optional().notEmpty().withMessage('Diagnosis cannot be empty'),
  body('medications').optional().isArray().withMessage('Medications must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    const prescriptionDoc = await prescription.findById(id);
    if (!prescriptionDoc) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Check authorization
    if (prescriptionDoc.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this prescription' });
    }

    // Check if prescription can be updated
    if (prescriptionDoc.status === 'completed') {
      return res.status(400).json({ error: 'Cannot update completed prescription' });
    }

    // Update prescription
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        prescriptionDoc[key] = updateData[key];
      }
    });

    await prescriptionDoc.save();

    // Create notification for patient
    await notification.create({
      recipient: prescriptionDoc.patient,
      recipientType: 'patient',
      title: 'Prescription Updated',
      message: `Your prescription has been updated by Dr. ${req.user.name}`,
      type: 'prescription',
      priority: 'medium',
      actionUrl: `/patient/prescriptions/${prescriptionDoc._id}`,
      metadata: {
        prescriptionId: prescriptionDoc._id,
        doctorName: req.user.name,
      }
    });

    res.json({
      message: 'Prescription updated successfully',
      prescription: prescriptionDoc
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete prescription
prescriptionRouter.patch("/:id/complete", [
  authenticate,
  authorize('doctor'),
], async (req, res) => {
  try {
    const { id } = req.params;

    const prescriptionDoc = await prescription.findById(id);
    if (!prescriptionDoc) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Check authorization
    if (prescriptionDoc.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to complete this prescription' });
    }

    // Update prescription status
    prescriptionDoc.status = 'completed';
    await prescriptionDoc.save();

    res.json({
      message: 'Prescription completed successfully',
      prescription: prescriptionDoc
    });
  } catch (error) {
    console.error('Complete prescription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get prescription history for a patient
prescriptionRouter.get("/patient/:patientId/history", [
  authenticate,
  authorize('doctor', 'admin'),
], async (req, res) => {
  try {
    const { patientId } = req.params;

    const prescriptions = await prescription.find({ patient: patientId })
      .populate('doctor', 'name email specialization')
      .populate('appointment', 'appointmentDate appointmentTime')
      .sort({ createdAt: -1 });

    res.json({ prescriptions });
  } catch (error) {
    console.error('Get prescription history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default prescriptionRouter;
