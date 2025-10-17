# Script de setup completo para Threat Modeling Co-Pilot
# PowerShell equivalente ao setup.js

Write-Host "🚀 Configurando Threat Modeling Co-Pilot..." -ForegroundColor Green

# Verificar se Node.js está instalado
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

# Verificar se npm está disponível
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm não encontrado" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao verificar npm: $_" -ForegroundColor Red
    exit 1
}

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json não encontrado. Execute este script no diretório raiz do projeto." -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 Instalando dependências..." -ForegroundColor Cyan

# Instalar dependências do projeto
try {
    Write-Host "   Instalando dependências principais..." -ForegroundColor White
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências principais" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependências principais instaladas" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao instalar dependências: $_" -ForegroundColor Red
    exit 1
}

# Instalar dependências do backend
if (Test-Path "backend/package.json") {
    try {
        Write-Host "   Instalando dependências do backend..." -ForegroundColor White
        Set-Location "backend"
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Erro ao instalar dependências do backend" -ForegroundColor Red
            Set-Location ".."
            exit 1
        }
        Set-Location ".."
        Write-Host "✅ Dependências do backend instaladas" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao instalar dependências do backend: $_" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
} else {
    Write-Host "⚠️ Backend não encontrado" -ForegroundColor Yellow
}

# Verificar se Ollama está disponível
Write-Host "`n🔍 Verificando Ollama..." -ForegroundColor Cyan
try {
    $ollamaVersion = ollama --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Ollama encontrado: $ollamaVersion" -ForegroundColor Green
        
        # Verificar modelos disponíveis
        $models = ollama list 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "📋 Modelos disponíveis:" -ForegroundColor Cyan
            Write-Host $models -ForegroundColor White
        }
    } else {
        Write-Host "⚠️ Ollama não encontrado. Instale: https://ollama.ai/download" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Ollama não disponível: $_" -ForegroundColor Yellow
}

# Verificar se Neo4j está disponível
Write-Host "`n🔍 Verificando Neo4j..." -ForegroundColor Cyan
try {
    $neo4jStatus = Get-Service -Name "Neo4j" -ErrorAction SilentlyContinue
    if ($neo4jStatus) {
        if ($neo4jStatus.Status -eq "Running") {
            Write-Host "✅ Neo4j está rodando" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Neo4j instalado mas não está rodando" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ Neo4j não encontrado. Instale: https://neo4j.com/download/" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Neo4j não disponível: $_" -ForegroundColor Yellow
}

# Configurar .env.local se não existir
if (-not (Test-Path ".env.local")) {
    Write-Host "`n📝 Criando .env.local..." -ForegroundColor Cyan
    
    $envContent = @"
# ===========================================
# CONFIGURAÇÕES DO THREAT MODELING CO-PILOT
# ===========================================

# ===========================================
# NEO4J CONFIGURATION
# ===========================================
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# ===========================================
# OLLAMA CONFIGURATION (RTX 4050 - 6GB VRAM)
# ===========================================
OLLAMA_BASE_URL=http://172.21.112.1:11434
OLLAMA_TIMEOUT=180000
OLLAMA_MAX_RETRIES=2

# Contexto padrão para todos os modelos (8k tokens)
OLLAMA_DEFAULT_CONTEXT_SIZE=8192

# Configurações específicas por modelo
OLLAMA_CONTEXT_MISTRAL_LATEST=4096
OLLAMA_CONTEXT_LLAMA3_1_LATEST=8192
OLLAMA_CONTEXT_PHI4_MINI_LATEST=4096
OLLAMA_CONTEXT_GRANITE3_3_8B=8192

# Compressão automática
OLLAMA_AUTO_COMPRESS=true
OLLAMA_COMPRESSION_RATIO=3

# ===========================================
# OPENROUTER CONFIGURATION
# ===========================================
OPENROUTER_API_KEY=your_openrouter_api_key_here
MODEL_OPENROUTER=meta-llama/llama-3.3-70b-instruct:free
EMBEDDING_MODEL_OPENROUTER=text-embedding-3-small

# ===========================================
# GEMINI CONFIGURATION
# ===========================================
GEMINI_API_KEY=your_gemini_api_key_here
MODEL_GEMINI=gemini-2.5-flash
EMBEDDING_MODEL_GEMINI=text-embedding-004

# ===========================================
# EMBEDDING CONFIGURATION
# ===========================================
EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text:latest
"@
    
    Set-Content -Path ".env.local" -Value $envContent
    Write-Host "✅ .env.local criado" -ForegroundColor Green
} else {
    Write-Host "✅ .env.local já existe" -ForegroundColor Green
}

# Compilar backend
Write-Host "`n🔨 Compilando backend..." -ForegroundColor Cyan
try {
    npm run build:backend
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend compilado com sucesso" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao compilar backend" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao compilar backend: $_" -ForegroundColor Red
}

Write-Host "`n✅ Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Configure suas API keys no .env.local" -ForegroundColor White
Write-Host "   2. Inicie Neo4j se necessário" -ForegroundColor White
Write-Host "   3. Execute: npm run dev:full" -ForegroundColor White
Write-Host ""
Write-Host "💡 Scripts disponíveis:" -ForegroundColor Cyan
Write-Host "   - ./scripts/optimize-ollama.ps1 (otimizar Ollama)" -ForegroundColor White
Write-Host "   - ./scripts/setup-ollama-config.ps1 (configurar Ollama)" -ForegroundColor White
