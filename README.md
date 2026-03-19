# MobileSkillApp - Aplicație de Management al Carierei și Evaluare a Competențelor

Această aplicație este dezvoltată ca parte a unei lucrări de licență și reprezintă o platformă mobilă integrată pentru gestionarea parcursului profesional, evaluarea abilităților tehnice și analiza asistată de AI a CV-urilor.

## 🌟 Funcționalități Principale

- **Analiza CV-ului cu AI:** Utilizatorii pot încărca CV-ul în format PDF, care este procesat folosind `pdf-parse` și analizat prin **Google Gemini AI** pentru a extrage automat competențele și experiența.
- **Roadmap-uri de Carieră:** Vizualizarea unor trasee de învățare structurate pentru diverse roluri tehnice (Frontend, Backend, Mobile, etc.), bazate pe date de la `roadmap.sh`.
- **Evaluarea Competențelor:**
    - **Self-assessment:** Utilizatorii își pot evalua propriul nivel pentru diverse tehnologii.
    - **Quiz-uri Tehnice:** Teste generate pentru a valida cunoștințele utilizatorului.
    - **Corelare Automată:** Sistemul corelează datele din CV cu cerințele din roadmap.
- **Tendințe pe Piața Muncii:** Integrare cu **Adzuna API** (sau date simulate) pentru a oferi informații despre cererea de pe piață pentru anumite tehnologii.
- **Sistem de Autentificare:** Securizat prin JWT și bcrypt pentru gestionarea profilului de utilizator.
- **Notificări prin Email:** Suport pentru comunicări prin email folosind Nodemailer.

## 🛠️ Tehnologii Utilizate

### Frontend (Client)
- **React Native** cu **Expo** (SDK 54)
- **TypeScript** pentru siguranța tipurilor
- **Expo Router** pentru navigare bazată pe fișiere
- **NativeWind (Tailwind CSS)** pentru stilizare modernă și responsivă
- **React Navigation** (Bottom Tabs)
- **Zod** pentru validarea datelor

### Backend (Server)
- **Node.js** cu **Express.js**
- **Prisma ORM** pentru interacțiunea cu baza de date
- **SQLite** ca bază de date locală (ușor de configurat)
- **Google Generative AI (Gemini 1.5 Flash)** pentru procesarea limbajului natural
- **Multer** pentru gestionarea încărcărilor de fișiere (CV-uri)
- **bcryptjs** și **jsonwebtoken (JWT)** pentru securitate
- **pdf-parse** pentru extragerea textului din documente PDF

## 🚀 Instalare și Configurare

### Pre-cerințe
- [Node.js](https://nodejs.org/) (versiunea 18+)
- [Expo Go](https://expo.dev/go) instalat pe telefon (pentru testare pe dispozitiv real)

### 1. Clonarea și Pregătirea Proiectului
```bash
# Clonează repository-ul
git clone https://github.com/ioanav44/MobileSkillApp.git
cd MobileSkillApp
```

### 2. Configurarea Serverului
```bash
cd server
npm install

# Configurează variabilele de mediu
# Creează un fișier .env în directorul server/ și adaugă:
# GEMINI_API_KEY=cheia_ta_gemini
# DATABASE_URL="file:./dev.db"
# PORT=5000

# Inițializează baza de date Prisma
npx prisma generate
npx prisma db push

# (Opțional) Populează baza de date cu date de test
node seed_careers.mjs
node seed_questions.mjs

# Pornește serverul
npm run dev
```

### 3. Configurarea Clientului
```bash
cd ../client
npm install

# Pornește aplicația Expo
npx expo start
```
*Folosește aplicația Expo Go pentru a scana codul QR sau rulează în simulatorul Android/iOS.*

## 📂 Structura Proiectului

- `/client`: Codul sursă pentru aplicația mobilă React Native.
    - `/app`: Rutele aplicației (Expo Router).
    - `/components`: Componente UI reutilizabile.
    - `/src`: Configurații, hook-uri și utilitare.
- `/server`: API-ul Node.js.
    - `/prisma`: Schema bazei de date.
    - `/routers`: Rutele API-ului.
    - `/scripts`: Scripturi de seeding și utilitare pentru AI.

## 📄 Licență
Acest proiect este realizat în scop academic pentru examenul de licență.
