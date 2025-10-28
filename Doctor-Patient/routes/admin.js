import { Router } from "express";
import { doctor } from "../models/doctor.js";
import { patient } from "../models/patient.js";
import { appointment } from "../models/appointment.js";
import { prescription } from "../models/prescription.js";
import { notification } from "../models/notification.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// Admin Dashboard
router.get("/", authenticate, authorize('admin'), async (req, res) => {
  try {
    // Get statistics
    const totalDoctors = await doctor.countDocuments();
    const approvedDoctors = await doctor.countDocuments({ status: "approved" });
    const pendingDoctors = await doctor.countDocuments({ status: "pending" });
    const rejectedDoctors = await doctor.countDocuments({ status: "rejected" });
    
    const totalPatients = await patient.countDocuments();
    const totalAppointments = await appointment.countDocuments();
    const todayAppointments = await appointment.countDocuments({
      appointmentDate: {
        $gte: new Date(new Date().setHours(0,0,0,0)),
        $lt: new Date(new Date().setHours(23,59,59,999))
      }
    });
    
    const totalPrescriptions = await prescription.countDocuments();
    
    // Get recent doctors for approval
    const recentDoctors = await doctor.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email specialization experience qualification status createdAt');

    // Get recent appointments
    const recentAppointments = await appointment.find()
      .populate('patient', 'name email')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get revenue data (last 7 days)
    const revenueData = [];
    const appointmentData = [];
    const labels = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0,0,0,0));
      const endOfDay = new Date(date.setHours(23,59,59,999));
      
      const dayAppointments = await appointment.countDocuments({
        appointmentDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['completed', 'confirmed'] }
      });
      
      const dayRevenue = await appointment.aggregate([
        {
          $match: {
            appointmentDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['completed', 'confirmed'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      appointmentData.push(dayAppointments);
      revenueData.push(dayRevenue.length > 0 ? dayRevenue[0].total : 0);
    }

    // Get specialization distribution
    const specializationData = await doctor.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$specialization', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

  res.render("admin", {
      stats: {
        totalDoctors,
        approvedDoctors,
    pendingDoctors,
        rejectedDoctors,
        totalPatients,
        totalAppointments,
        todayAppointments,
        totalPrescriptions
      },
      recentDoctors,
      recentAppointments,
      chartData: {
        labels,
        revenueData,
        appointmentData,
        specializationData
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load admin dashboard' });
  }
});

// Approve Doctor
router.post('/approve-doctor/:doctorId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const doctorDoc = await doctor.findByIdAndUpdate(
      doctorId,
      { status: 'approved' },
      { new: true }
    );

    if (!doctorDoc) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Create notification for doctor
    await notification.create({
      recipient: doctorId,
      recipientType: 'doctor',
      title: 'Account Approved',
      message: 'Congratulations! Your doctor account has been approved.',
      type: 'system',
      priority: 'high',
      actionUrl: '/doctor/dashboard'
    });

    res.json({ 
      message: 'Doctor approved successfully',
      doctor: doctorDoc 
    });
  } catch (error) {
    console.error('Approve doctor error:', error);
    res.status(500).json({ error: 'Failed to approve doctor' });
  }
});

// Reject Doctor
router.post('/reject-doctor/:doctorId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { reason } = req.body;
    
    const doctorDoc = await doctor.findByIdAndUpdate(
      doctorId,
      { status: 'rejected' },
      { new: true }
    );

    if (!doctorDoc) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Create notification for doctor
    await notification.create({
      recipient: doctorId,
      recipientType: 'doctor',
      title: 'Account Rejected',
      message: reason ? `Your account was rejected. Reason: ${reason}` : 'Your doctor account has been rejected.',
      type: 'system',
      priority: 'high',
      actionUrl: '/contact-support'
    });

    res.json({ 
      message: 'Doctor rejected successfully',
      doctor: doctorDoc 
    });
  } catch (error) {
    console.error('Reject doctor error:', error);
    res.status(500).json({ error: 'Failed to reject doctor' });
  }
});

// Suspend Doctor
router.post('/suspend-doctor/:doctorId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { reason } = req.body;
    
    const doctorDoc = await doctor.findByIdAndUpdate(
      doctorId,
      { status: 'suspended' },
      { new: true }
    );

    if (!doctorDoc) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Create notification for doctor
    await notification.create({
      recipient: doctorId,
      recipientType: 'doctor',
      title: 'Account Suspended',
      message: reason ? `Your account has been suspended. Reason: ${reason}` : 'Your doctor account has been suspended.',
      type: 'system',
      priority: 'urgent',
      actionUrl: '/contact-support'
    });

    res.json({ 
      message: 'Doctor suspended successfully',
      doctor: doctorDoc 
    });
  } catch (error) {
    console.error('Suspend doctor error:', error);
    res.status(500).json({ error: 'Failed to suspend doctor' });
  }
});

// Get All Doctors
router.get('/doctors', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, specialization, search } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (specialization) query.specialization = specialization;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const doctors = await doctor.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await doctor.countDocuments(query);

    res.json({
      doctors,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Get Doctor Details
router.get('/doctor/:doctorId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const doctorDoc = await doctor.findById(doctorId).select('-password');
    if (!doctorDoc) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Get doctor's appointments
    const appointments = await appointment.find({ doctor: doctorId })
      .populate('patient', 'name email phone')
      .sort({ appointmentDate: -1 })
      .limit(10);

    // Get doctor's prescriptions
    const prescriptions = await prescription.find({ doctor: doctorId })
      .populate('patient', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      doctor: doctorDoc,
      appointments,
      prescriptions
    });
  } catch (error) {
    console.error('Get doctor details error:', error);
    res.status(500).json({ error: 'Failed to fetch doctor details' });
  }
});

// Get System Analytics
router.get('/analytics', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // User growth
    const userGrowth = await Promise.all([
      patient.countDocuments({ createdAt: { $gte: startDate } }),
      doctor.countDocuments({ createdAt: { $gte: startDate } })
    ]);

    // Appointment analytics
    const appointmentStats = await appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Revenue analytics
    const revenueStats = await appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'confirmed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          averageRevenue: { $avg: '$amount' },
          totalAppointments: { $sum: 1 }
        }
      }
    ]);

    res.json({
      userGrowth: {
        patients: userGrowth[0],
        doctors: userGrowth[1]
      },
      appointmentStats,
      revenueStats: revenueStats[0] || { totalRevenue: 0, averageRevenue: 0, totalAppointments: 0 }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export const adminRouter = router;
