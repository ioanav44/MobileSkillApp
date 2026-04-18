import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { requireAuth } from '../middleware/auth.mjs';

const router = express.Router();
const prisma = new PrismaClient();

// =============================================
// Helper: Calculează streak-ul din activități
// =============================================
const calculateStreak = (activities) => {
    if (!activities || activities.length === 0) return { current: 0, longest: 0 };

    // Normalizăm datele la nivel de zi (fără ore)
    const uniqueDays = [...new Set(
        activities.map(a => {
            const d = new Date(a.date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })
    )].sort().reverse(); // Cele mai recente primele

    if (uniqueDays.length === 0) return { current: 0, longest: 0 };

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    // Current streak: numără zile consecutive de la azi/ieri
    let currentStreak = 0;
    const startDay = uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr ? uniqueDays[0] : null;

    if (startDay) {
        let checkDate = new Date(startDay);
        for (const day of uniqueDays) {
            const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
            if (day === checkStr) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
    }

    // Longest streak: parcurgem toate zilele
    let longestStreak = 1;
    let tempStreak = 1;
    for (let i = 0; i < uniqueDays.length - 1; i++) {
        const current = new Date(uniqueDays[i]);
        const next = new Date(uniqueDays[i + 1]);
        const diffDays = (current - next) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
        } else {
            tempStreak = 1;
        }
    }

    return { current: currentStreak, longest: Math.max(longestStreak, currentStreak) };
};

// =============================================
// GET /api/schedule - Returnează schedule + streak
// =============================================
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;

        const schedule = await prisma.learningSchedule.findUnique({
            where: { userId }
        });

        // Activitățile din ultimele 90 de zile pentru calcul streak
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const activities = await prisma.learningActivity.findMany({
            where: {
                userId,
                date: { gte: ninetyDaysAgo }
            },
            orderBy: { date: 'desc' }
        });

        const streakData = calculateStreak(activities);

        // Activitățile pentru calendar (ultimele 4 săptămâni)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Găsim ziua de Luni a săptămânii curente
        const currentMonday = new Date(today);
        const day = currentMonday.getDay(); // 0 = Duminică
        const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1); 
        currentMonday.setDate(diff);

        // Mergem în urmă cu 3 săptămâni (4 săptămâni total, 28 zile)
        const startCalendar = new Date(currentMonday);
        startCalendar.setDate(startCalendar.getDate() - 21);

        const calendarActivities = activities.filter(a => new Date(a.date) >= startCalendar);

        // Generăm array-ul de zile fix: 28 zile rotunde (Luni -> Duminică de 4 ori)
        const weekDays = [];
        for (let i = 0; i < 28; i++) {
            const d = new Date(startCalendar);
            d.setDate(d.getDate() + i);
            weekDays.push({
                label: ['D', 'L', 'Ma', 'Mi', 'J', 'V', 'S'][d.getDay()],
                dayOfWeek: d.getDay(),
                dateLabel: d.getDate(),
                completed: calendarActivities.some(a => {
                    const ad = new Date(a.date);
                    return ad.getDate() === d.getDate() &&
                           ad.getMonth() === d.getMonth() &&
                           ad.getFullYear() === d.getFullYear();
                }),
                isToday: d.toDateString() === new Date().toDateString()
            });
        }

        // Mesaj motivațional dinamic
        const motivationalMessage = getMotivationalMessage(streakData.current, schedule?.frequency);

        res.json({
            schedule,
            streak: {
                current: streakData.current,
                longest: streakData.longest,
                weekDays,
                totalActivities: activities.length,
                allActivityDates: activities.map(a => a.date),
                recentActivities: activities.slice(0, 5).map(a => ({
                    type: a.type,
                    description: a.description,
                    date: a.date
                }))
            },
            motivationalMessage
        });

    } catch (error) {
        console.error("Eroare GET schedule:", error);
        res.status(500).json({ error: 'Eroare preluare program de învățare' });
    }
});

// =============================================
// POST /api/schedule - Creează/Actualizează programul
// =============================================
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { frequency, reminderHour, reminderMinute } = req.body;

        // Validare
        const validFrequencies = ['daily', 'every_2_days', 'every_3_days', 'weekly'];
        if (!validFrequencies.includes(frequency)) {
            return res.status(400).json({ error: 'Frecvență invalidă' });
        }

        const hour = Math.max(0, Math.min(23, parseInt(reminderHour) || 19));
        const minute = Math.max(0, Math.min(59, parseInt(reminderMinute) || 0));

        const schedule = await prisma.learningSchedule.upsert({
            where: { userId },
            update: {
                frequency,
                reminderHour: hour,
                reminderMinute: minute,
                isActive: true
            },
            create: {
                userId,
                frequency,
                reminderHour: hour,
                reminderMinute: minute
            }
        });

        res.json({ message: 'Program salvat cu succes!', schedule });

    } catch (error) {
        console.error("Eroare POST schedule:", error);
        res.status(500).json({ error: 'Eroare salvare program' });
    }
});

// =============================================
// POST /api/schedule/activity - Înregistrează activitate
// =============================================
router.post('/activity', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { type, description } = req.body;

        const validTypes = ['quiz_completed', 'skill_added', 'skill_learned', 'roadmap_viewed'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Tip activitate invalid' });
        }

        // Înregistrăm activitatea
        const activity = await prisma.learningActivity.create({
            data: { userId, type, description }
        });

        // Recalculăm streak-ul
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const allActivities = await prisma.learningActivity.findMany({
            where: {
                userId,
                date: { gte: ninetyDaysAgo }
            },
            orderBy: { date: 'desc' }
        });

        const streakData = calculateStreak(allActivities);

        // Actualizăm streak-ul pe user
        await prisma.user.update({
            where: { id: userId },
            data: {
                currentStreak: streakData.current,
                longestStreak: Math.max(streakData.longest, streakData.current),
                lastActivityDate: new Date()
            }
        });

        res.json({
            message: 'Activitate înregistrată!',
            activity,
            streak: streakData
        });

    } catch (error) {
        console.error("Eroare POST activity:", error);
        res.status(500).json({ error: 'Eroare înregistrare activitate' });
    }
});

// =============================================
// DELETE /api/schedule - Dezactivează programul
// =============================================
router.delete('/', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;

        await prisma.learningSchedule.update({
            where: { userId },
            data: { isActive: false }
        });

        res.json({ message: 'Program dezactivat' });

    } catch (error) {
        console.error("Eroare DELETE schedule:", error);
        res.status(500).json({ error: 'Eroare dezactivare program' });
    }
});

// =============================================
// POST /api/schedule/push-token - Salvează push token
// =============================================
router.post('/push-token', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { pushToken } = req.body;

        await prisma.user.update({
            where: { id: userId },
            data: { pushToken }
        });

        res.json({ message: 'Push token salvat' });

    } catch (error) {
        console.error("Eroare salvare push token:", error);
        res.status(500).json({ error: 'Eroare salvare push token' });
    }
});

// =============================================
// Mesaje motivaționale dinamice
// =============================================
const getMotivationalMessage = (currentStreak, frequency) => {
    if (currentStreak === 0) {
        const messages = [
            "Azi e ziua perfectă să începi!",
            "Primul pas e cel mai important. Hai să-l faci acum!",
            "Nu amâna pe mâine ce poți învăța azi!",
            "Cariera ta tech te așteaptă. Fă primul pas!"
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    if (currentStreak === 1) return "Bun început! Continuă mâine pentru un streak de 2 zile.";
    if (currentStreak === 2) return "2 zile consecutive! Începe să devină obicei.";
    if (currentStreak === 3) return "3 zile la rând — ești pe drumul cel bun!";
    if (currentStreak >= 4 && currentStreak < 7) return `${currentStreak} zile consecutive — impresionant!`;
    if (currentStreak === 7) return "O săptămână completă! Felicitări, ești constant.";
    if (currentStreak > 7 && currentStreak < 14) return `${currentStreak} zile de streak — nimic nu te oprește!`;
    if (currentStreak === 14) return "2 săptămâni! Obiceiul este deja format.";
    if (currentStreak > 14 && currentStreak < 30) return `${currentStreak} zile de dedicare — continuă tot așa!`;
    if (currentStreak === 30) return "O lună întreagă! Dedicarea ta este remarcabilă.";
    if (currentStreak > 30) return `${currentStreak} zile consecutive — un nivel de dedicare excepțional!`;

    return "Continuă să înveți! Fiecare zi contează.";
};

export default router;
