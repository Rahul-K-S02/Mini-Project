import { Router } from "express";

const patientRouter = Router();

patientRouter.get('/',(req,res) => {
    res.render('patient');
})


export default patientRouter;