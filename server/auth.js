import express from "express";
import bycrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

import {
    verifyToken,
    requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();
const otpStore={};

router.post("/send-code", async (req, res) => {
    try{
        const {Username}=req.body;
        if(!Username){
            return res.status(400).json({
                success:false,
                message:"Username is required"});
            }
            const normalizedUsername=Username.toLowerCase().trim();
            const existingUser=await User.findOne({Username:normalizedUsername});
            if(existingUser){
                return res.status(400).json({
                    success:false,
                    message:"Username already exists"});
            }
            const code =Math.floor(100000+Math.random()*900000).toString();
            otpStore[normalizedUsername]={code,expires:Date.now()+5*60*1000};

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
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Username already exists",
            });
        }
        const hashedPassword = await bycrypt.hash(Password, 10);

        const newUser = await User.create({
            Username: normalizedUsername,
            Password: hashedPassword,
            status: "pending",
            role: "user",
        });
        delete otpStore[normalizedUsername];

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: newUser._id,
                Username: newUser.Username,
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
        const { Username, Password } = req.body;
        if (!Username || !Password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required",
            });
        }
        const normalizedUsername = Username.toLowerCase().trim();
        const user = await User.findOne({ Username: normalizedUsername });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password",
            });
        }
        const isPasswordValid = await bycrypt.compare(Password, user.Password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password",
            });
        }
        if (user.status !== "approved") {
            return res.status(403).json({
                success: false,
                message: "User is not approved yet",
            });
        }
        if (user.status === "rejected") {
            return res.status(403).json({
                success: false,
                message: "User registration has been rejected",
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
                Username: user.Username,
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
            role: req.user.role,
            status: req.user.status,    
        },
    });
}

router.get("/admin/pending-users", verifyToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.find({ status: "pending",}).select("-Password").sort({ createdAt: -1 });
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
        const UpdatedUser = await User.findByIdAndUpdate(
            userId,
            { status: action },
            { new: true }

        ).select("-Password");;

        if(!UpdatedUser){
            return res.status(404).json({
                success:false,
                message:"User not found"});
        }
        return res.status(200).json({
            success:true,
            message:`User ${action} successfully`,
            user:UpdatedUser});
    }catch(error){
        console.error("Error updating user status:",error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"});
    }
});

export default router;