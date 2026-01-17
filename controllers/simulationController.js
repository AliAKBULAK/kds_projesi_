const SimulationService = require('../services/SimulationService');

exports.saveSimulation = async (req, res) => {
    try {
        await SimulationService.saveSimulation(req.body);
        res.json({ message: 'Simülasyon başarıyla kaydedildi!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Kaydedilemedi' });
    }
};

exports.listScenarios = async (req, res) => {
    try {
        const rows = await SimulationService.getAllScenarios();
        res.json(rows);
    } catch (error) {
        console.error('Senaryo Listesi Hatası:', error);
        res.status(500).json({ error: 'Liste çekilemedi' });
    }
};

exports.getPrediction = (req, res) => {
    try {
        const { month } = req.params; // treating param as seasonKey
        const result = SimulationService.predictScenario(month);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Tahmin başarısız' });
    }
};
