import express from "express";
import dotenv from "dotenv";
import connectDB from "./dbConfig/db.js";
dotenv.config();

// Connect to MongoDB
connectDB();

const PORT = 8000;
const app = express();


app.get('/',(req,res) => {
    return res.send("Hello world");
})

app.get('/doctor',(req,res) => {
    return res.json({status: "API is working"});
})
app.get('/main',(req,res) => {
    return res.render('main');
})
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});