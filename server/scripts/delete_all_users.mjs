import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function deleteAllUsers() {
    console.log("--- Începere ștergere TOATE conturile de utilizator ---");

    try {
        // 1. Ștergem datele dependente (UserSkill, UserQuizResult, etc. - dacă există)
        // Prisma le șterge automat dacă avem Cascade Delete, dar e mai sigur să le ștergem manual dacă nu suntem siguri de relații

        const deleteUserSkills = await prisma.userSkill.deleteMany({});
        console.log(`S-au șters ${deleteUserSkills.count} înregistrări din UserSkill.`);

        const deleteQuizResults = await prisma.userQuizResult.deleteMany({});
        console.log(`S-au șters ${deleteQuizResults.count} înregistrări din UserQuizResult.`);

        // 2. Ștergem utilizatorii
        const deleteUsers = await prisma.user.deleteMany({});
        console.log(`S-au șters ${deleteUsers.count} utilizatori din baza de date.`);

        console.log("--- Toate conturile au fost șterse cu succes ---");
    } catch (error) {
        console.error("Eroare la ștergerea conturilor:", error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteAllUsers();
