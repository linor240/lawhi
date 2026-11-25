# Fabrique Lawhi.apk (appli Android). L'appli charge le site publié : une mise à jour du site
# arrive dans l'appli sans recompiler. Recompiler seulement si on change ce dossier (icônes, permissions, plugins).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$env:JAVA_HOME = "C:\Users\kasmi\Android\jdk"
$env:ANDROID_HOME = "C:\Users\kasmi\Android\sdk"
if (-not (Test-Path node_modules)) { npm install }
npx cap sync android
Push-Location android
.\gradlew.bat assembleDebug --console=plain -q
Pop-Location
Copy-Item android\app\build\outputs\apk\debug\app-debug.apk Lawhi.apk -Force
Write-Host "Lawhi.apk prêt : $PSScriptRoot\Lawhi.apk"
