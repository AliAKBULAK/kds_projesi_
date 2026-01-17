# Otel KDS Projesi (Enterprise Edition)

Bu proje, Otel Yönetimi için geliştirilmiş akıllı bir Karar Destek Sistemidir (KDS).
Node.js, MySQL ve Vanilla JS teknolojileri kullanılarak geliştirilmiştir.

## 🚀 Kurulum ve Çalıştırma

Bu projeyi çalıştırmak için iki yöntem vardır. En kolayı Docker kullanmaktır.

### Yöntem 1: Docker (Önerilen) 🐳
Bilgisayarınızda hiçbir kurulum yapmadan (Node.js veya MySQL gerekmez) projeyi çalıştırmak için:
👉 **[Docker Kurulum Rehberini Oku](README_DOCKER.md)**

### Yöntem 2: Manuel Kurulum 🛠️
Eğer kendi bilgisayarınızda Node.js ve MySQL kuruluysa:

1.  **Bağımlılıkları Yükle:**
    ```bash
    npm install
    ```

2.  **Veritabanını Hazırla:**
    *(MySQL servisinizin çalıştığından emin olun)*
    ```bash
    # Veritabanı tablolarını, trigger'ları ve örnek verileri kurar.
    node database/setup_db.js
    ```

3.  **Başlat:**
    ```bash
    npm run dev
    ```
    Tarayıcıda: `http://localhost:3000`

## 📂 Proje Özellikleri (Yeni Eklenenler)
- **Mevsimsel Simülasyon:** Yaz/Kış sezonuna göre doluluk ve enflasyon tahmini.
- **Vardiya Maliyet Sistemi:** Vardiya girildiği an bütçeye maliyet yansıyan trigger yapısı.
- **Risk Bekçisi:** Kritik senaryolarda devreye giren otomatik uyarı sistemi.
- **Audit Log:** Yapılan işlemlerin veritabanı seviyesinde loglanması.
