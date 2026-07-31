const axios = require('axios');
const crypto = require('crypto');

/**
 * ServerData Engine - Alight Motion API Proxy Layer
 * Berdasarkan spesifikasi Network Request AlightPro (Vercel)
 */
class ServerData {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || 'https://www.alightpro.my.id';
        
        // Header Bawaan Persis Seperti Log Network Chrome/Brave Browser
        this.defaultHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Priority': 'u=1, i',
            'Origin': this.baseUrl,
            'Referer': `${this.baseUrl}/`,
            'Sec-Ch-Ua': '"Not=A?Brand";v="99", "Brave";v="151", "Chromium";v="151"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Gpc': '1',
            'X-Requested-With': 'XMLHttpRequest'
        };

        // Endpoint Map Sesuai Matched Path Log
        this.endpoints = {
            session: '/api/session', // Sesi internal penghasil token/nonce
            stats: '/api/stats',
            statsRecent: '/api/stats/recent',
            alightMotion: '/api/alight-motion'
        };

        // Standard Axios Instance
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: config.timeout || 15000,
            headers: this.defaultHeaders,
            withCredentials: true
        });
    }

    /**
     * Membangun URL penuh
     */
    buildUrl(endpoint) {
        return `${this.baseUrl}${endpoint}`;
    }

    /**
     * Helper Pembuatan Hash Proof-of-Work (PoW) SHA-256
     */
    generatePow(sessionId, nonce, email) {
        const rawString = `${sessionId}:${nonce}:${email}`;
        return crypto.createHash('sha256').update(rawString).digest('hex');
    }

    /**
     * Ekstrak Cookie String dari Response Headers
     */
    parseCookies(responseHeaders) {
        const rawCookies = responseHeaders['set-cookie'] || [];
        return rawCookies.map(c => c.split(';')[0]).join('; ');
    }

    /**
     * Ambil Sesi Keamanan Target
     */
    async getSession() {
        try {
            const url = this.endpoints.session;
            const res = await this.client.get(url);
            const cookie = this.parseCookies(res.headers);

            return {
                status: true,
                data: res.data,
                cookie: cookie
            };
        } catch (error) {
            // Fallback jika /api/session tidak terpisah
            return {
                status: false,
                data: {
                    sessionId: crypto.randomBytes(16).toString('hex'),
                    token: crypto.randomBytes(32).toString('hex'),
                    nonce: crypto.randomBytes(12).toString('hex')
                },
                cookie: ''
            };
        }
    }

    /**
     * GET /api/stats
     */
    async getStats() {
        try {
            const res = await this.client.get(this.endpoints.stats);
            return { success: true, data: res.data };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * GET /api/stats/recent
     */
    async getRecentStats() {
        try {
            const res = await this.client.get(this.endpoints.statsRecent);
            return { success: true, data: res.data };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * POST /api/alight-motion (action: "send")
     * Mengirim link verifikasi OOB ke email target
     */
    async sendEmail(email) {
        if (!email) throw new Error("Email wajib diisi");

        const session = await this.getSession();
        const sessionId = session.data?.sessionId || crypto.randomBytes(16).toString('hex');
        const nonce = session.data?.nonce || crypto.randomBytes(12).toString('hex');
        const token = session.data?.token || crypto.randomBytes(32).toString('hex');
        
        const pow = this.generatePow(sessionId, nonce, email);

        const customHeaders = {
            'X-Amprem-Token': token,
            'X-Amprem-Nonce': nonce,
            'X-Amprem-Pow': pow
        };

        if (session.cookie) {
            customHeaders['Cookie'] = session.cookie;
        }

        try {
            const res = await this.client.post(
                this.endpoints.alightMotion,
                { action: 'send', email: email },
                { headers: customHeaders }
            );

            return {
                success: Boolean(res.data.status),
                message: res.data.msg || 'Link berhasil dikirim.',
                raw: res.data
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * POST /api/alight-motion (action: "verify")
     * Verifikasi Link OOB Firebase Alight Motion & Klaim Premium Status
     */
    async verifyLink(email, link) {
        if (!email || !link) throw new Error("Email dan Link OOB wajib diisi");

        const session = await this.getSession();
        const sessionId = session.data?.sessionId || crypto.randomBytes(16).toString('hex');
        const nonce = session.data?.nonce || crypto.randomBytes(12).toString('hex');
        const token = session.data?.token || crypto.randomBytes(32).toString('hex');

        const pow = this.generatePow(sessionId, nonce, email);

        const customHeaders = {
            'X-Amprem-Token': token,
            'X-Amprem-Nonce': nonce,
            'X-Amprem-Pow': pow
        };

        if (session.cookie) {
            customHeaders['Cookie'] = session.cookie;
        }

        try {
            const res = await this.client.post(
                this.endpoints.alightMotion,
                { action: 'verify', email: email, link: link },
                { headers: customHeaders }
            );

            if (!res.data.status) {
                return {
                    success: false,
                    message: res.data.msg || 'Verifikasi gagal dari server target.'
                };
            }

            const userData = res.data.data?.user?.users?.[0] || {};
            const premiumData = res.data.data?.premium?.result || {};

            return {
                success: true,
                message: 'Aktivasi Status Pro Berhasil!',
                user: {
                    displayName: userData.displayName || 'User',
                    email: userData.email || email,
                    photoUrl: userData.photoUrl || null,
                    validSince: userData.validSince,
                    lastLoginAt: userData.lastLoginAt
                },
                premium: {
                    valid: premiumData.valid || false,
                    status: premiumData.status || 'unknown',
                    autoRenewing: premiumData.autoRenewing || false,
                    startTimeMillis: premiumData.startTimeMillis || null,
                    expiryTimeMillis: premiumData.expiryTimeMillis || null
                },
                raw: res.data.data
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Error Handler Terpusat
     */
    handleError(error) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            const message = data?.msg || data?.message || `Request gagal dengan status code ${status}`;
            
            const err = new Error(message);
            err.status = status;
            err.data = data;
            return err;
        }
        return error;
    }
}

module.exports = ServerData;