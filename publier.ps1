# Publie une nouvelle version de Lawhi sur GitHub Pages.
# Exemple :
#   .\publier.ps1 -Version 1.1.0 -Notes "Ajout des notifications de prière", "Correction du lecteur"
# Les téléphones la voient au prochain contrôle (30 s après l'ouverture, puis toutes les 6 h).
param(
  [Parameter(Mandatory)][ValidatePattern('^\d+\.\d+\.\d+$')][string]$Version,
  [Parameter(Mandatory)][string[]]$Notes
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)

$current = (Get-Content version.json -Raw -Encoding UTF8 | ConvertFrom-Json).version
if ([version]$Version -le [version]$current) { throw "La version $Version doit être plus grande que la version actuelle ($current)." }

# Le même numéro à trois endroits : l'appli, le service worker (nouveau cache) et version.json.
foreach ($f in 'update.js', 'sw.js') {
  $t = [IO.File]::ReadAllText("$PSScriptRoot\$f", $utf8)
  $t = $t -replace '(const (APP_VERSION|VERSION) = ")[^"]+(")', "`${1}$Version`${3}"
  [IO.File]::WriteAllText("$PSScriptRoot\$f", $t, $utf8)
}
$json = [ordered]@{ version = $Version; date = (Get-Date -Format 'yyyy-MM-dd'); notes = @($Notes) } | ConvertTo-Json -Depth 3
[IO.File]::WriteAllText("$PSScriptRoot\version.json", $json + "`n", $utf8)

git add -A
git commit -m "Version $Version" -m ($Notes -join "`n")
git push
Write-Host "Version $Version publiée. En ligne d'ici 1 à 2 minutes : https://linor240.github.io/lawhi/" -ForegroundColor Green
