import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  verified: {
    type: String,
    enum:["google","normal"],
    default:"normal"
  }
});

export const patient = mongoose.model("patient", patientSchema);
