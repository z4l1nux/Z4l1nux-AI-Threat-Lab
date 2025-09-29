# 🚀 Configurando projeto Threat Modeling Full-Stack TypeScript
# Script PowerShell para Windows

Write-Host "🚀 Configurando projeto Threat Modeling Full-Stack TypeScript..." -ForegroundColor Green

# Instalar dependências do backend
Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências do backend" -ForegroundColor Red
    exit 1
}

# Instalar dependências do frontend
Write-Host "📦 Instalando dependências do frontend..." -ForegroundColor Yellow
Set-Location "src/client"
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências do frontend" -ForegroundColor Red
    Set-Location "../.."
    exit 1
}

Set-Location "../.."

# Build do backend
Write-Host "🔨 Compilando backend TypeScript..." -ForegroundColor Yellow
npm run build:backend

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao compilar backend" -ForegroundColor Red
    exit 1
}

# Build do frontend
Write-Host "🔨 Compilando frontend React..." -ForegroundColor Yellow
npm run build:frontend

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao compilar frontend" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "Para executar em desenvolvimento:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Para executar apenas o backend:" -ForegroundColor Cyan
Write-Host "  npm run dev:backend" -ForegroundColor White
Write-Host ""
Write-Host "Para executar apenas o frontend:" -ForegroundColor Cyan
Write-Host "  npm run dev:frontend" -ForegroundColor White
Write-Host ""
Write-Host "Para acessar a versão legacy:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000/legacy" -ForegroundColor White
Write-Host ""
Write-Host "Para acessar a nova versão React:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000" -ForegroundColor White
