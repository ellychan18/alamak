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

    // POST /api/send
    router.post('/send', async (req, res) => {
        try {
            const { email } = req.body;
            // Parameter diubah menjadi TRUE agar menggunakan proxy cors.caliph.my.id
            const targetUrl = api.buildUrl(api.endpoints.send, true); 
            
            const response = await axios.post(targetUrl, { email: email }, axiosConfig);
            
            res.status(200).json(response.data);
        } catch (error) {
            console.error('Error /api/send:', error?.response?.data || error.message);
            const errorData = error?.response?.data || { success: false, message: 'Gagal mengirim email OOB. Server target tidak merespon.' };
            res.status(error?.response?.status || 500).json(errorData);
        }
    });

    // POST /api/verify
    router.post('/verify', async (req, res) => {
        try {
            const { email, rawLink } = req.body;
            // Parameter diubah menjadi TRUE
            const targetUrl = api.buildUrl(api.endpoints.verify, true);
            
            const response = await axios.post(targetUrl, { email: email, rawLink: rawLink }, axiosConfig);
            
            res.status(200).json(response.data);
        } catch (error) {
            console.error('Error /api/verify:', error?.response?.data || error.message);
            const errorData = error?.response?.data || { success: false, message: 'Gagal memverifikasi OOB.' };
            res.status(error?.response?.status || 500).json(errorData);
        }
    });

    // POST /api/premium
    router.post('/premium', async (req, res) => {
        try {
            const { email, idToken } = req.body;
            // Parameter diubah menjadi TRUE
            const targetUrl = api.buildUrl(api.endpoints.premium, true);
            
            const response = await axios.post(targetUrl, { email: email, idToken: idToken }, axiosConfig);
            
            res.status(200).json(response.data);
        } catch (error) {
            console.error('Error /api/premium:', error?.response?.data || error.message);
            const errorData = error?.response?.data || { success: false, message: 'Gagal aktivasi premium.' };
            res.status(error?.response?.status || 500).json(errorData);
        }
    });

    return router;
};
