CREATE DATABASE IF NOT EXISTS hotel_kds_db;
USE hotel_kds_db;

DROP TABLE IF EXISTS saved_simulations;
DROP TABLE IF EXISTS historical_data;

CREATE TABLE historical_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    occupancy_rate DECIMAL(5,2),
    customer_count INT,
    room_price DECIMAL(10,2),
    personnel_expense DECIMAL(15,2),
    kitchen_expense DECIMAL(15,2),
    fixed_expense DECIMAL(15,2),
    other_expense DECIMAL(15,2),
    total_income DECIMAL(15,2)
);

CREATE TABLE saved_simulations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scenario_name VARCHAR(100),
    inflation_rate DECIMAL(5,2),
    raise_rate DECIMAL(5,2),
    target_occupancy DECIMAL(5,2),
    suggested_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Örnek Veri Ekleme (Manuel eklemek isterseniz)
-- Ancak `database/setup_db.js` dosyasını çalıştırırsanız burası otomatik dolar.
