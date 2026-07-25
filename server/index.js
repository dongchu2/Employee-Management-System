import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./auth.js";
import mongoose from "mongoose";

dotenv.config();
const app = express();
app.use(cors({
    origin: "http://localhost:5173"
}));
app.use(express.json());
app.get("/", (req, res) => {
    res.send("API is running...");
});
app.use("/api/auth", authRoutes);
const PORT = process.env.PORT || 3000;


mongoose
        .connect(process.env.MONGO_URI)

        .then(() => {
            console.log("MongoDB connected");
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        })
        .catch((err) => {
            console.log(err);
        });
