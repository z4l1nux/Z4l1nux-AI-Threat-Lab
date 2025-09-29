# 🚀 Script de Desenvolvimento - Threat Modeling
# Executa o projeto em modo desenvolvimento

Write-Host "🚀 Iniciando Threat Modeling em modo desenvolvimento..." -ForegroundColor Green

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

# Executar em modo desenvolvimento
Write-Host "🔧 Iniciando aplicação..." -ForegroundColor Yellow
Write-Host "Aplicação: http://localhost:3000" -ForegroundColor Green
Write-Host "Frontend Dev: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:3000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow

npm run dev
