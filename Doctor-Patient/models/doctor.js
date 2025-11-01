import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  gender: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  idproof: {
    type: String,
  },
  doctorid: {
    type: String,
    default: null,
  },
  specialization: {
    type: String,
  },
  location:{
    type:String,
  }
});

export const doctor = mongoose.model("doctor", doctorSchema);
