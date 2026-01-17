const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs'); // Security First!


const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
};

const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

async function setupDatabase() {
    let connection;
    try {
        console.log('🔌 MySQL sunucusuna bağlanılıyor...');
        connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            multipleStatements: true
        });

        console.log('🛠️ Veritabanı (TÜRKÇE - InnoDB) Kuruluyor...');

        // 1. Veritabanı Oluştur
        await connection.query(`CREATE DATABASE IF NOT EXISTS hotel_kds_db`);
        await connection.query(`USE hotel_kds_db`);

        // Temizlik: Hem eski İngilizce hem yeni Türkçe tabloları sil
        const tables = [
            'employees', 'departments', 'historical_data', 'saved_simulations',
            'personeller', 'departmanlar', 'gecmis_veriler', 'kayitli_senaryolar', 'users',
            'system_logs', 'risk_alerts', 'vardiyalar', 'butce_giderleri'
        ];
        // FK hatası almamak için SET FOREIGN_KEY_CHECKS=0
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        for (let t of tables) await connection.query(`DROP TABLE IF EXISTS ${t}`);
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Eski tablolar temizlendi.');

        // 2. Tabloları Oluştur (TÜRKÇE & InnoDB)

        // A. DEPARTMANLAR
        await connection.query(`
            CREATE TABLE departmanlar (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ad VARCHAR(100) NOT NULL,
                mevcut_personel_sayisi INT DEFAULT 0
            ) ENGINE=InnoDB;
        `);

        // B. PERSONELLER
        await connection.query(`
            CREATE TABLE personeller (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ad_soyad VARCHAR(100) NOT NULL,
                gorev VARCHAR(100),
                maas DECIMAL(10,2),
                departman_id INT,
                FOREIGN KEY (departman_id) REFERENCES departmanlar(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);

        // C. GEÇMİŞ VERİLER (Raporlama)
        await connection.query(`
            CREATE TABLE gecmis_veriler (
                id INT AUTO_INCREMENT PRIMARY KEY,
                yil INT NOT NULL,
                ay VARCHAR(20) NOT NULL,
                doluluk_orani DECIMAL(5,2),
                musteri_sayisi INT,
                oda_fiyati DECIMAL(10,2),
                personel_gideri DECIMAL(15,2),
                mutfak_gideri DECIMAL(15,2),
                sabit_gider DECIMAL(15,2),
                diger_gider DECIMAL(15,2),
                toplam_gelir DECIMAL(15,2)
            ) ENGINE=InnoDB;
        `);

        // D. KAYITLI SENARYOLAR
        await connection.query(`
            CREATE TABLE kayitli_senaryolar (
                id INT AUTO_INCREMENT PRIMARY KEY,
                senaryo_adi VARCHAR(100),
                enflasyon_orani DECIMAL(5,2),
                zam_orani DECIMAL(5,2),
                hedef_doluluk DECIMAL(5,2),
                onerilen_fiyat DECIMAL(10,2),
                kayit_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        // E. KULLANICILAR (USERS) - Secure Login
        await connection.query(`
            CREATE TABLE users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        // F. SİSTEM LOGLARI (AUDIT LOGS) - New Table
        await connection.query(`
            CREATE TABLE system_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_type VARCHAR(50), -- SCENARIO_CREATED, SCENARIO_DELETED
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        // G. RİSK ALARMLARI (BUSINESS LOGIC) - New Table
        await connection.query(`
            CREATE TABLE risk_alerts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                scenario_id INT,
                risk_level VARCHAR(20), -- HIGH, CRITICAL
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (scenario_id) REFERENCES kayitli_senaryolar(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);

        console.log('✅ Tablolar (TÜRKÇE) başarıyla oluşturuldu.');

        // --- TRIGGERS ---

        // 1. TRIGGER: Audit Log (Yeni Senaryo Eklendiğinde)
        await connection.query(`
            CREATE TRIGGER after_scenario_insert 
            AFTER INSERT ON kayitli_senaryolar
            FOR EACH ROW 
            BEGIN
                INSERT INTO system_logs (event_type, description) 
                VALUES ('SCENARIO_CREATED', CONCAT('Yeni Senaryo Eklendi: ', NEW.senaryo_adi, ' (Hedef Doluluk: %', NEW.hedef_doluluk, ')'));
            END
        `);

        // 2. TRIGGER: Backup Log (Senaryo Silinmeden Önce)
        // Note: DELETE özelliği henüz UI'da yok ama DB seviyesinde hazır olsun.
        await connection.query(`
            CREATE TRIGGER before_scenario_delete
            BEFORE DELETE ON kayitli_senaryolar
            FOR EACH ROW 
            BEGIN
                INSERT INTO system_logs (event_type, description) 
                VALUES ('SCENARIO_DELETED', CONCAT('Senaryo Silindi! Yedek İsim: ', OLD.senaryo_adi, ' | ID: ', OLD.id));
            END
        `);

        // 3. TRIGGER: Risk Watchdog (İş Zekası - Enflasyon/Doluluk Kontrolü)
        await connection.query(`
            CREATE TRIGGER risk_watchdog
            AFTER INSERT ON kayitli_senaryolar
            FOR EACH ROW 
            BEGIN
                -- Kural 1: Yüksek Enflasyon Riski (> %50)
                IF NEW.enflasyon_orani > 50 THEN
                    INSERT INTO risk_alerts (scenario_id, risk_level, message)
                    VALUES (NEW.id, 'CRITICAL', CONCAT('Kritik Enflasyon Seviyesi: %', NEW.enflasyon_orani, '. Maliyetleri Gözden Geçirin!'));
                END IF;

                -- Kural 2: Düşük Doluluk Riski (< %40)
                IF NEW.hedef_doluluk < 40 THEN
                    INSERT INTO risk_alerts (scenario_id, risk_level, message)
                    VALUES (NEW.id, 'HIGH', CONCAT('Düşük Doluluk Uyarısı: %', NEW.hedef_doluluk, '. Gelir kaybı riski yüksek.'));
                END IF;
            END
        `);

        // --- YENİ EKLENENLER (TABLOLAR) ---

        // H. VARDİYALAR (Shift Management)
        await connection.query(`
            CREATE TABLE vardiyalar (
                id INT AUTO_INCREMENT PRIMARY KEY,
                personel_id INT NOT NULL,
                tarih DATE,
                baslangic_saati TIME,
                bitis_saati TIME,
                FOREIGN KEY (personel_id) REFERENCES personeller(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);

        // I. BÜTÇE GİDERLERİ (Cost Tracking)
        await connection.query(`
            CREATE TABLE butce_giderleri (
                id INT AUTO_INCREMENT PRIMARY KEY,
                kategori VARCHAR(50), -- 'PERSONEL_VARDIYA'
                aciklama VARCHAR(255),
                tutar DECIMAL(10,2),
                tarih TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        // --- YENİ EKLENEN TRIGGER (MALİYET ŞERİDİ) ---

        // 4. TRIGGER: Otomatik Vardiya Maliyeti Hesaplama
        // Bu trigger, vardiya eklendiğinde personelin saatlik ücretini bulur ve maliyeti bütçeye yazar.
        await connection.query(`
            CREATE TRIGGER calculate_shift_cost
            AFTER INSERT ON vardiyalar
            FOR EACH ROW 
            BEGIN
                DECLARE saatlik_ucret DECIMAL(10,2);
                DECLARE calisma_saati DECIMAL(5,2);
                DECLARE toplam_maliyet DECIMAL(10,2);
                DECLARE personel_adi VARCHAR(100);

                -- 1. Personelin Maaşını ve Adını Bul
                SELECT maas / 225, ad_soyad INTO saatlik_ucret, personel_adi 
                FROM personeller WHERE id = NEW.personel_id;

                -- 2. Çalışma Süresini Hesapla (Saat cinsinden)
                SET calisma_saati = TIMESTAMPDIFF(MINUTE, NEW.baslangic_saati, NEW.bitis_saati) / 60;

                -- 3. Maliyeti Hesapla
                SET toplam_maliyet = calisma_saati * saatlik_ucret;

                -- 4. Bütçe Tablosuna Yaz (Otomatik Muhasebe)
                INSERT INTO butce_giderleri (kategori, aciklama, tutar)
                VALUES ('PERSONEL_VARDIYA', CONCAT(personel_adi, ' - ', NEW.tarih, ' (', calisma_saati, ' Saat)'), toplam_maliyet);
            END
        `);

        console.log('⚡ Triggerlar (Tetikleyiciler) başarıyla kuruldu.');

        // 3. Verileri Doldur

        // DEPARTMANLAR
        const depts = [
            [1, 'Yönetim'],
            [2, 'Ön Büro'],
            [3, 'Mutfak'],
            [4, 'Kat Hizmetleri'],
            [5, 'Teknik & Güvenlik']
        ];
        await connection.query('INSERT INTO departmanlar (id, ad) VALUES ?', [depts]);

        // PERSONELLER (Sanitize Edilmiş, Gerçekçi İsimler)
        let employees = [];
        const addEmp = (ad, gorev, maas, deptId) => {
            employees.push([ad, gorev, maas, deptId]);
        };

        // Yönetim
        addEmp('Ali Yılmaz', 'Genel Müdür', 85000, 1);
        addEmp('Derya Koç', 'Otel Müdürü', 60000, 1);
        addEmp('Mehmet Öz', 'Muhasebe Müdürü', 45000, 1);
        addEmp('Selin Ak', 'İK Müdürü', 45000, 1);

        // Ön Büro
        addEmp('Canan Erkin', 'Ön Büro Şefi', 35000, 2);
        ['Burak', 'Ceren', 'Deniz', 'Emre'].forEach(n => addEmp(`${n} Demir`, 'Resepsiyonist', 22000, 2));
        addEmp('Faruk Kaya', 'Bellboy', 18000, 2);
        addEmp('Gökhan Tekin', 'Bellboy', 18000, 2);

        // Mutfak
        addEmp('Murat Şef', 'Executive Chef', 70000, 3); // Vedat Milor gitti
        addEmp('Hakan Şef', 'Sous Chef', 40000, 3);
        ['Ayşe', 'Fatma', 'Hayri'].forEach(n => addEmp(`${n} Usta`, 'Sıcak/Soğuk Şefi', 28000, 3));
        ['Orhan', 'Remzi', 'Salih'].forEach(n => addEmp(`${n} Bey`, 'Bulaşıkhane', 18000, 3));
        ['Merve', 'Kaan', 'Lale', 'Jale', 'Bora', 'Cenk'].forEach(n => addEmp(`${n} Yılmaz`, 'Servis Elemanı', 19000, 3));

        // Housekeeping
        addEmp('Sultan Hanım', 'Kat Şefi', 30000, 4);
        for (let i = 1; i <= 8; i++) addEmp(`Temizlik Personeli ${i}`, 'Kat Görevlisi', 18000, 4);

        // Teknik
        addEmp('Mahmut Usta', 'Teknik Müdür', 35000, 5);
        addEmp('Rıza Soylu', 'Güvenlik Amiri', 28000, 5);
        addEmp('Mehmet Ali', 'Güvenlik', 20000, 5); // Memoli gitti

        await connection.query('INSERT INTO personeller (ad_soyad, gorev, maas, departman_id) VALUES ?', [employees]);

        // ADMIN KULLANCISI EKLE
        // Şifre: 'admin123' (Bcrypt ile hashlenmiş hali)
        const passwordHash = await bcrypt.hash('admin123', 10);
        await connection.query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', passwordHash, 'admin']);


        // Departman Sayılarını Güncelle
        await connection.query(`
            UPDATE departmanlar d 
            JOIN (SELECT departman_id, COUNT(*) as cnt FROM personeller GROUP BY departman_id) p 
            ON d.id = p.departman_id 
            SET d.mevcut_personel_sayisi = p.cnt
        `);

        // GEÇMİŞ VERİLER (Report Data)
        const data = [];
        const rooms = 100;

        for (let year of [2020, 2021, 2022, 2023, 2024]) {
            // Yıl bazlı katsayılar (Enflasyon ve Pandemi etkisi)
            let costMult = 1.0;
            let pandemicFactor = 1.0; // Doluluk etkileyici

            if (year === 2020) { costMult = 0.30; pandemicFactor = 0.55; } // Pandemi Başlangıcı
            else if (year === 2021) { costMult = 0.45; pandemicFactor = 0.70; } // Pandemi Devam
            else if (year === 2022) { costMult = 0.65; pandemicFactor = 0.95; } // Toparlanma
            else if (year === 2023) { costMult = 1.00; } // Baz Yıl
            else if (year === 2024) { costMult = 1.70; } // Enflasyonist Kriz

            const isCrisis = year === 2024;

            let baseFix = 300000 * costMult;
            let basePers = 1000000 * costMult;

            months.forEach((month, index) => {
                let season = 0.4;
                let priceFac = 0.8;

                if ([3, 4, 8, 9].includes(index)) { season = 0.7; priceFac = 1.0; }
                else if ([5, 6, 7].includes(index)) { season = 0.95; priceFac = 1.5; }

                let noise = (Math.random() * 0.1 - 0.05);

                // 2020 Mart öncesi (Index 0,1) pandemi yoktu
                let currentPandemicFactor = pandemicFactor;
                if (year === 2020 && index < 2) currentPandemicFactor = 1.0;

                let occ = Math.min(100, Math.max(15, (season + noise) * 100 * currentPandemicFactor));
                let sold = rooms * (occ / 100) * 30;
                let cust = Math.floor(sold * 1.8);
                let price = (1800 * costMult) * priceFac + (Math.random() * 50);
                let inc = sold * price;

                let expPers = basePers + (sold * 50 * costMult);
                let expKit = cust * (150 * costMult);
                let expFix = baseFix + ([0, 1, 10, 11].includes(index) ? 50000 * costMult : 0) + (Math.random() * 10000);
                let expOth = (inc * 0.05) + (50000 * costMult);

                data.push([
                    year, month,
                    occ.toFixed(2), cust, price.toFixed(2),
                    expPers.toFixed(2), expKit.toFixed(2), expFix.toFixed(2), expOth.toFixed(2),
                    inc.toFixed(2)
                ]);
            });
        }

        await connection.query(`
            INSERT INTO gecmis_veriler 
            (yil, ay, doluluk_orani, musteri_sayisi, oda_fiyati, personel_gideri, mutfak_gideri, sabit_gider, diger_gider, toplam_gelir) 
            VALUES ?
        `, [data]);

        console.log('✅ Türkçe Veritabanı Hazır! (Veriler Eklendi)');

    } catch (error) {
        console.error('❌ Hata:', error);
    } finally {
        if (connection) await connection.end();
        console.log('👋');
    }
}

setupDatabase();
