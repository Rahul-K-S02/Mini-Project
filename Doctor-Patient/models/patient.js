import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function() {
      return this.verified === 'normal';
    },
    minlength: 6,
  },
  age: {
    type: Number,
    required: true,
    min: 0,
    max: 120,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: "India" },
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String,
  },
  medicalHistory: {
    allergies: [String],
    chronicConditions: [String],
    medications: [String],
    surgeries: [String],
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    },
  },
  verified: {
    type: String,
    enum: ["google", "normal"],
    default: "normal"
  },
  googleId: {
    type: String,
    sparse: true,
  },
  profilePicture: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Hash password before saving
patientSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
patientSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export const patient = mongoose.model("patient", patientSchema);
