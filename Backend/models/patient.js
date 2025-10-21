import mangoose from 'mongoose';

const patientSchema = new mangoose.Schema({
  name: {
    type: String,
    required: true,
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
  },

  phone: {
    type: String,
    required: true,
    unique: true,
  },

  gender:{
    type: String,
    required: true,
  },
})

const Patient = mangoose.model('patient', patientSchema);

export default Patient;