import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        // The SDK doesn't have a direct listModels, we usually use fetch or check docs.
        // But we can try a few common names.
        const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash", "gemini-2.0-flash-001"];
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("test");
                console.log(`Model ${m} WORKS`);
            } catch (e) {
                console.log(`Model ${m} FAILED: ${e.message}`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

listModels();
