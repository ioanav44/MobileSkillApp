# 🎓 Ghid de Pregătire pentru Susținerea Licenței
## Întrebări Probabile ale Comisiei & Răspunsurile Aferente

Acest document conține o listă de întrebări tehnice și arhitecturale pe care comisia de examinare le poate pune în timpul prezentării proiectului, împreună cu răspunsuri clare, argumentate științific și adaptate exact la implementarea codului tău.

---

### ❓ Întrebarea 1: De ce ai ales SQLite ca bază de date și nu MongoDB sau PostgreSQL?
* **Răspuns pentru Comisie**: 
  > *"Am ales **SQLite** deoarece este o bază de date locală de tip file-based, extrem de rapidă, care nu necesită un server de baze de date dedicat care să ruleze permanent în fundal. Pentru arhitectura aplicației noastre de tip MVP (Minimum Viable Product), SQLite oferă performanțe optime și simplitate la deployment (fiind ideală pentru planul gratuit Render unde baza de date rulează instant din fișierul `dev.db`).*
  > 
  > *În plus, prin utilizarea **Prisma ORM** (Object-Relational Mapping), codul nostru este complet decuplat de motorul de baze de date. Dacă în viitor aplicația se scalează la nivel de producție cu milioane de utilizatori, putem migra la **PostgreSQL** sau **MySQL** doar prin schimbarea unei singure linii în fișierul `schema.prisma` (linia `provider = "sqlite"` devine `provider = "postgresql"`), fără a modifica vreo linie de cod din logica Express sau din query-uri."*

---

### ❓ Întrebarea 2: De ce nu ai lăsat modelul Gemini AI să parseze și să extragă direct skill-urile din CV-ul PDF, ci ai implementat un algoritm local bazat pe Regex?
* **Răspuns pentru Comisie**: 
  > *"Aceasta a fost o decizie strategică de optimizare a resurselor și a experienței utilizatorului (UX), bazată pe trei argumente:*
  > *1. **Performanță și Latență**: Trimiterea unui text lung extras din PDF către API-ul Gemini durează între 3 și 6 secunde. Algoritmul nostru local bazat pe expresii regulate pre-compilate analizează textul local în mai puțin de 50 de milisecunde.*
  > *2. **Costuri și Limitări (Rate Limiting)**: API-ul Gemini are limite stricte de request-uri gratuite pe minut (RPM). Trimiterea CV-urilor complete ar fi epuizat rapid cotele. Algoritmul local rulează 100% gratuit.*
  > *3. **Control și Prevenirea Halucinațiilor**: AI-ul are tendința de a 'halucina' (de a inventa tehnologii care nu apar în text sau de a traduce greșit). Prin rularea locală a algoritmului de matching pe baza unui catalog predefinit de tehnologii (`KNOWN_SKILLS`), ne asigurăm că extragem strict competențele reale."*

---

### ❓ Întrebarea 3: Cum ai rezolvat problema coliziunilor la căutarea tehnologiilor scurte în CV (de exemplu, cum nu confunzi limbajul „C” cu „CSS” sau verbul englezesc „go” cu limbajul „Go”)?
* **Răspuns pentru Comisie**: 
  > *"Pentru a rezolva problema coliziunilor și a fals-pozitivelor, am implementat un algoritm de căutare în trei etape:*
  > *1. **Sortarea după lungime**: Lista de tehnologii este sortată descrescător. Astfel, căutăm mai întâi tehnologii mai lungi precum `React Native`, `C++` sau `C#` și abia apoi trecem la cele scurte ca `React` sau `C`, evitând suprapunerile.*
  > *2. **Regex cu word boundaries**: Pentru tehnologiile simple, verificăm hotarele de cuvânt (`\b`), asigurându-ne că tehnologia este un cuvânt izolat în text.*
  > *3. **Reguli stricte de izolare (Excepții)**: Pentru tehnologii formate din 1-2 litere, am adăugat filtre suplimentare. De exemplu, limbajul **Go** este validat doar dacă apare în secțiuni specifice ale CV-ului (cum ar fi 'Languages' sau 'Skills') sau delimitat strict de virgule, eliminând fals-pozitivele din verbe sau cuvinte ca 'GitHub' sau 'Google'."*

---

### ❓ Întrebarea 4: Cum ai optimizat Chatbot-ul AI din punct de vedere al costurilor și al vitezei de răspuns?
* **Răspuns pentru Comisie**: 
  > *"Am proiectat o **arhitectură de optimizare în 3 nivele**:*
  > *1. **Nivelul 1 (Dicționar Static)**: Întrebările simple (salutări, detalii despre CV, salarii sau concepte ca 'Ce este React?') sunt interceptate și primesc un răspuns predefinit în mai puțin de 10ms, fără a apela vreun server extern.*
  > *2. **Nivelul 2 (Cache-ul SQLite)**: Întrebările trimise către Gemini sunt normalizate (eliminăm diacriticele, punctuația și spațiile duble) și stocate în tabela `ChatCache`. La întrebări similare sau identice repetate, răspunsul este servit instant direct din baza de date.*
  > *3. **Nivelul 3 (Apel Gemini AI)**: Doar dacă întrebarea este unică se apelează modelul Gemini 2.0 Flash, iar răspunsul este stocat automat în cache pentru viitor."*

---

### ❓ Întrebarea 5: Cum funcționează algoritmul de calcul pentru „Learning Streak” (zile consecutive de studiu)?
* **Răspuns pentru Comisie**: 
  > *"Algoritmul de streak este implementat în backend în fișierul `server/routers/schedule.mjs`. Acesta funcționează astfel:*
  > *1. Preluăm toate activitățile de învățare ale utilizatorului din ultimele 90 de zile.*
  > *2. Normalizăm datele la nivel de zi calendaristică (eliminând orele și minutele) și folosim o structură de date de tip **Set** (`new Set(...)`) pentru a elimina duplicatele. Astfel, dacă un utilizator face 5 activități într-o zi, acestea sunt numărate ca o singură zi activă.*
  > *3. Pentru **Streak-ul Curent**, verificăm dacă cea mai recentă zi de activitate este azi sau ieri. Dacă da, decrementăm consecutiv câte o zi și verificăm prezența ei în listă până găsim o zi lipsă.*
  > *4. Pentru **Streak-ul Maxim**, parcurgem lista ordonată și calculăm diferența de timp dintre zile consecutive. Dacă diferența este exact de 1 zi, incrementăm un contor temporar și actualizăm valoarea maximă."*

---

### ❓ Întrebarea 6: Cum se calculează procentul de potrivire (Percent Match) între utilizator și o carieră?
* **Răspuns pentru Comisie**: 
  > *"Nu folosim o simplă numărare booleană a abilităților, ci un **model de calcul bazat pe scoruri ponderate** în funcție de nivelul utilizatorului pe fiecare skill:*
  > * *Nivelul **Beginner** are o pondere de **0.4***
  > * *Nivelul **Intermediate** are o pondere de **0.8***
  > * *Nivelul **Advanced** are o pondere de **1.0***
  > 
  > *Suma ponderilor abilităților pe care utilizatorul le deține este împărțită la numărul total de abilități cerute de cariera respectivă, rezultând o compatibilitate procentuală mult mai realistă. Un utilizator cu 3 skill-uri Advanced va avea un procentaj considerabil mai mare decât un utilizator cu aceleași 3 skill-uri dar la nivel Beginner."*

---

### ❓ Întrebarea 7: Cum asiguri securitatea datelor utilizatorilor în aplicație?
* **Răspuns pentru Comisie**: 
  > *"Securitatea este structurată pe două niveluri:*
  > *1. **Criptarea Parolelor**: Parolele utilizatorilor nu sunt salvate niciodată în clar. Folosim biblioteca `bcryptjs` pentru a genera un hash securizat al parolei folosind un algoritm de hashing cu o complexitate de 10 runde de salt.*
  > *2. **Autentificare Stateless cu JWT**: Sesiunile de autentificare sunt gestionate prin **JSON Web Tokens**. La logare, serverul semnează un token cu o cheie privată (stocată securizat ca variabilă de mediu pe Render). Clientul stochează token-ul local și îl trimite în header-ul de autorizare (`Authorization: Bearer <token>`) la fiecare request. Endpoint-urile sensibile folosesc middleware-ul `requireAuth` pentru a verifica validitatea token-ului înainte de a returna date."*

---

### ❓ Întrebarea 8: Ce este EAS Build și de ce a fost necesar pentru generarea APK-ului?
* **Răspuns pentru Comisie**: 
  > *"**EAS Build** (Expo Application Services) este o suită de servicii cloud oferită de Expo pentru a compila aplicații React Native în pachete native (APK pentru Android și IPA pentru iOS).*
  > 
  > *A fost necesar deoarece aplicația noastră utilizează dependințe native și cod nativ. În timp ce în faza de dezvoltare am folosit **Expo Go** ca sandbox, pentru o variantă de producție instalabilă direct pe telefon am apelat la EAS. Acesta a generat automat cheile de semnătură digitală (Keystore-ul Android) în mod securizat pe serverele Expo și a compilat fișierul `.apk` gata de instalat pe orice dispozitiv Android fizic, fără a mai depinde de laptopul de dezvoltare."*

---

### ❓ Întrebarea 9: De ce ai ales React Native și nu dezvoltare nativă pură (Kotlin/Swift) sau Flutter?
* **Răspuns pentru Comisie**: 
  > *"Am ales **React Native** din două motive principale:*
  > *1. **Dezvoltare Multiplatformă (Cross-Platform)**: Ne permite să scriem o singură bază de cod în JavaScript/TypeScript care rulează nativ atât pe Android, cât și pe iOS. Față de dezvoltarea nativă pură (unde ar fi trebuit să scriem două aplicații complet separate în Kotlin și Swift), am redus timpul și costurile de dezvoltare la jumătate.*
  > *2. **Ecosistemul React**: React Native folosește aceleași paradigme de design și structură a componentelor ca React Web. Datorită popularității sale masive, există o multitudine de biblioteci gata optimizate pentru animații sau interfețe (cum ar fi Expo Vector Icons, React Native Animated).*
  > 
  > *Comparativ cu Flutter (care folosește limbajul Dart), React Native folosește **JavaScript**, limbajul standard de facto în web development, oferind o curbă de învățare mai lină și facilitând integrarea fluidă cu backend-ul construit tot în JavaScript (Node.js)."*

---

### ❓ Întrebarea 10: De ce ai ales Node.js și Express pentru server (backend)?
* **Răspuns pentru Comisie**: 
  > *"Alegerea **Node.js** și a framework-ului **Express** oferă un avantaj major din punct de vedere arhitectural: **JavaScript pe toată stiva (Full-stack JavaScript)**. Aceasta înseamnă că atât clientul mobil, cât și serverul sunt scrise în același limbaj, eliminând context-switching-ul și facilitând reutilizarea tipurilor de date sau a logicii de validare.*
  > 
  > *În plus, Node.js folosește un model de I/O asincron, bazat pe evenimente (non-blocking event loop), ceea ce îl face extrem de eficient pentru gestionarea conexiunilor concurente. Express este un framework minimalist, care nu adaugă overhead inutil, oferind flexibilitate maximă în structurarea middleware-urilor (cum ar fi cel de autentificare JWT sau Multer pentru procesarea fișierelor)."*

---

### ❓ Întrebarea 11: Ce este Prisma ORM și cu ce este mai bun decât scrierea de query-uri SQL brute?
* **Răspuns pentru Comisie**: 
  > *"**Prisma** este un ORM (Object-Relational Mapper) modern pentru Node.js și TypeScript. L-am ales deoarece:*
  > *1. **Tipizare automată**: Prisma generează automat scheme și tipuri de date pe baza fișierului `schema.prisma`. Acest lucru previne erorile de scriere din timpul dezvoltării.*
  > *2. **Productivitate**: În loc să scriem query-uri SQL brute (ex: `SELECT * FROM User WHERE id = ?`), interacționăm cu baza de date prin metode JavaScript intuitive (ex: `prisma.user.findUnique(...)`), reducând volumul de cod scris manual.*
  > *3. **Migrații sigure**: Prisma gestionează automat modificările structurii bazei de date prin sistemul său de migrații (`prisma db push`), generând automat tabelele și relațiile dintre ele fără riscul de a altera datele existente."*

---

### ❓ Întrebarea 12: Cum funcționează navigarea în aplicație și ce este Expo Router?
* **Răspuns pentru Comisie**: 
  > *"Aplicația utilizează **Expo Router**, un sistem modern de navigare bazat pe fișiere (file-based routing), inspirat de framework-uri web precum Next.js. Navigarea nu este definită într-un fișier central gigant de configurare, ci este mapată direct pe structura de directoare din `client/app/`:*
  > * Fișierele din `client/app/(tabs)/` definesc automat ecranele din bara de navigare de jos (Home, Roadmap, Trends, Profile).*
  > * Fișierele precum `register.jsx` sau `index.jsx` (ecranul de login) reprezintă rute independente.*
  > * Folderul `client/app/_layout.jsx` definește layout-ul global (cum ar fi contextul de autentificare și simulatorul de notificări).*
  > 
  > *Acest mod de organizare crește modularitatea proiectului, făcând aplicația mult mai ușor de extins cu pagini noi prin simpla creare a unui fișier în directorul `app`."*

---

### ❓ Întrebarea 13: De ce ai folosit Gemini 2.0 Flash și nu modelele de la OpenAI (GPT-4) sau Anthropic (Claude)?
* **Răspuns pentru Comisie**: 
  > *"Am optat pentru modelul **Gemini 2.0 Flash** de la Google din următoarele considerente:*
  > *1. **Viteză și Costuri (Eficiență)**: Modelele din familia 'Flash' sunt optimizate special pentru viteză mare de răspuns și latență redusă, fiind ideale pentru aplicații interactive cum este chatbot-ul nostru pe mobil.*
  > *2. **Planul gratuit generos**: Google AI Studio oferă o cotă gratuită generoasă pentru dezvoltatori, permițându-ne să rulăm aplicația fără costuri suplimentare pe parcursul testării.*
  > *3. **Ecosistemul**: SDK-ul oficial `@google/generative-ai` oferă o integrare simplă și fluidă în Node.js, asigurând o gestionare stabilă a răspunsurilor structurate în format JSON."*

---

### ❓ Întrebarea 14: Cum este gestionată stocarea pozelor de profil pentru utilizatori?
* **Răspuns pentru Comisie**: 
  > *"În tabela `User` din baza de date avem câmpul `profileImage`. Acesta nu stochează imaginea ca fișier binar brut (ceea ce ar mări masiv dimensiunea bazei de date și ar încetini interogările), ci stochează un URL (sau un șir Base64) către resursa respectivă.*
  > 
  > *Pentru stocarea locală în timpul dezvoltării, aplicația folosește stringuri Base64 sau imagini pre-încărcate. Pentru un mediu de producție real, URL-ul ar indica o imagine stocată într-un serviciu extern securizat (cum ar fi AWS S3 sau Cloudinary), optimizând astfel consumul de resurse al serverului de API."*

---

### ❓ Întrebarea 15: Cum funcționează Notificările In-App în interiorul aplicației mobile?
* **Răspuns pentru Comisie**: 
  > *"Deoarece serviciile de push notifications native (cum ar fi Firebase Cloud Messaging sau APNs de la Apple) necesită conturi plătite de developer sau configurări de rețea complexe în cloud, am implementat un simulator de notificări in-app.*
  > 
  > *Acesta folosește modulul **`DeviceEventEmitter`** din React Native pentru a transmite evenimente customizate de la nivelul componentelor de bază (cum ar fi adăugarea unui skill sau finalizarea unui chestionar) către layout-ul global `_layout.jsx`. Componenta `<InAppNotification />` ascultă aceste evenimente și randează un banner animat în partea de sus a ecranului care imită perfect comportamentul unei notificări push native, oferind utilizatorului feedback vizual instant."*

---

### ❓ Întrebarea 16: Ce este un Middleware în contextul serverului Express și cum este folosit în aplicație?
* **Răspuns pentru Comisie**: 
  > *"Un **middleware** este o funcție intermediară (un 'filtru' sau un 'paznic') care are acces la obiectul cererii (`req`), la obiectul răspunsului (`res`) și la următoarea funcție middleware din ciclul de cerere-răspuns al aplicației, numită convențional `next`.*
  > 
  > *În aplicația noastră, am implementat middleware-ul de securitate **`requireAuth`** (în `server/middleware/auth.mjs`). Acesta este poziționat înaintea tuturor rutelor private (cum ar fi încărcarea CV-ului, accesarea chat-ului sau înregistrarea progresului).*
  > 
  > *Atunci când o cerere ajunge pe server, middleware-ul extrage token-ul JWT din header-ul de autorizare și îl validează folosind cheia secretă. Dacă token-ul este valid, middleware-ul decodează ID-ul utilizatorului, îl atașează de obiectul cererii (`req.userId = decoded.userId`) și apelează funcția **`next()`** pentru a permite continuarea execuției către codul din router. Dacă token-ul lipsește, este fals sau expirat, middleware-ul întrerupe instantaneu cererea și returnează un cod de eroare HTTP `401 Unauthorized`, protejând astfel baza de date de accesul neautorizat."*

---

### ❓ Întrebarea 17: Ce sunt Rutele (Routes) și cum sunt ele diferențiate între Frontend și Backend în această aplicație?
* **Răspuns pentru Comisie**: 
  > *"Conceptul de **rută** reprezintă o cale de acces securizată către o destinație și este implementat în două moduri complementare în proiect:*
  > 
  > *1. **Rutele de Frontend (Navigation Routes)**: Reprezintă ecranele și paginile din aplicația mobilă. Ele controlează unde navighează utilizatorul pe ecran. Sunt implementate prin **Expo Router** (sistem file-based din directorul `client/app/`). De exemplu, calea `/profile` indică pagina de profil a utilizatorului, iar `/roadmap` indică pagina căii interactive de învățare.*
  > 
  > *2. **Rutele de Backend (API Endpoints)**: Reprezintă punctele de acces prin care aplicația mobilă comunică cu serverul pentru a citi sau scrie date. Sunt definite pe serverul Express (în directorul `server/routers/`) sub formă de căi URL asociate cu metode HTTP specifice (de ex. `GET /api/market-trends` pentru citirea tendințelor sau `POST /api/cv/upload` pentru trimiterea fișierului PDF). Fiecare rută de backend este responsabilă cu prelucrarea datelor primite și interacțiunea cu baza de date SQLite."*



