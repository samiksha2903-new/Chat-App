import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    // retrieve the cookie
    // verify the cookie using the jwt secret key
    // we haved passed the userId in the token hence after verification it will return userId.
    // if we got the userId then search in the DB and retrieve the users data and pass in the req for the next route to use it.
    try {
        const token = req.cookies?.jwt;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No Token Provided"});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (!decoded) return res.status(401).json({ message: "Unauthorized - Invalid Token!"});

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) return res.status(404).json({ message: "Unauthorized - User Not Found"});

        req.user = user;
        next();

    } catch (error) {
        console.log("Error in auth middleware: ", error.message);
        return res.status(500).json({ message: "Internal Server Error"});
    }
}