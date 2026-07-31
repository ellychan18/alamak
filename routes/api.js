const express = require('express');
const axios = require('axios');
const router = express.Router();

module.exports = (api) => {
    
    // Konfigurasi axios disesuaikan dengan script (Header polos + Timeout 60s)
    const axiosConfig = {
        headers: api.defaultHeaders,
        timeout: 60000
    };

    const getErrorMessage = (error) => {
        // Menangkap format error "error.response.data.message" atau "error.response.data.error"
        if (error.response && error.response.data) {
            return error.response.data.message || error.response.data.error || `Error Server (Status ${error.response.status})`;
        }
        return error.message || 'Koneksi ke server target terputus.';
    };

    // POST /api/send
    router.post('/send', async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: 'Email wajib diisi' });
            }

            const targetUrl = api.buildUrl(api.endpoints.send, false); // Direct request
            const response = await axios.post(targetUrl, { email: email }, axiosConfig);
            
            res.status(200).json(response.data);
        } catch (error) {
            console.error('API Send Error:', error.message);
            res.status(error?.response?.status || 500).json({ success: false, message: getErrorMessage(error) });
        }
    });

    // POST /api/verify
    router.post('/verify', async (req, res) => {
        try {
            const { email, rawLink } = req.body;
            if (!email || !rawLink) {
                return res.status(400).json({ success: false, message: 'Email dan Link OOB wajib diisi' });
            }

            const targetUrl = api.buildUrl(api.endpoints.verify, false); // Direct request
            const response = await axios.post(targetUrl, { email: email, rawLink: rawLink }, axiosConfig);
            
            res.status(200).json(response.data);
        } catch (error) {
            console.error('API Verify Error:', error.message);
            res.status(error?.response?.status || 500).json({ success: false, message: getErrorMessage(error) });
        }
    });

    // POST /api/premium
    router.post('/premium', async (req, res) => {
        try {
            const { email, idToken } = req.body;
            
            const targetUrl = api.buildUrl(api.endpoints.premium, false); // Direct request
            const response = await axios.post(targetUrl, { email: email, idToken: idToken }, axiosConfig);
            
            res.status(200).json(response.data);
        } catch (error) {
            console.error('API Premium Error:', error.message);
            res.status(error?.response?.status || 500).json({ success: false, message: getErrorMessage(error) });
        }
    });

    return router;
};
