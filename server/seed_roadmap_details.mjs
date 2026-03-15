
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
    console.log("Seeding common roadmap details...");

    const commonDetails = [
        {
            title: "JavaScript",
            description: "JavaScript este limbajul de programare principal al web-ului, permitând interactivitate și logică complexă pe pagini web.",
            freeResources: JSON.stringify([
                { type: "Video", label: "JavaScript pentru începători (Ro)", url: "https://www.youtube.com/results?search_query=javascript+romana" },
                { type: "Articol", label: "MDN Web Docs - JavaScript Basics", url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps" }
            ]),
            premiumResources: JSON.stringify([
                { label: "The Complete JavaScript Course 2024 (Udemy)", url: "https://www.udemy.com/course/the-complete-javascript-course/", discount: "80% Off" }
            ])
        },
        {
            title: "HTML",
            description: "HyperText Markup Language este scheletul oricărei pagini web, definind structura și conținutul acesteia.",
            freeResources: JSON.stringify([
                { type: "Video", label: "HTML Crash Course", url: "https://www.youtube.com/watch?v=qz0aGYrrlhU" },
                { type: "Articol", label: "W3Schools HTML Tutorial", url: "https://www.w3schools.com/html/" }
            ]),
            premiumResources: JSON.stringify([
                { label: "HTML & CSS Pro - Design Modern (Udemy)", url: "https://www.udemy.com/course/design-and-develop-a-killer-website-with-html5-and-css3/", discount: "50% Off" }
            ])
        },
        {
            title: "CSS",
            description: "Cascading Style Sheets este limbajul folosit pentru a stiliza paginile web, gestionând layout-ul, culorile și fonturile.",
            freeResources: JSON.stringify([
                { type: "Video", label: "CSS Tutorial for Beginners", url: "https://www.youtube.com/watch?v=yfoY53QXEnI" },
                { type: "Articol", label: "CSS-Tricks - Flexbox Guide", url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/" }
            ]),
            premiumResources: JSON.stringify([
                { label: "Advanced CSS and Sass (Udemy)", url: "https://www.udemy.com/course/advanced-css-and-sass/", discount: "70% Off" }
            ])
        }
    ];

    for (const detail of commonDetails) {
        await prisma.roadmapDetail.upsert({
            where: { title: detail.title },
            update: detail,
            create: detail
        });
    }

    console.log("Seeding complete!");
}

seed().catch(err => console.error(err)).finally(() => prisma.$disconnect());
