const express = require('express');
const axios = require('axios');
const router = express.Router();

module.exports = (api) => {
    router.get('/', async (req, res) => {
        try {
            const statUrl = api.buildUrl(api.endpoints.stats);
            const response = await axios.get(statUrl, { headers: api.defaultHeaders });

            if (response.data && response.data.status) {
                // Menyesuaikan dengan format JSON dari www.alightpro.my.id
                api.updateMetrics({
                    successToday: response.data.todayVerified,
                    totalVerified: response.data.totalVerified,
                    isMongo: response.data.isMongo
                });
            }

            res.render('index', {
                title: 'Home - LyrenzDev',
                active: 'home',
                metrics: api.metrics
            });

        } catch (error) {
            console.error("Gagal mengambil data statistik:", error.message);
            res.render('index', {
                title: 'Home - LyrenzDev',
                active: 'home',
                metrics: api.metrics
            });
        }
    });

    return router;
};
