import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
    // 1. Listăm toate carierele
    const all = await prisma.career.findMany({ select: { id: true, name: true } });
    console.log("Cariere existente:", all.map(c => `${c.id}: ${c.name}`).join(', '));

    // 2. Ștergem "Mobile Developer" (păstrăm "Mobile App Developer")
    const mobileDev = all.find(c => c.name === 'Mobile Developer');
    if (mobileDev) {
        // Ștergem întâi quiz questions legate de el
        await prisma.quizQuestion.deleteMany({ where: { careerId: mobileDev.id } });
        await prisma.userQuizResult.deleteMany({ where: { careerId: mobileDev.id } });
        await prisma.career.delete({ where: { id: mobileDev.id } });
        console.log("✅ Șters: Mobile Developer (id=" + mobileDev.id + ")");
    }

    // 3. Ștergem "Data Analyst" (păstrăm "Data Scientist") și-l înlocuim cu Software Architect
    const dataAnalyst = all.find(c => c.name === 'Data Analyst');
    if (dataAnalyst) {
        await prisma.quizQuestion.deleteMany({ where: { careerId: dataAnalyst.id } });
        await prisma.userQuizResult.deleteMany({ where: { careerId: dataAnalyst.id } });
        await prisma.career.update({
            where: { id: dataAnalyst.id },
            data: {
                name: 'Software Architect',
                description: 'Proiectează arhitectura sistemelor software complexe, alege tehnologiile potrivite și definește pattern-urile de design utilizate în aplicații enterprise.',
                skillsRequired: 'Design Patterns, Microservices, REST API, GraphQL, Docker, Kubernetes, AWS, CI/CD, SQL, NoSQL, System Design, Cloud Architecture',
                roadmapUrl: 'https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/software-architect/software-architect.json'
            }
        });
        console.log("✅ Înlocuit: Data Analyst → Software Architect (id=" + dataAnalyst.id + ")");
    }

    // 4. Verificăm rezultatul final
    const final = await prisma.career.findMany({ select: { id: true, name: true } });
    console.log("\n📋 Cariere finale:");
    final.forEach(c => console.log(`   ${c.id}: ${c.name}`));

    await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
