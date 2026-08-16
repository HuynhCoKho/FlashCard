# Dung ban AAB da ky, san sang tai len Google Play.
#
#   powershell -ExecutionPolicy Bypass -File scripts\build-release.ps1
#
# Moi thu can dung deu nam ngay trong kho, khong phai cai them gi:
#   .jdk\           JDK 21
#   .android-sdk\   Android SDK (platform 35/36, build-tools 34/35/36, licenses da chap nhan)
#   .release\       khoa upload flashcard-upload.jks + THONG-TIN-KHOA-UPLOAD.txt
#
# Ba thu muc nay deu nam trong .gitignore. Mat khau doc thang tu file thong tin
# khoa, khong in ra man hinh va khong ghi vao dau ca. Dung commit chung len Git.
#
# Nho tang versionCode trong android\app\build.gradle truoc khi dung ban moi,
# Play tu choi bundle trung versionCode voi ban da tai len.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

foreach ($needed in '.jdk', '.android-sdk', '.release\flashcard-upload.jks', '.release\THONG-TIN-KHOA-UPLOAD.txt') {
  if (-not (Test-Path (Join-Path $root $needed))) { throw "Thieu $needed trong $root" }
}

$jdk = Get-ChildItem (Join-Path $root '.jdk') -Directory | Select-Object -First 1
$env:JAVA_HOME        = $jdk.FullName
$env:ANDROID_HOME     = Join-Path $root '.android-sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:PATH             = "$($env:JAVA_HOME)\bin;$($env:PATH)"

$info = Get-Content (Join-Path $root '.release\THONG-TIN-KHOA-UPLOAD.txt') -Encoding UTF8
$secret = ($info | Where-Object { $_ -match '^Mat khau keystore/key:\s*(.+)$' } | Select-Object -First 1) -replace '^Mat khau keystore/key:\s*', ''
if (-not $secret) { throw 'Khong doc duoc mat khau trong THONG-TIN-KHOA-UPLOAD.txt' }

$env:FLASHCARD_STORE_FILE     = Join-Path $root '.release\flashcard-upload.jks'
$env:FLASHCARD_STORE_PASSWORD = $secret
$env:FLASHCARD_KEY_ALIAS      = 'flashcard-upload'
$env:FLASHCARD_KEY_PASSWORD   = $secret

Set-Content -LiteralPath (Join-Path $root 'android\local.properties') `
  -Value ('sdk.dir=' + $env:ANDROID_HOME.Replace('\', '\\')) -Encoding ascii

Set-Location $root
node scripts/sync-web.mjs
& node_modules\.bin\cap.cmd sync android

Set-Location (Join-Path $root 'android')
& .\gradlew.bat --no-daemon bundleRelease
if ($LASTEXITCODE -ne 0) { throw "Gradle that bai (ma $LASTEXITCODE)" }

$version = (Select-String -Path (Join-Path $root 'android\app\build.gradle') -Pattern 'versionName\s+"([^"]+)"').Matches[0].Groups[1].Value
$out = Join-Path $root ".release\FlashCard-v$version-release.aab"
Copy-Item (Join-Path $root 'android\app\build\outputs\bundle\release\app-release.aab') $out -Force

# cap sync viet lai hai tep gradle nay theo duong dan node_modules cua may hien tai,
# de nguyen se lam ban dung tren may khac hong. Tra lai nhu trong kho.
Set-Location $root
& git checkout -- android/app/capacitor.build.gradle android/capacitor.settings.gradle

Write-Output ''
Write-Output "AAB: $out"
& "$($env:JAVA_HOME)\bin\keytool.exe" -printcert -jarfile $out |
  Select-String 'SHA1:' | ForEach-Object { 'Chu ky ' + $_.Line.Trim() }
Write-Output 'Doi chieu SHA-1 nay voi chung chi khoa tai len trong Play Console > Duoc bao ve bang Play.'
