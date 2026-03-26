import express from 'express';
import cors from 'cors';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

console.log("-> App.mjs: Incarcare rutere...");
import authRouter from './routers/auth.mjs';
import cvRouter from './routers/cv.mjs';
import careerRouter from './routers/careers.mjs';
import marketTrendsRouter from './routers/marketTrends.mjs';
import scheduleRouter from './routers/schedule.mjs';
console.log("-> App.mjs: Rutere incarcate.");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/cv', cvRouter);
app.use('/api/careers', careerRouter);
app.use('/api/market-trends', marketTrendsRouter);
app.use('/api/schedule', scheduleRouter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

export default app;
export { prisma };
