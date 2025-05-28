import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true // for searching field, this makes searching easy
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minLength: 6
        },
        profilePic: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

export const User = mongoose.model("User", userSchema);

export default User;