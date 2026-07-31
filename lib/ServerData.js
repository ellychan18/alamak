require('dotenv').config();

class LyrenzDev {
    constructor() {
        this.baseUrl = process.env.BASE_URL || 'https://am.rafaelxd.my.id';
        this.proxyUrl = 'https://cors.caliph.my.id/';

        // Header disederhanakan mengikuti script referensi agar tidak diblokir firewall
        this.defaultHeaders = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
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

    // Default useProxy kita matikan (false) mengikuti script asli yang langsung direct
    buildUrl(endpoint, useProxy = false) {
        const targetUrl = `${this.baseUrl}${endpoint}`;
        return useProxy ? `${this.proxyUrl}${targetUrl}` : targetUrl;
    }
}

module.exports = LyrenzDev;
