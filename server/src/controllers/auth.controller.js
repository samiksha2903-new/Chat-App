import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";

// new user is creating | Register in DB
export const Signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    // signup the user
    // hashing the password
    // create a token
    // send them in cookie
    if ([fullName, email, password].some((field) => field?.trim() === "")) {
      return res.status(404).json({ message: "All fields are required." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashPassword = await bcrypt.hash(password, 10);

    /* const newUser = new User({
        fullName,
        email,
        password: hashPassword
    }) */
    const user = await User.create({
      fullName,
      email,
      password: hashPassword,
    });

    if (user) {
      generateToken(user._id, res);
    } else {
      console.log("Error while creating the user");
      return res.status(500).json({ message: "Error while Signup" });
    }

    return res.status(201).json(
      {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
      }
    );
  } catch (error) {
    console.log("error in signup controller: ", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// login user
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(404).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const decodePassword = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!decodePassword) {
      return res
        .status(404)
        .json({ message: "Invalid credentials! Please try again" });
    }

    // const payload = {
    //   userId: existingUser._id,
    // };

    // //  short-lived access token and a long-lived refresh token.
    // const token = jwt.sign(payload, jwtSecret, { expiresIn: "3d" });

    // return res
    //   .cookie("accessToken", token, {
    //     secure: false,
    //     sameSite: "none",
    //     httpOnly: true,
    //   })
    //   .status(200)
    //   .json({ message: "Logged in Successfully" });

    generateToken(existingUser._id, res);

    return res.status(200).json(
      {
        _id: existingUser._id,
        fullName: existingUser.fullName,
        email: existingUser.email,
        profilePic: existingUser.profilePic,
      },
      { message: "Successfully Login!" }
    );
  } catch (error) {
    console.log("Error in login controller: ", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// when we logout -> simply remove/empty the cookie
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller: ", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updateUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    return res.status(200).json(updateUser);
  } catch (error) {
    console.log("Error in update profile controller: ", error.message);
    return res.status(500).json({ message: "Internal Server Error!"})
  }
};

// this fn will be called when -> refresh the application(to check if the user is authenticated)
export const checkAuth = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}