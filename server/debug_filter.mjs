
const isActualSkill = (label) => {
    if (!label) return false;
    const clean = label.trim();
    const lower = clean.toLowerCase();

    // 1. structure
    if (lower.includes('vertical node') || lower === 'node' || lower === 'link') return false;

    // 2. question mark
    if (lower.includes('?')) return false;

    // 3. broad
    const forbiddenCategories = [
        'internet', 'accessibility', 'seo', 'basics', 'introduction', 'overview',
        'principles', 'concepts', 'fundamentals', 'best practices', 'how to',
        'hosting', 'domain names', 'browsers', 'dns', 'vcs', 'version control',
        'general knowledge', 'soft skills', 'designing', 'pick a', 'writing', 'building'
    ];
    if (forbiddenCategories.includes(lower)) return false;

    // 4. prefix
    const badPrefixes = [
        'what is', 'what are', "what's", 'how ', 'why ', 'learn ', 'basics of',
        'introduction', 'intro to', 'standard ', 'the ', 'pick a', 'writing ',
        'building ', 'about ', 'browsers ', 'dns ', 'hosting '
    ];
    if (badPrefixes.some(p => lower.startsWith(p))) return false;

    // 5. pattern
    const badPatterns = [
        'how it works', 'how they work', 'the basics', 'getting started',
        'explained', 'guide', 'tutorial', 'basics', 'fundamentals', 'principles',
        'design and', 'development and'
    ];
    if (badPatterns.some(p => lower.includes(p))) return false;

    // 6. word count
    const words = clean.split(/\s+/);
    if (words.length > 3) return false;

    const commonThreeWordTools = ['ruby on rails', 'google cloud platform', 'amazon web services', 'visual studio code'];
    if (words.length === 3 && !commonThreeWordTools.includes(lower)) return false;

    if (clean.length > 25) return false;

    return true;
};

const URL = "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/frontend/frontend.json";

async function test() {
    const res = await fetch(URL);
    const data = await res.json();

    const labels = data.nodes.map(n => n.data.label).filter(Boolean);
    const passed = labels.filter(isActualSkill);

    console.log("Total Passed:", passed.length);
    console.log("Passed Samples:", passed.slice(0, 20));

    const internet = labels.filter(l => l.toLowerCase().includes('internet'));
    console.log("\nInternet Related:");
    internet.forEach(i => console.log(`[${isActualSkill(i) ? 'PASS' : 'FAIL'}] ${i}`));

    const accessibility = labels.filter(l => l.toLowerCase().includes('accessibilit'));
    console.log("\nAccessibility Related:");
    accessibility.forEach(a => console.log(`[${isActualSkill(a) ? 'PASS' : 'FAIL'}] ${a}`));
}

test();
