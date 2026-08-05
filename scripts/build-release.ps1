# ============================================================
#  Build FlashCard tren Windows: APK debug + AAB release da ky.
#  Chay:  powershell -ExecutionPolicy Bypass -File scripts\build-release.ps1
#
#  Script tu tim JDK 21 va Android SDK, tu doc khoa upload trong
#  .release\THONG-TIN-KHOA-UPLOAD.txt roi nap vao bien moi truong
#  cua rieng tien trinh nay. Mat khau khong bao gio duoc in ra.
#  Khong co file khoa thi van build, nhung AAB se chua duoc ky.
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# ----- JDK 21 -----
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    $bundled = Get-ChildItem "$root\.jdk" -Directory -ErrorAction SilentlyContinue |
        Where-Object { Test-Path "$($_.FullName)\bin\java.exe" } |
        Select-Object -First 1
    if (-not $bundled) {
        throw "Khong tim thay JDK 21. Dat JAVA_HOME hoac giai nen JDK vao $root\.jdk\"
    }
    $env:JAVA_HOME = $bundled.FullName
}
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
Write-Host "JDK   : $env:JAVA_HOME"

# ----- Android SDK -----
if (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
}
if (-not (Test-Path $env:ANDROID_HOME)) {
    throw "Khong tim thay Android SDK tai $env:ANDROID_HOME. Dat bien ANDROID_HOME."
}
Write-Host "SDK   : $env:ANDROID_HOME"

$localProps = "$root\android\local.properties"
$sdkLine = "sdk.dir=" + ($env:ANDROID_HOME -replace '\\', '\\')
if (-not (Test-Path $localProps) -or (Get-Content $localProps -Raw) -notmatch 'sdk\.dir') {
    Set-Content -Path $localProps -Value $sdkLine -Encoding utf8
}

# ----- Khoa upload (khong in gia tri) -----
$keyInfo = "$root\.release\THONG-TIN-KHOA-UPLOAD.txt"
$keyStore = "$root\.release\flashcard-upload.jks"
$signed = $false

if ((Test-Path $keyInfo) -and (Test-Path $keyStore)) {
    $alias = $null
    $secret = $null
    foreach ($line in Get-Content $keyInfo -Encoding utf8) {
        if ($line -match '^\s*Alias\s*:\s*(.+?)\s*$') { $alias = $Matches[1] }
        elseif ($line -match '^\s*Mat khau[^:]*:\s*(.+?)\s*$') { $secret = $Matches[1] }
    }
    if ($alias -and $secret) {
        $env:FLASHCARD_STORE_FILE = $keyStore
        $env:FLASHCARD_STORE_PASSWORD = $secret
        $env:FLASHCARD_KEY_ALIAS = $alias
        $env:FLASHCARD_KEY_PASSWORD = $secret
        $signed = $true
        Write-Host "Khoa  : $keyStore (AAB se duoc ky)"
    }
}
if (-not $signed) {
    Write-Host "Khoa  : khong co -> AAB se CHUA DUOC KY, Play Console se tu choi."
}
Write-Host ""

# ----- Build -----
Write-Host "[1/4] npm install..."
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm install that bai." }

Write-Host ""
Write-Host "[2/4] APK debug..."
npm run android:build
if ($LASTEXITCODE -ne 0) { throw "Build APK that bai." }

Write-Host ""
Write-Host "[3/4] AAB release..."
npm run android:bundle
if ($LASTEXITCODE -ne 0) { throw "Build AAB that bai." }

# ----- Gom file -----
Write-Host ""
Write-Host "[4/4] Gom file vao dist\..."
$version = (Select-String -Path "$root\android\app\build.gradle" -Pattern 'versionName\s+"([^"]+)"').Matches[0].Groups[1].Value
New-Item -ItemType Directory -Force -Path "$root\dist" | Out-Null

Copy-Item "$root\android\app\build\outputs\apk\debug\app-debug.apk" `
          "$root\dist\FlashCard-v$version-debug.apk" -Force

$aab = "$root\android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aab) {
    Copy-Item $aab "$root\dist\FlashCard-v$version-release.aab" -Force
} else {
    Copy-Item "$root\android\app\build\outputs\bundle\release\app-release-unsigned.aab" `
              "$root\dist\FlashCard-v$version-release-unsigned.aab" -Force
}

Write-Host ""
Write-Host "===== XONG ====="
Get-ChildItem "$root\dist" | Select-Object Name, @{n='MB';e={[math]::Round($_.Length/1MB,2)}}
Write-Host ""
Write-Host "APK: cai truc tiep len dien thoai."
Write-Host "AAB: tai len Google Play Console."
