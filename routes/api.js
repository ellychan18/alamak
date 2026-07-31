const express = require('express');

/**
 * Factory Function Router API
 * @param {import('../lib/ServerData')} api - Instance ServerData / Engine API
 */
module.exports = (api) => {
    const router = express.Router();

    /**
     * Middleware Internal untuk Normalisasi Error Response
     */
    const handleRouteError = (res, error, defaultMsg = 'Terjadi kesalahan pada server') => {
        const status = error.status || 500;
        const message = error.message || defaultMsg;
        console.error(`[API Route Error] Status: ${status} | Message: ${message}`);
        return res.status(status).json({
            success: false,
            message: message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    };

    // ==========================================
    // 1. ENDPOINTS INFORMASI & STATISTIK
    // ==========================================

    /**
     * GET /api/stats
     * Mengambil data statistik umum server
     */
    router.get('/stats', async (req, res) => {
        try {
            const result = await api.getStats();
            return res.status(200).json(result.data);
        } catch (error) {
            return handleRouteError(res, error, 'Gagal mengambil data statistik');
        }
    });

    /**
     * GET /api/stats/recent
     * Mengambil statistik aktivitas terbaru
     */
    router.get('/stats/recent', async (req, res) => {
        try {
            const result = await api.getRecentStats();
            return res.status(200).json(result.data);
        } catch (error) {
            return handleRouteError(res, error, 'Gagal mengambil data aktivitas terbaru');
        }
    });

    // ==========================================
    // 2. ENDPOINTS PROSES OTENTIKASI & VERIFIKASI
    // ==========================================

    /**
     * POST /api/send
     * Mengirim link verifikasi OOB Firebase ke email user
     */
    router.post('/send', async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: 'Email wajib diisi' });
            }

            const result = await api.sendEmail(email);
            return res.status(200).json(result);
        } catch (error) {
            return handleRouteError(res, error, 'Gagal mengirim link ke email');
        }
    });

    /**
     * POST /api/verify
     * Melakukan verifikasi OOB Link Firebase & Mengaktifkan Status Premium Alight Motion
     */
    router.post('/verify', async (req, res) => {
        try {
            const { email, rawLink, link } = req.body;
            const targetLink = rawLink || link;

            if (!email || !targetLink) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email dan Link OOB Verifikasi wajib diisi' 
                });
            }

            const result = await api.verifyLink(email, targetLink);
            return res.status(200).json(result);
        } catch (error) {
            return handleRouteError(res, error, 'Gagal melakukan verifikasi link');
        }
    });

    /**
     * POST /api/alight-motion (Universal Single Endpoint)
     * Wrapper endpoint tunggal yang mendukung payload { action: "send" } atau { action: "verify" }
     */
    router.post('/alight-motion', async (req, res) => {
        try {
            const { action, email, rawLink, link } = req.body;

            if (!action) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Parameter action (send / verify) wajib disertakan' 
                });
            }

            if (action === 'send') {
                if (!email) {
                    return res.status(400).json({ success: false, message: 'Email wajib diisi' });
                }
                const result = await api.sendEmail(email);
                return res.status(200).json(result);

            } else if (action === 'verify') {
                const targetLink = rawLink || link;
                if (!email || !targetLink) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Email dan Link OOB Verifikasi wajib diisi' 
                    });
                }
                const result = await api.verifyLink(email, targetLink);
                return res.status(200).json(result);

            } else {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Action tidak valid. Gunakan "send" atau "verify"' 
                });
            }
        } catch (error) {
            return handleRouteError(res, error, 'Gagal memproses permintaan Alight Motion');
        }
    });

    // ==========================================
    // 3. ENDPOINT COMPATIBILITY & DUMMY STATUS
    // ==========================================

    /**
     * POST /api/premium
     * Endpoint kompatibilitas untuk mengonfirmasi status fitur VIP
     */
    router.post('/premium', (req, res) => {
        return res.status(200).json({
            success: true,
            message: 'Status Premium VIP berhasil diaktifkan!'
        });
    });

    return router;
};