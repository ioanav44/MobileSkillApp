import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await res.json();
    const models = data.models.map(m => m.name);
    console.log("ALL MODELS:", models.join(", "));
}

check();
