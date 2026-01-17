const https = require('https');
const xml2js = require('xml2js');

const TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';
let cache = {
    data: null,
    lastFetch: 0
};

exports.getRates = () => {
    return new Promise((resolve, reject) => {
        // Cache logic (1 hour)
        const now = Date.now();
        if (cache.data && (now - cache.lastFetch < 3600000)) {
            return resolve(cache.data);
        }

        https.get(TCMB_URL, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                xml2js.parseString(data, (err, result) => {
                    if (err) return reject(err);

                    try {
                        const usd = result.Tarih_Date.Currency.find(c => c.$.CurrencyCode === 'USD').BanknoteSelling[0];
                        const eur = result.Tarih_Date.Currency.find(c => c.$.CurrencyCode === 'EUR').BanknoteSelling[0];

                        const rates = {
                            USD: parseFloat(usd),
                            EUR: parseFloat(eur)
                        };

                        // Update Cache
                        cache.data = rates;
                        cache.lastFetch = now;

                        resolve(rates);
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                });
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};
