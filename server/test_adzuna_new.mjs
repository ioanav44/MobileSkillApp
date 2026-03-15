import dotenv from 'dotenv';
dotenv.config();

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;

async function testAdzuna() {
    console.log("Testing Adzuna with ID:", ADZUNA_APP_ID);
    const domain = { name: 'Software Developer', country: 'ro' };
    const url = `https://api.adzuna.com/v1/api/jobs/${domain.country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=1&what=${encodeURIComponent(domain.name)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Response status:", response.status);
        if (response.ok) {
            console.log("Success! Found", data.count, "jobs for", domain.name);
        } else {
            console.error("Error from Adzuna:", data);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testAdzuna();
