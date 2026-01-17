const SimulationModel = require('../models/SimulationModel');

exports.saveSimulation = async (data) => {
    return await SimulationModel.create(data);
};

exports.getAllScenarios = async () => {
    return await SimulationModel.findAll();
};

exports.predictScenario = (seasonKey) => {
    // Seasons: low (Winter), mid (Spring/Fall), high (Summer)

    let minOcc, maxOcc;
    let baseInflation = 45; // TR Reality Baseline (Optimistic estimate for 2025)

    // Inflation seasonality in TR:
    // Winter: Higher energy costs, New Year price hikes -> Higher Inflation
    // Summer: Agriculture abundance, tourism income -> Slightly lower/stable Inflation

    let predictedInflation, predictedOccupancy;

    if (seasonKey === 'high') {
        // YAZ (Summer) - Sabit: 92
        predictedOccupancy = 92;
        predictedInflation = baseInflation - 5; // ~40%
    } else if (seasonKey === 'mid') {
        // BAHAR (Spring/Autumn) - Sabit: 65
        predictedOccupancy = 65;
        predictedInflation = baseInflation; // ~45%
    } else if (seasonKey === 'yearly') {
        // YILLIK (Genel Ortalama) - Sabit: 68
        predictedOccupancy = 68;
        predictedInflation = baseInflation; // ~45%
    } else {
        // KIŞ (Winter) - Sabit: 46
        predictedOccupancy = 46;
        predictedInflation = baseInflation + 10; // ~55%
    }

    // Add Randomness to Inflation Only
    predictedInflation = Math.floor(predictedInflation + (Math.random() * 4 - 2)); // +/- 2% var

    return {
        season: seasonKey === 'high' ? 'Yaz Sezonu' : (seasonKey === 'mid' ? 'Bahar/Geçiş' : (seasonKey === 'yearly' ? 'Yıllık Ortalama' : 'Kış Sezonu')),
        predictedOccupancy,
        predictedInflation
    };
};
