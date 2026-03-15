import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const CAREERS = [
    {
        name: "Frontend Developer",
        description: "Construiește interfețe web moderne, responsive și interactive folosind HTML, CSS, JavaScript și framework-uri precum React sau Vue.",
        skillsRequired: JSON.stringify([
            { category: "Fundamentals", skills: ["HTML", "Semantic HTML", "Forms and Validation", "Accessibility", "CSS", "Responsive Design", "JavaScript"] },
            { category: "Frameworks", skills: ["React", "Angular", "Vue.js", "Svelte"] },
            { category: "Styling", skills: ["Tailwind CSS", "Sass", "CSS Architecture", "BEM"] },
            { category: "Tooling", skills: ["Git", "npm", "yarn", "Vite", "Webpack", "ESLint", "Prettier"] },
            { category: "Testing", skills: ["Jest", "Cypress", "Playwright"] },
            { category: "Web APIs", skills: ["Fetch API", "WebSockets", "Service Workers"] },
            { category: "Advanced", skills: ["TypeScript", "Next.js", "GraphQL", "Performance Optimization"] }
        ]),
        roadmapUrl: "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/frontend/frontend.json"
    },
    {
        name: "Backend Developer",
        description: "Dezvoltă logica serverului, API-uri, baze de date și arhitecturi scalabile pentru aplicații web și mobile.",
        skillsRequired: JSON.stringify([
            { category: "Languages", skills: ["JavaScript", "Python", "Java", "Go", "C#", "PHP"] },
            { category: "Fundamentals", skills: ["REST API", "GraphQL", "Authentication", "Web Security"] },
            { category: "Databases", skills: ["PostgreSQL", "MySQL", "MongoDB", "Redis"] },
            { category: "Architecture", skills: ["Microservices", "Monolithic Architecture", "Message Queues", "Event Driven Architecture"] },
            { category: "Tools", skills: ["Git", "Docker", "CI/CD"] },
            { category: "Infrastructure", skills: ["Nginx", "Caching", "Load Balancing"] }
        ]),
        roadmapUrl: "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/backend/backend.json"
    },
    {
        name: "Full Stack Developer",
        description: "Stăpânește atât frontend-ul cât și backend-ul, putând construi aplicații complete de la zero.",
        skillsRequired: JSON.stringify([
            { category: "Frontend", skills: ["HTML", "CSS", "JavaScript", "React", "Tailwind"] },
            { category: "Backend", skills: ["Node.js", "REST APIs", "Authentication"] },
            { category: "Databases", skills: ["PostgreSQL", "MongoDB", "Redis"] },
            { category: "DevOps", skills: ["AWS", "Docker", "CI/CD", "Deployment"] },
            { category: "Tools", skills: ["Git", "npm"] }
        ]),
        roadmapUrl: "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/full-stack/full-stack.json"
    },
    {
        name: "Mobile Developer",
        description: "Creează aplicații native și cross-platform pentru iOS și Android folosind Flutter, React Native sau limbaje native.",
        skillsRequired: JSON.stringify([
            { category: "Languages", skills: ["Dart", "JavaScript", "Kotlin", "Swift"] },
            { category: "Frameworks", skills: ["Flutter", "React Native"] },
            { category: "Mobile Fundamentals", skills: ["Widgets", "State Management", "Animations"] },
            { category: "Data", skills: ["REST APIs", "GraphQL", "JSON", "SQLite", "Firebase"] },
            { category: "Testing", skills: ["Unit Testing", "Integration Testing"] },
            { category: "Deployment", skills: ["App Store", "Play Store"] }
        ]),
        roadmapUrl: "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/react-native/react-native.json"
    },
    {
        name: "DevOps Engineer",
        description: "Automatizează procesele de deployment, gestionează infrastructura cloud și asigură funcționarea continuă a aplicațiilor.",
        skillsRequired: JSON.stringify([
            { category: "Programming", skills: ["Python", "Bash", "Go"] },
            { category: "Systems", skills: ["Linux", "Networking", "Operating Systems"] },
            { category: "Containers", skills: ["Docker", "Kubernetes"] },
            { category: "Cloud", skills: ["AWS", "Azure", "Google Cloud"] },
            { category: "CI/CD", skills: ["Jenkins", "GitLab CI", "CircleCI"] },
            { category: "Infrastructure", skills: ["Terraform", "Ansible"] },
            { category: "Monitoring", skills: ["Prometheus", "Grafana", "Datadog"] }
        ]),
        roadmapUrl: "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/devops/devops.json"
    },
    {
        name: "QA Engineer",
        description: "Asigură calitatea software-ului prin testare manuală și automatizată, identificând bug-uri înainte ca produsul să ajungă la utilizatori.",
        skillsRequired: JSON.stringify([
            { category: "Fundamentals", skills: ["Manual Testing", "Test Planning", "Test Cases", "Regression Testing"] },
            { category: "Automation", skills: ["Selenium", "Cypress", "Playwright"] },
            { category: "API Testing", skills: ["Postman", "REST Assured"] },
            { category: "Performance Testing", skills: ["JMeter", "K6", "Gatling"] },
            { category: "CI/CD", skills: ["Jenkins", "GitLab CI"] },
            { category: "Tools", skills: ["Git", "TestRail"] }
        ]),
        roadmapUrl: "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/qa/qa.json"
    },
    {
        name: "Data Scientist",
        description: "Analizează seturi mari de date, construiește modele predictive și extrage insight-uri valoroase pentru decizii de business.",
        skillsRequired: JSON.stringify([
            { category: "Programming", skills: ["Python", "SQL"] },
            { category: "Mathematics", skills: ["Statistics", "Probability", "Linear Algebra", "Calculus"] },
            { category: "Machine Learning", skills: ["Regression", "Classification", "Clustering", "Time Series"] },
            { category: "Data Analysis", skills: ["Exploratory Data Analysis", "Data Visualization"] },
            { category: "Tools", skills: ["Pandas", "NumPy", "Scikit-learn"] }
        ]),
        roadmapUrl: null
    },
    {
        name: "Machine Learning Engineer",
        description: "Proiectează și implementează pipeline-uri de machine learning la scală, de la antrenare la deployment în producție.",
        skillsRequired: JSON.stringify([
            { category: "Programming", skills: ["Python", "Go", "Bash"] },
            { category: "MLOps", skills: ["Model Training", "Model Serving", "Experiment Tracking", "Feature Stores"] },
            { category: "Data Engineering", skills: ["Data Pipelines", "Airflow", "Spark", "Kafka"] },
            { category: "Containers", skills: ["Docker", "Kubernetes"] },
            { category: "Cloud", skills: ["AWS", "Azure", "GCP"] },
            { category: "Infrastructure", skills: ["CI/CD", "Infrastructure as Code"] }
        ]),
        roadmapUrl: "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/mlops/mlops.json"
    },
    {
        name: "AI Developer",
        description: "Integrează modele de inteligență artificială în aplicații reale, folosind API-uri precum OpenAI și framework-uri specializate.",
        skillsRequired: JSON.stringify([
            { category: "Programming", skills: ["Python"] },
            { category: "AI Frameworks", skills: ["OpenAI API", "LangChain"] },
            { category: "AI Concepts", skills: ["Natural Language Processing", "Vector Databases"] },
            { category: "Integration", skills: ["API Integration"] }
        ]),
        roadmapUrl: "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/ai-data-scientist/ai-data-scientist.json"
    },
    {
        name: "Cyber Security Analyst",
        description: "Protejează sistemele și datele organizațiilor împotriva atacurilor cibernetice, analizând vulnerabilități și implementând măsuri de securitate.",
        skillsRequired: JSON.stringify([
            { category: "Fundamentals", skills: ["Networking", "Operating Systems", "Security Principles"] },
            { category: "Security Concepts", skills: ["CIA Triad", "Zero Trust", "Defense in Depth"] },
            { category: "Security Tools", skills: ["Wireshark", "Nmap", "SIEM"] },
            { category: "Attacks", skills: ["SQL Injection", "XSS", "MITM", "Phishing"] },
            { category: "Defense", skills: ["Firewalls", "Endpoint Security", "Incident Response"] },
            { category: "Cloud Security", skills: ["AWS", "Azure", "GCP"] }
        ]),
        roadmapUrl: "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/cyber-security/cyber-security.json"
    },
    {
        name: "UI/UX Designer",
        description: "Proiectează experiențe digitale intuitive și plăcute vizual, punând utilizatorul în centrul procesului de design.",
        skillsRequired: JSON.stringify([
            { category: "UX Fundamentals", skills: ["User Research", "User Personas", "User Journey"] },
            { category: "Design", skills: ["Wireframing", "Prototyping", "Interaction Design"] },
            { category: "Tools", skills: ["Figma", "Adobe XD", "Sketch"] },
            { category: "Design Principles", skills: ["Usability", "Accessibility", "Design Systems"] },
            { category: "Testing", skills: ["A/B Testing", "Usability Testing"] }
        ]),
        roadmapUrl: "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/ux-design/ux-design.json"
    },
    {
        name: "Software Architect",
        description: "Proiectează arhitectura sistemelor software complexe, alege tehnologiile potrivite și definește pattern-urile de design.",
        skillsRequired: JSON.stringify([
            { category: "Architecture", skills: ["System Design", "Cloud Architecture", "Microservices"] },
            { category: "Design Patterns", skills: ["Design Patterns"] },
            { category: "APIs", skills: ["REST API", "GraphQL"] },
            { category: "Databases", skills: ["SQL", "NoSQL"] },
            { category: "Infrastructure", skills: ["Docker", "Kubernetes", "AWS"] },
            { category: "DevOps", skills: ["CI/CD"] }
        ]),
        roadmapUrl: "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/software-architect/software-architect.json"
    }
];

async function main() {
    console.log("🗑️  Ștergem datele vechi...");

    // Ștergem în ordine (foreign keys)
    await prisma.userQuizResult.deleteMany({});
    await prisma.quizQuestion.deleteMany({});
    await prisma.career.deleteMany({});

    console.log("✅ Tabele curățate.\n");

    console.log("📥 Inserăm cele 12 nișe IT structurate...\n");

    for (const career of CAREERS) {
        const created = await prisma.career.create({ data: career });
        const parsed = JSON.parse(career.skillsRequired);
        const totalSkills = parsed.reduce((acc, cat) => acc + cat.skills.length, 0);
        console.log(`   ✅ ${created.name} (${parsed.length} categorii, ${totalSkills} skill-uri)`);
    }

    console.log("\n🎉 Toate cele 12 nișe au fost inserate cu succes!");
    console.log("   Poți verifica în Prisma Studio (http://localhost:5555)");

    await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
