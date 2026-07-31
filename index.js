require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts'); // Integrasi layout EJS
const path = require('path');
const ServerData = require('./lib/ServerData');
const apiRoutes = require('./routes/api');
const setupRoutes = require('./routes'); // Central router/page routes

const app = express();
const port = process.env.PORT || 3000;

// Inisialisasi Instance ServerData / API Engine
const api = new ServerData();

// Mengizinkan Express membaca IP & Protocol dari Reverse Proxy (misal: Vercel, Cloudflare, Nginx)
app.set('trust proxy', 1);

// Middleware parsing body request (Dipasang sebelum routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup direktori statis untuk aset (CSS, JS, Gambar)
app.use(express.static(path.join(__dirname, 'public')));

// Setup EJS & Express EJS Layouts sebagai template engine
app.use(expressLayouts);
app.set('layout', 'layout'); // Mengarah ke views/layout.ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Inject instance 'api' ke objek req agar bisa diakses di semua route controller jika diperlukan
app.use((req, res, next) => {
    req.api = api;
    next();
});

// Registrasi Route API utama (/api/stats, /api/send, /api/verify, dll)
app.use('/api', apiRoutes);

// Inisialisasi web/view routes utama (menyuapkan 'app' dan 'api' instance)
if (typeof setupRoutes === 'function') {
    setupRoutes(app, api);
}

// Handler untuk halaman 404 Not Found
app.use((req, res) => {
    if (req.accepts('html')) {
        return res.status(404).render('404', { active: '' });
    }
    res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan (404)' });
});

// Handler untuk Internal Server Error 500
app.use((err, req, res, next) => {
    console.error('[Server Error]:', err.stack || err.message);
    if (req.accepts('html')) {
        return res.status(500).render('error', { error: 'Terjadi kesalahan pada server.' });
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server (500)' });
});

// Jalankan server lokal (PM2/Nodemon/Local)
if (require.main === module) {
    app.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port}`);
    });
}

// Ekspor instance app untuk Vercel Serverless Function
module.exports = app;