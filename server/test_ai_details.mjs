
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    const title = "JavaScript";
    const careerName = "Frontend Developer";

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Ești un expert în carieră IT. Generază informații detaliate pentru conceptul "${title}" în contextul unei cariere de ${careerName || 'Software Developer'}.
    Include:
    1. O descriere scurtă și clară (max 300 caractere).
    2. 3-4 resurse gratuite (Articole, Video-uri YouTube, Documentație).
    3. 2 resurse premium (Cursuri Udemy/Coursera).
    
    Răspunde DOAR în format JSON:
    {
      "title": "${title}",
      "description": "...",
      "freeResources": [{"type": "Article/Video", "label": "...", "url": "..."}],
      "premiumResources": [{"label": "...", "url": "...", "discount": "20% Off"}]
    }
    Răspunsul să fie în limba Română, resursele pot fi în Engleză.`;

    const result = await model.generateContent(prompt);
    const aiText = result.response.text();
    console.log("Raw AI Response:", aiText);

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        console.log("No JSON found!");
    } else {
        try {
            const details = JSON.parse(jsonMatch[0]);
            console.log("Parsed Details:", JSON.stringify(details, null, 2));
        } catch (e) {
            console.log("JSON Parse Error:", e.message);
        }
    }
}

test();
