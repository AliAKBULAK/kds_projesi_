const db = require('../database/db_config');

exports.findByYear = async (year) => {
    const [rows] = await db.query(
        'SELECT * FROM gecmis_veriler WHERE yil = ? ORDER BY id ASC',
        [year]
    );
    return rows;
};

exports.findAll = async () => {
    const [rows] = await db.query(
        'SELECT * FROM gecmis_veriler ORDER BY yil ASC, id ASC'
    );
    return rows;
};
