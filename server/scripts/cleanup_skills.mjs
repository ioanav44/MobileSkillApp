import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function cleanupSkills() {
    console.log("--- Începere curățare skill-uri nedorite din baza de date ---");

    const UNWANTED_SKILLS = [
        'Canva', 'Photoshop', 'Illustrator', 'Adobe XD',
        'iOS', 'Android', 'Canvas', 'UI Design', 'UX Design',
        'Figma', 'Photoshop', 'Illustrator', 'Canva'
    ];

    try {
        // Găsim ID-urile skill-urilor pe care vrem să le ștergem
        const skillsToDelete = await prisma.skill.findMany({
            where: {
                name: {
                    in: UNWANTED_SKILLS
                }
            }
        });

        const skillIds = skillsToDelete.map(s => s.id);

        if (skillIds.length > 0) {
            // 1. Ștergem legăturile din UserSkill
            const deleteUserSkills = await prisma.userSkill.deleteMany({
                where: {
                    skillId: {
                        in: skillIds
                    }
                }
            });
            console.log(`S-au șters ${deleteUserSkills.count} legături din UserSkill.`);

            // 2. Ștergem skill-urile din tabela Skill
            const deleteSkills = await prisma.skill.deleteMany({
                where: {
                    id: {
                        in: skillIds
                    }
                }
            });
            console.log(`S-au șters ${deleteSkills.count} skill-uri din tabela Skill.`);
        } else {
            console.log("Nu s-au găsit skill-uri nedorite în baza de date.");
        }

        console.log("--- Curățare finalizată ---");
    } catch (error) {
        console.error("Eroare:", error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupSkills();
