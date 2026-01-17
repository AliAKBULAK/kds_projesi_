const db = require('../database/db_config');

exports.findAll = async () => {
    const query = `
      SELECT 
        p.id, 
        p.ad_soyad, 
        p.gorev, 
        p.maas, 
        d.ad AS departman_adi 
      FROM personeller p
      JOIN departmanlar d ON p.departman_id = d.id
      ORDER BY d.id, p.maas DESC
    `;
    const [rows] = await db.query(query);
    return rows;
};
