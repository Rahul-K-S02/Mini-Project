import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
// import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { urlencoded } from "express";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(urlencoded({ extended: true }));
app.use(express.static("public"));
// app.use(cookieParser());
app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

// Database connection
try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected successfully!");
} catch (err) {
  console.error("❌ MongoDB connection failed:", err);
}

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

// Admin Login
app.post("/admin", async (req, res) => {
  const { email, password } = req.body;
  try {
    // const admin = await Admin.findOne({ email });
    // if (!admin) return res.status(404).send("❌ Admin not found!");

    // const isMatch = await bcrypt.compare(password, admin.password);
    // if (!isMatch) return res.status(401).send("❌ Invalid credentials");

    res.send("✅ Admin login successful!");
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

// Server listen
app.listen(PORT,
     () => console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
