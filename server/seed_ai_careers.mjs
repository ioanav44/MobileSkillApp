import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
    console.log("Adding AI-related career objectives...");

    const aiCareers = [
        {
            name: "AI Developer",
            description: "Dezvoltă soluții software care integrează modele de inteligență artificială și LLM-uri.",
            skillsRequired: "Python, OpenAI API, LangChain, Vector Databases, NLP, API Integration",
            roadmapUrl: "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/ai/ai.json"
        },
        {
            name: "Machine Learning Engineer",
            description: "Construiește și antrenează modele predictive folosind seturi mari de date.",
            skillsRequired: "Python, TensorFlow, PyTorch, Scikit-learn, Pandas, NumPy, Statistics, MLOps",
            roadmapUrl: "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/mlops/mlops.json"
        },
        {
            name: "Data Analyst",
            description: "Transformă datele brute în informații utile pentru business prin analize și vizualizări.",
            skillsRequired: "SQL, Excel, Tableau, Power BI, Statistics, Data Visualization, Python",
            roadmapUrl: "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/data-analyst/data-analyst.json"
        }
    ];

    for (const career of aiCareers) {
        await prisma.career.upsert({
            where: { name: career.name },
            update: career,
            create: career
        });
        console.log(`✅ [AI Career] Adăugat/Actualizat: ${career.name}`);
    }

    console.log("AI careers updated successfully!");
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
