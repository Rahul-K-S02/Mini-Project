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


export default patientRouter;