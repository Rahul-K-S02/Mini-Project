import { Router } from "express";
import { doctor } from "../models/doctor.js";
import passport from "../services/googleAuth.js";


const patientRouter = Router();

patientRouter.get('/',async (req,res) => {
    const doctorArray = await doctor.find({status:"approved"});
    res.render('patient',{
        doctors: doctorArray,
        patientName: "rahul"
    });
})


patientRouter.get("/auth/google",
    passport.authenticate("google",{scope: ["profile","email"],session:false})
)

patientRouter.get("/auth/google/callback",
    passport.authenticate("google",{session:false,failureRedirect:"/patientPage"}),
    (req,res) => {
        res.redirect("/patientPage");
    }
)


patientRouter.get('/findNearDoctor',async (req,res) => {
    const doctors = await doctor.find({location:"shimoga"})
    console.log(doctors)
    res.render('findNearDoctorForm',{
        doctors
    });
})


patientRouter.post('/book-appointment',(req,res) => {
    const data = req.body;
    console.log(data);
    res.send("Booked successfully!");
})
export default patientRouter;