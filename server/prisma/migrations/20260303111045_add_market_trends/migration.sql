-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "cvText" TEXT,
    "niche" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Career" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skillsRequired" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Course" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "category" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MarketTrend" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "domain" TEXT NOT NULL,
    "topSkills" TEXT NOT NULL,
    "avgSalaryMin" REAL,
    "avgSalaryMax" REAL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "demandLevel" TEXT NOT NULL,
    "jobCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "_SkillToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_SkillToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SkillToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Career_name_key" ON "Career"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MarketTrend_domain_key" ON "MarketTrend"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "_SkillToUser_AB_unique" ON "_SkillToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_SkillToUser_B_index" ON "_SkillToUser"("B");
