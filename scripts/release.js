const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Renk kodları
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

async function createRelease() {
  try {
    log('\n═══════════════════════════════════════════════════════════', 'blue');
    log('           OnurLtd Market - Release Oluşturucu            ', 'blue');
    log('═══════════════════════════════════════════════════════════\n', 'blue');

    // 0. Electron process'lerini kapat
    logStep(0, 'Electron process\'leri kapatılıyor...');
    try {
      execSync('taskkill /F /IM electron.exe /T 2>nul', { stdio: 'ignore' });
      execSync('taskkill /F /IM "OnurLtd Market.exe" /T 2>nul', { stdio: 'ignore' });
      // Biraz bekle
      await new Promise(resolve => setTimeout(resolve, 2000));
      logSuccess('Electron process\'leri kapatıldı');
    } catch (err) {
      // Electron çalışmıyorsa sorun değil
      log('   (Çalışan electron process bulunamadı)', 'yellow');
    }

    // 1. Package.json'dan version al
    logStep(1, 'Versiyon bilgisi okunuyor...');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;
    log(`   Sürüm: v${version}`, 'yellow');
    logSuccess('Versiyon bilgisi okundu');

    // 2. Output klasörünü kontrol et
    logStep(2, 'Output klasörü kontrol ediliyor...');
    const outputDir = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(outputDir)) {
      logError('Output klasörü bulunamadı!');
      log('   Önce npm run build komutunu çalıştırın', 'yellow');
      process.exit(1);
    }
    logSuccess('Output klasörü bulundu');

    // 3. Release klasörünü oluştur
    logStep(3, 'Release klasörü hazırlanıyor...');
    const releaseDir = path.join(__dirname, '..', 'release');
    if (!fs.existsSync(releaseDir)) {
      fs.mkdirSync(releaseDir, { recursive: true });
    }
    logSuccess('Release klasörü hazır');

    // 4. Dist dosyalarını output'a kopyala
    logStep(4, 'Build dosyaları output klasörüne kopyalanıyor...');
    const distDir = path.join(__dirname, '..', 'dist');
    
    // Renderer dosyalarını kopyala
    const rendererSrc = path.join(distDir, 'renderer');
    if (fs.existsSync(rendererSrc)) {
      execSync(`xcopy "${rendererSrc}" "${outputDir}" /E /I /Y /Q`, { stdio: 'ignore' });
      logSuccess('Renderer dosyaları kopyalandı');
    }

    // 5. ZIP oluştur
    logStep(5, 'ZIP dosyası oluşturuluyor...');
    const zipName = `OnurLtd-Market-v${version}-Windows-x64.zip`;
    const zipPath = path.join(releaseDir, zipName);
    
    // Eski ZIP'i sil
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
    
    // Geçici klasöre kopyala (çalışan dosyalardan kaçınmak için)
    const tempDir = path.join(releaseDir, 'temp-release');
    if (fs.existsSync(tempDir)) {
      execSync(`rmdir /S /Q "${tempDir}"`, { stdio: 'ignore' });
    }
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Output içeriğini temp'e kopyala
    execSync(`xcopy "${outputDir}" "${tempDir}" /E /I /Y /Q`, { stdio: 'ignore' });
    
    // Temp'ten ZIP oluştur
    const psCommand = `Compress-Archive -Path "${tempDir}\\*" -DestinationPath "${zipPath}" -Force`;
    execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit' });
    
    // Temp klasörünü sil
    execSync(`rmdir /S /Q "${tempDir}"`, { stdio: 'ignore' });
    
    const zipStats = fs.statSync(zipPath);
    const zipSizeMB = (zipStats.size / (1024 * 1024)).toFixed(2);
    logSuccess(`ZIP dosyası oluşturuldu: ${zipName} (${zipSizeMB} MB)`);

    // 6. Release notları oluştur
    logStep(6, 'Release notları oluşturuluyor...');
    const releaseNotes = `
═══════════════════════════════════════════════════════════
  OnurLtd Market - Sürüm ${version}
═══════════════════════════════════════════════════════════

Derleme Tarihi: ${new Date().toLocaleDateString('tr-TR', { 
  day: '2-digit', 
  month: 'long', 
  year: 'numeric' 
})}

Platform: Windows 10/11 (64-bit)
Boyut: ${zipSizeMB} MB

─────────────────────────────────────────────────────────────
KURULUM TALİMATLARI
─────────────────────────────────────────────────────────────

1. ${zipName} dosyasını açın
2. İçeriği istediğiniz klasöre çıkarın
3. OnurLtd Market.exe dosyasını çalıştırın
4. Daha fazla bilgi için README.md dosyasına bakın

─────────────────────────────────────────────────────────────
DİL DESTEĞİ
─────────────────────────────────────────────────────────────

✓ Türkçe (TR)
✓ İngilizce (EN)
✓ Rusça (RU)

─────────────────────────────────────────────────────────────
ÖZELLİKLER
─────────────────────────────────────────────────────────────

✓ Satış Yönetimi
✓ Otomatik Fatura Oluşturma
✓ TIR/Kamyon Envanteri
✓ Müşteri Borç Takibi
✓ Ödeme Durumu Takibi
✓ Raporlar (PDF)
✓ Çevrimdışı Çalışma
✓ Veri Yedekleme/Geri Yükleme

═══════════════════════════════════════════════════════════
`;

    const notesPath = path.join(releaseDir, `RELEASE-v${version}.txt`);
    fs.writeFileSync(notesPath, releaseNotes, 'utf8');
    logSuccess('Release notları oluşturuldu');

    // Başarı mesajı
    log('\n═══════════════════════════════════════════════════════════', 'green');
    log('                    ✅ RELEASE HAZIR!                       ', 'green');
    log('═══════════════════════════════════════════════════════════\n', 'green');
    
    log('📦 Release Dosyaları:', 'blue');
    log(`   └── ${zipPath}`, 'yellow');
    log(`   └── ${notesPath}`, 'yellow');
    
    log('\n🚀 Dağıtım:', 'blue');
    log('   1. ZIP dosyasını paylaşın', 'yellow');
    log('   2. Kullanıcılar ZIP\'i açarak kurulum yapabilir', 'yellow');
    log('   3. OnurLtd Market.exe dosyasını çalıştırsınlar\n', 'yellow');

  } catch (error) {
    logError(`Release oluşturulurken hata: ${error.message}`);
    process.exit(1);
  }
}

// Script'i çalıştır
createRelease();
