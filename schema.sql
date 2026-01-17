CREATE DATABASE IF NOT EXISTS kds_projesi_yeni;
USE kds_projesi_yeni;

-- 1. Personel Tanımları (Sabit Liste)
CREATE TABLE IF NOT EXISTS personel_ayarlari (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unvan VARCHAR(50),
    mevcut_maas DECIMAL(10,2), -- TL Bazlı
    varsayilan_sayi INT
) ENGINE=InnoDB;

-- 2. Simülasyon Başlıkları
CREATE TABLE IF NOT EXISTS simulasyonlar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tarih DATETIME DEFAULT CURRENT_TIMESTAMP,
    senaryo_adi VARCHAR(100),
    beklenen_kur DECIMAL(10,2),
    oneri_fiyat_dolar DECIMAL(10,2),
    tahmini_yillik_kar DECIMAL(15,2)
) ENGINE=InnoDB;

-- 3. Simülasyon Detayları (İlişkisel Tablo)
CREATE TABLE IF NOT EXISTS simulasyon_detaylari (
    id INT AUTO_INCREMENT PRIMARY KEY,
    simulasyon_id INT,
    personel_id INT,
    kullanilan_sayi INT,
    verilen_zam_orani INT,
    FOREIGN KEY (simulasyon_id) REFERENCES simulasyonlar(id) ON DELETE CASCADE,
    FOREIGN KEY (personel_id) REFERENCES personel_ayarlari(id)
) ENGINE=InnoDB;

-- 4. Geçmiş Veriler (Raporlama)
CREATE TABLE IF NOT EXISTS gecmis_veriler (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donem VARCHAR(50),
    toplam_gelir DECIMAL(15,2),
    personel_gideri DECIMAL(15,2),
    diger_giderler DECIMAL(15,2),
    net_kar DECIMAL(15,2)
) ENGINE=InnoDB;

-- Varsılan Veriler: Personel Ayarları
INSERT INTO personel_ayarlari (unvan, mevcut_maas, varsayilan_sayi) VALUES
('Genel Müdür', 85000.00, 1),
('Ön Büro Müdürü', 45000.00, 1),
('Resepsiyonist', 25000.00, 4),
('Kat Hizmetleri Müdürü', 40000.00, 1),
('Temizlik Personeli', 22000.00, 10),
('Aşçıbaşı', 55000.00, 1),
('Aşçı Yardımcısı', 28000.00, 3),
('Garson', 22000.00, 8),
('Teknik Servis', 26000.00, 2);

-- Varsayılan Veriler: Geçmiş Dönem (2024 Örnek Veri)
INSERT INTO gecmis_veriler (donem, toplam_gelir, personel_gideri, diger_giderler, net_kar) VALUES
('2024-Q1', 4500000.00, 1200000.00, 800000.00, 2500000.00),
('2024-Q2', 6800000.00, 1350000.00, 1100000.00, 4350000.00),
('2024-Q3', 9500000.00, 1500000.00, 1500000.00, 6500000.00),
('2024-Q4', 5200000.00, 1300000.00, 900000.00, 3000000.00);
