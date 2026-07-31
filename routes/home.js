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

            // Render file views/home.ejs dengan data yang didapat
            res.render('home', {
                title: 'Home - LyrenzDev',
                active: 'home',
                metrics: api.metrics
            });

        } catch (error) {
            console.error("Gagal mengambil data statistik:", error.message);
            
            // Tetap render halaman menggunakan data metrics bawaan (0/disconnected) jika terjadi error
            res.render('home', {
                title: 'Home - LyrenzDev',
                active: 'home',
                metrics: api.metrics
            });
        }
    });

    return router;
};
