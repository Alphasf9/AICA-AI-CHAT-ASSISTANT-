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

