const homeRoutes = require('./home');
const apiRoutes = require('./api');

/**
 * Mendaftarkan seluruh rute aplikasi (UI & API)
 * @param {import('express').Express} app - Instance Express
 * @param {import('../lib/ServerData')} api - Instance ServerData Engine
 */
function setupRoutes(app, api) {
    // 1. Rute Tampilan Utama (UI)
    if (typeof homeRoutes === 'function') {
        app.use('/', homeRoutes(api));
    } else {
        app.use('/', homeRoutes);
    }

    // 2. Rute API Backend/Proxy
    // Menangani apiRoutes baik berupa fungsi factory maupun Router Express biasa
    if (typeof apiRoutes === 'function') {
        app.use('/api', apiRoutes(api));
    } else {
        app.use('/api', apiRoutes);
    }

    // 3. Fallback Route 404 (Untuk endpoint API yang tidak terdaftar)
    app.use('/api/*', (req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint API tidak ditemukan.'
        });
    });
}

module.exports = setupRoutes;