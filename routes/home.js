const express = require('express');
const axios = require('axios');
const router = express.Router();

module.exports = (api) => {
    // Handler untuk halaman utama (GET /)
    router.get('/', async (req, res) => {
        try {
            // Membangun URL untuk mengambil statistik. 
            // Parameter 'true' digunakan agar otomatis menggunakan proxy.
            const statUrl = api.buildUrl(api.endpoints.statistics, true);
            
            // Melakukan request ke endpoint statistik
            const response = await axios.get(statUrl, {
                headers: api.defaultHeaders
            });

            // Jika sukses, perbarui metrics di memori class LyrenzDev
            if (response.data && response.data.success) {
                api.updateMetrics(response.data.metrics);
            }

            // PERBAIKAN: Ganti 'home' menjadi 'index' agar mengarah ke views/index.ejs
            res.render('index', {
                title: 'Home - LyrenzDev',
                active: 'home',
                metrics: api.metrics
            });

        } catch (error) {
            console.error("Gagal mengambil data statistik:", error.message);
            
            // PERBAIKAN: Ganti 'home' menjadi 'index' di bagian catch juga
            res.render('index', {
                title: 'Home - LyrenzDev',
                active: 'home',
                metrics: api.metrics
            });
        }
    });

    return router;
};
