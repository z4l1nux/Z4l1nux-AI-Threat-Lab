# Script universal para executar o Threat Modeling Co-Pilot
# Detecta automaticamente o sistema operacional e executa o comando apropriado

Write-Host "🚀 Iniciando Threat Modeling Co-Pilot..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json não encontrado. Execute este script no diretório raiz do projeto." -ForegroundColor Red
    exit 1
}

# Verificar se Node.js está disponível
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Node.js não encontrado. Instale primeiro: https://nodejs.org/" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao verificar Node.js: $_" -ForegroundColor Red
    exit 1
}

# Verificar se .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️ .env.local não encontrado. Criando configuração padrão..." -ForegroundColor Yellow
    
    # Executar setup se .env.local não existir
    if (Test-Path "scripts\setup.ps1") {
        Write-Host "🔧 Executando setup automático..." -ForegroundColor Cyan
        & ".\scripts\setup.ps1"
    } else {
        Write-Host "❌ Script de setup não encontrado" -ForegroundColor Red
        exit 1
    }
}

# Verificar se dependências estão instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️ Dependências não instaladas. Instalando..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
        exit 1
    }
}

# Verificar se backend está compilado
if (-not (Test-Path "backend\dist")) {
    Write-Host "🔨 Compilando backend..." -ForegroundColor Cyan
    npm run build:backend
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao compilar backend" -ForegroundColor Red
        exit 1
    }
}

# Verificar serviços externos
Write-Host "`n🔍 Verificando serviços externos..." -ForegroundColor Cyan

# Verificar Neo4j
try {
    $neo4jStatus = Get-Service -Name "Neo4j" -ErrorAction SilentlyContinue
    if ($neo4jStatus -and $neo4jStatus.Status -eq "Running") {
        Write-Host "✅ Neo4j está rodando" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Neo4j não está rodando. Inicie o serviço Neo4j" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Neo4j não detectado" -ForegroundColor Yellow
}

# Verificar Ollama
try {
    $ollamaVersion = ollama --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Ollama encontrado: $ollamaVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Ollama não encontrado. Instale: https://ollama.ai/download" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Ollama não disponível" -ForegroundColor Yellow
}

# Iniciar o projeto
Write-Host "`n🚀 Iniciando Threat Modeling Co-Pilot..." -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend: http://localhost:3001" -ForegroundColor White
Write-Host "   Neo4j: http://localhost:7474" -ForegroundColor White
Write-Host ""

try {
    npm run dev:full
} catch {
    Write-Host "❌ Erro ao iniciar o projeto: $_" -ForegroundColor Red
    exit 1
}
