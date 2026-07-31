require('dotenv').config();

class LyrenzDev {
    constructor() {
        const rawBaseUrl = process.env.BASE_URL || 'https://www.alightpro.my.id';
        this.baseUrl = rawBaseUrl.replace(/\/$/, '');

        this.defaultHeaders = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': this.baseUrl,
            'Referer': `${this.baseUrl}/`
        };

        this.endpoints = {
            stats: '/api/stats',
            statsRecent: '/api/stats/recent',
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
        return new URL(endpoint, this.baseUrl).href;
    }
}

module.exports = LyrenzDev;
