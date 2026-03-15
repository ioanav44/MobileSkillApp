import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const courses = [
        // Frontend
        { title: 'React - Ghid Complet (Hooks, Router, Redux)', platform: 'Udemy', link: 'https://www.udemy.com/course/react-ghid-complet/', category: 'React' },
        { title: 'JavaScript Modern de la Zero la Expert', platform: 'Udemy', link: 'https://www.udemy.com/course/javascript-modern/', category: 'JavaScript' },
        { title: 'TypeScript for Beginners', platform: 'Coursera', link: 'https://www.coursera.org/learn/typescript', category: 'TypeScript' },
        { title: 'HTML & CSS Design', platform: 'FreeCodeCamp', link: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', category: 'HTML' },
        { title: 'CSS Advanced Layouts', platform: 'Udemy', link: 'https://www.udemy.com/course/advanced-css-and-sass/', category: 'CSS' },

        // Backend
        { title: 'Node.js, Express & MongoDB Dev to Deployment', platform: 'Udemy', link: 'https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/', category: 'Node.js' },
        { title: 'Python for Data Science and Machine Learning', platform: 'Udemy', link: 'https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/', category: 'Python' },
        { title: 'The Complete SQL Bootcamp 2024', platform: 'Udemy', link: 'https://www.udemy.com/course/the-complete-sql-bootcamp/', category: 'SQL' },
        { title: 'Docker and Kubernetes: The Complete Guide', platform: 'Udemy', link: 'https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/', category: 'Docker' },
        { title: 'REST APIs with Flask and Python', platform: 'Coursera', link: 'https://www.coursera.org/specializations/python-flask', category: 'API' },

        // Mobile
        { title: 'React Native - The Practical Guide 2024', platform: 'Udemy', link: 'https://www.udemy.com/course/react-native-the-practical-guide/', category: 'React Native' },
        { title: 'Flutter & Dart - The Complete Guide', platform: 'Udemy', link: 'https://www.udemy.com/course/learn-flutter-dart-holy-grail-course/', category: 'Flutter' },

        // Data Science
        { title: 'Machine Learning A-Z: Hands-On Python & R', platform: 'Udemy', link: 'https://www.udemy.com/course/machine-learning/', category: 'Machine Learning' },
        { title: 'Data Analysis with Pandas and Python', platform: 'Coursera', link: 'https://www.coursera.org/learn/python-data-analysis', category: 'Tableau' },
        { title: 'Power BI Desktop de la A la Z', platform: 'Udemy', link: 'https://www.udemy.com/course/microsoft-power-bi-up-and-running-with-power-bi-desktop/', category: 'Power BI' }
    ];

    console.log('Se populează baza de date cu cursuri...');

    for (const course of courses) {
        await prisma.course.create({
            data: course
        });
    }

    console.log(`Finalizat! Am adăugat ${courses.length} cursuri.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
