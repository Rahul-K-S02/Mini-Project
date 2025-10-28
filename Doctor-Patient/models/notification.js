import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientType',
  },
  recipientType: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['appointment', 'prescription', 'payment', 'system', 'reminder', 'emergency'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  actionUrl: {
    type: String, // URL to redirect when notification is clicked
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // Additional data for specific notification types
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    },
  },
}, {
  timestamps: true,
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, recipientType: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export const notification = mongoose.model("notification", notificationSchema);

