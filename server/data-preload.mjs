import pkg from '@prisma/client';
const { PrismaClient } = pkg;


const prisma = new PrismaClient();

async function main() {
    console.log('Seeding data...');
    // Add seed logic here
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
