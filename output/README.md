# OnurLtd Market - Meyve Pazarı Yönetim Sistemi

**Sürüm:** 1.0.0  
**Tarih:** Şubat 2026  
**Platform:** Windows 10/11 (64-bit)

## Kurulum Talimatları

### Hızlı Başlangıç
1. **OnurLtd Market.exe** dosyasını çift tıklatarak uygulamayı başlatın
2. Uygulama ilk kez çalıştığında otomatik olarak veritabanını oluşturacaktır
3. Giriş yapın ve işletme yönetimine başlayın

### Sistem Gereksinimleri
- **İşletim Sistemi:** Windows 10 veya Windows 11 (64-bit)
- **RAM:** En az 2GB (4GB+ önerilir)
- **Disk Alanı:** 500MB boş alan
- **Internet:** Çevrimdışı çalışır, internet gerektirmez

### Kurulum Adımları (Opsiyonel - Klonlama)
Başka bir bilgisayara aktarmak için:
1. `output` klasörünü USB ya da ağ paylaşımı üzerinden kopyalayın
2. Hedef bilgisayarda klasörü açın
3. `OnurLtd Market.exe` dosyasını çalıştırın

## Özellikler

### Satış Yönetimi
- Ürün satışı kaydı
- Otomatik fatura oluşturma
- Ödeme takibi (Ödendi/Kısmi Ödeme/Ödenmedi)
- Masraf ve komisyon hesaplama

### TIR (Kamyon) Envanteri
- Kamyonlara ürün envanteri ekleme
- Crate/Pallet/Box birimlerinde stok takibi
- Kalan envanter gösterimi
- Envanter otomatik güncelleme

### Müşteri Yönetimi
- Müşteri kaydı ve yönetimi
- Borç takibi
- Ödeme geçmişi
- Müşteri raporları

### Fatura Yönetimi
- Fatura oluşturma ve düzenleme
- Fatura numaralandırması
- Ödeme durumu takibi
- PDF rapor çıktısı

### Rapor ve Analiz
- Günlük satış raporları
- Müşteri borç toplamı raporları
- Ödeme durumu raporları
- TIR performans raporları

### Ayarlar
- Vergi oranı ayarları
- Fatura sırası ayarları
- Kullanıcı tercihler

## Veri Yönetimi

### Veritabanı
Uygulama tamamen çevrimdışı çalışır ve verileri yerel SQLite veritabanında saklar:
- **Veritabanı Konumu:** `%APPDATA%\OnurLtd Market\data.db`
- **Yedekleme:** Uygulama içinden "Yedekle" butonuyla yapılabilir

### Dil Desteği
- **Türkçe (TR)** - Varsayılan
- **İngilizce (EN)** - Opsiyonel

## Sorun Giderme

### Uygulama Açılmıyor
1. Windows'u yeniden başlatın
2. .NET Framework'ün güncel olduğundan emin olun
3. Antivirus yazılımının uygulamayı engellemiyor olduğunu kontrol edin

### Veritabanı Hataları
1. Uygulamayı kapatın
2. `%APPDATA%\OnurLtd Market\` klasörünü silin
3. Uygulamayı yeniden başlatın (yeni veritabanı oluşturulacak)

### Performans Sorunları
1. Başka uygulamaları kapatın
2. İşletim sistemini yeniden başlatın
3. Disk alanını kontrol edin

## Teknik Bilgiler

### Yapılar
- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Backend:** Node.js + SQLite
- **Desktop:** Electron 33
- **Localization:** i18next

### Dağıtım
- Portable Windows uygulaması (kurulum gerektirmez)
- Bağımlılıklar uygulamaya entegre edilmiş
- Çalışmak için sadece Windows 10+ gerekli

## Destek ve İletişim

Sorularınız veya teknik sorunlarınız için lütfen sistem yöneticinize başvurun.

---

**Geliştirildi:** Ocak-Şubat 2026  
**Platform:** Electron/Windows  
**Lisans:** Proprietary
