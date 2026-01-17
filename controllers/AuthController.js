const db = require('../database/db_config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'super_secret_hotel_key'; // In production, use .env

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Find User
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı.' });
        }

        const user = users[0];

        // 2. Check Password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Şifre hatalı.' });
        }

        // 3. Generate Token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            SECRET_KEY,
            { expiresIn: '2h' }
        );

        res.json({ token, username: user.username, role: user.role });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};
