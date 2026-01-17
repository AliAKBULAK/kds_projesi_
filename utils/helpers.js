exports.formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
};

exports.calculateProfit = (income, expense) => {
    return income - expense;
};
