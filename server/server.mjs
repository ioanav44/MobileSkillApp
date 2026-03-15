import dotenv from 'dotenv';
dotenv.config();

console.log("-> Configurare mediu: Key Gemini detectat?", !!process.env.GEMINI_API_KEY);

console.log("-> Incarcare aplicatie...");
import app from './app.mjs';
console.log("-> Aplicatie incarcata.");

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} (Listening on all interfaces)`);
});
