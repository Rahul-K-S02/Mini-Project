import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'appointment',
    required: true,
  },
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
  diagnosis: {
    type: String,
    required: true,
  },
  symptoms: [String],
  medications: [{
    name: {
      type: String,
      required: true,
    },
    dosage: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    instructions: String,
  }],
  instructions: {
    type: String,
  },
  followUpDate: {
    type: Date,
  },
  followUpRequired: {
    type: Boolean,
    default: false,
  },
  labTests: [{
    testName: String,
    instructions: String,
    urgency: {
      type: String,
      enum: ["routine", "urgent", "emergency"],
      default: "routine",
    },
  }],
  status: {
    type: String,
    enum: ["active", "completed", "cancelled"],
    default: "active",
  },
  isDigital: {
    type: Boolean,
    default: true,
  },
  digitalSignature: {
    type: String, // Base64 encoded signature
  },
}, {
  timestamps: true,
});

export const prescription = mongoose.model("prescription", prescriptionSchema);

