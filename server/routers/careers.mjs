import express from 'express';
import fs from 'fs';
import pkg from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
const { PrismaClient } = pkg;
import { requireAuth } from '../middleware/auth.mjs';
import SKILL_DESCRIPTIONS from '../skill-descriptions.mjs';

const router = express.Router();
const prisma = new PrismaClient();

// Endpoint simplu: returnează descrierea + cursuri recomandate fără AI
router.get('/skill-info', requireAuth, async (req, res) => {
    const { skillName } = req.query;
    if (!skillName) return res.status(400).json({ error: 'Lipsă parametru skillName' });

    const description = SKILL_DESCRIPTIONS[skillName] || `${skillName} este o competență tehnică importantă în domeniul IT.`;
    const encoded = encodeURIComponent(skillName);

    // Verificăm dacă avem detalii cache-uite în DB (de la generări anterioare cu AI)
    let cachedResources = null;
    try {
        cachedResources = await prisma.roadmapDetail.findUnique({ where: { title: skillName } });
    } catch (e) { /* ignorăm */ }

    if (cachedResources) {
        return res.json({
            title: skillName,
            description,
            freeResources: JSON.parse(cachedResources.freeResources || '[]'),
            premiumResources: JSON.parse(cachedResources.premiumResources || '[]'),
            completed: false
        });
    }

    // Fallback: generăm link-uri directe de căutare (0 AI, instant)
    res.json({
        title: skillName,
        description,
        freeResources: [
            { type: "Video", label: `Tutoriale ${skillName} (YouTube)`, url: `https://www.youtube.com/results?search_query=${encoded}+tutorial+for+beginners` },
            { type: "Documentație", label: `Documentație oficială ${skillName}`, url: `https://www.google.com/search?q=${encoded}+official+documentation` },
            { type: "Articol", label: `Ghid complet ${skillName}`, url: `https://www.google.com/search?q=${encoded}+complete+guide` }
        ],
        premiumResources: [
            { platform: "Udemy", label: `Cursuri ${skillName} pe Udemy`, url: `https://www.udemy.com/courses/search/?q=${encoded}` },
            { platform: "Coursera", label: `Cursuri ${skillName} pe Coursera`, url: `https://www.coursera.org/search?query=${encoded}` }
        ],
        completed: false
    });
});

// Helper pentru validarea unui skill tehnic (eliminăm orice sună a întrebare or explicație)
const isActualSkill = (label) => {
    if (!label) return false;
    const lower = label.toLowerCase().trim();
    if (lower.length < 2 || lower.length > 40) return false;
    if (lower.includes('?')) return false;

    const trash = [
        'roadmap.sh', 'contributing', 'credits', 'license', 'github', 'subscribe', 'follow', 'click here',
        'vertical node', 'horizontal node', 'group', 'how does', 'what is', 'internet', 'browser',
        'basic', 'learn', 'making a', 'repo', 'hosting', 'dns', 'domain', 'servers', 'read more',
        'click', 'visit', 'article', 'video', 'watch', 'vs ', 'difference'
    ];
    if (trash.some(t => lower.includes(t))) return false;

    return true;
};

const extractRoadmapSkills = (data) => {
    if (!data || !data.nodes) return [];
    return data.nodes
        .filter(node => node.data && node.data.label && isActualSkill(node.data.label))
        .map(node => node.data.label);
};

const buildOrderedRoadmap = (data, userSkills) => {
    if (!data || !data.nodes) return [];
    const nodes = data.nodes.filter(n => n.data && n.data.label && isActualSkill(n.data.label));
    const edges = data.edges || [];
    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);

    const inDegree = {};
    nodes.forEach(n => inDegree[n.id] = 0);
    edges.forEach(e => { if (inDegree[e.target] !== undefined) inDegree[e.target]++; });

    let queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
    let orderedIds = [];
    while (queue.length > 0) {
        let currentId = queue.shift();
        orderedIds.push(currentId);
        edges.filter(e => e.source === currentId).forEach(e => {
            if (inDegree[e.target] !== undefined) {
                inDegree[e.target]--;
                if (inDegree[e.target] === 0) queue.push(e.target);
            }
        });
    }

    // Acceptăm topic, subtopic și uneori noduri simple
    const mainTopics = orderedIds
        .map(id => nodeMap[id])
        .filter(n => n && (n.type === 'topic' || n.type === 'subtopic' || n.type === 'checkpoint' || n.type === 'skill'));

    return mainTopics.slice(0, 80).map(mainNode => {
        const subNodeIds = edges.filter(e => e.source === mainNode.id).map(e => e.target);
        const subSteps = nodes
            .filter(n => subNodeIds.includes(n.id))
            .map(n => ({
                title: n.data.label,
                completed: userSkills.includes(n.data.label.toLowerCase())
            }));

        return {
            title: mainNode.data.label,
            type: (mainNode.type === 'topic' || mainNode.type === 'subtopic') ? 'topic' : 'checkpoint',
            description: subSteps.length > 0 ? `${subSteps.filter(s => s.completed).length}/${subSteps.length} competențe` : "Concept esențial",
            completed: userSkills.includes(mainNode.data.label.toLowerCase()) || (subSteps.length > 0 && subSteps.every(s => s.completed)),
            subSteps
        };
    });
};

const logToFile = (msg) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync('server_debug.log', `[${timestamp}] ${msg}\n`);
};

// Configurare Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Listare toate carierele target
router.get('/', requireAuth, async (req, res) => {
    try {
        const careers = await prisma.career.findMany();
        res.json(careers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare preluare cariere' });
    }
});

// ==========================================
// RĂSPUNSURI PREDEFINITE (0 tokeni consumați)
// ==========================================
const PREDEFINED_RESPONSES = {
    // Salutări
    'salut': 'Salut! Sunt asistentul tău de carieră IT. Te pot ajuta cu sfaturi despre tehnologii, parcursuri de învățare sau orientare profesională. Ce te interesează?',
    'buna': 'Bună! Cu ce te pot ajuta astăzi în legătură cu cariera ta în IT?',
    'hello': 'Hello! Sunt aici să te ajut cu orientarea ta profesională în domeniul IT. Ce întrebări ai?',
    'hey': 'Hey! Sunt asistentul tău de carieră. Întreabă-mă orice legat de tehnologii, skill-uri sau parcursuri profesionale.',
    'hi': 'Hi! Cu ce te pot ajuta în legătură cu parcursul tău profesional în IT?',
    'ce faci': 'Sunt bine, mulțumesc! Sunt gata să te ajut cu orice întrebare legată de cariera ta în IT.',
    'cine esti': 'Sunt un asistent virtual de carieră IT, integrat în aplicația MobileSkillApp. Te pot ajuta cu sfaturi personalizate despre tehnologii, parcursuri de învățare și orientare profesională.',
    
    // Întrebări generale despre carieră
    'ce limbaje sa invat': 'Depinde de direcția ta. Pentru Frontend: JavaScript/TypeScript sunt esențiale. Pentru Backend: Node.js, Python sau Java sunt foarte căutate. Pentru Mobile: Kotlin (Android) sau Swift (iOS), sau React Native/Flutter pentru cross-platform. Recomandarea mea: începe cu JavaScript, este versatil și cerut pe piață.',
    'ce framework sa invat': 'Cele mai cerute framework-uri în 2024-2025 sunt: React (frontend web), Next.js (fullstack), React Native sau Flutter (mobile), Express/NestJS (backend Node.js), Spring Boot (backend Java). Alege în funcție de cariera pe care o vizezi.',
    'cum sa fac un cv': 'Un CV bun în IT trebuie să conțină: 1) Datele de contact și un link GitHub/LinkedIn. 2) Skill-urile tehnice grupate pe categorii. 3) Proiectele personale cu descrieri scurte și link-uri. 4) Experiența profesională (dacă există). 5) Educația. Păstrează CV-ul pe maxim 2 pagini și adaptează-l pentru fiecare job.',
    'cum sa ma pregatesc de interviu': 'Pentru un interviu tehnic: 1) Exersează probleme pe LeetCode/HackerRank. 2) Revizuiește conceptele fundamentale (structuri de date, algoritmi). 3) Pregătește-te să explici proiectele tale. 4) Studiază compania și produsele lor. 5) Pregătește întrebări pentru intervievator. 6) Fă mock interviews cu prieteni sau pe platforme online.',
    'cat castiga un programator': 'Salariile variază mult în funcție de nivel și tehnologie. În România (2024-2025): Junior: 3.000-6.000 RON net, Mid-level: 6.000-12.000 RON net, Senior: 12.000-20.000+ RON net. Domeniile cele mai bine plătite sunt: Cloud/DevOps, AI/ML, și Full-Stack Development.',
    
    // Cursuri și resurse de învățare
    'cursuri': 'Cele mai bune platforme pentru cursuri IT sunt: 1) Udemy - cursuri practice și accesibile. 2) Coursera - cursuri universitare certificate. 3) freeCodeCamp - complet gratuit. 4) YouTube - tutoriale gratuite de calitate. 5) Pluralsight - pentru profesioniști. Recomandarea mea: începe cu resurse gratuite, apoi investește în cursuri Udemy la reduceri.',
    'ce cursuri sa fac': 'Depinde de direcția ta: Pentru Web Development recomand "The Web Developer Bootcamp" (Udemy). Pentru React: cursurile lui Maximilian Schwarzmüller. Pentru Python: "100 Days of Code" de Angela Yu. Pentru baze de date: "The Complete SQL Bootcamp". Vizitează secțiunea de Roadmap din aplicație pentru recomandări personalizate!',
    'recomanda cursuri': 'Îți recomand să verifici secțiunea de Roadmap din aplicație - acolo vei găsi resurse personalizate pe baza skill-urilor tale. Platforme de top: Udemy (cursuri practice), Coursera (certificate universitare), freeCodeCamp (gratuit), și YouTube pentru tutoriale rapide.',
    'resurse': 'Resurse gratuite de top: 1) freeCodeCamp.org - curriculum complet de web dev. 2) The Odin Project - parcurs complet full-stack. 3) MDN Web Docs - referință web. 4) JavaScript.info - ghid JS modern. 5) YouTube (Traversy Media, Net Ninja, Fireship). Verifică și secțiunea de Roadmap din aplicație!',
    'de unde sa invat': 'Poți învăța gratuit de pe: freeCodeCamp, The Odin Project, MDN Web Docs, YouTube (Traversy Media, Net Ninja). Pentru cursuri plătite: Udemy (așteptă reducerile la 10-15€), Coursera, și Pluralsight. Cel mai important: practică zilnic și construiește proiecte reale!',
    
    // Sfaturi pentru începători
    'sunt incepator': 'Bine ai venit în lumea IT! Îți recomand să începi cu: 1) HTML + CSS (2-3 săptămâni). 2) JavaScript basics (1-2 luni). 3) Un framework (React, sau React Native pentru mobile). 4) Git pentru control versiuni. Cel mai important: codează zilnic, chiar și 30 de minute, și construiește proiecte mici.',
    'de unde sa incep': 'Începe cu fundamentele: 1) Învață HTML și CSS pentru structura web. 2) Treci la JavaScript pentru logică. 3) Alege o direcție (Frontend, Backend sau Mobile). 4) Învață un framework popular (React, Node.js, etc). 5) Construiește proiecte și pune-le pe GitHub. Folosește roadmap-ul din aplicație pentru un parcurs structurat!',
    'ce sa invat primul': 'Ordinea recomandată: 1) HTML + CSS (baza web-ului). 2) JavaScript (limbajul esențial). 3) Git & GitHub (controlul versiunilor). 4) Un framework (React pentru frontend, Node.js pentru backend). 5) O bază de date (SQL sau MongoDB). Roadmap-ul din aplicație te poate ghida pas cu pas!',
    
    // Cariere specifice
    'frontend developer': 'Pentru Frontend Developer ai nevoie de: HTML, CSS, JavaScript, un framework (React/Vue/Angular), responsive design, Git, și cunoștințe de UI/UX. Salariu mediu în România: 5.000-15.000 RON net. Este una dintre cele mai accesibile cariere pentru începători.',
    'backend developer': 'Pentru Backend Developer ai nevoie de: un limbaj server (Node.js, Python, Java), baze de date (SQL + NoSQL), API-uri REST, autentificare/securitate, și cunoștințe de server/deploy. Salariu mediu în România: 6.000-18.000 RON net.',
    'fullstack developer': 'Full-Stack Developer combină frontend + backend. Ai nevoie de: HTML/CSS/JS, un framework frontend (React), un framework backend (Node.js/Express), baze de date, Git, și deploy basics. Este cel mai versatil rol, foarte cerut pe piață.',
    'mobile developer': 'Pentru Mobile Developer: React Native sau Flutter pentru cross-platform, sau Swift (iOS) / Kotlin (Android) pentru nativ. Ai nevoie și de: API integration, state management, și UI/UX mobile. Piața mobilă este în continuă creștere!',
    'devops engineer': 'DevOps Engineer necesită: Linux, Docker, Kubernetes, CI/CD (GitHub Actions/Jenkins), cloud (AWS/Azure/GCP), scripting (Bash/Python), monitoring, și Infrastructure as Code (Terraform). Este una dintre cele mai bine plătite specializări IT.',
    
    // Portofoliu și proiecte
    'portofoliu': 'Un portofoliu bun trebuie să conțină: 1) 3-5 proiecte variate care demonstrează skill-uri diferite. 2) Cod curat pe GitHub cu README-uri detaliate. 3) Un site personal cu prezentarea proiectelor. 4) Link-uri live funcționale. Calitatea bate cantitatea - un proiect bine făcut valorează mai mult decât 10 proiecte simple.',
    'ce proiecte sa fac': 'Proiecte recomandate: 1) Un to-do list (basics). 2) O aplicație de vreme cu API extern. 3) Un blog/portfolio personal. 4) Un clone al unei aplicații cunoscute (Twitter, Spotify). 5) O aplicație full-stack cu autentificare. Pune tot pe GitHub și documentează bine!',
    
    // Piața muncii
    'cum sa gasesc un job': 'Pași pentru a găsi un job în IT: 1) Construiește un portofoliu solid pe GitHub. 2) Optimizează-ți profilul LinkedIn. 3) Aplică pe: LinkedIn, BestJobs, eJobs, Hipo.ro. 4) Participă la meetup-uri și hackathoane. 5) Exersează interviuri tehnice pe LeetCode. 6) Nu te descuraja de respingeri - persistența contează!',
    'linkedin': 'Pentru un profil LinkedIn bun: 1) Adaugă o poză profesională. 2) Scrie un headline clar (ex: "Junior Frontend Developer | React | JavaScript"). 3) Detaliază proiectele în secțiunea Experience. 4) Adaugă skill-uri și cere endorsements. 5) Postează conținut tehnic regulat. 6) Conectează-te cu recruiteri din domeniu.',
    
    // Freelancing
    'freelancing': 'Pentru freelancing în IT: 1) Construiește mai întâi experiență (6-12 luni). 2) Creează un portofoliu impresionant. 3) Începe pe platforme ca Upwork, Fiverr, sau Toptal. 4) Setează-ți prețuri competitive la început. 5) Construiește relații pe termen lung cu clienții. Avantaje: flexibilitate și venituri potențial mai mari.',
    
    // Ajutor aplicație
    'cum functioneaza aplicatia': 'MobileSkillApp te ajută în 4 pași: 1) Încarcă-ți CV-ul pentru analiză automată cu AI. 2) Alege o carieră țintă și vizualizează roadmap-ul de competențe. 3) Evaluează-ți nivelul prin self-assessment și quiz-uri tehnice. 4) Urmărește tendințele pieței IT. Eu, asistentul AI, sunt aici să te ghidez pe tot parcursul!',
    'ajutor': 'Te pot ajuta cu: 1) Informații despre tehnologii (întreabă "ce este React?"). 2) Sfaturi de carieră (întreabă "cum să găsesc un job?"). 3) Recomandări de cursuri (întreabă "ce cursuri să fac?"). 4) Ghidare pentru începători (întreabă "de unde să încep?"). 5) Informații despre salarii și piața muncii. Întreabă orice!',
    
    // Frontend
    'ce este react': 'React este o bibliotecă JavaScript dezvoltată de Meta (Facebook) pentru construirea interfețelor utilizator. Se bazează pe componente reutilizabile și un Virtual DOM eficient. Este cel mai popular framework frontend, cu o comunitate vastă și multe resurse de învățare.',
    'ce este angular': 'Angular este un framework TypeScript dezvoltat de Google pentru aplicații web de tip SPA (Single Page Application). Oferă o arhitectură completă cu routing, forms, HTTP client și dependency injection incluse. Este foarte utilizat în mediul enterprise.',
    'ce este vue': 'Vue.js este un framework JavaScript progresiv pentru interfețe web. Este apreciat pentru curba de învățare ușoară, documentația excelentă și flexibilitatea sa. Combină cele mai bune idei din React și Angular.',
    
    // Backend
    'ce este node.js': 'Node.js este un mediu de execuție JavaScript pe server, construit pe motorul V8 al Chrome. Permite dezvoltarea de aplicații backend rapide și scalabile. Este ideal pentru aplicații real-time, API-uri REST și microservicii.',
    'ce este express': 'Express.js este cel mai popular framework web pentru Node.js. Oferă o sintaxă minimalistă pentru crearea de servere HTTP, routing, middleware și API-uri REST. Este baza multor aplicații web moderne.',
    'ce este python': 'Python este un limbaj de programare versatil, cunoscut pentru sintaxa clară și lizibilă. Este foarte folosit în: dezvoltare web (Django, Flask), data science, machine learning, automatizare și scripting.',
    
    // Baze de date
    'ce este sql': 'SQL (Structured Query Language) este limbajul standard pentru interacțiunea cu bazele de date relaționale. Permite crearea, citirea, actualizarea și ștergerea datelor. Cele mai populare baze de date SQL sunt: PostgreSQL, MySQL și SQLite.',
    'ce este mongodb': 'MongoDB este o bază de date NoSQL orientată pe documente. Salvează datele în format JSON-like (BSON), oferind flexibilitate în structura datelor. Este foarte populară în stiva MERN (MongoDB, Express, React, Node.js).',
    
    // DevOps
    'ce este docker': 'Docker este o platformă de containerizare care permite împachetarea aplicațiilor împreună cu toate dependențele lor. Containerele Docker asigură că aplicația rulează identic pe orice mediu (development, testing, production).',
    'ce este git': 'Git este cel mai folosit sistem de control al versiunilor. Permite urmărirea modificărilor în cod, colaborarea în echipă și gestionarea ramurilor de dezvoltare. GitHub și GitLab sunt platforme populare bazate pe Git.',
    
    // Mulțumiri / Închidere
    'multumesc': 'Cu plăcere! Dacă mai ai întrebări despre cariera ta în IT, nu ezita să mă întrebi.',
    'mersi': 'Cu drag! Sunt aici oricând ai nevoie de sfaturi legate de cariera ta.',
    'pa': 'La revedere! Succes în parcursul tău profesional! 🚀',
    'la revedere': 'La revedere! Îți doresc mult succes în cariera ta IT!'
};

// Funcție pentru normalizarea textului (pentru cache și matching)
const normalizeQuestion = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[?!.,;:'"]/g, '')       // eliminăm punctuația
        .replace(/\s+/g, ' ')              // normalizăm spațiile
        .replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i')
        .replace(/ș/g, 's').replace(/ț/g, 't'); // normalizăm diacriticele
};

// ==========================================
// MATCHING PE CUVINTE CHEIE / SUBIECTE
// ==========================================
// Dacă cineva menționează „react" în orice formă, returnăm info despre React
const TOPIC_RESPONSES = {
    'react': 'React este o bibliotecă JavaScript dezvoltată de Meta (Facebook) pentru construirea interfețelor utilizator. Se bazează pe componente reutilizabile și un Virtual DOM eficient. Este cel mai popular framework frontend, cu o comunitate vastă și foarte cerut pe piața muncii.',
    'angular': 'Angular este un framework TypeScript dezvoltat de Google pentru aplicații web de tip SPA. Oferă o arhitectură completă cu routing, forms, HTTP client și dependency injection incluse. Este foarte utilizat în mediul enterprise.',
    'vue': 'Vue.js este un framework JavaScript progresiv pentru interfețe web. Este apreciat pentru curba de învățare ușoară, documentația excelentă și flexibilitatea sa.',
    'node': 'Node.js este un mediu de execuție JavaScript pe server, construit pe motorul V8 al Chrome. Permite dezvoltarea de aplicații backend rapide și scalabile, fiind ideal pentru API-uri REST și microservicii.',
    'express': 'Express.js este cel mai popular framework web pentru Node.js. Oferă o sintaxă minimalistă pentru routing, middleware și API-uri REST. Este baza multor aplicații web moderne.',
    'python': 'Python este un limbaj de programare versatil, folosit în dezvoltare web (Django, Flask), data science, machine learning, automatizare și scripting. Are o sintaxă clară și o comunitate imensă.',
    'java': 'Java este un limbaj de programare orientat pe obiecte, foarte folosit în aplicații enterprise, Android development și sisteme backend. Este cunoscut pentru portabilitate și ecosistemul vast (Spring Boot, Maven).',
    'javascript': 'JavaScript este limbajul principal al web-ului. Rulează atât în browser (frontend) cât și pe server (Node.js). Este esențial pentru orice dezvoltator web și are un ecosistem enorm de framework-uri și librării.',
    'typescript': 'TypeScript este un superset al JavaScript-ului care adaugă tipizare statică. Previne multe erori de cod înainte de runtime și este foarte popular în proiecte mari. Este folosit de Angular, și tot mai mult cu React și Node.js.',
    'sql': 'SQL (Structured Query Language) este limbajul standard pentru bazele de date relaționale. Permite crearea, citirea, actualizarea și ștergerea datelor. Cele mai populare baze de date SQL sunt: PostgreSQL, MySQL și SQLite.',
    'mongodb': 'MongoDB este o bază de date NoSQL orientată pe documente. Salvează datele în format JSON-like, oferind flexibilitate în structura datelor. Este populară în stiva MERN (MongoDB, Express, React, Node.js).',
    'docker': 'Docker este o platformă de containerizare care permite împachetarea aplicațiilor cu toate dependențele lor. Asigură că aplicația rulează identic pe orice mediu (dev, testing, production).',
    'git': 'Git este cel mai folosit sistem de control al versiunilor. Permite urmărirea modificărilor, colaborarea în echipă și gestionarea ramurilor de dezvoltare. GitHub și GitLab sunt platforme populare bazate pe Git.',
    'kubernetes': 'Kubernetes (K8s) este o platformă open-source pentru orchestrarea containerelor Docker la scară mare. Automatizează deployment-ul, scalarea și gestionarea aplicațiilor containerizate.',
    'flutter': 'Flutter este un framework de la Google pentru dezvoltarea de aplicații mobile cross-platform (iOS + Android) dintr-un singur cod sursă. Folosește limbajul Dart și oferă performanță nativă.',
    'react native': 'React Native este un framework de la Meta pentru aplicații mobile cross-platform folosind JavaScript/React. Permite reutilizarea logicii între iOS și Android, cu performanță apropiată de nativ.',
    'next': 'Next.js este un framework React pentru aplicații web fullstack. Oferă server-side rendering, generare statică, routing bazat pe fișiere și API routes integrate. Este foarte popular în producție.',
    'css': 'CSS (Cascading Style Sheets) este limbajul pentru stilizarea paginilor web. Definește layout-ul, culorile, fonturile și animațiile. Tehnologii moderne includ Flexbox, Grid, și preprocesoare ca Sass.',
    'html': 'HTML (HyperText Markup Language) este limbajul de bază al web-ului, folosit pentru structurarea conținutului paginilor. Este primul lucru pe care trebuie să-l înveți pentru dezvoltare web.',
    'tailwind': 'Tailwind CSS este un framework CSS utility-first care permite stilizarea directă în HTML prin clase predefinite. Accelerează dezvoltarea UI și oferă un design consistent.',
    'prisma': 'Prisma este un ORM modern pentru Node.js și TypeScript. Simplifica interacțiunea cu baza de date prin tipizare automată, migrări și un query builder intuitiv. Suportă PostgreSQL, MySQL, SQLite și MongoDB.',
    'firebase': 'Firebase este o platformă de la Google care oferă backend-as-a-service: autentificare, baze de date real-time (Firestore), hosting, cloud functions și notificări push. Ideal pentru prototipare rapidă.',
    'aws': 'AWS (Amazon Web Services) este cea mai mare platformă de cloud computing. Oferă sute de servicii: EC2 (servere), S3 (stocare), Lambda (serverless), RDS (baze de date) și multe altele.',
    'linux': 'Linux este un sistem de operare open-source esențial pentru orice developer. Majoritatea serverelor web rulează pe Linux. Comanda terminalului și Bash scripting sunt skill-uri fundamentale.',
    'rest': 'REST (Representational State Transfer) este un stil arhitectural pentru API-uri web. Folosește metode HTTP (GET, POST, PUT, DELETE) pentru a manipula resurse. Este standardul dominant pentru comunicarea client-server.',
    'graphql': 'GraphQL este un limbaj de interogare pentru API-uri, dezvoltat de Meta. Spre deosebire de REST, permite clientului să ceară exact datele de care are nevoie, reducând transferul inutil de date.',
    'redis': 'Redis este o bază de date in-memory folosită ca cache, broker de mesaje și stocaj temporar. Este extrem de rapidă și foarte utilizată pentru a îmbunătăți performanța aplicațiilor.',
    'ci/cd': 'CI/CD (Continuous Integration / Continuous Deployment) automatizează testarea și livrarea codului. Instrumente populare: GitHub Actions, Jenkins, GitLab CI. Este esențial în DevOps.',
    'devops': 'DevOps este o cultură și un set de practici care combină dezvoltarea (Dev) cu operațiunile IT (Ops). Include CI/CD, containerizare (Docker), orchestrare (Kubernetes) și monitorizare.',
    'machine learning': 'Machine Learning este o ramură a inteligenței artificiale care permite computerelor să învețe din date. Biblioteci populare: TensorFlow, PyTorch, scikit-learn. Python este limbajul dominant.',
    'ai': 'Inteligența Artificială (AI) cuprinde tehnici care permit computerelor să simuleze inteligența umană: procesare de limbaj natural, viziune computerizată, machine learning. Este unul dintre cele mai căutate domenii IT.',
    
    // Cuvinte cheie de carieră/învățare
    'curs': 'Cele mai bune platforme pentru cursuri IT sunt: Udemy (cursuri practice și accesibile), Coursera (certificate universitare), freeCodeCamp (complet gratuit), și YouTube. Verifică și secțiunea de Roadmap din aplicație pentru recomandări personalizate pe baza skill-urilor tale!',
    'recomand': 'Îți recomand să verifici secțiunea de Roadmap din aplicație - acolo vei găsi resurse personalizate. Platforme de top: Udemy (practice), Coursera (certificate), freeCodeCamp (gratuit), YouTube (tutoriale rapide). Întreabă-mă despre o tehnologie specifică pentru mai multe detalii!',
    'job': 'Pentru a găsi un job în IT: 1) Construiește un portofoliu pe GitHub. 2) Optimizează LinkedIn. 3) Aplică pe LinkedIn, BestJobs, eJobs, Hipo.ro. 4) Participă la meetup-uri. 5) Exersează pe LeetCode. Persistența contează!',
    'salariu': 'Salarii IT în România (2024-2025): Junior: 3.000-6.000 RON net, Mid: 6.000-12.000 RON, Senior: 12.000-20.000+ RON. Cele mai bine plătite domenii: Cloud/DevOps, AI/ML, Full-Stack, și Security.',
    'interviu': 'Pentru un interviu tehnic: 1) Exersează pe LeetCode/HackerRank. 2) Revizuiește structuri de date și algoritmi. 3) Pregătește-te să explici proiectele tale. 4) Studiază compania. 5) Fă mock interviews. Încrederea vine cu practica!',
    'incepator': 'Bine ai venit în IT! Începe cu: 1) HTML + CSS (2-3 săptămâni). 2) JavaScript (1-2 luni). 3) Un framework (React). 4) Git. Codează zilnic, chiar și 30 min, și construiește proiecte mici. Roadmap-ul din aplicație te ghidează pas cu pas!',
    'portofoliu': 'Un portofoliu bun: 1) 3-5 proiecte variate pe GitHub. 2) README-uri detaliate. 3) Un site personal. 4) Link-uri live funcționale. Calitatea bate cantitatea - un proiect bine făcut valorează mai mult decât 10 simple.',
    'freelance': 'Pentru freelancing: 1) Construiește experiență (6-12 luni). 2) Portofoliu impresionant. 3) Platforme: Upwork, Fiverr, Toptal. 4) Prețuri competitive la început. 5) Relații pe termen lung cu clienții.',
};

// Funcție pentru a găsi cel mai bun răspuns predefinit
const findPredefinedResponse = (question) => {
    const normalized = normalizeQuestion(question);
    
    // 1. Căutare exactă în dicționarul principal
    if (PREDEFINED_RESPONSES[normalized]) {
        return PREDEFINED_RESPONSES[normalized];
    }
    
    // 2. Căutare parțială – dacă întrebarea conține o frază cheie din dicționar
    for (const [key, response] of Object.entries(PREDEFINED_RESPONSES)) {
        const normalizedKey = normalizeQuestion(key);
        if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
            return response;
        }
    }
    
    // 3. Căutare pe TOPIC (cuvinte cheie de tehnologii) — cea mai inteligentă
    //    "spune-mi despre react", "vreau sa invat react", "react ce e?" → toate dau match
    for (const [topic, response] of Object.entries(TOPIC_RESPONSES)) {
        const normalizedTopic = normalizeQuestion(topic);
        // Verificăm dacă cuvântul cheie apare ca un cuvânt separat în întrebare
        const words = normalized.split(' ');
        if (words.includes(normalizedTopic) || normalized.includes(normalizedTopic)) {
            return response;
        }
    }
    
    return null;
};

// Chat AI personalizat via Gemini (cu cache + răspunsuri predefinite)
router.post('/ai-chat', requireAuth, async (req, res) => {
    try {
        const { careerId, messages } = req.body;
        const userId = req.userId;
        const lastUserMessage = messages[messages.length - 1].content;
        const careerKey = careerId || 'general';
        
        logToFile(`-> Chat cerut de user ${userId} pentru cariera ${careerKey}`);

        // ============ PASUL 1: Verifică răspunsuri predefinite (0 tokeni) ============
        const predefinedReply = findPredefinedResponse(lastUserMessage);
        if (predefinedReply) {
            console.log("[PREDEFINED] Răspuns returnat din dicționar, fără consum API.");
            return res.json({ reply: predefinedReply });
        }

        // ============ PASUL 2: Verifică cache-ul din baza de date ============
        const cacheKey = normalizeQuestion(lastUserMessage);
        try {
            const cached = await prisma.chatCache.findUnique({
                where: { questionKey: cacheKey }
            });
            if (cached) {
                console.log("[CACHE] Răspuns returnat din cache, fără consum API.");
                return res.json({ reply: cached.response });
            }
        } catch (e) { /* cache miss, continuăm */ }

        // ============ PASUL 3: Apel Gemini API (cu context minim) ============
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { skills: true }
        });

        if (!user) return res.status(404).json({ error: 'Utilizator negăsit' });

        const userSkillsList = user.skills.map(s => s.name).join(', ') || "niciunul momentan";
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        let systemContext = `Ești un consilier de carieră IT. Context: Utilizatorul are competențele: [${userSkillsList}]. `;

        if (careerKey !== 'general' && !isNaN(parseInt(careerKey))) {
            const career = await prisma.career.findUnique({ where: { id: parseInt(careerKey) } });
            if (career) systemContext += `Se orientează către rolul de [${career.name}]. `;
        }

        systemContext += `Răspunde scurt (maxim 3-4 propoziții), profesional, în română. Fără emoji.`;

        // Trimitem DOAR ultimul mesaj, nu toată conversația → mai puțini tokeni
        const prompt = `${systemContext}\n\nÎntrebare: ${lastUserMessage}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // ============ PASUL 4: Salvăm răspunsul în cache ============
        try {
            await prisma.chatCache.create({
                data: {
                    questionKey: cacheKey,
                    careerId: String(careerKey),
                    response: responseText
                }
            });
            console.log("[AI+CACHE] Răspuns generat cu AI și salvat în cache.");
        } catch (e) {
            // Dacă deja există (race condition), ignorăm
            console.log("[AI] Răspuns generat cu AI (cache skip - deja exista).");
        }

        res.json({ reply: responseText });

    } catch (error) {
        logToFile(`EROARE CHAT AI: ${error.status} - ${error.message}`);
        console.error("Eroare Gemini Chat:", error.status, error.message);

        // În loc de eroare, returnăm un răspuns util de fallback
        const fallbackReplies = [
            'Momentan procesez multe cereri simultan. Între timp, îți recomand să explorezi secțiunea de Roadmap pentru a vedea parcursul tău de învățare, sau să verifici secțiunea de Tendințe pentru a descoperi ce tehnologii sunt cele mai cerute pe piață.',
            'Sunt în pauză de procesare! Până revin, poți să îți analizezi CV-ul din secțiunea de Profil sau să parcurgi quiz-urile tehnice pentru a-ți evalua cunoștințele.',
            'Procesez foarte multe cereri în acest moment. Te invit să explorezi roadmap-ul de carieră personalizat sau să verifici tendințele pieței IT din aplicație.',
        ];
        const fallbackReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];

        res.json({ reply: fallbackReply });
    }
});

// Gap Analysis: Compara skill-urile userului cu cele cerute de o cariera
router.post('/gap-analysis', requireAuth, async (req, res) => {
    try {
        const { careerId } = req.body;
        const userId = req.userId;

        // 1. Gaseste cariera tinta
        const career = await prisma.career.findUnique({
            where: { id: parseInt(careerId) }
        });

        if (!career) {
            return res.status(404).json({ error: 'Cariera nu a fost găsită' });
        }

        // 2. Gaseste userul si skill-urile lui deja extrase
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                skills: {
                    include: { skill: true }
                }
            }
        });

        // 3. Extragere skills necesare pentru carieră
        let requiredSkills = [];
        let parsedSkillTree = [];
        try {
            parsedSkillTree = JSON.parse(career.skillsRequired);
            requiredSkills = parsedSkillTree.flatMap(categoryObj => categoryObj.skills);
        } catch (e) {
            requiredSkills = career.skillsRequired.split(',').map(s => s.trim());
        }

        // 4. Calcul Scor Ponderat (Weighted Match)
        const levelWeights = {
            'Beginner': 0.4,
            'Intermediate': 0.8,
            'Advanced': 1.0
        };

        const userSkillsMap = {};
        if (user && user.skills) {
            user.skills.forEach(us => {
                if (us.skill && us.skill.name) {
                    userSkillsMap[us.skill.name.toLowerCase()] = us.level || 'Beginner';
                }
            });
        }

        let totalScore = 0;
        const matchingSkills = [];
        const missingSkills = [];

        if (requiredSkills && Array.isArray(requiredSkills)) {
            for (const skill of requiredSkills) {
                if (!skill) continue;
                const skillLabel = String(skill);
                const userLevel = userSkillsMap[skillLabel.toLowerCase()];
                if (userLevel) {
                    matchingSkills.push(skillLabel);
                    totalScore += levelWeights[userLevel] || 0.8;
                } else {
                    missingSkills.push(skillLabel);
                }
            }
        }

        // Sortăm: Advanced > Intermediate > Beginner
        const levelOrder = { 'Advanced': 3, 'Intermediate': 2, 'Beginner': 1 };
        matchingSkills.sort((a, b) => {
            const lA = levelOrder[userSkillsMap[a.toLowerCase()]] || 0;
            const lB = levelOrder[userSkillsMap[b.toLowerCase()]] || 0;
            return lB - lA;
        });

        const percentMatch = (requiredSkills && requiredSkills.length > 0)
            ? Math.round((totalScore / requiredSkills.length) * 100)
            : 0;

        const userSkillNames = Object.keys(userSkillsMap);



        // 4. Generăm un Roadmap dinamic foarte curat
        let roadmapSteps = [];

        // PĂRERE UTILIZATOR: Folosim arborele logic structurat (cel cu "Fundamentals", "Frameworks" etc.) în loc de tot gunoiul de noduri brute!
        if (parsedSkillTree && parsedSkillTree.length > 0) {
            roadmapSteps = parsedSkillTree.map((category, idx) => {
                const categoryMatches = category.skills.filter(s => userSkillNames.includes(s.toLowerCase()));
                const isCompleted = categoryMatches.length === category.skills.length && category.skills.length > 0;

                // Generăm o descriere mai utilă bazată pe numele categoriei
                const catLower = category.category.toLowerCase();
                let catDesc;
                if (catLower.includes('fundamental') || catLower.includes('basics') || catLower.includes('basic')) catDesc = "Baza teoretică și conceptele fundamentale necesare pentru a progresa.";
                else if (catLower.includes('frontend') || catLower.includes('front-end') || catLower.includes('ui')) catDesc = "Tehnologii pentru crearea interfețelor utilizator moderne și responsive.";
                else if (catLower.includes('backend') || catLower.includes('back-end') || catLower.includes('server')) catDesc = "Logica de server, baze de date și API-uri pentru aplicații robuste.";
                else if (catLower.includes('tool') || catLower.includes('vcs') || catLower.includes('git')) catDesc = "Instrumente de productivitate, controlul versiunilor și colaborare în echipă.";
                else if (catLower.includes('testing') || catLower.includes('qa') || catLower.includes('test')) catDesc = "Asigurarea calității codului prin testare automată și manuală.";
                else if (catLower.includes('architect') || catLower.includes('design pattern') || catLower.includes('system design')) catDesc = "Principii de proiectare software, design patterns și arhitecturi scalabile.";
                else if (catLower.includes('database') || catLower.includes('sql') || catLower.includes('nosql') || catLower.includes('db')) catDesc = "Gestionarea și interogarea bazelor de date relaționale și NoSQL.";
                else if (catLower.includes('devops') || catLower.includes('cloud') || catLower.includes('deploy') || catLower.includes('infra')) catDesc = "Automatizare, containerizare și livrare continuă a aplicațiilor în cloud.";
                else if (catLower.includes('mobile') || catLower.includes('android') || catLower.includes('ios')) catDesc = "Dezvoltarea aplicațiilor mobile native sau cross-platform.";
                else if (catLower.includes('security') || catLower.includes('auth') || catLower.includes('cyber')) catDesc = "Securitatea aplicațiilor, autentificare și protecția datelor.";
                else if (catLower.includes('design') || catLower.includes('ux') || catLower.includes('figma')) catDesc = "Designul interfețelor și experiența utilizatorului (UI/UX).";
                else if (catLower.includes('data') || catLower.includes('analytics') || catLower.includes('bi')) catDesc = "Analiza datelor, vizualizare și extragerea de insight-uri valoroase.";
                else if (catLower.includes('machine learning') || catLower.includes('ai') || catLower.includes('ml') || catLower.includes('deep learning')) catDesc = "Algoritmi de machine learning, rețele neuronale și inteligență artificială.";
                else if (catLower.includes('framework')) catDesc = "Framework-uri și librarii moderne pentru accelerarea dezvoltării.";
                else if (catLower.includes('language') || catLower.includes('programming')) catDesc = "Limbaje de programare și paradigme de scriere a codului.";
                else catDesc = `Competențe din categoria ${category.category} necesare pentru acest rol.`;

                return {
                    title: category.category || `Etapa ${idx + 1}`,
                    description: catDesc,
                    progressInfo: `${categoryMatches.length}/${category.skills.length} competențe`,
                    completed: isCompleted,
                    subSteps: category.skills.map(skillLabel => ({
                        title: skillLabel,
                        completed: userSkillNames.includes(skillLabel.toLowerCase())
                    }))
                };
            });
        } else {
            // Fallback la lista plată simplă dacă e doar comma separated
            // ... rest of levels logic ...
            // Fallback pentru structura cu "levels"
            roadmapSteps = [
                { title: "Evaluare Inițială", description: `Ai deja ${matchingSkills.length} din ${requiredSkills.length} competențe cheie pentru ${career.name}.`, completed: true },
                ...missingSkills.slice(0, 5).map((s, idx) => ({
                    title: `Învățare ${s}`,
                    description: `Skill esențial pentru rol.`,
                    completed: false
                }))
            ];
        }

        // 5. Generăm recomandări de cursuri via AI pentru skill-urile care lipsesc
        let recommendedCourses = [];
        if (missingSkills.length > 0) {
            const topMissingSkills = missingSkills.slice(0, 5).sort();
            const cacheKey = `${career.name}|${topMissingSkills.join(',')}`;

            try {
                // Verificăm cache-ul
                const cachedCourses = await prisma.courseRecommendationCache.findUnique({
                    where: { cacheKey }
                });

                if (cachedCourses) {
                    console.log(`[CACHE] Serving course recommendations for: ${cacheKey}`);
                    recommendedCourses = JSON.parse(cachedCourses.coursesJson);
                } else {
                    console.log(`[AI] Cache miss. Generating courses for: ${cacheKey}`);
                    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                    const topMissingStr = topMissingSkills.join(', ');
                    const coursePrompt = `User needs skills for ${career.name}: [${topMissingStr}]. 
                    Recommend 3 real courses (Udemy/Coursera). Return ONLY JSON array: [{"title": "Course Name", "platform": "Udemy", "link": "https://..."}]`;

                    const result = await model.generateContent(coursePrompt);
                    const aiText = result.response.text();
                    const cleanJson = aiText.replace(/```json|```/g, '').trim();
                    recommendedCourses = JSON.parse(cleanJson);

                    // Salvăm în cache
                    await prisma.courseRecommendationCache.create({
                        data: {
                            cacheKey,
                            coursesJson: JSON.stringify(recommendedCourses)
                        }
                    });
                }
            } catch (aiErr) {
                console.error("Eroare recomandări cursuri:", aiErr);
                recommendedCourses = missingSkills.slice(0, 3).map(skill => ({
                    title: `Curs intensiv de ${skill}`,
                    platform: "Udemy",
                    link: `https://www.udemy.com/courses/search/?q=${skill}`
                }));
            }
        }

        res.json({
            careerName: career.name,
            matchingSkills: matchingSkills.slice(0, 10), // Limităm pentru UI-ul mobil
            missingSkills: missingSkills.slice(0, 10),
            percentMatch,
            recommendedCourses,
            roadmapSteps
        });


    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare analiza gap' });
    }
});

// Salvare curs pe profilul utilizatorului
router.post('/save-course', requireAuth, async (req, res) => {
    try {
        let { title, platform, link } = req.body;
        const userId = req.userId;

        // Fallback-uri de protecție ca să nu crăpăm Prisma
        title = title || "Resursă necunoscută";
        platform = platform || "Online";
        link = link || "N/A";

        let course = await prisma.course.findFirst({
            where: { link: link }
        });

        if (!course) {
            course = await prisma.course.create({
                data: { title, platform, link, category: 'saved' }
            });
        }

        // Conectăm cursul la utilizator
        await prisma.user.update({
            where: { id: userId },
            data: {
                savedCourses: {
                    connect: { id: course.id }
                }
            }
        });

        res.json({ message: 'Curs salvat cu succes' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare la salvarea cursului' });
    }
});

// Ștergere curs de pe profil
router.delete('/unsave-course', requireAuth, async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.userId;

        await prisma.user.update({
            where: { id: userId },
            data: {
                savedCourses: {
                    disconnect: { id: courseId }
                }
            }
        });

        res.json({ message: 'Curs eliminat' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare la eliminarea cursului' });
    }
});

// Listare cursuri salvate de utilizator
router.get('/my-courses', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { savedCourses: true }
        });
        res.json({ courses: user?.savedCourses || [] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare la preluarea cursurilor' });
    }
});

// Baza de date locală cu resurse pentru skill-uri comune (folosită fără AI)
const commonSkillsDB = {
    'html': {
        free: [
            { type: 'Documentație', label: 'Documentație oficială MDN HTML - Referință completă', url: 'https://developer.mozilla.org/ro/docs/Web/HTML' },
            { type: 'Video', label: 'HTML de la zero - Crash Course complet (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE' }
        ],
        premium: [
            { platform: 'Udemy', label: 'The Web Developer Bootcamp - HTML, CSS și JS complet', url: 'https://www.udemy.com/course/the-web-developer-bootcamp/' },
            { platform: 'Coursera', label: 'HTML, CSS și JavaScript pentru Web Developers (Johns Hopkins)', url: 'https://www.coursera.org/learn/html-css-javascript-for-web-developers' }
        ]
    },
    'semantic html': {
        free: [
            { type: 'Documentație', label: 'HTML Semantic Elements - MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Semantics' },
            { type: 'Video', label: 'HTML Semantic Elements Explained (Kevin Powell)', url: 'https://www.youtube.com/watch?v=kGW8Al_cga4' }
        ],
        premium: [
            { platform: 'Udemy', label: 'The Web Developer Bootcamp - Structura semantică HTML', url: 'https://www.udemy.com/course/the-web-developer-bootcamp/' },
            { platform: 'Coursera', label: 'Introduction to HTML5 (Michigan University)', url: 'https://www.coursera.org/learn/html' }
        ]
    },
    'css': {
        free: [
            { type: 'Documentație', label: 'Ghid CSS complet pe MDN Web Docs', url: 'https://developer.mozilla.org/ro/docs/Web/CSS' },
            { type: 'Video', label: 'CSS Flexbox și Grid - Tutorial vizual complet (Kevin Powell)', url: 'https://www.youtube.com/@KevinPowell' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Advanced CSS and Sass: Flexbox, Grid, Animations', url: 'https://www.udemy.com/course/advanced-css-and-sass/' },
            { platform: 'Coursera', label: 'Responsive Web Design with CSS (Michigan University)', url: 'https://www.coursera.org/learn/introcss' }
        ]
    },
    'responsive design': {
        free: [
            { type: 'Documentație', label: 'Responsive Design - Ghid complet MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design' },
            { type: 'Video', label: 'Responsive Web Design - Tutoriale practice (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=srvUrASNj0s' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Advanced CSS and Sass - Responsive Design Mastery', url: 'https://www.udemy.com/course/advanced-css-and-sass/' },
            { platform: 'Coursera', label: 'Responsive Website Basics (University of London)', url: 'https://www.coursera.org/learn/website-coding' }
        ]
    },
    'javascript': {
        free: [
            { type: 'Documentație', label: 'JavaScript.info - Ghidul modern și complet al JS', url: 'https://javascript.info/' },
            { type: 'Video', label: 'JavaScript Full Course pentru beginners (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg' }
        ],
        premium: [
            { platform: 'Udemy', label: 'The Complete JavaScript Course: From Zero to Expert (Jonas Schmedtmann)', url: 'https://www.udemy.com/course/the-complete-javascript-course/' },
            { platform: 'Coursera', label: 'JavaScript pentru Programatori Web (Duke University)', url: 'https://www.coursera.org/learn/javascript-jquery-json' }
        ]
    },
    'typescript': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială TypeScript - Handbook complet', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
            { type: 'Video', label: 'TypeScript Tutorial complet pentru beginners (Net Ninja)', url: 'https://www.youtube.com/watch?v=2pZmKW9-I_k' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Understanding TypeScript - 2024 Edition (Maximilian)', url: 'https://www.udemy.com/course/understanding-typescript/' },
            { platform: 'Coursera', label: 'Full-Stack Web Development with React + TypeScript', url: 'https://www.coursera.org/specializations/full-stack-react' }
        ]
    },
    'react': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială React.dev - Noul ghid interactiv', url: 'https://react.dev/learn' },
            { type: 'Video', label: 'React în 12 ore - Curs complet 2024 (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=b9eMGE7QtTk' }
        ],
        premium: [
            { platform: 'Udemy', label: 'React - The Complete Guide 2024 (Maximilian Schwarzmüller)', url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/' },
            { platform: 'Coursera', label: 'Front-End Web Development with React (Hong Kong University)', url: 'https://www.coursera.org/learn/front-end-react' }
        ]
    },
    'angular': {
        free: [
            { type: 'Documentație', label: 'Tour of Heroes - Tutorial oficial Angular (angular.dev)', url: 'https://angular.dev/tutorials/learn-angular' },
            { type: 'Video', label: 'Angular Crash Course 2024 - De la zero la aplicație reală', url: 'https://www.youtube.com/watch?v=3dHNOWTI7H8' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Angular - The Complete Guide 2024 (Maximilian)', url: 'https://www.udemy.com/course/the-complete-guide-to-angular-2/' },
            { platform: 'Coursera', label: 'Front-End JavaScript Frameworks: Angular (Hong Kong Univ)', url: 'https://www.coursera.org/learn/angular' }
        ]
    },
    'vue.js': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Vue.js 3 - Guide complet', url: 'https://vuejs.org/guide/introduction.html' },
            { type: 'Video', label: 'Vue.js 3 Tutorial complet pentru beginners (Net Ninja)', url: 'https://www.youtube.com/watch?v=YrxBCBibVo0' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Vue - The Complete Guide (incl. Vuex) - Maximilian', url: 'https://www.udemy.com/course/vuejs-2-the-complete-guide/' },
            { platform: 'Coursera', label: 'Vue.js Essential Training (LinkedIn Learning)', url: 'https://www.coursera.org/learn/vue-js' }
        ]
    },
    'svelte': {
        free: [
            { type: 'Documentație', label: 'Tutorial oficial Svelte.dev - Interactiv in browser', url: 'https://svelte.dev/tutorial/basics' },
            { type: 'Video', label: 'Svelte Crash Course 2024 - De la zero la aplicație (Traversy)', url: 'https://www.youtube.com/watch?v=UGBJHYpHPvA' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Svelte & SvelteKit: The Complete Guide', url: 'https://www.udemy.com/courses/search/?q=svelte&sort=highest-rated' },
            { platform: 'Coursera', label: 'Modern JavaScript Frameworks - Svelte Track', url: 'https://www.coursera.org/courses?query=svelte' }
        ]
    },
    'next.js': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Next.js - Tutoriale și API docs', url: 'https://nextjs.org/docs' },
            { type: 'Video', label: 'Next.js 14 Crash Course - App Router și Server Actions', url: 'https://www.youtube.com/watch?v=wm5gMKuwSYk' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Next.js 14 & React - The Complete Guide (Maximilian)', url: 'https://www.udemy.com/course/nextjs-react-the-complete-guide/' },
            { platform: 'Coursera', label: 'Full-Stack Web Development cu Next.js și React', url: 'https://www.coursera.org/learn/nextjs' }
        ]
    },
    'tailwind css': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Tailwind CSS - Toate clasele', url: 'https://tailwindcss.com/docs' },
            { type: 'Video', label: 'Tailwind CSS Crash Course - De la zero (Traversy Media)', url: 'https://www.youtube.com/watch?v=dFgzHOX84xQ' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Tailwind CSS: De la zero la aplicații Professional', url: 'https://www.udemy.com/courses/search/?q=tailwind+css&sort=highest-rated' },
            { platform: 'Coursera', label: 'Modern CSS cu Tailwind - Curs Profesional', url: 'https://www.coursera.org/courses?query=tailwind+css' }
        ]
    },
    'sass': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Sass - Ghid și referință', url: 'https://sass-lang.com/guide/' },
            { type: 'Video', label: 'Sass Tutorial complet pentru beginners (Net Ninja)', url: 'https://www.youtube.com/watch?v=St5B7hnMLjg' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Advanced CSS and Sass: Flexbox, Grid, Animations & More!', url: 'https://www.udemy.com/course/advanced-css-and-sass/' },
            { platform: 'Coursera', label: 'CSS Preprocessors: Sass and Less', url: 'https://www.coursera.org/courses?query=sass' }
        ]
    },
    'git': {
        free: [
            { type: 'Documentație', label: 'Pro Git Book - Ghidul oficial complet și gratuit', url: 'https://git-scm.com/book/en/v2' },
            { type: 'Video', label: 'Git și GitHub pentru beginners - Crash Course (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=RGOj5yH7evk' }
        ],
        premium: [
            { platform: 'Udemy', label: 'The Complete Git Guide: Understand and Master Git and GitHub', url: 'https://www.udemy.com/course/git-github-practical-guide/' },
            { platform: 'Coursera', label: 'Version Control cu Git (Atlassian/Bitbucket)', url: 'https://www.coursera.org/learn/version-control-with-git' }
        ]
    },
    'npm': {
        free: [
            { type: 'Documentație', label: 'Documentația NPM - Ghidul oficial al pachetelor JS', url: 'https://docs.npmjs.com/' },
            { type: 'Video', label: 'NPM Crash Course - Tot ce trebuie să știi (Traversy Media)', url: 'https://www.youtube.com/watch?v=jHDhaSSKmB0' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Node.js și NPM: Complete Developer Guide', url: 'https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/' },
            { platform: 'Coursera', label: 'Node.js for Beginners - Gestionarea pachetelor NPM', url: 'https://www.coursera.org/learn/server-side-nodejs' }
        ]
    },
    'jest': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Jest - Getting Started', url: 'https://jestjs.io/docs/getting-started' },
            { type: 'Video', label: 'Jest Testing Tutorial - JavaScript Unit Testing (Traversy)', url: 'https://www.youtube.com/watch?v=7r4xVDI2vho' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Testing JavaScript cu Jest și Testing Library', url: 'https://www.udemy.com/courses/search/?q=jest+testing&sort=highest-rated' },
            { platform: 'Coursera', label: 'Software Testing și QA cu JavaScript', url: 'https://www.coursera.org/courses?query=javascript+testing' }
        ]
    },
    'cypress': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Cypress.io - E2E Testing', url: 'https://docs.cypress.io/guides/getting-started/introduction' },
            { type: 'Video', label: 'Cypress E2E Testing Tutorial complet (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=u8vMu7viCm8' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Cypress Testing: E2E Automation Testing Masterclass', url: 'https://www.udemy.com/courses/search/?q=cypress+testing&sort=highest-rated' },
            { platform: 'Coursera', label: 'Test Automation cu Cypress - Curs Profesional', url: 'https://www.coursera.org/courses?query=cypress' }
        ]
    },
    'python': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Python.org - Tutorial și Referință', url: 'https://docs.python.org/3/tutorial/' },
            { type: 'Video', label: 'Python pentru beginners - Curs complet 6 ore (Mosh Hamedani)', url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc' }
        ],
        premium: [
            { platform: 'Udemy', label: '100 Days of Code: The Complete Python Pro Bootcamp (Angela Yu)', url: 'https://www.udemy.com/course/100-days-of-code/' },
            { platform: 'Coursera', label: 'Python for Everybody Specialization (Michigan University)', url: 'https://www.coursera.org/specializations/python' }
        ]
    },
    'java': {
        free: [
            { type: 'Documentație', label: 'Oracle Java Documentation - Tutoriale oficiale Java', url: 'https://docs.oracle.com/en/java/' },
            { type: 'Video', label: 'Java Full Course pentru beginners - Curs complet (Mosh)', url: 'https://www.youtube.com/watch?v=eIrMbAQSU34' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Java Programming Masterclass - Updated to Java 17 (Tim Buchalka)', url: 'https://www.udemy.com/course/java-the-complete-java-developer-course/' },
            { platform: 'Coursera', label: 'Java Programming and Software Engineering Fundamentals (Duke)', url: 'https://www.coursera.org/specializations/java-programming' }
        ]
    },
    'go': {
        free: [
            { type: 'Documentație', label: 'Tour of Go - Tutorial interactiv oficial Golang', url: 'https://go.dev/tour/welcome/1' },
            { type: 'Video', label: 'Go (Golang) Tutorial complet pentru beginners (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=un6ZyFkqFKo' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Go: The Complete Developer\'s Guide (Golang)', url: 'https://www.udemy.com/course/go-the-complete-developers-guide/' },
            { platform: 'Coursera', label: 'Programming with Google Go Specialization (UC Irvine)', url: 'https://www.coursera.org/specializations/google-golang' }
        ]
    },
    'node.js': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Node.js - Ghid și API Reference', url: 'https://nodejs.org/en/docs/' },
            { type: 'Video', label: 'Node.js Crash Course comlet - REST API din zero (Traversy Media)', url: 'https://www.youtube.com/watch?v=fBNz5xF-Kx4' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Node.js, Express, MongoDB & More: The Complete Bootcamp', url: 'https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/' },
            { platform: 'Coursera', label: 'Server-side Development cu NodeJS, Express și MongoDB (HK Univ)', url: 'https://www.coursera.org/learn/server-side-nodejs' }
        ]
    },
    'rest api': {
        free: [
            { type: 'Documentație', label: 'REST API Tutorial - Ghid complet cu exemple practice', url: 'https://restfulapi.net/' },
            { type: 'Video', label: 'REST API Explained - Cum funcționează și cum îl construiești', url: 'https://www.youtube.com/watch?v=lsMQRaeKNDk' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Node.js API Masterclass cu Express și MongoDB', url: 'https://www.udemy.com/course/nodejs-api-masterclass/' },
            { platform: 'Coursera', label: 'APIs (IBM Full Stack Developer Certificate)', url: 'https://www.coursera.org/learn/ibm-api-connect' }
        ]
    },
    'graphql': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială GraphQL.org - Introducere și spec', url: 'https://graphql.org/learn/' },
            { type: 'Video', label: 'GraphQL Crash Course cu Node.js - Tutorial complet (Traversy)', url: 'https://www.youtube.com/watch?v=BcLNfwF04Kw' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Modern GraphQL with React - Full-stack Bootcamp', url: 'https://www.udemy.com/course/graphql-with-react-course/' },
            { platform: 'Coursera', label: 'Building GraphQL APIs - Curs Profesional', url: 'https://www.coursera.org/search?query=graphql' }
        ]
    },
    'postgresql': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială PostgreSQL - Manual complet', url: 'https://www.postgresql.org/docs/' },
            { type: 'Video', label: 'PostgreSQL Tutorial complet pentru beginners (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=qw--VYLpxG4' }
        ],
        premium: [
            { platform: 'Udemy', label: 'SQL și PostgreSQL: The Complete Developer\'s Guide', url: 'https://www.udemy.com/course/sql-and-postgresql/' },
            { platform: 'Coursera', label: 'Introduction to SQL cu PostgreSQL (Michigan University)', url: 'https://www.coursera.org/learn/intro-sql' }
        ]
    },
    'mysql': {
        free: [
            { type: 'Documentație', label: 'MySQL Documentation - Ghidul oficial și reference', url: 'https://dev.mysql.com/doc/' },
            { type: 'Video', label: 'MySQL Tutorial complet pentru beginners (Programming with Mosh)', url: 'https://www.youtube.com/watch?v=7S_tz1z_5bA' }
        ],
        premium: [
            { platform: 'Udemy', label: 'The Ultimate MySQL Bootcamp: Go from SQL Beginner to Expert', url: 'https://www.udemy.com/course/the-ultimate-mysql-bootcamp-go-from-sql-beginner-to-expert/' },
            { platform: 'Coursera', label: 'Database Management Essentials (University of Colorado)', url: 'https://www.coursera.org/learn/database-management' }
        ]
    },
    'mongodb': {
        free: [
            { type: 'Documentație', label: 'MongoDB University - Cursuri oficiale gratuite online', url: 'https://university.mongodb.com/' },
            { type: 'Video', label: 'MongoDB Crash Course - Tutorial complet (Traversy Media)', url: 'https://www.youtube.com/watch?v=-56x56UppqQ' }
        ],
        premium: [
            { platform: 'Udemy', label: 'MongoDB - The Complete Developer\'s Guide (Maximilian)', url: 'https://www.udemy.com/course/mongodb-the-complete-developers-guide/' },
            { platform: 'Coursera', label: 'Database Management cu MongoDB și Node.js', url: 'https://www.coursera.org/learn/mongodb' }
        ]
    },
    'redis': {
        free: [
            { type: 'Documentație', label: 'Redis Documentation - Ghid oficial Getting Started', url: 'https://redis.io/docs/getting-started/' },
            { type: 'Video', label: 'Redis Crash Course - Tutorial complet (Traversy Media)', url: 'https://www.youtube.com/watch?v=jgpVdJB2sKQ' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Redis: The Complete Developer\'s Guide (Stephen Grider)', url: 'https://www.udemy.com/course/redis-the-complete-developers-guide-p/' },
            { platform: 'Coursera', label: 'Caching și Performance cu Redis', url: 'https://www.coursera.org/courses?query=redis' }
        ]
    },
    'sql': {
        free: [
            { type: 'Documentație', label: 'SQLZoo - Practice interactivă SQL direct în browser', url: 'https://sqlzoo.net/' },
            { type: 'Video', label: 'SQL Tutorial complet pentru beginners (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY' }
        ],
        premium: [
            { platform: 'Udemy', label: 'The Complete SQL Bootcamp: Go from Zero to Hero', url: 'https://www.udemy.com/course/the-complete-sql-bootcamp/' },
            { platform: 'Coursera', label: 'SQL for Data Science - Curs Specializat (UC Davis)', url: 'https://www.coursera.org/learn/sql-for-data-science' }
        ]
    },
    'docker': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Docker - Get Started Guide', url: 'https://docs.docker.com/get-started/' },
            { type: 'Video', label: 'Docker Tutorial complet pentru beginners (TechWorld with Nana)', url: 'https://www.youtube.com/watch?v=3c-iBn73dDE' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Docker & Kubernetes: The Practical Guide 2024', url: 'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/' },
            { platform: 'Coursera', label: 'Containerized Applications on AWS (Amazon Web Services)', url: 'https://www.coursera.org/learn/containerized-apps-on-aws' }
        ]
    },
    'kubernetes': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Kubernetes.io - Concepte și tutoriale', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/' },
            { type: 'Video', label: 'Kubernetes Tutorial Complet pentru beginners (TechWorld with Nana)', url: 'https://www.youtube.com/watch?v=X48VuDVv0do' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Kubernetes: Practical Guide 2024 (Docker & Kubernetes)', url: 'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/' },
            { platform: 'Coursera', label: 'Getting Started with Google Kubernetes Engine (Google Cloud)', url: 'https://www.coursera.org/learn/google-kubernetes-engine' }
        ]
    },
    'ci/cd': {
        free: [
            { type: 'Documentație', label: 'GitHub Actions Documentation - Creare pipeline CI/CD gratuit', url: 'https://docs.github.com/en/actions' },
            { type: 'Video', label: 'CI/CD Pipeline Tutorial - GitHub Actions de la zero (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=R8_veQiYBjI' }
        ],
        premium: [
            { platform: 'Udemy', label: 'DevOps Projects: 20 Real-Time DevOps Projects (CI/CD)', url: 'https://www.udemy.com/course/devopsprojects/' },
            { platform: 'Coursera', label: 'Continuous Delivery and DevOps (Virginia University)', url: 'https://www.coursera.org/learn/uva-darden-continous-delivery-devops' }
        ]
    },
    'aws': {
        free: [
            { type: 'Documentație', label: 'AWS Documentation - Ghiduri pentru toate serviciile', url: 'https://docs.aws.amazon.com/' },
            { type: 'Video', label: 'AWS Certified Cloud Practitioner - Curs complet gratuit (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=SOTamWNgDKc' }
        ],
        premium: [
            { platform: 'Udemy', label: 'AWS Certified Solutions Architect - Ultimate Guide (Stephane Maarek)', url: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/' },
            { platform: 'Coursera', label: 'AWS Cloud Technical Essentials (Amazon)', url: 'https://www.coursera.org/learn/aws-cloud-technical-essentials' }
        ]
    },
    'azure': {
        free: [
            { type: 'Documentație', label: 'Microsoft Learn - Azure Learning Paths gratuite', url: 'https://learn.microsoft.com/en-us/azure/' },
            { type: 'Video', label: 'Azure Tutorial complet pentru beginners (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=NKEFWyqJ5XA' }
        ],
        premium: [
            { platform: 'Udemy', label: 'AZ-900: Microsoft Azure Fundamentals - Complete Guide', url: 'https://www.udemy.com/course/az900-azure/' },
            { platform: 'Coursera', label: 'Microsoft Azure Fundamentals AZ-900 (Microsoft)', url: 'https://www.coursera.org/learn/microsoft-azure-fundamentals-az-900-certification' }
        ]
    },
    'linux': {
        free: [
            { type: 'Documentație', label: 'The Linux Command Line - Carte gratuită online completă', url: 'https://linuxcommand.org/tlcl.php' },
            { type: 'Video', label: 'Linux Command Line Tutorial complet - Bash Scripting (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=iwolPf6kN-k' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Linux Mastery: Master the Linux Command Line in 11.5 Hours', url: 'https://www.udemy.com/course/linux-mastery/' },
            { platform: 'Coursera', label: 'Linux and Private Cloud Administration (IBM)', url: 'https://www.coursera.org/professional-certificates/ibm-linux-private-cloud-admin' }
        ]
    },
    'bash': {
        free: [
            { type: 'Documentație', label: 'Bash Reference Manual - Documentație oficială GNU', url: 'https://www.gnu.org/software/bash/manual/' },
            { type: 'Video', label: 'Bash Scripting Tutorial complet pentru beginners (YouTube)', url: 'https://www.youtube.com/watch?v=e7BufAVwDiM' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Shell Scripting: Discover How to Automate Command Line Tasks', url: 'https://www.udemy.com/course/shell-scripting-linux/' },
            { platform: 'Coursera', label: 'Linux Commands and Shell Scripting (IBM)', url: 'https://www.coursera.org/learn/hands-on-introduction-to-linux-commands-and-shell-scripting' }
        ]
    },
    'terraform': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Terraform - Get Started', url: 'https://developer.hashicorp.com/terraform/tutorials' },
            { type: 'Video', label: 'Terraform Course pentru beginners - Infrastructure as Code (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=SLB_c_ayRMo' }
        ],
        premium: [
            { platform: 'Udemy', label: 'HashiCorp Certified: Terraform Associate - Complete Course', url: 'https://www.udemy.com/course/terraform-beginner-to-advanced/' },
            { platform: 'Coursera', label: 'Infrastructure as Code cu Terraform (Google Cloud)', url: 'https://www.coursera.org/learn/managing-infrastructure-with-terraform' }
        ]
    },
    'react native': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială React Native - Ghid și componente', url: 'https://reactnative.dev/docs/getting-started' },
            { type: 'Video', label: 'React Native Tutorial 2024 - Construiește aplicații mobile (Traversy)', url: 'https://www.youtube.com/watch?v=0-S5a0eXPoc' }
        ],
        premium: [
            { platform: 'Udemy', label: 'React Native - The Practical Guide 2024 (Maximilian)', url: 'https://www.udemy.com/course/react-native-the-practical-guide/' },
            { platform: 'Coursera', label: 'Developing Mobile Apps with React Native (Meta Professional)', url: 'https://www.coursera.org/learn/react-native-course' }
        ]
    },
    'flutter': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Flutter.dev - Ghid și Widget catalog', url: 'https://flutter.dev/docs' },
            { type: 'Video', label: 'Flutter Tutorial pentru beginners - Curs complet (Net Ninja)', url: 'https://www.youtube.com/watch?v=1ukSR1GRtMU' }
        ],
        premium: [
            { platform: 'Udemy', label: 'The Complete Flutter Development Bootcamp with Dart (Angela Yu)', url: 'https://www.udemy.com/course/flutter-bootcamp-with-dart/' },
            { platform: 'Coursera', label: 'Flutter Development - Google Mobile Framework (Coursera)', url: 'https://www.coursera.org/courses?query=flutter' }
        ]
    },
    'dart': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Dart.dev - Language Tour', url: 'https://dart.dev/guides/language/language-tour' },
            { type: 'Video', label: 'Dart Tutorial complet pentru beginners (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=Ej_Pcr4uC2Q' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Dart and Flutter: The Complete Developer\'s Guide (Stephen Grider)', url: 'https://www.udemy.com/course/dart-and-flutter-the-complete-developers-guide/' },
            { platform: 'Coursera', label: 'Programming with Dart (Google & Coursera)', url: 'https://www.coursera.org/courses?query=dart+programming' }
        ]
    },
    'kotlin': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Kotlin.org - Getting Started', url: 'https://kotlinlang.org/docs/getting-started.html' },
            { type: 'Video', label: 'Kotlin Tutorial complet pentru beginners (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=F9UC9DY-vIU' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Android Development với Kotlin: The Complete Guide', url: 'https://www.udemy.com/course/android-kotlin-developer/' },
            { platform: 'Coursera', label: 'Android App Development cu Kotlin (Meta Professional)', url: 'https://www.coursera.org/professional-certificates/meta-android-developer' }
        ]
    },
    'swift': {
        free: [
            { type: 'Documentație', label: 'Swift Documentation - The Swift Programming Language (Apple)', url: 'https://docs.swift.org/swift-book/' },
            { type: 'Video', label: 'iOS Development cu Swift - Curs complet (Angela Yu / freeCodeCamp)', url: 'https://www.youtube.com/watch?v=comQ1-x2a1Q' }
        ],
        premium: [
            { platform: 'Udemy', label: 'iOS & Swift: The Complete iOS App Development Bootcamp (Angela Yu)', url: 'https://www.udemy.com/course/ios-13-app-development-bootcamp/' },
            { platform: 'Coursera', label: 'iOS App Development cu Swift (University of Toronto)', url: 'https://www.coursera.org/learn/swift-programming' }
        ]
    },
    'firebase': {
        free: [
            { type: 'Documentație', label: 'Firebase Documentation - Ghid oficial Google Firebase', url: 'https://firebase.google.com/docs' },
            { type: 'Video', label: 'Firebase Tutorial complet - Auth, Firestore, Storage (Net Ninja)', url: 'https://www.youtube.com/watch?v=9zdvmgGsww0' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Firebase & Firestore Fundamentals for React developers', url: 'https://www.udemy.com/courses/search/?q=firebase&sort=highest-rated' },
            { platform: 'Coursera', label: 'Developing Applications with Google Cloud Firebase', url: 'https://www.coursera.org/courses?query=firebase' }
        ]
    },
    'figma': {
        free: [
            { type: 'Documentație', label: 'Figma Learn - Tutoriale și ghiduri oficiale Figma', url: 'https://help.figma.com/hc/en-us/categories/360002051613-Get-started' },
            { type: 'Video', label: 'Figma Tutorial complet pentru beginners - UI/UX Design (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=jwCmIBJ8Jtc' }
        ],
        premium: [
            { platform: 'Udemy', label: 'UI/UX Design Bootcamp cu Figma - De la zero la expert', url: 'https://www.udemy.com/course/ui-ux-web-design-using-adobe-xd/' },
            { platform: 'Coursera', label: 'UI/UX Design Specialization cu Figma (California Institute of Arts)', url: 'https://www.coursera.org/specializations/ui-ux-design' }
        ]
    },
    'pandas': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Pandas - 10 minutes to pandas', url: 'https://pandas.pydata.org/docs/user_guide/10min.html' },
            { type: 'Video', label: 'Pandas Tutorial complet - Data Analysis cu Python (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=r-uOLxNrNk8' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Python for Data Science and Machine Learning Bootcamp', url: 'https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/' },
            { platform: 'Coursera', label: 'Applied Data Science with Python Specialization (Michigan University)', url: 'https://www.coursera.org/specializations/data-science-python' }
        ]
    },
    'scikit-learn': {
        free: [
            { type: 'Documentație', label: 'Documentația oficială Scikit-learn - User Guide complet', url: 'https://scikit-learn.org/stable/user_guide.html' },
            { type: 'Video', label: 'Scikit-learn Crash Course - Machine Learning cu Python (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=0B5eIE_1vpU' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Machine Learning A-Z cu Python și R (Kirill Eremenko)', url: 'https://www.udemy.com/course/machinelearning/' },
            { platform: 'Coursera', label: 'Machine Learning Specialization (Andrew Ng - Stanford)', url: 'https://www.coursera.org/specializations/machine-learning-introduction' }
        ]
    },
    'postman': {
        free: [
            { type: 'Documentație', label: 'Postman Learning Center - Ghid oficial Postman', url: 'https://learning.postman.com/docs/getting-started/introduction/' },
            { type: 'Video', label: 'Postman Tutorial complet pentru testarea API-urilor (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=VywxIQ2ZXw4' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Postman: The Complete Guide - REST API Testing', url: 'https://www.udemy.com/course/postman-the-complete-guide/' },
            { platform: 'Coursera', label: 'API Testing cu Postman - Curs Profesional', url: 'https://www.coursera.org/courses?query=postman+api+testing' }
        ]
    },
    'state management': {
        free: [
            { type: 'Documentație', label: 'Redux Documentation - Ghid oficial State Management', url: 'https://redux.js.org/introduction/getting-started' },
            { type: 'Video', label: 'Redux Toolkit Tutorial complet (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=5yEG6GhoJBs' }
        ],
        premium: [
            { platform: 'Udemy', label: 'React Redux Full Stack 2024 - State Management Complet', url: 'https://www.udemy.com/courses/search/?q=redux+state+management&sort=highest-rated' },
            { platform: 'Coursera', label: 'Front-End Web Development - State Management cu React', url: 'https://www.coursera.org/courses?query=react+state+management' }
        ]
    },
    'design patterns': {
        free: [
            { type: 'Documentație', label: 'Refactoring.Guru - Catalog complet de Design Patterns', url: 'https://refactoring.guru/design-patterns' },
            { type: 'Video', label: 'Design Patterns in JavaScript - Curs complet (freeCodeCamp)', url: 'https://www.youtube.com/watch?v=BWprw8Nu4dY' }
        ],
        premium: [
            { platform: 'Udemy', label: 'Design Patterns in JavaScript: Complete Course', url: 'https://www.udemy.com/course/design-patterns-javascript/' },
            { platform: 'Coursera', label: 'Design Patterns Specialization (University of Alberta)', url: 'https://www.coursera.org/specializations/design-patterns' }
        ]
    }
};

// Endpoint pentru detalii despre un node din Roadmap (Resurse & Descriere) - ACUM CU CACHE
router.get('/roadmap-item-details', requireAuth, async (req, res) => {
    try {
        const { title, careerName } = req.query;
        if (!title) return res.status(400).json({ error: "Titlul este necesar" });

        // 1. Verificăm în baza de date dacă avem deja aceste detalii (Cachcing)
        const cached = await prisma.roadmapDetail.findUnique({
            where: { title: title }
        });

        if (cached) {
            console.log(`[CACHE] Serving details for: ${title}`);
            // Dacă avem cache dar fără descriere bună, înlocuim cu cea din SKILL_DESCRIPTIONS
            const localDesc = SKILL_DESCRIPTIONS[title] || SKILL_DESCRIPTIONS[title.toLowerCase()];
            return res.json({
                title: cached.title,
                description: localDesc || cached.description,
                freeResources: JSON.parse(cached.freeResources),
                premiumResources: JSON.parse(cached.premiumResources)
            });
        }

        // 2. Verificăm în baza de date locală (SKILL_DESCRIPTIONS + commonSkillsDB)
        const localDesc = SKILL_DESCRIPTIONS[title] || SKILL_DESCRIPTIONS[title.toLowerCase()];
        if (localDesc) {
            // Avem descriere locală - căutăm și resurse locale dacă există
            const normalizedTitle = title.toLowerCase().trim();
            const skillData = commonSkillsDB[normalizedTitle] ||
                commonSkillsDB[Object.keys(commonSkillsDB).find(k => normalizedTitle.includes(k) || k.includes(normalizedTitle))];

            if (skillData) {
                console.log(`[LOCAL] Serving from local DB for: ${title}`);
                return res.json({
                    title,
                    description: localDesc,
                    freeResources: skillData.free,
                    premiumResources: skillData.premium
                });
            }

            // Avem descriere dar nu resurse specifice - generăm resurse dinamice cu titluri sugestive
            const encoded = encodeURIComponent(title);
            console.log(`[LOCAL DESC] Serving local desc + dynamic resources for: ${title}`);
            return res.json({
                title,
                description: localDesc,
                freeResources: [
                    { type: 'Video', label: `${title} - Tutorial complet de la zero (YouTube)`, url: `https://www.youtube.com/results?search_query=${encoded}+full+course+for+beginners` },
                    { type: 'Documentație', label: `${title} - Documentație și ghid oficial`, url: `https://www.google.com/search?q=${encoded}+official+documentation` }
                ],
                premiumResources: [
                    { platform: 'Udemy', label: `${title} - Cel mai bine cotat curs complet`, url: `https://www.udemy.com/courses/search/?q=${encoded}&sort=highest-rated` },
                    { platform: 'Coursera', label: `${title} - Specializare cu Certificat Profesional`, url: `https://www.coursera.org/courses?query=${encoded}` }
                ]
            });
        }

        // 3. Nu am nimic local - apelăm AI pentru skill-uri necunoscute
        console.log(`[AI] Cache miss + no local data. Generating details for: ${title} (${careerName})`);

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `Ești un expert educațional IT. Oferă resurse de înaltă calitate pentru conceptul "${title}" în cadrul unei cariere de ${careerName || 'Software Developer'}.
        
        CERINȚE:
        1. "description": Descriere tehnică scurtă (max 250 caractere) în Română.
        2. "freeResources": 2-3 resurse oficiale sau de top (MDN, Web.dev, oficial docs, YouTube channels celebre).
        3. "premiumResources": 2 cursuri plătite de prestigiu (Udemy, Coursera, Pluralsight).
        
        Răspunde strict în JSON:
        {
          "title": "${title}",
          "description": "...",
          "freeResources": [{"type": "Documentation/Video", "label": "...", "url": "..."}],
          "premiumResources": [{"label": "...", "platform": "Udemy", "url": "..."}]
        }
        Resursele pot fi în Engleză.`;

        const result = await model.generateContent(prompt);
        const aiText = result.response.text();
        console.log(`[AI RAW] Response for ${title}:`, aiText);

        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Formatul răspunsului AI este invalid.");

        let details = JSON.parse(jsonMatch[0]);

        // Normalizare date (Afișare bună în Frontend)
        const normalizeResources = (list) => {
            if (!Array.isArray(list)) return [];
            return list.map(item => ({
                label: item.label || item.title || item.name || "Resursă",
                url: item.url || item.link || item.href || "#",
                type: item.type || "Link",
                platform: item.platform || null
            }));
        };

        details.freeResources = normalizeResources(details.freeResources || details.free_resources);
        details.premiumResources = normalizeResources(details.premiumResources || details.premium_resources);
        details.description = details.description || "Informații indisponibile.";

        // 2. Salvăm în DB
        await prisma.roadmapDetail.create({
            data: {
                title: details.title || title,
                description: details.description,
                freeResources: JSON.stringify(details.freeResources),
                premiumResources: JSON.stringify(details.premiumResources)
            }
        });

        res.json(details);
    } catch (error) {
        console.error("Eroare detalii roadmap:", error);

        // Fallback final - folosim baza de date locală la nivel de modul
        const titleFallback = req.query.title || "Acest subiect";
        const normalizedTitle = titleFallback.toLowerCase().trim();
        const localDescFallback = SKILL_DESCRIPTIONS[titleFallback] || SKILL_DESCRIPTIONS[normalizedTitle];

        let skillDataFallback = commonSkillsDB[normalizedTitle];
        if (!skillDataFallback) {
            const foundKey = Object.keys(commonSkillsDB).find(key => normalizedTitle.includes(key) || key.includes(normalizedTitle));
            if (foundKey) skillDataFallback = commonSkillsDB[foundKey];
        }

        const fallbackDesc = localDescFallback || skillDataFallback?.desc || `Competență esențială în dezvoltarea software modernă. Stăpânirea ${titleFallback} îți va deschide oportunități valoroase pe piața muncii.`;
        const freeRes = skillDataFallback?.free || [
            { type: 'Video', label: `${titleFallback} Tutorial Complet - Curs de la zero (YouTube)`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(titleFallback)}+full+course+for+beginners` },
            { type: 'Documentație', label: `${titleFallback} - Documentație și ghid oficial`, url: `https://www.google.com/search?q=${encodeURIComponent(titleFallback)}+official+documentation` }
        ];
        const premRes = skillDataFallback?.premium || [
            { platform: 'Udemy', label: `${titleFallback} - Cel mai bine cotat curs complet`, url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(titleFallback)}&sort=highest-rated` },
            { platform: 'Coursera', label: `${titleFallback} - Specializare și Certificat Profesional`, url: `https://www.coursera.org/courses?query=${encodeURIComponent(titleFallback)}` }
        ];

        res.json({
            title: titleFallback,
            description: fallbackDesc,
            freeResources: freeRes,
            premiumResources: premRes
        });
    }
});

export default router;
