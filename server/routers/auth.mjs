import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pkg from '@prisma/client';
import { requireAuth } from '../middleware/auth.mjs';
const { PrismaClient } = pkg;


import nodemailer from 'nodemailer';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretlicenta';

// Configurare Nodemailer (Din .env pentru securitate)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE === 'true' || true,
    auth: {
        user: process.env.SMTP_USER, // ex: adresa_ta@gmail.com
        pass: process.env.SMTP_PASS, // ex: parola_aplicatie_16_caractere
    },
});

const logToFile = (msg) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync('server_debug.log', `[${timestamp}] [MAIL] ${msg}\n`);
};

// 1. Inregistrare Utilizator (Register)
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Acest email este deja folosit.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
            },
        });

        // Trimitere Mail de Bun Venit
        try {
            await transporter.sendMail({
                from: '"Carieră IT" <welcome@cariera-it.ro>',
                to: email,
                subject: "Bun venit pe platforma Carieră IT!",
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h1 style="color: #2563eb;">Salut, ${firstName}!</h1>
                        <p>Ne bucurăm că te-ai alăturat comunității noastre. Contul tău a fost creat cu succes.</p>
                        <p>Acum poți să îți analizezi CV-ul, să descoperi parcursul tău profesional și să te pregătești pentru jobul ideal în IT.</p>
                        <br/>
                        <p>Mult succes,</p>
                        <p><b>Echipa Carieră IT</b></p>
                    </div>
                `
            });
        } catch (mailErr) {
            logToFile(`Eroare trimitere mail către ${email}: ${mailErr.message}`);
            console.error("Eroare trimitere mail:", mailErr.message);
        }

        res.status(201).json({ message: 'Utilizator creat cu succes', userId: newUser.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare la inregistrare.' });
    }
});

// 2. Autentificare Utilizator (Login)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Credentiale invalide.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credentiale invalide.' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, selectedCareerId: user.selectedCareerId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare la autentificare.' });
    }
});


// 3. Obține profilul curent (Me)
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, email: true, firstName: true, lastName: true, cvText: true, selectedCareerId: true, profileImage: true }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare la incarcarea profilului.' });
    }
});

// --- Actualizare Obiectiv Carieră ---
router.post('/update-career', requireAuth, async (req, res) => {
    try {
        const { careerId } = req.body;
        await prisma.user.update({
            where: { id: req.userId },
            data: { selectedCareerId: careerId ? parseInt(careerId) : null }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Eroare la salvarea obiectivului' });
    }
});

// --- Actualizare Imagine Profil ---
router.post('/update-profile-image', requireAuth, async (req, res) => {
    try {
        const { image } = req.body;
        await prisma.user.update({
            where: { id: req.userId },
            data: { profileImage: image }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Eroare la salvarea imaginii' });
    }
});

export default router;
