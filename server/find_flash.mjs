import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await res.json();
    data.models.forEach(m => {
        if (m.name.includes("gemini-1.5-flash")) {
            console.log("FOUND:", m.name);
        }
    });
}

check();
