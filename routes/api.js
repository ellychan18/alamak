const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

module.exports = (api) => {
    
    // Header Penyamaran Browser Asli (Menghindari Blokir WAF/Cloudflare 403)
    const browserHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Content-Type': 'application/json',
        'Origin': api.baseUrl || 'https://alightcreative.com',
        'Referer': api.baseUrl || 'https://alightcreative.com/',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        ...(api.defaultHeaders || {})
    };

    const axiosConfig = {
        headers: browserHeaders,
        timeout: 15000,
        withCredentials: true
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
        
        // Ekstrak Cookie dengan aman
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

    // Helper Menyusun Header Lengkap
    const buildHeaders = (session, email) => {
        const pow = generatePow(session.data.sessionId, session.data.nonce, email);
        const headers = {
            ...browserHeaders,
            'X-Amprem-Token': session.data.token,
            'X-Amprem-Nonce': session.data.nonce,
            'X-Amprem-Pow': pow
        };

        if (session.cookie) {
            headers['Cookie'] = session.cookie;
        }

        return headers;
    };

    // Logic core untuk Send Email
    const handleSendAction = async (email) => {
        if (!email) throw { status: 400, message: 'Email wajib diisi' };

        const session = await getSession();
        if (!session.data?.status) throw { status: 500, message: "Gagal memuat sesi keamanan" };

        const customHeaders = buildHeaders(session, email);
        const targetUrl = api.buildUrl(api.endpoints.alight);
        
        const response = await axios.post(
            targetUrl, 
            { action: 'send', email }, 
            { headers: customHeaders, timeout: axiosConfig.timeout }
        );

        return {
            success: Boolean(response.data.status),
            message: response.data.msg || 'Link OOB berhasil dikirim ke email.'
        };
    };

    // Logic core untuk Verify OOB
    const handleVerifyAction = async (email, link) => {
        if (!email || !link) throw { status: 400, message: 'Email dan Link OOB wajib diisi' };

        const session = await getSession();
        if (!session.data?.status) throw { status: 500, message: "Gagal memuat sesi keamanan" };

        const customHeaders = buildHeaders(session, email);
        const targetUrl = api.buildUrl(api.endpoints.alight);
        
        const response = await axios.post(
            targetUrl, 
            { action: 'verify', email, link }, 
            { headers: customHeaders, timeout: axiosConfig.timeout }
        );

        if (!response.data.status) {
            throw {
                status: 400,
                message: response.data.msg || 'Verifikasi gagal dari server target.'
            };
        }

        const userData = response.data.data?.user?.users?.[0] || {};
        const premiumData = response.data.data?.premium?.result || {};

        return { 
            success: true, 
            message: 'Aktivasi Status Pro Berhasil!', 
            user: {
                displayName: userData.displayName || 'User',
                email: userData.email || email,
                photoUrl: userData.photoUrl || null
            },
            premium: {
                valid: premiumData.valid || false,
                expiryTimeMillis: premiumData.expiryTimeMillis || null,
                status: premiumData.status || 'unknown'
            },
            raw: response.data.data
        };
    };

    // POST /api/send
    router.post('/send', async (req, res) => {
        try {
            const { email } = req.body;
            const result = await handleSendAction(email);
            res.status(200).json(result);
        } catch (error) {
            const errorMsg = error.message || getErrorMessage(error);
            console.error('API Send Error:', errorMsg);
            res.status(error.status || error?.response?.status || 500).json({ success: false, message: errorMsg });
        }
    });

    // POST /api/verify
    router.post('/verify', async (req, res) => {
        try {
            const { email, rawLink, link } = req.body;
            const targetLink = rawLink || link;
            const result = await handleVerifyAction(email, targetLink);
            res.status(200).json(result);
        } catch (error) {
            const errorMsg = error.message || getErrorMessage(error);
            console.error('API Verify Error:', errorMsg);
            res.status(error.status || error?.response?.status || 500).json({ success: false, message: errorMsg });
        }
    });

    // POST /api/alight-motion (Universal Route)
    router.post('/alight-motion', async (req, res) => {
        try {
            const { action, email, rawLink, link } = req.body;
            if (action === 'send') {
                const result = await handleSendAction(email);
                return res.status(200).json(result);
            } else if (action === 'verify') {
                const targetLink = rawLink || link;
                const result = await handleVerifyAction(email, targetLink);
                return res.status(200).json(result);
            } else {
                return res.status(400).json({ success: false, message: 'Action tidak valid' });
            }
        } catch (error) {
            const errorMsg = error.message || getErrorMessage(error);
            res.status(error.status || error?.response?.status || 500).json({ success: false, message: errorMsg });
        }
    });

    return router;
};
