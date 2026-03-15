// Script Mock pentru Sincronizare Trenduri Piață (Demonstrativ)
// Acesta simulează ce se va întâmpla când cheile Adzuna vor fi active.

const sampleAdzunaResults = [
    {
        title: "Frontend Developer (React)",
        salary_min: 2500,
        salary_max: 4500,
        location: { display_name: "București, RO" },
        description: "Looking for React, TypeScript and CSS experts...",
        company: { display_name: "Tech Solutions SRL" }
    },
    {
        title: "Python Backend Engineer",
        salary_min: 3000,
        salary_max: 6000,
        location: { display_name: "Cluj-Napoca, RO" },
        description: "Skills: Python, Django, PostgreSQL, Docker...",
        company: { display_name: "Global Dev" }
    },
    {
        title: "Data Analyst",
        salary_min: 2000,
        salary_max: 3500,
        location: { display_name: "Remote" },
        description: "Requirements: SQL, PowerBI, Excel, Python...",
        company: { display_name: "DataMetrics" }
    }
];

async function simulateSync() {
    console.log("--- SIMULARE SINCRONIZARE TRENDURI ---");
    console.log("Se procesează joburile primite din API...");

    const trends = sampleAdzunaResults.map(job => {
        // Extragem skill-uri (simulat)
        const commonSkills = ["React", "Python", "SQL", "TypeScript", "Docker", "Django"];
        const foundSkills = commonSkills.filter(s => job.description.includes(s));

        return {
            domain: job.title.split('(')[0].trim(),
            topSkills: foundSkills.join(", "),
            avgSalaryMin: job.salary_min,
            avgSalaryMax: job.salary_max,
            jobCount: Math.floor(Math.random() * 100) + 10,
            demandLevel: job.salary_max > 4000 ? "High" : "Medium"
        };
    });

    console.log("\nDATE CE VOR FI SALVATE ÎN BAZA DE DATE:");
    console.table(trends);

    console.log("\nAceste date vor fi afișate sub formă de CARURI și GRAFICE în aplicația mobilă.");
}

simulateSync();
