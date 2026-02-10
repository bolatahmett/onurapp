# 🚀 Release Süreci - OnurLtd Market

## Hızlı Başlangıç

Release oluşturmak için tek komut:

```bash
npm run release
```

Bu komut:
1. ✅ Tüm kodu derler (main, preload, renderer)
2. ✅ Output klasörünü günceller
3. ✅ ZIP dosyası oluşturur
4. ✅ Release notları hazırlar
5. ✅ `release/` klasörüne kaydeder

---

## 📋 Adım Adım Release Süreci

### 1. Versiyon Güncelleme (Opsiyonel)

Yeni sürüm için `package.json`'daki version'u güncelle:

```json
{
  "version": "1.0.3"  // veya yeni sürüm
}
```

### 2. Build ve Release

```bash
npm run release
```

### 3. Sonuçlar

Release tamamlandığında `release/` klasöründe:

```
release/
├── OnurLtd-Market-v1.0.2-Windows-x64.zip  (Kurulum dosyası)
└── RELEASE-v1.0.2.txt                     (Release notları)
```

### 4. Dağıtım

**ZIP dosyasını:**
- USB'ye kopyala
- Ağ paylaşımına yükle
- E-posta ile gönder
- Cloud storage'a yükle

---

## 📦 Release İçeriği

ZIP dosyasında:

```
OnurLtd Market.exe        (Ana uygulama - 188MB)
resources/                (Kaynaklar)
locales/                  (Dil dosyaları)
README.md                 (Kullanım talimatları)
KURULUM.txt              (Hızlı kurulum)
VERSION.txt              (Sürüm bilgisi)
+ Sistem DLL'leri
```

---

## 🔧 Manuel Release (Alternatif)

Eğer script çalışmazsa manuel olarak:

### Adım 1: Build
```bash
npm run build
```

### Adım 2: Output Hazırla
Output klasöründe tüm dosyaların olduğundan emin ol

### Adım 3: ZIP Oluştur (PowerShell)
```powershell
Compress-Archive -Path "output\*" -DestinationPath "release\OnurLtd-Market-v1.0.2.zip" -Force
```

### Adım 4: Dağıt
ZIP dosyasını paylaş

---

## 📝 Sürüm Notları

Her release için `RELEASE-vX.X.X.txt` dosyası otomatik oluşturulur:

- Sürüm numarası
- Derleme tarihi
- Platform bilgisi
- Kurulum talimatları
- Özellik listesi
- Dil desteği

---

## ⚙️ Gelişmiş Ayarlar

### Electron Builder (Tam Installer)

Tam Windows installer istiyorsanız:

```bash
npm run dist
```

**Not:** Code signing sertifikası gerektirir. Şu anki haliyle code signing devre dışı.

### Custom Package

Özel paket oluşturmak için `scripts/release.js` dosyasını düzenleyin.

---

## 🎯 Tavsiyeler

### Versiyonlama

Semantic versioning kullanın:
- `1.0.0` → `1.0.1` (Bug fix)
- `1.0.0` → `1.1.0` (Yeni özellik)
- `1.0.0` → `2.0.0` (Büyük değişiklik)

### Test

Release öncesi:
1. `npm run build` çalıştır
2. `npm start` ile test et
3. Tüm özellikleri kontrol et
4. 3 dilde dene (TR, EN, RU)

### Dağıtım

Release sonrası:
1. ZIP'i test bilgisayarında aç ve dene
2. README.md'yi kontrol et
3. Kullanıcılara göndermeden önce kendin kur

---

## 🐛 Sorun Giderme

### "Script bulunamadı" Hatası

```bash
# scripts klasörünün var olduğundan emin ol
dir scripts
```

### "Output klasörü yok" Hatası

```bash
# Önce build yap
npm run build
```

### ZIP oluşturamıyor

PowerShell yönetici olarak çalıştır:
```powershell
npm run release
```

---

## 📊 Başarılı Release Çıktısı

```
═══════════════════════════════════════════════════════════
           OnurLtd Market - Release Oluşturucu            
═══════════════════════════════════════════════════════════

[1] Versiyon bilgisi okunuyor...
   Sürüm: v1.0.2
✅ Versiyon bilgisi okundu

[2] Output klasörü kontrol ediliyor...
✅ Output klasörü bulundu

[3] Release klasörü hazırlanıyor...
✅ Release klasörü hazır

[4] Build dosyaları output klasörüne kopyalanıyor...
✅ Renderer dosyaları kopyalandı

[5] ZIP dosyası oluşturuluyor...
✅ ZIP dosyası oluşturuldu: OnurLtd-Market-v1.0.2-Windows-x64.zip (102 MB)

[6] Release notları oluşturuluyor...
✅ Release notları oluşturuldu

═══════════════════════════════════════════════════════════
                    ✅ RELEASE HAZIR!                       
═══════════════════════════════════════════════════════════
```

---

## 🎉 Başarılı Release!

Artık ZIP dosyanızı paylaşabilirsiniz. Kullanıcılar:
1. ZIP'i açacak
2. OnurLtd Market.exe'ye tıklayacak
3. Uygulama çalışacak ve kullanıma hazır olacak

**Kolay gelsin!** 🚀
