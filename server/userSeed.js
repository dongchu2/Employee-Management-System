import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import User from "./User";

dotenv.config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      console.log("Admin user already exists.");
      return;
    }


    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    const adminUser = new User({
      username: process.env.ADMIN_USERNAME,
      password: hashedPassword,
      status: "approved",
      role: "admin",
    });

    await adminUser.save();
    console.log("Admin user created successfully.");
  } catch (error) {
    console.error("Error creating admin user:", error);
  };
}

  createAdminUser();