const jwt = require('jsonwebtoken');
const SECRET_KEY = 'super_secret_hotel_key';

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(403).json({ error: 'Giriş yapmanız gerekiyor.' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Geçersiz Token.' });
        }
        req.user = user;
        next();
    });
};
