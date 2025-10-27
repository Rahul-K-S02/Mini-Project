import jwt from 'jsonwebtoken';
import { doctor } from '../models/doctor.js';
import { patient } from '../models/patient.js';
import { appointment } from '../models/appointment.js';
import { notification } from '../models/notification.js';

export const setupSocketHandlers = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      let user;

      switch (decoded.userType) {
        case 'doctor':
          user = await doctor.findById(decoded.userId).select('-password');
          break;
        case 'patient':
          user = await patient.findById(decoded.userId).select('-password');
          break;
        case 'admin':
          user = { _id: 'admin', name: 'Admin', userType: 'admin' };
          break;
        default:
          return next(new Error('Authentication error: Invalid user type'));
      }

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      socket.userType = decoded.userType;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.userType})`);
    
    // Join user to their personal room
    socket.join(`user_${socket.user._id}`);
    
    // Update doctor's online status
    if (socket.userType === 'doctor') {
      await doctor.findByIdAndUpdate(socket.user._id, {
        isOnline: true,
        lastActive: new Date()
      });
      
      // Notify patients about doctor's online status
      socket.broadcast.emit('doctor_online', {
        doctorId: socket.user._id,
        doctorName: socket.user.name,
        specialization: socket.user.specialization
      });
    }

    // Handle joining appointment room
    socket.on('join_appointment', async (appointmentId) => {
      try {
        const appointmentDoc = await appointment.findById(appointmentId)
          .populate('patient', 'name')
          .populate('doctor', 'name');

        if (!appointmentDoc) {
          socket.emit('error', { message: 'Appointment not found' });
          return;
        }

        // Check if user is authorized to join this appointment
        const isAuthorized = 
          socket.userType === 'admin' ||
          appointmentDoc.patient._id.toString() === socket.user._id.toString() ||
          appointmentDoc.doctor._id.toString() === socket.user._id.toString();

        if (!isAuthorized) {
          socket.emit('error', { message: 'Not authorized to join this appointment' });
          return;
        }

        socket.join(`appointment_${appointmentId}`);
        socket.emit('joined_appointment', {
          appointmentId,
          appointment: appointmentDoc
        });

        // Notify other participants
        socket.to(`appointment_${appointmentId}`).emit('user_joined', {
          userId: socket.user._id,
          userName: socket.user.name,
          userType: socket.userType
        });
      } catch (error) {
        socket.emit('error', { message: 'Error joining appointment' });
      }
    });

    // Handle leaving appointment room
    socket.on('leave_appointment', (appointmentId) => {
      socket.leave(`appointment_${appointmentId}`);
      socket.to(`appointment_${appointmentId}`).emit('user_left', {
        userId: socket.user._id,
        userName: socket.user.name,
        userType: socket.userType
      });
    });

    // Handle chat messages
    socket.on('send_message', async (data) => {
      try {
        const { appointmentId, message, messageType = 'text' } = data;

        // Verify user is in the appointment room
        if (!socket.rooms.has(`appointment_${appointmentId}`)) {
          socket.emit('error', { message: 'Not in appointment room' });
          return;
        }

        const messageData = {
          appointmentId,
          senderId: socket.user._id,
          senderName: socket.user.name,
          senderType: socket.userType,
          message,
          messageType,
          timestamp: new Date()
        };

        // Broadcast message to all users in the appointment room
        io.to(`appointment_${appointmentId}`).emit('new_message', messageData);

        // Create notification for offline users
        const appointmentDoc = await appointment.findById(appointmentId)
          .populate('patient', 'name')
          .populate('doctor', 'name');

        if (appointmentDoc) {
          const recipientId = socket.userType === 'patient' 
            ? appointmentDoc.doctor._id 
            : appointmentDoc.patient._id;
          const recipientType = socket.userType === 'patient' ? 'doctor' : 'patient';

          await notification.create({
            recipient: recipientId,
            recipientType: recipientType,
            title: 'New Message',
            message: `New message from ${socket.user.name}`,
            type: 'appointment',
            priority: 'medium',
            actionUrl: `/${recipientType}/appointments/${appointmentId}`,
            metadata: {
              appointmentId,
              senderName: socket.user.name,
              message: message.substring(0, 100)
            }
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Handle video call requests
    socket.on('request_video_call', async (data) => {
      try {
        const { appointmentId, callType = 'video' } = data;

        const appointmentDoc = await appointment.findById(appointmentId);
        if (!appointmentDoc) {
          socket.emit('error', { message: 'Appointment not found' });
          return;
        }

        // Check authorization
        const isAuthorized = 
          socket.userType === 'admin' ||
          appointmentDoc.patient._id.toString() === socket.user._id.toString() ||
          appointmentDoc.doctor._id.toString() === socket.user._id.toString();

        if (!isAuthorized) {
          socket.emit('error', { message: 'Not authorized for this appointment' });
          return;
        }

        const callData = {
          appointmentId,
          callerId: socket.user._id,
          callerName: socket.user.name,
          callerType: socket.userType,
          callType,
          timestamp: new Date()
        };

        // Send call request to other participants
        socket.to(`appointment_${appointmentId}`).emit('incoming_call', callData);
        
        // Send confirmation to caller
        socket.emit('call_request_sent', callData);
      } catch (error) {
        socket.emit('error', { message: 'Error requesting video call' });
      }
    });

    // Handle call responses
    socket.on('call_response', (data) => {
      const { appointmentId, response, callId } = data;
      
      socket.to(`appointment_${appointmentId}`).emit('call_response', {
        response,
        callId,
        responderId: socket.user._id,
        responderName: socket.user.name
      });
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { appointmentId } = data;
      socket.to(`appointment_${appointmentId}`).emit('user_typing', {
        userId: socket.user._id,
        userName: socket.user.name,
        userType: socket.userType
      });
    });

    socket.on('typing_stop', (data) => {
      const { appointmentId } = data;
      socket.to(`appointment_${appointmentId}`).emit('user_stopped_typing', {
        userId: socket.user._id,
        userName: socket.user.name,
        userType: socket.userType
      });
    });

    // Handle appointment status updates
    socket.on('appointment_status_update', async (data) => {
      try {
        const { appointmentId, status, notes } = data;

        const appointmentDoc = await appointment.findById(appointmentId);
        if (!appointmentDoc) {
          socket.emit('error', { message: 'Appointment not found' });
          return;
        }

        // Check authorization (only doctor or admin can update status)
        if (socket.userType !== 'doctor' && socket.userType !== 'admin') {
          socket.emit('error', { message: 'Not authorized to update appointment status' });
          return;
        }

        if (socket.userType === 'doctor' && appointmentDoc.doctor.toString() !== socket.user._id.toString()) {
          socket.emit('error', { message: 'Not authorized to update this appointment' });
          return;
        }

        // Update appointment
        appointmentDoc.status = status;
        if (notes) appointmentDoc.notes = notes;
        await appointmentDoc.save();

        // Broadcast status update to all participants
        io.to(`appointment_${appointmentId}`).emit('appointment_status_changed', {
          appointmentId,
          status,
          updatedBy: socket.user.name,
          updatedAt: new Date()
        });

        // Create notification for patient
        await notification.create({
          recipient: appointmentDoc.patient,
          recipientType: 'patient',
          title: 'Appointment Status Updated',
          message: `Your appointment status has been updated to ${status}`,
          type: 'appointment',
          priority: 'medium',
          actionUrl: `/patient/appointments/${appointmentId}`,
          metadata: {
            appointmentId,
            status,
            updatedBy: socket.user.name
          }
        });
      } catch (error) {
        socket.emit('error', { message: 'Error updating appointment status' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.userType})`);
      
      // Update doctor's offline status
      if (socket.userType === 'doctor') {
        await doctor.findByIdAndUpdate(socket.user._id, {
          isOnline: false,
          lastActive: new Date()
        });
        
        // Notify patients about doctor's offline status
        socket.broadcast.emit('doctor_offline', {
          doctorId: socket.user._id,
          doctorName: socket.user.name
        });
      }
    });
  });

  // Handle errors
  io.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });
};
