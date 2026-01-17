const StaffService = require('../services/StaffService');

exports.getAllStaff = async (req, res) => {
    try {
        const rows = await StaffService.getAllStaff();
        res.json(rows);
    } catch (error) {
        console.error('Personel API Hatası:', error);
        res.status(500).json({ error: 'Personel listesi çekilemedi' });
    }
};
