import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;