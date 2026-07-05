# 🏗️ Arhitectura Sistemului și Structura Detaliată a Proiectului

Acest document oferă o explicare detaliată a împărțelii folderelor din cadrul aplicației **CareerMentor**, definind responsabilitatea fiecărui director și a fișierelor conținute.

---

## 📂 Structura Completă a Folderelor și Rolul Acestora

```text
Aplicatie licenta/
├── client/                     # --- APLICAȚIA MOBILĂ (React Native & Expo) ---
│   ├── app/                    # Sistemul de Navigare (Expo Router)
│   │   ├── (tabs)/             # Bara de navigare de jos (Tab Navigation)
│   │   │   ├── _layout.jsx     # Configurația vizuală a tab-urilor, culori active, iconițe
│   │   │   ├── home.jsx        # Dashboard-ul utilizatorului (procentaj compatibilitate, cursuri salvate, streak curent)
│   │   │   ├── profile.jsx     # Pagina de Profil (Upload CV, grafic tip contribuții, calendarul de activitate)
│   │   │   ├── roadmap.jsx     # Pagina interactivă cu pașii de studiu și categorii de skill-uri
│   │   │   └── trends.jsx      # Pagina cu tendințe salariale, joburi active și sincronizarea JSearch
│   │   ├── _layout.jsx         # Layout-ul global de bază (Simulatorul de notificări in-app, sesiunea utilizatorului)
│   │   ├── index.jsx           # Pagina de autentificare (Login screen)
│   │   └── register.jsx        # Pagina de creare cont (Register screen)
│   │
│   ├── src/                    # Logica de business, componente reutilizabile și configurări frontend
│   │   ├── components/         # Componente interfețe utilizator (UI) customizate
│   │   │   ├── ui/             # Componente UI de bază (Collapsible, elemente native specifice platformei iOS/Android)
│   │   │   ├── AiBotModal.jsx  # Fereastra modală pentru Chatbot-ul de consiliere AI
│   │   │   ├── CustomAlert.jsx # Pop-up-uri stilizate pentru mesaje de informare sau erori
│   │   │   ├── HistoryCalendarModal.jsx # Vizualizarea detaliată a activităților înregistrate pe zile
│   │   │   ├── InAppNotification.jsx    # Design-ul și animația pentru alertele simulate în aplicație
│   │   │   ├── RoadmapDetailsModal.jsx  # Fereastra de selectare manuală a nivelului skill-ului și cursuri recomandate
│   │   │   ├── RoadmapVisual.jsx        # Randarea grafică a căii de învățare cu legături logice între tehnologii
│   │   │   ├── ScheduleSetupModal.jsx   # Modalul de configurare a planificatorului (Remindere orare, frecvență)
│   │   │   └── StreakCard.jsx           # Widget-ul vizual pentru afișarea streak-ului și mesajelor motivaționale
│   │   │
│   │   ├── config/             # Configurații globale ale clientului
│   │   │   └── index.js        # Declară adresa URL către serverul API (Render sau IP-ul local în development)
│   │   │
│   │   ├── constants/          # Constante de design
│   │   │   └── theme.ts        # Schema de culori premium (Dark/Light mode, paleta de culori brand)
│   │   │
│   │   ├── hooks/              # Hook-uri React customizate
│   │   │   ├── useNotifications.js # Gestionează ascultarea evenimentelor pentru in-app banners
│   │   │   └── use-theme-color.ts  # Gestionează detectarea dinamică a schemei de culori active
│   │   │
│   │   └── stores/             # Gestiunea stării globale a sesiunii
│   │       └── useAuth.js      # Magazin persistat (State Store) pentru salvarea token-ului JWT și a profilului utilizatorului
│   │
│   ├── assets/                 # Resurse grafice native (Splash screen, iconițe aplicație, logo)
│   ├── app.json                # Fișierul de configurare Expo (Nume aplicație, ID pachet, permisiuni, culori native)
│   ├── eas.json                # Configurația pentru EAS Build (profilele de compilat APK Android pentru testare/producție)
│   └── package.json            # Pachetul de management al dependințelor mobile (React, Expo Router, Lucide Icons, Expo Picker)
│
├── server/                     # --- SERVERUL BACKEND (Node.js & Express) ---
│   ├── prisma/                 # Pachetul de gestiune al Bazei de Date (ORM Prisma)
│   │   ├── schema.prisma       # Definirea modelelor de tabele, a legăturilor relaționale și a conexiunii SQLite
│   │   └── dev.db              # Fișierul bazei de date SQLite (stocare fizică la nivel de disc)
│   │
│   ├── middleware/             # Interceptoare de securitate HTTP
│   │   └── auth.mjs            # Middleware care verifică validitatea semnăturii token-ului JWT din header
│   │
│   ├── routers/                # Endpoint-urile API REST (Express Controllers)
│   │   ├── auth.mjs            # Gestionarea userilor: Login, Register, decriptare și hashing parole (bcryptjs)
│   │   ├── cv.mjs              # Încărcare CV: extragerea textului din PDF, algoritmul local de matching și scoring
│   │   ├── careers.mjs         # Carieră: calcule compatibilități, vizualizare roadmap-uri, integrare chatbot Gemini
│   │   ├── marketTrends.mjs    # Tendințe piață: interogări joburi, scale salariale, autosincronizare JSearch
│   │   └── schedule.mjs        # Gamificare: calcularea streak-urilor consecutive, calendarul de 28 de zile, activități
│   │
│   ├── scripts/                # Scripturi administrative pentru mentenanță
│   │   ├── cleanup_skills.mjs  # Elimină skill-urile care nu mai sunt corelate sau au fost salvate greșit
│   │   └── delete_all_users.mjs# Resetează utilizatorii din sistem în timpul testărilor
│   │
│   ├── seed_careers.mjs        # Script de încărcare inițială a nomenclatorului de cariere din baza de date
│   ├── seed_questions.mjs      # Script de populare cu întrebări grilă tehnice aferente fiecărei cariere
│   ├── seed_courses.mjs        # Script de populare cu date pre-setate de cursuri
│   ├── sync_db_skills.mjs      # Script automatizat ce preia roadmap.sh și structurează automat skill-urile cu Gemini
│   ├── app.mjs                 # Inițializează aplicația Express, activează CORS, parsarea JSON și configurează routerele
│   ├── server.mjs              # Ascultă portul HTTP selectat (pornirea efectivă a serverului Node.js)
│   └── package.json            # Pachetul cu scripturile de start și dependințele serverului (Express, Prisma, Gemini SDK, bcryptjs)
```

---

## 🛠️ Modul de Împărțire a Responsabilităților (Separation of Concerns)

Proiectul este separat strict în două părți decuplate:

### 1. Clientul (`/client`) - Responsabil cu Experiența Utilizatorului (UI/UX)
* **Design & Interfață**: Toate ecranele, modalurile de setare și paginile pe care le vede utilizatorul sunt stocate aici.
* **Sistemul Expo Router**: Permite navigarea lină între pagini. Rutele sunt grupate în directorul `app/`.
* **State Management (`stores/useAuth.js`)**: Când utilizatorul se autentifică cu succes, clientul reține token-ul JWT local. La fiecare cerere trimisă ulterior către server, clientul atașează automat acest token sub formă de header pentru a dovedi identitatea utilizatorului.

### 2. Serverul (`/server`) - Responsabil cu Logica și Securitatea (Business Logic)
* **Gestiunea Bazei de Date (`/prisma`)**: Toate tabelele și regulile dintre ele (de exemplu: un utilizator are mai multe abilități stocate în `UserSkill`) sunt controlate de aici.
* **Procesarea Algoritmilor (`/routers`)**:
  * Extragerea textului din PDF se face pe server, deoarece necesită utilizarea resurselor de sistem.
  * Matching-ul de skill-uri și calculul streak-ului pe zile unice rulează în siguranță pe backend pentru a evita alterarea datelor de pe un client modificat.
  * Apelarea API-urilor plătite sau limitate (Gemini, JSearch) se face securizat de pe server, fără ca cheile secrete de API (API Keys) să fie vizibile sau descărcate în telefonul utilizatorului.

---

## 🏗️ Fluxul de Date între Foldere la un Caz Real (Exemplu: Adăugarea unei activități)

Atunci când utilizatorul finalizează un test grilă pe ecran:
1. Ecranul **`client/app/(tabs)/home.jsx`** apelează magazinul global **`client/src/stores/useAuth.js`** pentru a lua tokenul de logare.
2. Clientul face un apel HTTP `POST` către portul configurat în **`client/src/config/index.js`** la calea `/api/schedule/activity`.
3. Serverul interceptează cererea în **`server/app.mjs`** și o trimite la routerul **`server/routers/schedule.mjs`**.
4. Înainte ca routerul să proceseze cererea, middleware-ul **`server/middleware/auth.mjs`** verifică dacă tokenul JWT este valid.
5. Routerul **`server/routers/schedule.mjs`** rulează algoritmul de recalculare a streak-ului și folosește clientul **Prisma** (`server/prisma/schema.prisma`) pentru a face update în fișierul **`server/prisma/dev.db`**.
6. Serverul returnează noul număr de zile consecutive, iar componenta **`client/src/components/InAppNotification.jsx`** animează bannerul de felicitare pe ecranul utilizatorului.
