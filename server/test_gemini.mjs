import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    try {
        console.log("Testing Gemini with key:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");
        const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });
        const result = await model.generateContent("Salut, cine ești?");




        console.log("Gemini response:", result.response.text());
    } catch (e) {
        console.error("Gemini Error:", e);
    }
}

test();
