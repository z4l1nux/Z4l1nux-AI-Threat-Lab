# 🔨 Script de Build - Threat Modeling
# Compila o projeto para produção

Write-Host "🔨 Compilando Threat Modeling para produção..." -ForegroundColor Green

# Verificar se as dependências estão instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "src/client/node_modules")) {
    Write-Host "📦 Instalando dependências do frontend..." -ForegroundColor Yellow
    Set-Location "src/client"
    npm install
    Set-Location "../.."
}

# Build completo
Write-Host "🔨 Compilando backend..." -ForegroundColor Yellow
npm run build:backend

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao compilar backend" -ForegroundColor Red
    exit 1
}

Write-Host "🔨 Compilando frontend..." -ForegroundColor Yellow
npm run build:frontend

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao compilar frontend" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "Arquivos compilados:" -ForegroundColor Cyan
Write-Host "  Backend: dist/" -ForegroundColor White
Write-Host "  Frontend: public/react/" -ForegroundColor White
Write-Host ""
Write-Host "Para executar em produção:" -ForegroundColor Cyan
Write-Host "  npm start" -ForegroundColor White
