import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'patient',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'doctor',
    required: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  appointmentTime: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    default: 30, // in minutes
  },
  status: {
    type: String,
    enum: ["scheduled", "confirmed", "in-progress", "completed", "cancelled", "no-show"],
    default: "scheduled",
  },
  type: {
    type: String,
    enum: ["consultation", "follow-up", "emergency", "routine-checkup"],
    default: "consultation",
  },
  symptoms: [String],
  diagnosis: {
    type: String,
  },
  notes: {
    type: String,
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'prescription',
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "refunded"],
    default: "pending",
  },
  amount: {
    type: Number,
    required: true,
  },
  meetingLink: {
    type: String, // For video consultations
  },
  isVideoCall: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  review: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });

export const appointment = mongoose.model("appointment", appointmentSchema);
