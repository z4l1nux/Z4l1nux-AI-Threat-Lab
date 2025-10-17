# Script para configurar Ollama automaticamente baseado nos modelos disponíveis
# RTX 4050 (6GB VRAM) - Configurações otimizadas
# PowerShell equivalente ao setup-ollama-config.sh

Write-Host "🚀 Configurando Ollama para RTX 4050 (6GB VRAM)..." -ForegroundColor Green

# Verificar se .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "📝 Criando .env.local..." -ForegroundColor Cyan
    New-Item -ItemType File -Path ".env.local" -Force | Out-Null
}

# Backup do .env.local existente
if (Test-Path ".env.local") {
    Copy-Item ".env.local" ".env.local.backup" -Force
    Write-Host "💾 Backup criado: .env.local.backup" -ForegroundColor Green
}

# Verificar se já existem configurações Ollama
$envContent = Get-Content ".env.local" -Raw -ErrorAction SilentlyContinue
if ($envContent -and $envContent.Contains("OLLAMA_DEFAULT_CONTEXT_SIZE")) {
    Write-Host "⚠️ Configurações Ollama já existem no .env.local" -ForegroundColor Yellow
    Write-Host "   Removendo configurações antigas..." -ForegroundColor Yellow
    
    # Remover linhas antigas do Ollama
    $lines = Get-Content ".env.local" | Where-Object { 
        $_ -notmatch "^# OLLAMA" -and 
        $_ -notmatch "^OLLAMA_" -and 
        $_ -notmatch "^$"
    }
    $lines | Set-Content ".env.local"
}

# Adicionar configurações otimizadas
Write-Host "`n🔧 Adicionando configurações Ollama ao .env.local..." -ForegroundColor Cyan

$ollamaConfig = @"

# ===========================================
# OLLAMA CONFIGURATION (RTX 4050 - 6GB VRAM)
# ===========================================
OLLAMA_BASE_URL=http://172.21.112.1:11434
OLLAMA_TIMEOUT=180000
OLLAMA_MAX_RETRIES=2

# Contexto padrão para todos os modelos (8k tokens)
OLLAMA_DEFAULT_CONTEXT_SIZE=8192

# Configurações específicas por modelo (baseado nos seus modelos disponíveis)
# Modelos leves - contexto maior
OLLAMA_CONTEXT_MISTRAL_LATEST=4096
OLLAMA_CONTEXT_LLAMA3_1_LATEST=8192
OLLAMA_CONTEXT_PHI4_MINI_LATEST=4096
OLLAMA_CONTEXT_GRANITE3_3_8B=8192

# Modelos médios - contexto moderado
OLLAMA_CONTEXT_QWEN2_5_CODER_7B=4096
OLLAMA_CONTEXT_QWEN3_8B=4096
OLLAMA_CONTEXT_DEEPSEEK_R1_LATEST=6144
OLLAMA_CONTEXT_WHITERABBITNEO_2_5_QWEN_2_5_CODER_7B_LATEST=4096

# Compressão automática
OLLAMA_AUTO_COMPRESS=true
OLLAMA_COMPRESSION_RATIO=3

# Configurações de contexto RAG (sem hardcoding)
OLLAMA_DEFAULT_CONTEXT_LIMIT=1000
OLLAMA_LOCAL_CONTEXT_LIMIT=300
OLLAMA_AI_SYSTEM_CONTEXT_LIMIT=600
OLLAMA_LIMITED_CONTEXT_LIMIT=150

# Modelos com contexto limitado (configurável)
OLLAMA_LIMITED_CONTEXT_PHI4_MINI_LATEST=true
OLLAMA_LIMITED_CONTEXT_MISTRAL_LATEST=true
OLLAMA_LIMITED_CONTEXT_QWEN2_5_CODER_7B=true
OLLAMA_LIMITED_CONTEXT_QWEN3_8B=true

# Compressão agressiva por modelo (configurável)
OLLAMA_AGGRESSIVE_COMPRESS_PHI4_MINI_LATEST=true
OLLAMA_AGGRESSIVE_COMPRESS_MISTRAL_LATEST=true
OLLAMA_AGGRESSIVE_COMPRESS_QWEN2_5_CODER_7B=true
OLLAMA_AGGRESSIVE_COMPRESS_QWEN3_8B=true
"@

Add-Content -Path ".env.local" -Value $ollamaConfig

Write-Host "✅ Configurações adicionadas ao .env.local" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configurações aplicadas:" -ForegroundColor Cyan
Write-Host "   - Contexto padrão: 8192 tokens" -ForegroundColor White
Write-Host "   - Modelos leves: 4096-8192 tokens" -ForegroundColor White
Write-Host "   - Modelos médios: 4096-6144 tokens" -ForegroundColor White
Write-Host "   - Compressão automática: habilitada" -ForegroundColor White
Write-Host "   - Compressão agressiva: configurável por modelo" -ForegroundColor White
Write-Host "   - Contexto RAG: configurável por tipo de sistema" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Reinicie o backend: npm run dev:full" -ForegroundColor White
Write-Host "   2. Teste com um modelo: phi4-mini:latest ou mistral:latest" -ForegroundColor White
Write-Host "   3. Monitore VRAM: nvidia-smi" -ForegroundColor White
Write-Host "   4. Ajuste configurações no .env.local se necessário" -ForegroundColor White
Write-Host ""
Write-Host "💡 Dicas:" -ForegroundColor Cyan
Write-Host "   - Use phi4-mini:latest para melhor contexto (4k tokens)" -ForegroundColor White
Write-Host "   - Use mistral:latest para melhor equilíbrio (4k tokens)" -ForegroundColor White
Write-Host "   - Configure OLLAMA_LIMITED_CONTEXT_* para modelos específicos" -ForegroundColor White
Write-Host "   - Configure OLLAMA_AGGRESSIVE_COMPRESS_* para compressão agressiva" -ForegroundColor White

# Verificar se o projeto está configurado
if (Test-Path "package.json") {
    Write-Host "`n🔍 Verificando configuração do projeto..." -ForegroundColor Cyan
    
    # Verificar se backend está configurado
    if (Test-Path "backend/package.json") {
        Write-Host "✅ Backend encontrado" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Backend não encontrado" -ForegroundColor Yellow
    }
    
    # Verificar se frontend está configurado
    if (Test-Path "src") {
        Write-Host "✅ Frontend encontrado" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Frontend não encontrado" -ForegroundColor Yellow
    }
    
    Write-Host "`n🚀 Para iniciar o projeto:" -ForegroundColor Cyan
    Write-Host "   npm run dev:full" -ForegroundColor White
} else {
    Write-Host "`n⚠️ Este não parece ser o diretório do projeto Threat Modeling Co-Pilot" -ForegroundColor Yellow
    Write-Host "   Execute este script no diretório raiz do projeto" -ForegroundColor Yellow
}
