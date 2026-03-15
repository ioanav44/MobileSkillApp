import pkg from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
const delay = ms => new Promise(res => setTimeout(res, ms));

const { PrismaClient } = pkg;
const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const isActualSkill = (label) => {
    if (!label) return false;
    const lower = label.toLowerCase().trim();
    if (lower.length < 2 || lower.length > 40) return false; // Nu prea există tehnologii mai lungi de 40 de caractere
    if (lower.includes('?')) return false; // E o întrebare

    // Cuvinte care arată că e o explicație, nu un skill
    const trash = [
        'roadmap.sh', 'contributing', 'credits', 'license', 'github', 'subscribe', 'follow', 'click here',
        'vertical node', 'horizontal node', 'group', 'how does', 'what is', 'internet', 'browser',
        'basic', 'learn', 'making a', 'repo', 'hosting', 'dns', 'domain', 'servers', 'read more',
        'click', 'visit', 'article', 'video', 'watch', 'vs ', 'difference'
    ];
    if (trash.some(t => lower.includes(t))) return false;

    return true;
};

const extractRoadmapSkills = (data) => {
    if (!data || !data.nodes) return [];
    return data.nodes
        .filter(node => node.data && node.data.label && isActualSkill(node.data.label))
        .map(node => node.data.label);
};

async function main() {
    console.log("Începe actualizarea skillsRequired din sursa oficială (roadmap.sh)...");
    const careers = await prisma.career.findMany();
    for (const career of careers) {
        if (career.roadmapUrl) {
            try {
                const response = await fetch(career.roadmapUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const data = await response.json();
                const skills = extractRoadmapSkills(data);

                if (skills && skills.length > 0) {
                    const uniqueSkills = [...new Set(skills)];
                    console.log(`🧠 [AI] Se structurează ${uniqueSkills.length} abilități brute pentru ${career.name} cu AI...`);

                    const prompt = `Ești un tehnician expert. Ai primit o listă brută extrase dintr-un roadmap pentru nișa "${career.name}": 
${uniqueSkills.join(', ')}.

Misiunea ta:
1. Elimină TOATE noțiunile teoretice generale, întrebările, linkurile, acțiunile (ex: "internet", "browser", "how it works", "dns", "vs", "learn", etc). Păstrează EXCLUSIV tehnologii concrete, limbaje, unelte și concepte tehnice vitale (ex: HTML, CSS, React, SQL, AWS, Docker).
2. Maximizează esențialul (păstrează maxim 35-40 cele mai importante pentru această nișă).
3. Grupează-le pe categorii logice (Ex: "Fundamentals", "Tooling", "Frameworks", "Testing", "Advanced").
4. Răspunde STRICT și exclusiv cu un Array JSON valid, fără \`\`\`json și fără niciun alt comentariu.

Format necesar:
[
  { "category": "Web Fundamentals", "skills": ["HTML", "CSS", "JavaScript"] },
  { "category": "Frameworks", "skills": ["React", "Vue.js"] }
]`;

                    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

                    let aiText = "";
                    let success = false;
                    while (!success) {
                        try {
                            const result = await model.generateContent(prompt);
                            aiText = result.response.text().trim();
                            success = true;
                        } catch (e) {
                            if (e.message.includes('429')) {
                                console.log("⏳ Rate limit lovit, aștept 15s...");
                                await delay(15000);
                            } else {
                                throw e;
                            }
                        }
                    }

                    if (aiText.startsWith('```json')) aiText = aiText.substring(7);
                    if (aiText.endsWith('```')) aiText = aiText.substring(0, aiText.length - 3);
                    aiText = aiText.trim();

                    // Verificăm dacă e valid
                    try {
                        JSON.parse(aiText);
                    } catch (err) {
                        console.error("FAILED JSON PARSE! Raw text from AI was:", aiText);
                        throw err;
                    }


                    await prisma.career.update({
                        where: { id: career.id },
                        data: {
                            skillsRequired: aiText // Salvăm STRINGIFIED JSON-ul curat
                        }
                    });
                    console.log(`✅ [SUCCES] ${career.name}: structură organizată salvată.`);

                    // Wait 4s to avoid rate limitting
                    await delay(4000);
                }
                await delay(2000); // 2 seconds between careers
            } catch (err) {
                console.error(`❌ [EROARE] ${career.name}:`, err.message);
                await delay(2000);
            }
        } else {
            console.log(`⚠️ [SKIP] ${career.name}: Nu are setat un URL pentru roadmap.`);
        }
    }
    console.log("Actualizare completă!");
    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
