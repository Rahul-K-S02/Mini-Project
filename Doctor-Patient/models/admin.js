import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        reqired: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }

})

export default admin = mongoose.model('admin',adminSchema);