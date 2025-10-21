import { Router } from "express";
import {doctor} from "../models/doctor.js";

const router = Router();

router.get('/', async (req,res) => {
    // const pendingDoctors = ["Alice","Bob"];
    // const approvedDoctors = ["Ram","Lashman"];

    const pendingDoctors = await doctor.find({status:'pending'}) || [];
    const approvedDoctors = await doctor.find({status:'approved'}) || [];


    const approvedDoctorsCount = await doctor.countDocuments({status:'approved'}) || 0;
    const rejectedDoctorsCount = await doctor.countDocuments({status:'rejected'}) || 0;

    const totalDoctorsCount = approvedDoctors

    console.log(approvedDoctors);
    res.render('admin',{
        pendingDoctors,
        approvedDoctors,
        approvedDoctorsCount,
        rejectedDoctorsCount,
        totalDoctorsCount
    });
})


export const adminRouter = router;