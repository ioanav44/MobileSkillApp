
const URL = "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/frontend/frontend.json";

async function analyze() {
    const res = await fetch(URL);
    const data = await res.json();

    console.log("Total Nodes:", data.nodes.length);
    console.log("Total Edges:", data.edges.length);

    const topics = data.nodes.filter(n => n.type === 'topic');
    console.log("Topics:", topics.length);

    // Check first 10 topics
    topics.slice(0, 10).forEach(t => {
        console.log(`- ${t.data.label} (ID: ${t.id})`);
    });

    const edges = data.edges;
    // Find nodes with no incoming edges (potential entry points)
    const targetIds = new Set(edges.map(e => e.target));
    const entryPoints = topics.filter(t => !targetIds.has(t.id));

    console.log("Entry Points:", entryPoints.map(t => t.data.label));
}

analyze();
