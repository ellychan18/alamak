const express = require('express');
const axios = require('axios');
const router = express.Router();

module.exports = (api) => {
    
    const axiosConfig = {
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36',
            'Referer': 'https://am.rafaelxd.my.id/dashboard?tab=activation'
        }
    };

    // Fungsi bantuan untuk mengekstrak pesan error dengan aman
    const getErrorMessage = (error) => {
        if (error.response && error.response.data) {
            // Jika server target/proxy merespon dengan JSON
            if (error.response.data.message) return error.response.data.message;
            // Jika server target/proxy merespon dengan HTML/Teks (misal: diblokir Cloudflare)
            if (typeof error.response.data === 'string') return `Error Server Target (Status ${error.response.status})`;
        }
        // Jika request gagal total (misal: timeout atau proxy mati)
        return error.message || 'Koneksi ke server target terputus.';
    };

    // POST /api/send
    router.post('/send', async (req, res) => {
        try {
            const { email } = req.body;
            // Gunakan true untuk proxy
            const targetUrl = api.buildUrl(api.endpoints.send, true); 
            
            const response = await axios.post(targetUrl, { email: email }, axiosConfig);
            res.status(200).json(response.data);
        } catch (error) {
            console.error('API Send Error:', error.message);
            res.status(500).json({ success: false, message: getErrorMessage(error) });
        }
    });

    // POST /api/verify
    router.post('/verify', async (req, res) => {
        try {
            const { email, rawLink } = req.body;
            const targetUrl = api.buildUrl(api.endpoints.verify, true);
            
            const response = await axios.post(targetUrl, { email: email, rawLink: rawLink }, axiosConfig);
            res.status(200).json(response.data);
        } catch (error) {
            console.error('API Verify Error:', error.message);
            res.status(500).json({ success: false, message: getErrorMessage(error) });
        }
    });

    // POST /api/premium
    router.post('/premium', async (req, res) => {
        try {
            const { email, idToken } = req.body;
            const targetUrl = api.buildUrl(api.endpoints.premium, true);
            
            const response = await axios.post(targetUrl, { email: email, idToken: idToken }, axiosConfig);
            res.status(200).json(response.data);
        } catch (error) {
            console.error('API Premium Error:', error.message);
            res.status(500).json({ success: false, message: getErrorMessage(error) });
        }
    });

    return router;
};
                
