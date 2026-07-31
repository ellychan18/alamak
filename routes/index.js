const homeRoutes = require('./home');
const apiRoutes = require('./api');

/**
 * Mendaftarkan seluruh rute aplikasi (UI & API)
 * @param {import('express').Express} app - Instance Express
 * @param {import('../lib/ServerData')} api - Instance ServerData Engine
 */
function setupRoutes(app, api) {
    // 1. Rute Tampilan Utama (UI)
    app.use('/', homeRoutes(api));

    // 2. Rute API Backend/Proxy
    // Jika apiRoutes berupa fungsi factory (menerima parameter 'api')
    if (typeof apiRoutes === 'function') {
        app.use('/api', apiRoutes(api));
    } else {
        // Jika apiRoutes berupa Router Express standar
        app.use('/api', apiRoutes);
    }
}

module.exports = setupRoutes;