import jwt from "jsonwebtoken";
import User from "./User.js";


const verifyToken = async (req, res, next) => {
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({
                success: false,
                message:"no token provided "});
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id).select("-password");
        if(!user){
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }
        if(user.status !== "approved"){
            return res.status(403).json({
                success: false,
                message: "User is not approved yet",
            });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(401).json({
            success: false,
            message: "Invalid token",
        });
    }
};

    const requireAdmin = (req, res, next) => {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admins only.",
            });
        }
        next();
}
export { verifyToken, requireAdmin };