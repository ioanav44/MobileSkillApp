import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function check() {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await res.json();
    if (data.models) {
        const names = data.models.map(m => m.name + " (" + m.displayName + ")");
        fs.writeFileSync('all_models.txt', names.join('\n'));
        console.log("Written", names.length, "models to all_models.txt");
    } else {
        console.log("Error:", data);
    }
}

check();
