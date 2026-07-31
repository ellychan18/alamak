const express = require('express');
const axios = require('axios');
const router = express.Router();

module.exports = (api) => {
    
    // POST /api/send
    router.post('/send', async (req, res) => {
        try {
            const { email } = req.body;
            const targetUrl = api.buildUrl(api.endpoints.send, true); // true = pakai proxy
            
            const response = await axios.post(targetUrl, { email }, { headers: api.defaultHeaders });
            res.json(response.data);
        } catch (error) {
            console.error('Error /api/send:', error.message);
            res.status(500).json({ success: false, message: 'Gagal mengirim email OOB.' });
        }
    });

    // POST /api/verify
    router.post('/verify', async (req, res) => {
        try {
            const { email, rawLink } = req.body;
            const targetUrl = api.buildUrl(api.endpoints.verify, true);
            
            const response = await axios.post(targetUrl, { email, rawLink }, { headers: api.defaultHeaders });
            res.json(response.data);
        } catch (error) {
            console.error('Error /api/verify:', error.message);
            res.status(500).json({ success: false, message: 'Gagal memverifikasi OOB.' });
        }
    });

    // POST /api/premium
    router.post('/premium', async (req, res) => {
        try {
            const { email, idToken } = req.body;
            const targetUrl = api.buildUrl(api.endpoints.premium, true);
            
            const response = await axios.post(targetUrl, { email, idToken }, { headers: api.defaultHeaders });
            res.json(response.data);
        } catch (error) {
            console.error('Error /api/premium:', error.message);
            res.status(500).json({ success: false, message: 'Gagal aktivasi premium.' });
        }
    });

    return router;
};

