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

  DOB : {
    type: Date,
    required: true,
  },


  Age : {
    type: Number,
    required: true,
  },

  bloodgroup: {
    type : String,
    required : true
  },

  Password: {
    type: String,
    required: true,
  },

  cpd : {
    type: String,
    required: true
  },

  emgconactname : {
    type: String,
    required: true
  },

  emgcontactnumber : {
    type: String,
    required: true
  },
})

const Patient = mangoose.model('patient', patientSchema);

export default Patient;