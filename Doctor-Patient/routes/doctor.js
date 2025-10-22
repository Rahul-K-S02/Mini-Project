import { Router } from "express";

const doctorRouter = Router();

doctorRouter.get("/", (req, res) => {
  res.send(`
        <h1>Your Information is successfully! admin will verify your details</h1>    
    `);
});

export default doctorRouter;
