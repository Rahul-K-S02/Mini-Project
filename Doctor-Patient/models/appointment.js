import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    doctorid: String,
    urgencyLevel: String,
    notes: String
})

export const appointment = appointmentSchema;