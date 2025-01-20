import { GoogleGenerativeAI } from "@google/generative-ai";



const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: process.env.GOOGLE_PROMPT
});

export const generateResult = async (prompt) => {
    const result = await model.generateContent(prompt);
    return result.response.text();
}

