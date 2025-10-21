import mangoose from 'mongoose';

const doctorSchema = new mangoose.Schema({
  FullName: {
    type: String,
    required: true,
  },
  
  Email: {
    type: String,
    required: true,
    unique: true,
  },

  Phone: {
    type: String,
    required: true,
    unique: true,
  },

        Gender: {
    type: String,
    required: true,
  },
  
    Password: {
    type: String,
    required: true,
  },

    ConfirmPassword: {
    type: String,
    required: true,
  },

    Specialization: {
    type: String,
    required: true,
  },

    Experience: {
    type: Number,
    required: true,
  },

   Qualification: {
    type: String,
    required: true,
  },

  MedicalLicNo: {
    type: String,
    required: true,
  },

  HospitalName: {
    type: String,
    required: true,
  },

  HospitalAddress: {
    type: String,
    required: true,
  },

  HosptialPhone: {
    type: String,
    required: true,
  },

  Hospitalemail: {
    type: String,
    required: true,
  },

  DoctorImage: {
    type: String,
    required: true,
  },        

  HospitalImage: {
    type: String,
    required: true,
  },

  pending : {
    type : Boolean,
    default : false
  },

  perscription : {
    type : String,
    required : false
  },

  appointments : {
    type : Array,
    required : false
  },

  appointmenttoken : {
    type : Number,
    required : false
  },

  appointmenttime : {
    type : String,
    required : false
  },

});

const Doctor = mangoose.model('Doctor', doctorSchema);

export default Doctor;