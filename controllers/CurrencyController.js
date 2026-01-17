const CurrencyService = require('../services/CurrencyService');

exports.getExchangeRates = async (req, res) => {
    try {
        const rates = await CurrencyService.getRates();
        res.json(rates);
    } catch (error) {
        console.error('Döviz Hatası:', error);
        // Fallback default rates if service fails
        res.json({ USD: 32.0, EUR: 35.0, error: 'Service Unavailable' });
    }
};
