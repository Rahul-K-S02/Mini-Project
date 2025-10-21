import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    gender: {
        type: String
    },
    age: {
        type:Number
    },
    status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
    
})

export const doctor = mongoose.model('doctor',doctorSchema);