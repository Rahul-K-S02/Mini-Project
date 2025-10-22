import { Router } from "express";
import { doctor } from "../models/doctor.js";

const router = Router();

router.get("/", async (req, res) => {
  // const pendingDoctors = ["Alice","Bob"];
  // const approvedDoctors = ["Ram","Lashman"];

  const pendingDoctors = (await doctor.find({ status: "pending" })) || [];
  const approvedDoctors = (await doctor.find({ status: "approved" })) || [];

  const approvedDoctorsCount =
    (await doctor.countDocuments({ status: "approved" })) || 0;
  const rejectedDoctorsCount =
    (await doctor.countDocuments({ status: "rejected" })) || 0;

  const totalDoctorsCount = approvedDoctorsCount;

  console.log(approvedDoctors);
  res.render("admin", {
    pendingDoctors,
    approvedDoctors,
    approvedDoctorsCount,
    rejectedDoctorsCount,
    totalDoctorsCount,
  });
});

router.get('/approve-doctor/:doctorid',async (req,res) => {
    const doctorID = req.params.doctorid;
    try {
        const updatedDoctor = await doctor.findOneAndUpdate(
            { doctorid : doctorID }, 
            { $set: { status: "approved" } },
        );
        res.send("Approved Succesfully!")
    } catch(e) {
        console.log(e);
    }
})


router.get('/reject-doctor/:doctorid',async (req,res) => {
    const doctorID = req.params.doctorid;
    try {
        const updatedDoctor = await doctor.findOneAndUpdate(
            { doctorid : doctorID }, 
            { $set: { status: "rejected" } },
        );
        res.send("Rejected succesfully");
    } catch(e) {
        console.log(e);
    }
})
export const adminRouter = router;
