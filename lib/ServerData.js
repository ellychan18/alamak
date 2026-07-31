require('dotenv').config();

class LyrenzDev {
    constructor() {
        this.baseUrl = process.env.BASE_URL || 'https://am.rafaelxd.my.id';
        this.proxyUrl = 'https://cors.caliph.my.id/';

        this.defaultHeaders = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36',
            'Referer': 'https://am.rafaelxd.my.id/dashboard?tab=activation'
        };

        this.endpoints = {
            send: '/api/send',
            statistics: '/api/statistics',
            verify: '/api/verify',
            premium: '/api/premium'
        };

        this.metrics = {
            totalRequestsToday: 0,
            successToday: 0,
            failedToday: 0,
            totalUsers: 0,
            successRate: 0,
            mongoDbStatus: 'disconnected',
            serverStatus: 'operational',
            uptimeSeconds: 0
        };
    }

    updateMetrics(newMetrics) {
        this.metrics = { ...this.metrics, ...newMetrics };
        return this.metrics;
    }

    buildUrl(endpoint, useProxy = false) {
        const targetUrl = `${this.baseUrl}${endpoint}`;
        return useProxy ? `${this.proxyUrl}${targetUrl}` : targetUrl;
    }
}

module.exports = LyrenzDev;

