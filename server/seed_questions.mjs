import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding technical quiz questions...");

    const careers = await prisma.career.findMany();

    const questionsByNiche = {
        "Frontend Developer": [
            { text: "Ce face 'useEffect' în React?", options: JSON.stringify(["Gestionează starea", "Execută efecte secundare", "Creează rute"]), correctIdx: 1 },
            { text: "Care este diferența dintre 'margin' și 'padding'?", options: JSON.stringify(["Nu există diferență", "Margin e interior, padding exterior", "Padding e interior, margin exterior"]), correctIdx: 2 },
            { text: "Ce înseamnă un element semantinc în HTML?", options: JSON.stringify(["Un element cu înțeles pentru browser și developer", "Un element stilizat cu CSS", "Un element JavaScript"]), correctIdx: 0 }
        ],
        "Backend Developer": [
            { text: "Ce este un REST API?", options: JSON.stringify(["Un tip de bază de date", "Un stil arhitectural pentru servicii web", "Un limbaj de programare"]), correctIdx: 1 },
            { text: "La ce folosește un 'Middleware' în Express?", options: JSON.stringify(["Pentru a stoca imagini", "Pentru a procesa cererea înainte de handler", "Pentru a închide baza de date"]), correctIdx: 1 },
            { text: "Ce este un 'Primary Key'?", options: JSON.stringify(["O cheie de la server", "Un identificator unic pentru un rând într-o tabelă", "Un tip de fișier"]), correctIdx: 1 }
        ],
        "AI Developer": [
            { text: "Ce este un 'Prompt' în contextul LLM?", options: JSON.stringify(["O eroare de sistem", "Textul de intrare dat modelului", "O bază de date"]), correctIdx: 1 },
            { text: "Ce înseamnă NLP?", options: JSON.stringify(["Natural Language Processing", "Non-Linear Programming", "New Language Protocol"]), correctIdx: 0 }
        ]
    };

    for (const career of careers) {
        const questions = questionsByNiche[career.name] || questionsByNiche["Backend Developer"]; // Default to Backend if niche not mapped
        for (const q of questions) {
            await prisma.quizQuestion.create({
                data: {
                    careerId: career.id,
                    text: q.text,
                    options: q.options,
                    correctIdx: q.correctIdx
                }
            });
        }
        console.log(`✅ Adăugat întrebări pentru: ${career.name}`);
    }

    console.log("Done seeding questions!");
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
