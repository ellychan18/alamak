const express = require('express');
const axios = require('axios');
const router = express.Router();

module.exports = (api) => {
    
    // POST /api/send
    router.post('/send', async (req, res) => {
        try {
            const { email } = req.body;
            // Ubah true menjadi false agar request langsung tanpa proxy
            const targetUrl = api.buildUrl(api.endpoints.send, false); 
            
            const response = await axios.post(targetUrl, { email }, { headers: api.defaultHeaders });
            res.json(response.data);
        } catch (error) {
            console.error('Error /api/send:', error?.response?.data || error.message);
            // Mengirimkan pesan error asli dari server target jika ada
            const errMsg = error?.response?.data?.message || 'Gagal mengirim email OOB.';
            res.status(500).json({ success: false, message: errMsg });
        }
    });

    // POST /api/verify
    router.post('/verify', async (req, res) => {
        try {
            const { email, rawLink } = req.body;
            const targetUrl = api.buildUrl(api.endpoints.verify, false); // false = tanpa proxy
            
            const response = await axios.post(targetUrl, { email, rawLink }, { headers: api.defaultHeaders });
            res.json(response.data);
        } catch (error) {
            console.error('Error /api/verify:', error?.response?.data || error.message);
            const errMsg = error?.response?.data?.message || 'Gagal memverifikasi OOB.';
            res.status(500).json({ success: false, message: errMsg });
        }
    });

    // POST /api/premium
    router.post('/premium', async (req, res) => {
        try {
            const { email, idToken } = req.body;
            const targetUrl = api.buildUrl(api.endpoints.premium, false); // false = tanpa proxy
            
            const response = await axios.post(targetUrl, { email, idToken }, { headers: api.defaultHeaders });
            res.json(response.data);
        } catch (error) {
            console.error('Error /api/premium:', error?.response?.data || error.message);
            const errMsg = error?.response?.data?.message || 'Gagal aktivasi premium.';
            res.status(500).json({ success: false, message: errMsg });
        }
    });

    return router;
};
