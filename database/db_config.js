const mysql = require('mysql2');

// Veritabanı bağlantı ayarları
// Varsayılan XAMPP/WAMP ayarları kullanılmıştır (user: root, pass: boş)
// Eğer şifreniz varsa 'password' alanını güncelleyin.
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hotel_kds_db',
    multipleStatements: true
};

// Bağlantı havuzu oluştur (Performans için)
const pool = mysql.createPool(dbConfig);

module.exports = pool.promise();
