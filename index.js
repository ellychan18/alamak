require('dotenv').config();
const express = require('express');
const path = require('path');
const LyrenzDev = require('./lib/ServerData');
const setupRoutes = require('./routes');

const app = express();
const port = process.env.PORT || 3000;
const api = new LyrenzDev();

// Setup direktori statis untuk aset (CSS, JS, Gambar)
app.use(express.static(path.join(__dirname, 'public')));

// Setup EJS sebagai template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware parsing body request
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Inisialisasi routes dan menyuntikkan instance API ke dalamnya
setupRoutes(app, api);

// Handler untuk halaman 404 Not Found
app.use((req, res) => {
    res.status(404).render('404', { active: '' });
});

// Handler untuk Internal Server Error 500
app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).render('error', { error: 'Terjadi kesalahan pada server.' });
});

// Jalankan server lokal (PM2/Nodemon) atau ekspor untuk Vercel Serverless
if (require.main === module) {
    app.listen(port, () => {
        console.log(`🦊 LyrenzDev running at http://localhost:${port}`);
    });
}

module.exports = app;
