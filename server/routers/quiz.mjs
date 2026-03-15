import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { requireAuth } from '../middleware/auth.mjs';

const router = express.Router();
const prisma = new PrismaClient();

// 1. Preia întrebări pentru o carieră specifică
router.get('/questions/:careerId', requireAuth, async (req, res) => {
    try {
        const careerId = parseInt(req.params.careerId);
        const questions = await prisma.quizQuestion.findMany({
            where: { careerId }
        });

        // Returnăm doar textul și opțiunile (fără indexul corect)
        const safeQuestions = questions.map(q => ({
            id: q.id,
            text: q.text,
            options: JSON.parse(q.options)
        }));

        res.json(safeQuestions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare la preluarea întrebărilor' });
    }
});

// 2. Trimite răspunsuri și calculează scorul
router.post('/submit', requireAuth, async (req, res) => {
    try {
        const { careerId, answers } = req.body; // { careerId: 1, answers: [ { qId: 1, choice: 0 }, ... ] }
        const userId = req.userId;

        const questions = await prisma.quizQuestion.findMany({
            where: { careerId: parseInt(careerId) }
        });

        let correctCount = 0;
        answers.forEach(ans => {
            const q = questions.find(question => question.id === ans.qId);
            if (q && q.correctIdx === ans.choice) {
                correctCount++;
            }
        });

        const percentage = Math.round((correctCount / questions.length) * 100);

        // Salvăm rezultatul testului
        await prisma.userQuizResult.create({
            data: {
                userId,
                careerId: parseInt(careerId),
                score: percentage
            }
        });

        // Actualizăm quizScore pentru toate skill-urile user-ului (ca bonus la evaluare)
        await prisma.userSkill.updateMany({
            where: { userId },
            data: { quizScore: percentage }
        });

        // RECALCULARE NIVEL FINAL (Logica de business)
        // Nivel = (CV_Score + Quiz_Score) / 2 (de exemplu, momentan)
        const userSkills = await prisma.userSkill.findMany({ where: { userId } });
        for (const us of userSkills) {
            const finalScore = Math.min(100, Math.round((us.cvScore + us.selfScore + (percentage * 0.5)) / 2.5));
            // Exemplu: dacă CV=80, Self=100, Quiz=100 -> (80+100+50)/2.5 = 92 -> Advanced

            let finalLevel = 'Intermediate';
            if (finalScore >= 75) finalLevel = 'Advanced';
            else if (finalScore < 45) finalLevel = 'Beginner';

            await prisma.userSkill.update({
                where: { id: us.id },
                data: { level: finalLevel }
            });
        }

        res.json({ score: percentage, correctCount, total: questions.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare la procesarea testului' });
    }
});

export default router;
