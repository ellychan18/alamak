const homeRoutes = require('./home');
const apiRoutes = require('./api'); // Tambahkan ini

function setupRoutes(app, api) {
    // Rute Tampilan (UI)
    app.use('/', homeRoutes(api));

    // Rute API Frontend ke Backend
    app.use('/api', apiRoutes(api)); // Tambahkan ini
}

module.exports = setupRoutes;
