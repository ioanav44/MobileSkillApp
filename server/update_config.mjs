import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    let fallbackIp = '127.0.0.1';

    for (const name of Object.keys(interfaces)) {
        // Ignorăm adaptoarele virtuale cunoscute
        const isVirtual = name.toLowerCase().includes('virtual') ||
            name.toLowerCase().includes('vethernet') ||
            name.toLowerCase().includes('wsl') ||
            name.toLowerCase().includes('host-only') ||
            name.toLowerCase().includes('bluetooth');

        if (isVirtual) continue;

        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                // Prioritate pentru adrese de tip 192.168.x.x (Wi-Fi local tipic)
                if (iface.address.startsWith('192.168.')) {
                    return iface.address;
                }
                // Dacă nu e 192.168, dar e un adaptor real (Wi-Fi sau Ethernet), îl salvăm ca fallback
                if (name.includes('Wi-Fi') || name.includes('Ethernet') || name.includes('wireless')) {
                    fallbackIp = iface.address;
                }
            }
        }
    }
    return fallbackIp;
}

const ip = getLocalIp();
const configPath = path.join(__dirname, '../client/src/config/index.js');
const configContent = `export const API_URL = 'http://${ip}:5000';\n`;

try {
    fs.writeFileSync(configPath, configContent);
    console.log(`✅ [Config] IP actualizat automat: ${ip}`);
} catch (err) {
    console.error(`❌ [Config] Eșec update IP: ${err.message}`);
}
