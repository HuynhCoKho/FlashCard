@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

rem ============================================================
rem  Build FlashCard: APK debug (cai local) + AAB release (Play)
rem  Chay: scripts\build-android.bat
rem  Yeu cau: Node.js, Java 21, Android SDK (ANDROID_HOME hoac
rem           android\local.properties co dong sdk.dir=...)
rem  Muon AAB duoc ky, dat truoc 4 bien moi truong:
rem     FLASHCARD_STORE_FILE, FLASHCARD_STORE_PASSWORD,
rem     FLASHCARD_KEY_ALIAS,  FLASHCARD_KEY_PASSWORD
rem ============================================================

cd /d "%~dp0.."
echo Thu muc du an: %CD%
echo.

if "%FLASHCARD_STORE_FILE%"=="" (
  echo [!] Chua co FLASHCARD_STORE_FILE nen AAB se CHUA DUOC KY.
  echo     Play Console chi nhan file da ky bang dung khoa upload cu.
  echo.
) else (
  echo [i] Se ky AAB bang khoa: %FLASHCARD_STORE_FILE%
  echo.
)

echo [1/4] Cai thu vien npm...
call npm install --no-audit --no-fund
if errorlevel 1 goto :fail

echo.
echo [2/4] Build APK debug...
call npm run android:build
if errorlevel 1 goto :fail

echo.
echo [3/4] Build AAB release...
call npm run android:bundle
if errorlevel 1 goto :fail

echo.
echo [4/4] Gom file vao thu muc dist\
if not exist dist mkdir dist

set "VER=unknown"
for /f "tokens=2 delims= " %%v in ('findstr /c:"versionName" android\app\build.gradle') do set "VER=%%~v"

copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "dist\FlashCard-v!VER!-debug.apk" >nul
if errorlevel 1 goto :fail

if exist "android\app\build\outputs\bundle\release\app-release.aab" (
  copy /y "android\app\build\outputs\bundle\release\app-release.aab" "dist\FlashCard-v!VER!-release.aab" >nul
) else (
  copy /y "android\app\build\outputs\bundle\release\app-release-unsigned.aab" "dist\FlashCard-v!VER!-release-unsigned.aab" >nul
)
if errorlevel 1 goto :fail

echo.
echo ===== XONG =====
dir /b dist
echo.
echo APK: cai truc tiep len dien thoai.
echo AAB: tai len Google Play Console cho tester.
goto :end

:fail
echo.
echo ===== BUILD THAT BAI =====
echo Xem thong bao loi phia tren. Loi hay gap:
echo  - Thieu Android SDK: tao file android\local.properties voi dong
echo    sdk.dir=C:\\Users\\TEN_MAY\\AppData\\Local\\Android\\Sdk
echo  - Sai phien ban Java: can Java 21 (java -version de kiem tra).
exit /b 1

:end
endlocal
