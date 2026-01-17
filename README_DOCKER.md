# 🐳 KDS Projesi - Docker Kurulum Rehberi

Bu projeyi başka bir bilgisayarda (Sunumda, Hocanın bilgisayarında vb.) çalıştırmak için en kolay yöntem Docker kullanmaktır.

## 1. Hazırlık
Gittiğiniz bilgisayarda **Docker Desktop** uygulamasının kurulu ve çalışıyor olması yeterlidir. Node.js veya MySQL kurmanıza gerek YOKTUR.

## 2. Çalıştırma

1.  Bu proje klasörünü bilgisayara kopyalayın.
2.  Klasörün içinde terminali açın.
3.  Şu komutu yazın:
    ```bash
    docker-compose up -d
    ```
    *(Bu komut hem MySQL veritabanını hem de bizim KDS uygulamasını otomatik kurar ve başlatır. İlk kez çalıştırırken indirme yapacağı için internet gereklidir & 1-2 dakika sürebilir.)*

## 3. Veritabanını Kurma (Sadece İlk Sefer)
Uygulama çalışmaya başladıktan sonra, tabloları ve verileri oluşturmak için şu komutu bir kez çalıştırın:
```bash
docker exec -it hotel_kds_app npm run setup-db
```

## 4. Giriş
Tarayıcıyı açın ve girin:
**http://localhost:3000**

## Kapatma
İşiniz bitince:
```bash
docker-compose down
```
