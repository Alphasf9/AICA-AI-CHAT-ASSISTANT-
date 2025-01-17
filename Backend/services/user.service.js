import User from "../models/user.model.js";



export const createUser = async ({ email, password }) => {
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const hashedPassword = await User.hashPassword(password)
        const user = await User.create({ email, password: hashedPassword });
        return user

    } catch (error) {
        console.log(`Error creating user: ${error.message}`)
    }
}

export const getUsers = async ({ userId }) => {
    try {
        if (!userId) {
            throw new Error("User id is required")
        }
        const users = await User.find({
            _id: { $ne: userId }
        });
        return users
    } catch (error) {
        console.log(`Error getting users: ${error.message}`)
    }
}
