const mongoose = require('mongoose');
const dns = require('dns');
const https = require('https');

// Set public DNS servers for Node.js c-ares resolver
try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
    // Ignore if custom DNS cannot be set
}

// Helper to fetch SRV records via Google HTTPS DNS API if local DNS fails
const resolveSrvViaHttps = (hostname) => {
    return new Promise((resolve, reject) => {
        const srvName = `_mongodb._tcp.${hostname}`;
        const url = `https://dns.google/resolve?name=${encodeURIComponent(srvName)}&type=SRV`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.Answer && json.Answer.length > 0) {
                        const addresses = json.Answer.map(ans => {
                            // SRV data format in Google DNS: "priority weight port target"
                            const parts = ans.data.split(' ');
                            const port = parts[2] || '27017';
                            let target = parts[3] || '';
                            if (target.endsWith('.')) target = target.slice(0, -1);
                            return `${target}:${port}`;
                        });
                        resolve(addresses);
                    } else {
                        reject(new Error('No SRV records returned from HTTPS DNS'));
                    }
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', (err) => reject(err));
    });
};

const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('MONGODB_URI is not defined in environment variables');
        process.exit(1);
    }

    // 1st attempt: direct mongoose connect
    try {
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB connected: ${conn.connection.host}`);
        return conn;
    } catch (firstError) {
        console.warn(`Standard MongoDB connection attempt failed: ${firstError.message}`);

        // If SRV lookup failed, try fallback SRV resolution
        if (firstError.message && (firstError.message.includes('ESERVFAIL') || firstError.message.includes('querySrv'))) {
            console.log('Attempting DNS SRV fallback resolution via Google HTTPS DNS...');
            try {
                // Extract auth, hostname, and options from mongodb+srv://
                const match = mongoUri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(\/.*)?$/);
                if (match) {
                    const [, user, pass, host, rest] = match;
                    const hosts = await resolveSrvViaHttps(host);
                    if (hosts && hosts.length > 0) {
                        const queryChar = (rest && rest.includes('?')) ? '&' : '?';
                        const fallbackUri = `mongodb://${user}:${pass}@${hosts.join(',')}${rest || '/'}${queryChar}ssl=true&authSource=admin`;
                        console.log('Connecting with resolved fallback URI...');
                        const conn = await mongoose.connect(fallbackUri);
                        console.log(`MongoDB connected via fallback: ${conn.connection.host}`);
                        return conn;
                    }
                }
            } catch (fallbackError) {
                console.error('Fallback DNS SRV resolution failed:', fallbackError.message);
            }
        }

        console.error(`MongoDB Connection Error: ${firstError}`);
        process.exit(1);
    }
};

module.exports = connectDB;
