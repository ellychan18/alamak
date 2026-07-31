const express = require('express');
const axios = require('axios');
const router = express.Router();

module.exports = (api) => {
    // Handler untuk halaman utama (GET /)
    router.get('/', async (req, res) => {
        try {
            // Membangun URL untuk mengambil statistik. 
            // Parameter diubah menjadi 'false' agar request langsung ke server target tanpa proxy
            // (karena CORS tidak berlaku untuk request antar-server dari Node.js).
            const statUrl = api.buildUrl(api.endpoints.statistics, false);
            
            // Melakukan request ke endpoint statistik
            const response = await axios.get(statUrl, {
                headers: api.defaultHeaders
            });

            // Jika sukses, perbarui metrics di memori class LyrenzDev
            if (response.data && response.data.success) {
                api.updateMetrics(response.data.metrics);
            }

            // Render file views/index.ejs dengan data yang didapat
            res.render('index', {
                title: 'Home - LyrenzDev',
                active: 'home',
                metrics: api.metrics
            });

        } catch (error) {
            console.error("Gagal mengambil data statistik:", error.message);
            
            // Tetap render halaman menggunakan data metrics bawaan jika terjadi error
            res.render('index', {
                title: 'Home - LyrenzDev',
                active: 'home',
                metrics: api.metrics
            });
        }
    });

    return router;
};
