import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
// import bcrypt from "bcryptjs";
// import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
// import { urlencoded } from "express";
import { adminRouter } from "./routes/admin.js";
import {admin} from "./models/admin.js";
import { type } from "os";
dotenv.config();
// Database connection
try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected successfully!");
} catch (err) {
  console.error("❌ MongoDB connection failed:", err);
}



const app = express();
const PORT = process.env.PORT || 5000;

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());
// app.use(cookieParser());
app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

// Admin Login
app.post("/admin", async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  const response = await admin.find()
  console.log(response)
  try {
    // const admin = await Admin.findOne({ email });
    // if (!admin) return res.status(404).send("❌ Admin not found!");
    if(email=="sagar@gmail.com" && password=="asdf") {
      res.cookie('admin',JSON.stringify(email,password)).redirect('/adminPage');
    } else {
      res.json({status:400,valid:"Invalid Email!"})
    }
    // const isMatch = await bcrypt.compare(password, admin.password);
    // if (!isMatch) return res.status(401).send("❌ Invalid credentials");
    
  } catch (error) {
    console.error(error);
    res.status(500).send("⚠️ Server error during admin login");
  }
});

// Doctor Register
app.post("/doctor", async (req, res) => {
  const { name, phone, gender } = req.body;
  try {
    // const newDoctor = new Doctor({ name, phone, gender });
    // await newDoctor.save();
    res.send("✅ Doctor registered successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("⚠️ Error registering doctor");
  }
});

// Patient Verify
app.get("/patientVerify", async (req, res) => {
  const { aadhar, phone } = req.query;
  try {
    if (!aadhar && !phone)
      return res.status(400).send("⚠️ Please provide Aadhar or phone number");

    // const newPatient = new Patient({ aadhar, phone });
    // await newPatient.save();
    res.send("✅ Patient verified successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("⚠️ Error verifying patient");
  }
});

app.use('/adminPage',adminRouter);

// Server listen
app.listen(PORT,
     () => console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
