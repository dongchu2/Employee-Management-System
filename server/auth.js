import dotenv from "dotenv";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./User.js";
import nodemailer from "nodemailer";

import {
    verifyToken,
    requireAdmin,
} from "./authMiddleware.js";
dotenv.config();
const router = express.Router();
const otpStore={};
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

router.post("/send-code", async (req, res) => {
    try{
        const {Username}=req.body;
        if(!Username){
            return res.status(400).json({
                success:false,
                message:"Username is required"});
            }
            const normalizedUsername=Username.toLowerCase().trim();
            const existingUser=await User.findOne({username:normalizedUsername});
            if(existingUser){
                return res.status(400).json({
                    success:false,
                    message:"Username already exists"});
            }
            const code =Math.floor(100000+Math.random()*900000).toString();
            otpStore[normalizedUsername]={code,expiresAt:Date.now()+5*60*1000};

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: normalizedUsername,
                subject:"Your Verification Code",
                text:`Your verification code is ${code}. It will expire in 5 minutes.`,
            });


            console.log("verification code for",normalizedUsername,":",code);
            return res.status(200).json({
                success:true,
                message:"Verification code sent successfully"});
    }catch(error){
        console.error("Error sending verification code:",error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"});
    }
});

router.post("/register", async (req, res) => {
    try {
        const { Username, Password, code } = req.body;
        if (!Username || !Password || !code) {
            return res.status(400).json({
                success: false,
                message: "Username, password, and verification code are required",
            });
        }
        const normalizedUsername = Username.toLowerCase().trim();
        if (Password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }
        const otpRecord = otpStore[normalizedUsername];
        if (!otpRecord){
            return res.status(400).json({
                success: false,
                message: "No verification code found for this username",
            });
        }

        if(Date.now()>otpRecord.expiresAt){
            delete otpStore[normalizedUsername];
            return res.status(400).json({
                success: false,
                message: "Verification code has expired",
            });
        }
        if (code !== otpRecord.code) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification code",
            });
        }
        const existingUser = await User.findOne({ username: normalizedUsername });  
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Username already exists",
            });
        }
        const hashedPassword = await bcrypt.hash(Password, 10);

        const newUser = await User.create({
            username: normalizedUsername,
            password: hashedPassword,
            status: "pending",
            role: "user",
        });
        delete otpStore[normalizedUsername];

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: newUser._id,
                username: newUser.username,
                status: newUser.status,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { username, Password } = req.body;
        if (!username || !Password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required",
            });
        }
        const normalizedUsername = username.toLowerCase().trim();
        const user = await User.findOne({ username: normalizedUsername });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username",
            });
        }
        const isPasswordValid = await bcrypt.compare(Password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid password",
            });
        }
        if (user.status === "rejected") {
            return res.status(403).json({
                success: false,
                message: "User registration has been rejected",
            });
        }
        if (user.status !== "approved") {
            return res.status(403).json({
                success: false,
                message: "User is not approved yet",
            });
        }
    

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                status: user.status,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

router.get("/verify", verifyToken, async (req, res) => {
    return res.status(200).json({
        success: true,
        user: {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role,
            status: req.user.status,    
        },
    });
})

router.get("/admin/pending-users", verifyToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.find({ status: "pending",}).select("-password").sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        console.error("Error fetching pending users:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

router.post("/admin/approve", verifyToken, requireAdmin, async (req, res) => {
    try {
        const { userId, action} = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }
        if (!action) {
            return res.status(400).json({
                success: false,
                message: "Action is required",
            });
        }
        if (!["approved", "rejected"].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Invalid action. Must be 'approved' or 'rejected'",
            });
        }
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { status: action },
            { new: true }

        ).select("-password");

        if(!updatedUser){
            return res.status(404).json({
                success:false,
                message:"User not found"});
        }
        return res.status(200).json({
            success:true,
            message:`User ${action} successfully`,
            user: updatedUser });
    }catch(error){
        console.error("Error updating user status:",error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"});
    }
});

export default router;