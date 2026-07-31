const express = require('express');
const axios = require('axios');
const router = express.Router();

module.exports = (api) => {
    
    // Konfigurasi axios disesuaikan dengan script referensi (Header polos + Timeout 60s)
    const axiosConfig = {
        headers: api.defaultHeaders,
        timeout: 60000
    };

    // Fungsi canggih untuk mengubah format error apapun menjadi teks biasa
    const getErrorMessage = (error) => {
        if (error.response && error.response.data) {
            const data = error.response.data;
            
            // Jika ada pesan berupa teks langsung
            if (typeof data.message === 'string') return data.message;
            if (typeof data.error === 'string') return data.error;
            
            // Jika ternyata pesannya adalah Object/Array, kita paksa jadi format String JSON
            if (typeof data === 'object') {
                return JSON.stringify(data);
            }
            
            return String(data);
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
            const errorMsg = getErrorMessage(error);
            console.error('API Send Error:', errorMsg);
            res.status(error?.response?.status || 500).json({ success: false, message: errorMsg });
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
            const errorMsg = getErrorMessage(error);
            console.error('API Verify Error:', errorMsg);
            res.status(error?.response?.status || 500).json({ success: false, message: errorMsg });
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
            const errorMsg = getErrorMessage(error);
            console.error('API Premium Error:', errorMsg);
            res.status(error?.response?.status || 500).json({ success: false, message: errorMsg });
        }
    });

    return router;
};
                          
