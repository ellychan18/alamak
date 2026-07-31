const express = require('express');
const router = express.Router();

module.exports = (api) => {
    router.get('/', async (req, res) => {
        // Safe default metrics agar EJS tidak error saat dipanggil
        let currentMetrics = (api && api.metrics) ? api.metrics : {
            successToday: 0,
            totalVerified: 0,
            isMongo: false
        };

        try {
            // Mengambil data statistik menggunakan method bawaan ServerData
            const statsResult = await api.getStats();
            const statsData = statsResult.data;

            if (statsData) {
                const updatedData = {
                    successToday: statsData.todayVerified ?? statsData.successToday ?? 0,
                    totalVerified: statsData.totalVerified ?? 0,
                    isMongo: statsData.isMongo ?? false
                };

                // Perbarui metrics di instance api jika method updateMetrics tersedia
                if (typeof api.updateMetrics === 'function') {
                    api.updateMetrics(updatedData);
                    currentMetrics = api.metrics;
                } else {
                    api.metrics = updatedData;
                    currentMetrics = updatedData;
                }
            }

            return res.render('index', {
                title: 'Home - LyrenzDev',
                active: 'home',
                metrics: currentMetrics
            });

        } catch (error) {
            console.error('[Home Route Error] Gagal mengambil data statistik:', error.message);
            
            return res.render('index', {
                title: 'Home - LyrenzDev',
                active: 'home',
                metrics: currentMetrics
            });
        }
    });

    return router;
};