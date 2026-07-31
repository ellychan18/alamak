const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

module.exports = (api) => {
    
    const axiosConfig = {
        headers: api.defaultHeaders,
        timeout: 60000
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

    // Perbaikan rumus Proof-of-Work (menggabungkan sessionId, nonce, dan email)
    const generatePow = (sessionId, nonce, email) => {
        const rawString = `${sessionId}:${nonce}:${email}`;
        return crypto.createHash('sha256').update(rawString).digest('hex');
    };

    // POST /api/send
    router.post('/send', async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ success: false, message: 'Email wajib diisi' });

            const session = await getSession();
            if (!session.data.status) throw new Error("Gagal memuat sesi API");

            // Mengirim sessionId, nonce, dan email ke fungsi PoW
            const pow = generatePow(session.data.sessionId, session.data.nonce, email);
            const customHeaders = {
                ...axiosConfig.headers,
                'X-Amprem-Token': session.data.token,
                'X-Amprem-Nonce': session.data.nonce,
                'X-Amprem-Pow': pow
            };
            
            if (session.cookie) {
                customHeaders['Cookie'] = session.cookie;
            }

            const targetUrl = api.buildUrl(api.endpoints.alight);
            const response = await axios.post(targetUrl, { action: 'send', email: email }, { headers: customHeaders });
            
            res.status(200).json({ success: response.data.status, message: response.data.msg || 'Link OOB dikirim.' });
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
            if (!session.data.status) throw new Error("Gagal memuat sesi API");

            const pow = generatePow(session.data.sessionId, session.data.nonce, email);

            const customHeaders = {
                ...axiosConfig.headers,
                'X-Amprem-Token': session.data.token,
                'X-Amprem-Nonce': session.data.nonce,
                'X-Amprem-Pow': pow
            };

            if (session.cookie) {
                customHeaders['Cookie'] = session.cookie;
            }

            const targetUrl = api.buildUrl(api.endpoints.alight);
            const response = await axios.post(targetUrl, { action: 'verify', email: email, link: rawLink }, { headers: customHeaders });
            
            res.status(200).json({ success: response.data.status, message: 'Berhasil di verifikasi.', idToken: 'SKIP_PREMIUM_CALL' });
        } catch (error) {
            const errorMsg = getErrorMessage(error);
            console.error('API Verify Error:', errorMsg);
            res.status(error?.response?.status || 500).json({ success: false, message: errorMsg });
        }
    });

    // POST /api/premium (Dibypass)
    router.post('/premium', async (req, res) => {
        res.status(200).json({ success: true, message: 'Status Premium VIP berhasil diaktifkan!' });
    });

    return router;
};
