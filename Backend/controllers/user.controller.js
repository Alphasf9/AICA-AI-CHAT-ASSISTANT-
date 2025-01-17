import User from "../models/user.model.js";
import { createUser, getUsers } from "../services/user.service.js";
import { validationResult } from "express-validator"
import redisClient from "../services/redis.service.js";



export const registerUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const user = await createUser(req.body);

        const token = await user.generateJWT();

        delete user._doc.password;
        res.cookie('token', token, { httpOnly: true });


        return res.status(201).json({
            message: "User created successfully",
            user,
            token
        })
    } catch (error) {
        console.log(`Error registering user: ${error.message}`)
        res.status(500).json({ message: "Error registering user" })
    }
}



export const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        const isMatch = await user.validPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Email or password incorrect" })
        }
        const token = await user.generateJWT();
        delete user._doc.password;
        res.cookie('token', token, { httpOnly: true });

        return res.status(200).json({
            message: "User logged in successfully",
            user,
            token
        })
    } catch (error) {
        console.log(`Error logging in user: ${error.message}`)
        res.status(500).json({ message: "Error logging in user" })
    }
}



export const getUserProfile = async (req, res) => {
    try {

        return res.status(200).json({
            message: "User profile retrieved successfully",
            user: req.user
        })
    } catch (error) {
        console.log(`Error getting user profile: ${error.message}`)
        res.status(500).json({ message: "Error getting user profile" })
    }
}


export const logout = async (req, res) => {
    try {

        const token = req.cookies.token || req.headers.authorization.split(' ')[1];
        redisClient.set(token, 'logout', 'EX', 60 * 60 * 24)
        res.clearCookie('token');
        return res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.log(`Error logging out user: ${error.message}`)
        res.status(500).json({ message: "Error logging out user" })
    }
}



export const getAllUsers = async (req, res) => {
    try {
        const loggedInUser = await User.findOne({ email: req.user.email });
        const allUsers = await getUsers({ userId: loggedInUser._id });
        return res.status(200).json({ message: "All users retrieved successfully", users: allUsers });
    } catch (error) {
        console.log(`Error getting all users: ${error.message}`)
        res.status(500).json({ message: "Error getting all users" })
    }
}
