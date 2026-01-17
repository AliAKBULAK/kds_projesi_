const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const dataController = require('../controllers/dataController');
const simulationController = require('../controllers/simulationController');

// Staff Routes
router.get('/personel', staffController.getAllStaff);

// Data & Charts Routes
router.get('/data/all', dataController.getAllData);
router.get('/data/:year', dataController.getDataByYear);

// Auth Routes
const authController = require('../controllers/AuthController');
router.post('/login', authController.login);

// Simulation Routes
router.post('/simulation/save', simulationController.saveSimulation);
router.get('/simulation/list', simulationController.listScenarios);
router.get('/simulation/predict/:month', simulationController.getPrediction);

// Currency Routes
const currencyController = require('../controllers/CurrencyController');
router.get('/currency', currencyController.getExchangeRates);

module.exports = router;
