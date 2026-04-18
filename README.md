# MobileSkillApp - Aplicație de Management al Carierei și Evaluare a Competențelor

Această aplicație este dezvoltată ca parte a unei lucrări de licență și reprezintă o platformă mobilă integrată pentru gestionarea parcursului profesional, evaluarea abilităților tehnice și orientarea profesională asistată de AI.

## 🌟 Funcționalități Principale

- **Analiza CV-ului:** Utilizatorii pot încărca CV-ul în format PDF, care este procesat folosind `pdfjs-dist` pentru a extrage automat competențele tehnice prin potrivire cu o bază de date de peste 80 de skill-uri.
- **Roadmap-uri de Carieră:** Vizualizarea unor trasee de învățare structurate pentru diverse roluri tehnice (Frontend, Backend, Mobile, etc.), bazate pe date de la `roadmap.sh`.
- **Evaluarea Competențelor:**
    - **Self-assessment:** Utilizatorii își pot evalua propriul nivel pentru diverse tehnologii.
    - **Quiz-uri Tehnice:** Teste generate pentru a valida cunoștințele utilizatorului.
    - **Gap Analysis:** Sistemul corelează competențele utilizatorului cu cerințele unei cariere țintă și calculează procentul de potrivire.
- **Chatbot AI:** Asistent conversațional bazat pe **Google Gemini 2.0 Flash**, cu răspunsuri personalizate pe baza profilului utilizatorului și optimizare pe 3 niveluri (predefinit → cache → API).
- **Tendințe pe Piața Muncii:** Integrare cu **JSearch API** (RapidAPI) pentru date reale despre cererea de pe piață, salarii și creștere per domeniu IT.
- **Sistem Gamificat de Învățare:** Program personalizat, tracking zilnic al activităților și sistem de streak motivațional.
- **Sistem de Autentificare:** Securizat prin JWT și bcrypt pentru gestionarea profilului de utilizator.
- **Notificări prin Email:** E-mail de bun venit la înregistrare, trimis prin Nodemailer + SMTP Gmail.

## 🛠️ Tehnologii Utilizate

### Frontend (Client)
- **React Native** (v0.81) cu **Expo** (SDK 54)
- **JavaScript (JSX)** pentru logica și interfețele componentelor
- **Expo Router** (v6) pentru navigare bazată pe structura de fișiere
- **React Navigation** (v7) — Stack Navigator + Bottom Tab Navigator
- **React Context API** pentru gestionarea stării globale
- **Zod** (v4) pentru validarea datelor

### Backend (Server)
- **Node.js** cu **Express.js** (v5)
- **Prisma ORM** (v6.4) pentru interacțiunea cu baza de date
- **SQLite** ca bază de date locală (fișier `dev.db`)
- **Google Generative AI** — model **Gemini 2.0 Flash** pentru chatbot și recomandări
- **Multer** pentru gestionarea încărcărilor de fișiere (CV-uri PDF)
- **pdfjs-dist** (legacy build) pentru extragerea textului din documente PDF
- **bcryptjs** și **jsonwebtoken (JWT)** pentru securitate
- **Nodemailer** pentru trimiterea de e-mailuri tranzacționale
- **JSearch API** (RapidAPI) pentru date despre piața muncii IT

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
# JSEARCH_API_KEY=cheia_ta_jsearch

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
    - `/app`: Rutele aplicației (Expo Router) — Login, Register, Tabs.
    - `/src/components`: Componente UI reutilizabile (ChatBot, Roadmap, Streak, Calendar etc.).
    - `/src/stores`: Gestionarea stării globale (AuthContext).
    - `/src/config`: Configurare URL server.
- `/server`: API-ul Node.js cu Express.
    - `/prisma`: Schema bazei de date și migrări.
    - `/routers`: Rutele API-ului (auth, cv, careers, marketTrends, schedule).
    - `/middleware`: Middleware de autentificare JWT.

## 📄 Licență
Acest proiect este realizat în scop academic pentru examenul de licență.
