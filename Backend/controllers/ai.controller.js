import { generateResult } from "../services/aigemini.service.js";


export const getResult = async (req, res) => {
    try {
        const { prompt } = req.query;
        const result = await generateResult(prompt);
        res.status(200).json({ result });
    } catch (error) {
        console.error(`Error generating result: ${error.message}`);
        res.status(500).json({ message: "Error generating result" });

    }
};