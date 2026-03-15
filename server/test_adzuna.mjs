import dotenv from 'dotenv';

dotenv.config();

const ADZUNA_APP_ID = "c9200391";
const ADZUNA_APP_KEY = "24d12f5306e8286eabcaec959610437d";

async function testAdzuna() {
    console.log("--- TEST ADZUNA API ---");
    console.log(`Using ID: [${ADZUNA_APP_ID}]`);
    console.log(`Using Key: [${ADZUNA_APP_KEY.substring(0, 5)}...]`);

    // Căutăm joburi de "Software Developer" în "Romania" (ro)
    // Documentația Adzuna: https://developer.adzuna.com/docs/search
    const country = 'ro';
    const query = 'Software Developer';
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=5&what=${encodeURIComponent(query)}`;

    console.log(`URL apelat: ${url}`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            console.log("\nSUCCES! Am găsit date:");
            console.log(`Total joburi găsite în ${country}: ${data.count}`);

            console.log("\nExemple de joburi găsite:");
            data.results.forEach((job, index) => {
                console.log(`\n--- Job ${index + 1} ---`);
                console.log(`Titlu: ${job.title}`);
                console.log(`Companie: ${job.company.display_name}`);
                console.log(`Locație: ${job.location.display_name}`);
                console.log(`Salariu Min: ${job.salary_min || 'N/A'}`);
                console.log(`Salariu Max: ${job.salary_max || 'N/A'}`);
                console.log(`Creat la: ${job.created}`);
                // Adzuna nu dă skill-uri direct ca array, trebuie să le filtrăm din descriere
                // sau să folosim endpoint-ul de categorii
            });

            console.log("\n--- STRUCTURA BRUTĂ A UNUI JOB (pentru referință) ---");
            console.log(JSON.stringify(data.results[0], null, 2));

        } else {
            console.error("Eroare API Adzuna:", data);
        }
    } catch (error) {
        console.error("Eroare la apelul API:", error.message);
    }
}

testAdzuna();
