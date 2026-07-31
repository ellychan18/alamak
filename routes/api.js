const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

module.exports = (api) => {
    
    const axiosConfig = {
        headers: api.defaultHeaders,
        timeout: 15000
    };

    const getErrorMessage = (error) => {
        if (error.response && error.response.data) {
            const data = error.response.data;
            if (typeof data.msg === 'string') return data.msg;
            if (typeof data.message === 'string') return data.message;
            if (typeof data === 'object') return JSON.stringify(data);
            return String(data);
        }
        return error.message || 'Koneksi ke server target terputus.';
    };

    // Helper Ambil Session & Cookie
    const getSession = async () => {
        const sessionUrl = api.buildUrl(api.endpoints.session);
        const response = await axios.get(sessionUrl, axiosConfig);
        
        const rawCookies = response.headers['set-cookie'] || [];
        const cookieString = rawCookies.map(c => c.split(';')[0]).join('; ');

        return {
            data: response.data,
            cookie: cookieString
        };
    };

    // Helper Pembuatan Hash Proof-of-Work (PoW)
    const generatePow = (sessionId, nonce, email) => {
        const rawString = `${sessionId}:${nonce}:${email}`;
        return crypto.createHash('sha256').update(rawString).digest('hex');
    };

    // Helper Menyusun Header
    const buildHeaders = (session, email) => {
        const pow = generatePow(session.data.sessionId, session.data.nonce, email);
        const headers = {
            ...axiosConfig.headers,
            'X-Amprem-Token': session.data.token,
            'X-Amprem-Nonce': session.data.nonce,
            'X-Amprem-Pow': pow
        };

        if (session.cookie) {
            headers['Cookie'] = session.cookie;
        }

        return headers;
    };

    // GET /api/stats
    router.get('/stats', async (req, res) => {
        try {
            const targetUrl = api.buildUrl(api.endpoints.stats);
            const response = await axios.get(targetUrl, axiosConfig);
            res.status(200).json(response.data);
        } catch (error) {
            res.status(500).json({ success: false, message: getErrorMessage(error) });
        }
    });

    // GET /api/stats/recent
    router.get('/stats/recent', async (req, res) => {
        try {
            const targetUrl = api.buildUrl(api.endpoints.statsRecent);
            const response = await axios.get(targetUrl, axiosConfig);
            res.status(200).json(response.data);
        } catch (error) {
            res.status(500).json({ success: false, message: getErrorMessage(error) });
        }
    });

    // POST /api/send
    router.post('/send', async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ success: false, message: 'Email wajib diisi' });

            const session = await getSession();
            if (!session.data?.status) throw new Error("Gagal memuat sesi keamanan");

            const customHeaders = buildHeaders(session, email);
            const targetUrl = api.buildUrl(api.endpoints.alight);
            
            const response = await axios.post(
                targetUrl, 
                { action: 'send', email }, 
                { headers: customHeaders, timeout: axiosConfig.timeout }
            );
            
            res.status(200).json({ 
                success: Boolean(response.data.status), 
                message: response.data.msg || 'Link berhasil dikirim.' 
            });
        } catch (error) {
            const errorMsg = getErrorMessage(error);
            console.error('API Send Error:', errorMsg);
            res.status(error?.response?.status || 500).json({ success: false, message: errorMsg });
        }
    });

    // POST /api/verify
    router.post('/verify', async (req, res) => {
        try {
            const { email, rawLink } = req.body;
            if (!email || !rawLink) return res.status(400).json({ success: false, message: 'Data tidak lengkap' });

            const session = await getSession();
            if (!session.data?.status) throw new Error("Gagal memuat sesi keamanan");

            const customHeaders = buildHeaders(session, email);
            const targetUrl = api.buildUrl(api.endpoints.alight);
            
            const response = await axios.post(
                targetUrl, 
                { action: 'verify', email, link: rawLink }, 
                { headers: customHeaders, timeout: axiosConfig.timeout }
            );

            // Validasi status verifikasi dari response server
            if (!response.data.status) {
                return res.status(400).json({
                    success: false,
                    message: response.data.msg || 'Verifikasi gagal dari server target.'
                });
            }

            // Ekstrak data user dan status premium asli dari response
            const userData = response.data.data?.user?.users?.[0] || {};
            const premiumData = response.data.data?.premium?.result || {};

            res.status(200).json({ 
                success: true, 
                message: 'Verifikasi berhasil!', 
                user: {
                    displayName: userData.displayName || 'User',
                    email: userData.email,
                    photoUrl: userData.photoUrl
                },
                premium: {
                    valid: premiumData.valid || false,
                    expiryTimeMillis: premiumData.expiryTimeMillis || null,
                    status: premiumData.status || 'unknown'
                },
                raw: response.data.data
            });
        } catch (error) {
            const errorMsg = getErrorMessage(error);
            console.error('API Verify Error:', errorMsg);
            res.status(error?.response?.status || 500).json({ success: false, message: errorMsg });
        }
    });

    // POST /api/premium
    router.post('/premium', async (req, res) => {
        res.status(200).json({ 
            success: true, 
            message: 'Status Premium VIP berhasil diaktifkan!' 
        });
    });

    return router;
};
