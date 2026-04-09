import express from 'express';
import pkg from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// pdfjs-dist (build legacy) pentru extragere text din PDF-uri, inclusiv LaTeX
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
// fileURLToPath + path.resolve pentru path-uri absolute (evita probleme cu spatii si ../ pe Windows)
const __cvRouterDir = fileURLToPath(new URL('.', import.meta.url));
const __serverRoot = path.resolve(__cvRouterDir, '..');  // server/ = ../ fata de routers/
const __workerSrc = pathToFileURL(path.resolve(__serverRoot, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
const __standardFontDataUrl = pathToFileURL(path.resolve(__serverRoot, 'node_modules/pdfjs-dist/standard_fonts')).href + '/';
pdfjsLib.GlobalWorkerOptions.workerSrc = __workerSrc;

const { PrismaClient } = pkg;
import { requireAuth } from '../middleware/auth.mjs';

const logToFile = (msg) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync('server_debug.log', `[${timestamp}] ${msg}\n`);
};

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// Listă extinsă de competențe tehnice (Master List)
const KNOWN_SKILLS = [
    // Limbaje de programare
    'C', 'C++', 'C#', 'JavaScript', 'TypeScript', 'Python', 'Java', 'SQL', 'PL/SQL', 'Bash', 'PHP', 'Swift', 'Kotlin', 'Rust', 'Dart', 'Scala', 'Assembly', 'MATLAB', 'Go', 'Ruby', 'PowerShell',
    // Frameworks & Libraries
    'React', 'React Native', 'Node.js', 'Express', 'Angular', 'Vue.js', 'Next.js', 'Nuxt.js', 'NestJS', 'Laravel', 'Spring Boot', 'Django', 'Flask', 'FastAPI', 'Flutter', 'Redux', 'Tailwind', 'Bootstrap', 'Svelte', 'AdonisJS', 'Expo',
    // AI / Data Science
    'Electron', 'Unity', 'Unreal Engine', 'TensorFlow', 'PyTorch', 'OpenCV', 'Pandas', 'NumPy', 'Scikit-learn', 'Keras', 'Spacy', 'HuggingFace',
    // Web & Design
    'HTML', 'CSS', 'Sass', 'Less', 'Figma',
    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'CI/CD', 'Git', 'GitHub', 'GitLab', 'Firebase', 'Netlify', 'Vercel', 'Ansible', 'CircleCI', 'TravisCI',
    // Baze de date & Backend
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Oracle', 'SQLite', 'MariaDB', 'DynamoDB', 'Cassandra', 'Neo4j', 'Snowflake', 'BigQuery', 'Supabase',
    // Unelte & Altele
    'GraphQL', 'Microservices', 'Linux', '.NET', 'ASP.NET', 'Power BI', 'Tableau', 'Salesforce', 'SAP', 'WebSockets', 'WebRTC', 'Postman', 'Arduino', 'Mixly'
];

// Helper pentru validare "Common Sense"
const isValidSkillFormat = (label) => {
    if (!label) return false;
    const lower = label.toLowerCase().trim();
    // Permitem lungime 1 special pentru "C" sau alte limbaje/tehnologii foarte scurte
    if (lower.length < 1 || lower.length > 35) return false;
    // Nu acceptăm propoziții
    if (label.split(' ').length > 4) return false;
    // Nu acceptăm întrebări sau caractere dubioase
    if (/[?!=]/.test(label)) return false;

    const trash = ['evaluare', 'test', 'question', 'answer', 'roadmap', 'click', 'visit', 'video', 'article', 'tutorial', 'course', 'curs', 'încearcă'];
    if (trash.some(t => lower.includes(t))) return false;

    return true;
};

// --- ENDPOINT: Sugestii de skill-uri (pentru Auto-complete) ---
router.get('/suggest-skills', requireAuth, async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 1) return res.json({ suggestions: [] });

    const search = q.toLowerCase();
    const suggestions = KNOWN_SKILLS
        .filter(s => s.toLowerCase().includes(search))
        .slice(0, 10); // Returnăm max 10 sugestii

    res.json({ suggestions });
});

router.post('/upload', requireAuth, upload.single('cvFile'), async (req, res) => {
    logToFile(`--- CERERE NOUĂ /upload (User: ${req.userId}) ---`);
    try {
        let cvText = '';
        let extractedSkills = [];
        const userId = req.userId;

        if (req.file) {
            logToFile(`Fișier primit: ${req.file.originalname} (${req.file.size} bytes)`);
            const buffer = req.file.buffer;

            let rawText = "";
            try {
                // Folosim pdfjs-dist (legacy build) care suportă PDF-uri LaTeX și alte formate complexe
                const uint8Array = new Uint8Array(buffer);
                const loadingTask = pdfjsLib.getDocument({
                    data: uint8Array,
                    isEvalSupported: false,
                    standardFontDataUrl: __standardFontDataUrl
                });
                const pdfDoc = await loadingTask.promise;
                const numPages = pdfDoc.numPages;
                const pages = [];
                for (let i = 1; i <= numPages; i++) {
                    const page = await pdfDoc.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    pages.push(pageText);
                }
                rawText = pages.join('\n');
                logToFile(`PDF extras cu succes (pdfjs): ${rawText.length} caractere, ${numPages} pagini`);
            } catch (pdfErr) {
                logToFile(`Eroare pdfjs: ${pdfErr.message} - folosim fallback`);
                // Fallback: extrage text lizibil din bytes
                rawText = buffer.toString('latin1').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
            }

            if (!rawText || rawText.length < 10) {
                // Re-introducem un fallback dar mai curat
                rawText = buffer.toString('utf8').replace(/[^\x20-\x7E\s]/g, ' ');
                logToFile("Folosim fallback text-extraction.");
            }

            if (rawText && rawText.length > 10) {
                const found = [];
                const lowerText = rawText.toLowerCase();

                // Sortăm skill-urile: cele mai lungi primele, ca "C++" să fie detectat înaintea "C"
                const sortedSkills = [...KNOWN_SKILLS].sort((a, b) => b.length - a.length);

                sortedSkills.forEach(s => {
                    const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                    // Construim un regex care să nu permită caractere alfanumerice imediat înainte/după
                    // Folosim \b pentru skill-uri alfanumerice simple, sau delimitatori pentru cele cu simboluri
                    let reg;
                    if (/^[a-zA-Z0-9]+$/.test(s)) {
                        // Skill pur alfanumeric: folosim word boundary
                        reg = new RegExp(`\\b(${escaped})\\b`, 'gi');
                    } else {
                        // Skill cu caractere speciale (C++, C#, Node.js etc.): delimitatori custom
                        reg = new RegExp(`(?:^|[^a-zA-Z0-9])(${escaped})(?=$|[^a-zA-Z0-9])`, 'gi');
                    }

                    // Resetăm lastIndex înainte de test (important pentru flag 'g')
                    reg.lastIndex = 0;
                    const matchFound = reg.test(rawText);

                    if (matchFound) {
                        // Validări extra pentru skill-uri ambigue
                        if (s === 'Go') {
                            // "Go" trebuie să apară explicit ca skill, nu în "GitHub", "Google", "ongoing" etc.
                            // Verificăm că apare ca skill în secțiunea de skills sau ca limbaj de programare
                            const goReg = /(?:^|[\s,;:|])(Go)(?=$|[\s,;:|.])/gm;
                            goReg.lastIndex = 0;
                            if (!goReg.test(rawText)) return;
                            if (/ongoing|go to|go back|Google|GitHub/i.test(rawText.replace(/\bGo\b(?=[\s,;:])/g, ''))) {
                                // dacă "Go" apare strict ca skill izolat în text, îl păstrăm
                                const strictGoReg = /(?:Languages|Skills|Limbaje)[^\n]*\bGo\b/i;
                                if (!strictGoReg.test(rawText)) return;
                            }
                        }
                        if (s === 'R') {
                            if (lowerText.includes('romanian') || lowerText.includes('r&d') || /for r/i.test(lowerText)) return;
                        }
                        // "C" nu trebuie prins din "CSS", "C#", "C++", "CAD" etc. — sortarea pe lungime ajută,
                        // dar verificăm că "C" apare izolat (ex: în lista de limbaje separată prin virgulă)
                        if (s === 'C') {
                            const cReg = /(?:^|[\s,;:|])(C)(?=$|[\s,;:|,])/gm;
                            cReg.lastIndex = 0;
                            if (!cReg.test(rawText)) return;
                        }

                        let cvScore = 30;
                        const skillIdx = lowerText.indexOf(s.toLowerCase());
                        const contextWindow = lowerText.substring(Math.max(0, skillIdx - 100), Math.min(lowerText.length, skillIdx + 100));

                        if (contextWindow.includes('project') || contextWindow.includes('proiect')) cvScore += 20;
                        if (contextWindow.includes('job') || contextWindow.includes('work') || contextWindow.includes('experience')) cvScore += 30;
                        if (contextWindow.includes('internship') || contextWindow.includes('intern')) cvScore += 20;
                        if (contextWindow.includes('senior') || contextWindow.includes('expert')) cvScore += 20;

                        cvScore = Math.min(cvScore, 85);
                        let estimatedLevel = 'Intermediate';
                        if (cvScore >= 70) estimatedLevel = 'Advanced';
                        else if (cvScore < 40) estimatedLevel = 'Beginner';

                        if (!found.find(f => f.skill === s)) {
                            found.push({ skill: s, level: estimatedLevel, cvScore });
                        }
                    }
                });

                if (found.length > 0) {
                    extractedSkills = found;
                    cvText = `Analizat local (${req.file.originalname})`;
                }
            }
        } else if (req.body.cvText) {
            cvText = req.body.cvText;
            const lowerCv = cvText.toLowerCase();
            KNOWN_SKILLS.forEach(s => {
                const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const reg = new RegExp(`(?:^|[^a-zA-Z0-9#+.])(${escaped})(?:$|[^a-zA-Z0-9#+.])`, 'gi');
                if (reg.test(lowerCv)) {
                    extractedSkills.push({ skill: s, level: 'Intermediate' });
                }
            });
        }

        await prisma.user.update({ where: { id: userId }, data: { cvText: cvText || "CV Text" } });

        if (extractedSkills.length > 0) {
            await prisma.userSkill.deleteMany({ where: { userId } });
            const uniqueSkills = new Map();
            for (const item of extractedSkills) {
                const name = (typeof item === 'string' ? item : (item.skill || item.name || "")).trim();
                if (!name) continue;
                const lowerName = name.toLowerCase();
                if (!uniqueSkills.has(lowerName)) {
                    uniqueSkills.set(lowerName, {
                        name: name,
                        level: item.level || 'Intermediate',
                        cvScore: item.cvScore || 30
                    });
                }
            }

            for (const [_, skillData] of uniqueSkills) {
                const skillRecord = await prisma.skill.upsert({
                    where: { name: skillData.name },
                    update: {},
                    create: { name: skillData.name }
                });

                await prisma.userSkill.create({
                    data: {
                        userId: userId,
                        skillId: skillRecord.id,
                        level: skillData.level,
                        cvScore: skillData.cvScore
                    }
                });
            }
        }

        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { skills: { include: { skill: true } } }
        });

        const finalSkills = updatedUser.skills.map(us => ({
            name: us.skill.name,
            level: us.level
        }));

        res.json({ message: 'OK', skillsCount: finalSkills.length, skills: finalSkills });
    } catch (err) {
        console.error('Eroare:', err);
        res.status(500).json({ error: 'Eroare server' });
    }
});

router.get('/my-skills', requireAuth, async (req, res) => {
    try {
        const u = await prisma.user.findUnique({
            where: { id: req.userId },
            include: { skills: { include: { skill: true } } }
        });
        res.json({
            skills: u.skills.map(us => ({
                name: us.skill.name,
                level: us.level,
                cvScore: us.cvScore,
                selfScore: us.selfScore,
                quizScore: us.quizScore
            }))
        });
    } catch (e) {
        res.status(500).json({ error: 'Eroare' });
    }
});

router.post('/update-skills', requireAuth, async (req, res) => {
    try {
        const { skills } = req.body;
        const userId = req.userId;
        for (const s of skills) {
            const skillRec = await prisma.skill.findUnique({ where: { name: s.name } });
            if (skillRec) {
                await prisma.userSkill.updateMany({
                    where: { userId, skillId: skillRec.id },
                    data: { level: s.level, selfScore: 100 }
                });
            }
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Eroare' });
    }
});

// --- Adăugare manuală REFACTORED (cu validare) ---
router.post('/add-skill', requireAuth, async (req, res) => {
    try {
        const { skillName, level } = req.body;
        const userId = req.userId;

        if (!isValidSkillFormat(skillName)) {
            return res.status(400).json({ error: 'Acesta nu pare a fi un skill tehnic valid. Te rugăm să introduci un singur cuvânt sau o tehnologie (ex: Docker, React).' });
        }

        const cleanName = skillName.trim();
        const lowerName = cleanName.toLowerCase();

        // 1. Verificăm dacă e un typo dintr-un skill cunoscut (Fuzzy match simplu)
        const closeMatch = KNOWN_SKILLS.find(s => s.toLowerCase() === lowerName);
        const finalName = closeMatch || cleanName;

        const skillRecord = await prisma.skill.upsert({
            where: { name: finalName },
            update: {},
            create: { name: finalName }
        });

        await prisma.userSkill.upsert({
            where: { userId_skillId: { userId: userId, skillId: skillRecord.id } },
            update: { level: level || 'Intermediate', selfScore: 100 },
            create: {
                userId: userId,
                skillId: skillRecord.id,
                level: level || 'Intermediate',
                cvScore: 50,
                selfScore: 100
            }
        });

        // Auto-log activitate pentru streak
        try {
            await prisma.learningActivity.create({
                data: {
                    userId,
                    type: 'skill_added',
                    description: `Skill adăugat: ${skillRecord.name}`
                }
            });
            await prisma.user.update({
                where: { id: userId },
                data: { lastActivityDate: new Date() }
            });
        } catch (e) { /* ignorăm erori de logging */ }

        res.json({ success: true, skill: { name: skillRecord.name, level: level || 'Intermediate' } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare la adăugarea competenței' });
    }
});

// --- Ștergere CV și Skill-uri (Reset) ---
router.delete('/reset', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;

        // Ștergem toate skill-urile asociate
        await prisma.userSkill.deleteMany({ where: { userId } });

        // Resetăm textul CV-ului și obiectivul (opțional)
        await prisma.user.update({
            where: { id: userId },
            data: { cvText: null }
        });

        res.json({ success: true, message: 'Profilul a fost resetat.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare la resetarea profilului.' });
    }
});

// --- Ștergere skill specific ---
router.delete('/skill/:name', requireAuth, async (req, res) => {
    try {
        const { name } = req.params;
        const userId = req.userId;

        const skillRec = await prisma.skill.findUnique({ where: { name } });
        if (!skillRec) return res.status(404).json({ error: 'Skill-ul nu există.' });

        await prisma.userSkill.deleteMany({
            where: { userId, skillId: skillRec.id }
        });

        res.json({ success: true, message: 'Skill șters cu succes.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Eroare la ștergerea competenței.' });
    }
});

export default router;
