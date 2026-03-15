import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const trends = await prisma.marketTrend.findMany();
    console.log('Trends count:', trends.length);
    console.log(JSON.stringify(trends, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
