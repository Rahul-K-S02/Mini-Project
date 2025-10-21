import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    age: {
        type:Number
    },
    gender: {
        type: String
    },
    phone: {
        type:String,
        required:true,
    },
    address: {
        type: String,
        required: true
    }
})

export default patient = mongoose.model('patient',patientSchema);