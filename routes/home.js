const express = require('express');
const router = express.Router();

module.exports = (api) => {
    // 1. Halaman Beranda (Home)
    router.get('/', async (req, res) => {
        // Safe default metrics agar EJS tidak error saat dipanggil
        let currentMetrics = (api && api.metrics) ? api.metrics : {
            successToday: 0,
            totalVerified: 0,
            isMongo: false
        };

        try {
            if (api && typeof api.getStats === 'function') {
                const statsResult = await api.getStats();
                const statsData = statsResult ? statsResult.data : null;

                if (statsData) {
                    const updatedData = {
                        successToday: statsData.todayVerified ?? statsData.successToday ?? 0,
                        totalVerified: statsData.totalVerified ?? 0,
                        isMongo: statsData.isMongo ?? false
                    };

                    if (typeof api.updateMetrics === 'function') {
                        api.updateMetrics(updatedData);
                        currentMetrics = api.metrics;
                    } else {
                        api.metrics = updatedData;
                        currentMetrics = updatedData;
                    }
                }
            }

            return res.render('index', {
                title: 'Home - LyrenzDev',
                active: 'home',
                activePage: 'home',
                metrics: currentMetrics
            });

        } catch (error) {
            console.error('[Home Route Error] Gagal mengambil data statistik:', error.message);
            
            return res.render('index', {
                title: 'Home - LyrenzDev',
                active: 'home',
                activePage: 'home',
                metrics: currentMetrics
            });
        }
    });

    // 2. Halaman Aktivasi
    router.get('/activation', (req, res) => {
        const currentMetrics = (api && api.metrics) ? api.metrics : {
            successToday: 0,
            totalVerified: 0,
            isMongo: false
        };

        res.render('index', {
            title: 'Aktivasi - LyrenzDev',
            active: 'activation',
            activePage: 'activation',
            metrics: currentMetrics
        });
    });

    // 3. Halaman Status Server / System
    router.get('/status', async (req, res) => {
        let currentMetrics = (api && api.metrics) ? api.metrics : {
            successToday: 0,
            totalVerified: 0,
            isMongo: false
        };

        try {
            if (api && typeof api.getStats === 'function') {
                const statsResult = await api.getStats();
                if (statsResult && statsResult.data) {
                    currentMetrics = {
                        successToday: statsResult.data.todayVerified ?? statsResult.data.successToday ?? 0,
                        totalVerified: statsResult.data.totalVerified ?? 0,
                        isMongo: statsResult.data.isMongo ?? false
                    };
                }
            }
        } catch (err) {
            console.error('[Status Route Error]:', err.message);
        }

        res.render('status', {
            title: 'Status Sistem - LyrenzDev',
            active: 'status',
            activePage: 'status',
            metrics: currentMetrics
        });
    });

    // 4. Halaman Tentang Kami
    router.get('/about', (req, res) => {
        res.render('about', {
            title: 'Tentang Kami - LyrenzDev',
            active: 'about',
            activePage: 'about'
        });
    });

    return router;
};