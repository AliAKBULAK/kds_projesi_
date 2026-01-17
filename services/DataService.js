const DataModel = require('../models/DataModel');
const { calculateProfit } = require('../utils/helpers');

exports.getDashboardData = async (year) => {
    const rows = await DataModel.findByYear(year);

    if (rows.length === 0) {
        return { year, summary: null, monthlyData: [] };
    }

    // Yıllık Özet Hesaplama
    const summary = rows.reduce((acc, row) => {
        acc.totalIncome += parseFloat(row.toplam_gelir || 0);
        acc.totalExpense += (
            parseFloat(row.personel_gideri || 0) +
            parseFloat(row.mutfak_gideri || 0) +
            parseFloat(row.sabit_gider || 0) +
            parseFloat(row.diger_gider || 0)
        );
        acc.avgOccupancy += parseFloat(row.doluluk_orani || 0);
        acc.totalCustomers += parseInt(row.musteri_sayisi || 0);
        acc.avgPrice += parseFloat(row.oda_fiyati || 0);
        return acc;
    }, { totalIncome: 0, totalExpense: 0, avgOccupancy: 0, totalCustomers: 0, avgPrice: 0 });

    if (rows.length > 0) {
        summary.avgOccupancy /= rows.length;
        summary.avgPrice /= rows.length;
    }

    const mappedRows = rows.map(row => ({
        ...row,
        year: row.yil,
        month: row.ay,
        occupancy_rate: row.doluluk_orani,
        customer_count: row.musteri_sayisi,
        room_price: row.oda_fiyati,
        personnel_expense: row.personel_gideri,
        kitchen_expense: row.mutfak_gideri,
        fixed_expense: row.sabit_gider,
        other_expense: row.diger_gider,
        total_income: row.toplam_gelir
    }));

    return {
        year,
        summary,
        monthlyData: mappedRows
    };
};

exports.getAllDashboardData = async () => {
    const rows = await DataModel.findAll();

    // Group by Year
    const grouped = rows.reduce((acc, row) => {
        const y = row.yil;
        if (!acc[y]) acc[y] = [];
        acc[y].push(row);
        return acc;
    }, {});

    const result = {};

    for (const [year, yearlyRows] of Object.entries(grouped)) {
        // Yıllık Özet Hesaplama
        // Yıllık Özet Hesaplama
        const summary = yearlyRows.reduce((acc, row) => {
            acc.totalIncome += parseFloat(row.toplam_gelir || 0);
            acc.totalExpense += (
                parseFloat(row.personel_gideri || 0) +
                parseFloat(row.mutfak_gideri || 0) +
                parseFloat(row.sabit_gider || 0) +
                parseFloat(row.diger_gider || 0)
            );
            acc.avgOccupancy += parseFloat(row.doluluk_orani || 0);
            acc.totalCustomers += parseInt(row.musteri_sayisi || 0);
            acc.avgPrice += parseFloat(row.oda_fiyati || 0);
            return acc;
        }, { totalIncome: 0, totalExpense: 0, avgOccupancy: 0, totalCustomers: 0, avgPrice: 0 });

        if (yearlyRows.length > 0) {
            summary.avgOccupancy /= yearlyRows.length;
            summary.avgPrice /= yearlyRows.length;
        }

        const mappedRows = yearlyRows.map(row => ({
            ...row,
            year: row.yil,
            month: row.ay,
            total_income: row.toplam_gelir,
            total_expense: (
                parseFloat(row.personel_gideri || 0) +
                parseFloat(row.mutfak_gideri || 0) +
                parseFloat(row.sabit_gider || 0) +
                parseFloat(row.diger_gider || 0)
            ),
            personnel_expense: row.personel_gideri,
            kitchen_expense: row.mutfak_gideri,
            fixed_expense: row.sabit_gider,
            other_expense: row.diger_gider,
            occupancy_rate: row.doluluk_orani
        }));

        result[year] = {
            summary,
            monthlyData: mappedRows
        };
    }

    return result;
};
