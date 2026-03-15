import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await res.json();
    console.log("Found", data.models.length, "models total.");
    data.models.forEach(m => console.log(m.name, m.displayName));
}

check();
