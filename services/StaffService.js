const StaffModel = require('../models/StaffModel');

exports.getAllStaff = async () => {
    return await StaffModel.findAll();
};
