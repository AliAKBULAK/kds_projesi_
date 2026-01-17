const DataService = require('../services/DataService');

exports.getDataByYear = async (req, res) => {
    try {
        const year = req.params.year;
        const data = await DataService.getDashboardData(year);
        res.json(data);

    } catch (error) {
        console.error('API HATASI:', error);
        res.status(500).json({ error: 'Veri tabanı hatası: ' + error.message });
    }
};

exports.getAllData = async (req, res) => {
    try {
        const data = await DataService.getAllDashboardData();
        res.json(data);
    } catch (error) {
        console.error('API HATASI (ALL):', error);
        res.status(500).json({ error: 'Veri hatası: ' + error.message });
    }
};
