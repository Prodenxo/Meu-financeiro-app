# Sobe a API (:3333, do repo Meu-financeiro-clone) num terminal novo e o Expo neste, em modo LAN (celular via Expo Go).
# Uso (na raiz): npm run dev   ou   .\scripts\dev.ps1
# API em outra pasta: defina MF_BACKEND_DIR antes de rodar.

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backend = if ($env:MF_BACKEND_DIR) { $env:MF_BACKEND_DIR } else { Join-Path (Split-Path -Parent $root) 'Meu-financeiro-clone\backend' }
$frontend = Join-Path $root 'frontend'

function Test-EnvFile($path) {
  if (-not (Test-Path $path)) {
    Write-Host "Falta $path - copie do .env.example da mesma pasta e preencha." -ForegroundColor Red
    return $false
  }
  return $true
}

if (-not (Test-Path $backend)) {
  Write-Host "API nao encontrada em $backend (clone o repo Meu-financeiro-clone ao lado deste ou defina MF_BACKEND_DIR)." -ForegroundColor Red
  exit 1
}
if (-not (Test-EnvFile (Join-Path $backend '.env'))) { exit 1 }
if (-not (Test-EnvFile (Join-Path $frontend '.env'))) { exit 1 }

$apiUp = Get-NetTCPConnection -LocalPort 3333 -State Listen -ErrorAction SilentlyContinue
if ($apiUp) {
  Write-Host 'API ja esta rodando na porta 3333.' -ForegroundColor Cyan
} else {
  Write-Host 'Abrindo API em outro terminal (porta 3333)...' -ForegroundColor Cyan
  Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Set-Location -LiteralPath '$backend'; npm run dev"
  )
}

Write-Host 'Expo neste terminal: escaneie o QR Code com o Expo Go (mesmo Wi-Fi) ou tecle w para o navegador.' -ForegroundColor Green
Write-Host 'No celular, EXPO_PUBLIC_MEI_API_URL_DEV em frontend/.env precisa ser http://<IP-do-PC>:3333.' -ForegroundColor DarkGray
Write-Host ''

Set-Location -LiteralPath $frontend
if (-not (Test-Path 'node_modules') -and -not (Test-Path (Join-Path $root 'node_modules\expo'))) {
  Write-Host 'Instalando dependencias...' -ForegroundColor Yellow
  Set-Location -LiteralPath $root
  npm install
  Set-Location -LiteralPath $frontend
}
npx expo start --lan
