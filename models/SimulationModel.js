const db = require('../database/db_config');

exports.create = async (data) => {
  const { scenario_name, inflation_rate, raise_rate, target_occupancy, suggested_price } = data;

  const query = `
      INSERT INTO kayitli_senaryolar 
      (senaryo_adi, enflasyon_orani, zam_orani, hedef_doluluk, onerilen_fiyat) 
      VALUES (?, ?, ?, ?, ?)
    `;

  return await db.query(query, [scenario_name, inflation_rate, raise_rate, target_occupancy, suggested_price]);
};

exports.findAll = async () => {
  const query = `SELECT * FROM kayitli_senaryolar ORDER BY kayit_tarihi DESC`;
  const [rows] = await db.query(query);
  return rows;
};
