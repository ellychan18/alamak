const express = require('express');
const axios = require('axios');
const crypto = require('crypto'); // Built-in Node.js untuk membuat hash
const router = express.Router();

module.exports = (api) => {
    
    const axiosConfig = {
        headers: api.defaultHeaders,
        timeout: 60000
    };

    const getErrorMessage = (error) => {
        if (error.response && error.response.data) {
            const data = error.response.data;
            if (typeof data.msg === 'string') return data.msg;
            if (typeof data.message === 'string') return data.message;
            if (typeof data === 'object') return JSON.stringify(data);
            return String(data);
        }
        return error.message || 'Koneksi ke server target terputus.';
    };

    // Fungsi mengambil Sesi Otomatis
    const getSession = async () => {
        const sessionUrl = api.buildUrl(api.endpoints.session);
        const response = await axios.get(sessionUrl, axiosConfig);
        return response.data;
    };

    // Fungsi pembuat Hash Proof of Work (X-Amprem-Pow)
    const generatePow = (nonce, email) => {
        /* PENTING: Karena rumus asli dari server untuk membuat Pow hash tidak diketahui pasti, 
           kita mencoba menggunakan hash SHA-256 standar dari string 'nonce'. 
           Jika Anda mendapatkan error "Invalid Proof of Work" dari server mereka, 
           Anda harus mencari tahu rumus asli (misal: nonce + token + email) dari pembuat API tersebut. */
        return crypto.createHash('sha256').update(nonce).digest('hex');
    };

    // POST /api/send
    router.post('/send', async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ success: false, message: 'Email wajib diisi' });

            // 1. Minta Token & Nonce ke server
            const session = await getSession();
            if (!session.status) throw new Error("Gagal memuat sesi API");

            // 2. Siapkan Header Otentikasi
            const pow = generatePow(session.nonce, email);
            const customHeaders = {
                ...axiosConfig.headers,
                'X-Amprem-Token': session.token,
                'X-Amprem-Nonce': session.nonce,
                'X-Amprem-Pow': pow
            };

            // 3. Eksekusi Kirim Email
            const targetUrl = api.buildUrl(api.endpoints.alight);
            const response = await axios.post(targetUrl, { action: 'send', email: email }, { headers: customHeaders });
            
            res.status(200).json({ success: response.data.status, message: response.data.msg || 'Link OOB dikirim.' });
        } catch (error) {
            const errorMsg = getErrorMessage(error);
            res.status(error?.response?.status || 500).json({ success: false, message: errorMsg });
        }
    });

    // POST /api/verify
    router.post('/verify', async (req, res) => {
        try {
            const { email, rawLink } = req.body;
            if (!email || !rawLink) return res.status(400).json({ success: false, message: 'Data tidak lengkap' });

            const session = await getSession();
            const pow = generatePow(session.nonce, email);

            const customHeaders = {
                ...axiosConfig.headers,
                'X-Amprem-Token': session.token,
                'X-Amprem-Nonce': session.nonce,
                'X-Amprem-Pow': pow
            };

            const targetUrl = api.buildUrl(api.endpoints.alight);
            const response = await axios.post(targetUrl, { action: 'verify', email: email, link: rawLink }, { headers: customHeaders });
            
            // Server baru menggabungkan status Premium ke dalam respon Verify.
            // Kita kembalikan idToken tiruan agar proses di Frontend berlanjut.
            res.status(200).json({ success: response.data.status, message: 'Berhasil di verifikasi.', idToken: 'SKIP_PREMIUM_CALL' });
        } catch (error) {
            const errorMsg = getErrorMessage(error);
            res.status(error?.response?.status || 500).json({ success: false, message: errorMsg });
        }
    });

    // POST /api/premium (Dibypass)
    router.post('/premium', async (req, res) => {
        // Karena di server baru aktivasi premium dilakukan bersamaan di step "verify", 
        // Endpoint ini dipanggil oleh frontend index.ejs kita namun langsung diberikan respon Sukses.
        res.status(200).json({ success: true, message: 'Status Premium VIP berhasil diaktifkan!' });
    });

    return router;
};
