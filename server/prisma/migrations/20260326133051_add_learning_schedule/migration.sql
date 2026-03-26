/*
  Warnings:

  - You are about to drop the `_SkillToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "_SkillToUser_B_index";

-- DropIndex
DROP INDEX "_SkillToUser_AB_unique";

-- AlterTable
ALTER TABLE "Career" ADD COLUMN "roadmapUrl" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_SkillToUser";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "LearningSchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "reminderHour" INTEGER NOT NULL DEFAULT 19,
    "reminderMinute" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LearningSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearningActivity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserSkill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'Intermediate',
    "cvScore" INTEGER NOT NULL DEFAULT 30,
    "selfScore" INTEGER NOT NULL DEFAULT 50,
    "quizScore" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "UserSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "careerId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "correctIdx" INTEGER NOT NULL,
    CONSTRAINT "QuizQuestion_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserQuizResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "careerId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RoadmapDetail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "freeResources" TEXT NOT NULL,
    "premiumResources" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CourseRecommendationCache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cacheKey" TEXT NOT NULL,
    "coursesJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ChatCache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "questionKey" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MarketTrend" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "domain" TEXT NOT NULL,
    "topSkills" TEXT NOT NULL,
    "avgSalaryMin" REAL,
    "avgSalaryMax" REAL,
    "avgSalaryEntry" REAL,
    "avgSalaryMid" REAL,
    "avgSalarySenior" REAL,
    "currency" TEXT NOT NULL DEFAULT 'RON',
    "demandLevel" TEXT NOT NULL,
    "jobCount" INTEGER NOT NULL DEFAULT 0,
    "growthPercent" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'Industry Report 2024',
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_MarketTrend" ("avgSalaryMax", "avgSalaryMin", "currency", "demandLevel", "domain", "id", "jobCount", "lastUpdated", "topSkills") SELECT "avgSalaryMax", "avgSalaryMin", "currency", "demandLevel", "domain", "id", "jobCount", "lastUpdated", "topSkills" FROM "MarketTrend";
DROP TABLE "MarketTrend";
ALTER TABLE "new_MarketTrend" RENAME TO "MarketTrend";
CREATE UNIQUE INDEX "MarketTrend_domain_key" ON "MarketTrend"("domain");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "cvText" TEXT,
    "niche" TEXT,
    "selectedCareerId" INTEGER,
    "profileImage" TEXT,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" DATETIME,
    "pushToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "cvText", "email", "firstName", "id", "lastName", "niche", "password") SELECT "createdAt", "cvText", "email", "firstName", "id", "lastName", "niche", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "LearningSchedule_userId_key" ON "LearningSchedule"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkill_userId_skillId_key" ON "UserSkill"("userId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapDetail_title_key" ON "RoadmapDetail"("title");

-- CreateIndex
CREATE UNIQUE INDEX "CourseRecommendationCache_cacheKey_key" ON "CourseRecommendationCache"("cacheKey");

-- CreateIndex
CREATE UNIQUE INDEX "ChatCache_questionKey_key" ON "ChatCache"("questionKey");
