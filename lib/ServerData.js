require('dotenv').config();

class LyrenzDev {
    constructor() {
        this.baseUrl = process.env.BASE_URL || 'https://www.alightpro.my.id';

        this.defaultHeaders = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://www.alightpro.my.id/#verifikasi'
        };

        this.endpoints = {
            stats: '/api/stats',
            session: '/api/session',
            alight: '/api/alight-motion'
        };

        this.metrics = {
            successToday: 0,
            totalVerified: 0,
            isMongo: false
        };
    }

    updateMetrics(newMetrics) {
        this.metrics = { ...this.metrics, ...newMetrics };
        return this.metrics;
    }

    buildUrl(endpoint) {
        return `${this.baseUrl}${endpoint}`;
    }
}

module.exports = LyrenzDev;
