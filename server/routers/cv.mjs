import express from 'express';
import pkg from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

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
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'SQL', 'TypeScript', 'PHP', 'Swift', 'Kotlin', 'Rust', 'Dart', 'Scala', 'Assembly', 'MATLAB', 'Go', 'Ruby',
    'React', 'Node.js', 'Express', 'Angular', 'Vue.js', 'Next.js', 'Nuxt.js', 'Laravel', 'Spring Boot', 'Django', 'Flask', 'FastAPI', 'React Native', 'Flutter', 'Redux', 'Tailwind', 'Bootstrap', 'Svelte', 'NestJS', 'AdonisJS',
    'Electron', 'Unity', 'Unreal Engine', 'TensorFlow', 'PyTorch', 'OpenCV', 'Pandas', 'NumPy', 'Scikit-learn', 'Keras', 'Spacy', 'HuggingFace',
    'HTML', 'CSS', 'Sass', 'Less', 'Figma',
    'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'CI/CD', 'Git', 'GitHub', 'GitLab', 'Firebase', 'Netlify', 'Vercel', 'Ansible', 'CircleCI', 'TravisCI',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Oracle', 'SQLite', 'MariaDB', 'DynamoDB', 'Cassandra', 'Neo4j', 'Snowflake', 'BigQuery',
    'GraphQL', 'Microservices', 'Linux', '.NET', 'ASP.NET', 'Power BI', 'Tableau', 'Salesforce', 'SAP', 'Bash', 'PowerShell', 'WebSockets', 'WebRTC'
];

// Helper pentru validare "Common Sense"
const isValidSkillFormat = (label) => {
    if (!label) return false;
    const lower = label.toLowerCase().trim();
    if (lower.length < 2 || lower.length > 35) return false;
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
                if (typeof pdf === 'function') {
                    const data = await pdf(buffer);
                    rawText = data.text || "";
                } else if (pdf && pdf.default && typeof pdf.default === 'function') {
                    const data = await pdf.default(buffer);
                    rawText = data.text || "";
                }
            } catch (pdfErr) {
                logToFile(`Eroare PDF-Parse: ${pdfErr.message}`);
            }

            if (!rawText || rawText.length < 10) {
                // Re-introducem un fallback dar mai curat
                rawText = buffer.toString('utf8').replace(/[^\x20-\x7E\s]/g, ' ');
                logToFile("Folosim fallback text-extraction.");
            }

            if (rawText && rawText.length > 10) {
                const found = [];
                const lowerText = rawText.toLowerCase();

                KNOWN_SKILLS.forEach(s => {
                    const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                    // Verificăm dacă skill-ul există în text (case-insensitive)
                    const reg = new RegExp(`(?:^|[^a-zA-Z0-9#+.])(${escaped})(?:$|[^a-zA-Z0-9#+.])`, 'gi');

                    if (reg.test(rawText)) {
                        const isVeryShort = s.length <= 3;
                        if (isVeryShort) {
                            // Pt skill-uri scurte (iOS, C#, PHP) ne asigurăm că match-ul este exact (word boundary)
                            // dar RĂMÂNEM case-insensitive ('gi') ca să prindă și "sql" și "SQL"
                            const strictReg = new RegExp(`(?:^|[^a-zA-Z0-9#+.])(${escaped})(?:$|[^a-zA-Z0-9#+.])`, 'gi');
                            if (!strictReg.test(rawText)) return;

                            // Validări extra pt "Go" și "R" care sunt prea comune
                            if (s === 'Go' && (lowerText.includes("go to") || lowerText.includes("go back") || /ongoing/i.test(lowerText))) return;
                            if (s === 'R' && (lowerText.includes("romanian") || lowerText.includes("r&d") || /for r/i.test(lowerText))) return;
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

export default router;
