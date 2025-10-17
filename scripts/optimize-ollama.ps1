# Script para otimizar Ollama para RTX 4050 (6GB VRAM)
# PowerShell equivalente ao optimize-ollama.sh

Write-Host "🚀 Otimizando Ollama para RTX 4050 (6GB VRAM)..." -ForegroundColor Green

# Verificar se Ollama está instalado
try {
    $ollamaVersion = ollama --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Ollama não encontrado. Instale primeiro: https://ollama.ai/download" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Ollama encontrado: $ollamaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao verificar Ollama: $_" -ForegroundColor Red
    exit 1
}

# Verificar se NVIDIA está disponível
try {
    $nvidiaInfo = nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ NVIDIA GPU detectada: $nvidiaInfo" -ForegroundColor Green
    } else {
        Write-Host "⚠️ NVIDIA não detectada, usando configurações CPU" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ nvidia-smi não disponível, usando configurações CPU" -ForegroundColor Yellow
}

# Configurações otimizadas para RTX 4050
Write-Host "`n🔧 Aplicando configurações otimizadas..." -ForegroundColor Cyan

# Configurar variáveis de ambiente para esta sessão
$env:OLLAMA_NUM_THREADS = "6"
$env:OLLAMA_NUM_GPU_LAYERS = "31"
$env:OLLAMA_BATCH_SIZE = "512"
$env:OLLAMA_HOST = "0.0.0.0:11434"

Write-Host "✅ Configurações aplicadas:" -ForegroundColor Green
Write-Host "   - Threads: $env:OLLAMA_NUM_THREADS" -ForegroundColor White
Write-Host "   - GPU Layers: $env:OLLAMA_NUM_GPU_LAYERS" -ForegroundColor White
Write-Host "   - Batch Size: $env:OLLAMA_BATCH_SIZE" -ForegroundColor White
Write-Host "   - Host: $env:OLLAMA_HOST" -ForegroundColor White

# Verificar modelos disponíveis
Write-Host "`n📋 Modelos disponíveis:" -ForegroundColor Cyan
try {
    $models = ollama list 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host $models -ForegroundColor White
    } else {
        Write-Host "⚠️ Erro ao listar modelos" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Erro ao listar modelos: $_" -ForegroundColor Yellow
}

# Recomendações de modelos
Write-Host "`n💡 Recomendações para RTX 4050:" -ForegroundColor Cyan
Write-Host "   - phi4-mini:latest (2.5GB) - Melhor contexto" -ForegroundColor White
Write-Host "   - mistral:latest (4.4GB) - Bom equilíbrio" -ForegroundColor White
Write-Host "   - llama3.1:latest (4.9GB) - Maior precisão" -ForegroundColor White
Write-Host "   - granite3.3:8b (4.9GB) - Alternativa" -ForegroundColor White

# Testar modelo se disponível
$testModel = "phi4-mini:latest"
Write-Host "`n🧪 Testando modelo $testModel..." -ForegroundColor Cyan

try {
    $testResult = echo "Teste de contexto" | ollama run $testModel --verbose 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Modelo $testModel funcionando corretamente" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Erro ao testar modelo $testModel" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Erro ao testar modelo: $_" -ForegroundColor Yellow
}

# Monitoramento de recursos
Write-Host "`n📊 Monitoramento de recursos:" -ForegroundColor Cyan
Write-Host "   - Use 'nvidia-smi' para monitorar VRAM" -ForegroundColor White
Write-Host "   - Use 'ollama ps' para ver modelos carregados" -ForegroundColor White
Write-Host "   - Use 'ollama logs' para ver logs do Ollama" -ForegroundColor White

# Dicas de otimização
Write-Host "`n🎯 Dicas de otimização:" -ForegroundColor Cyan
Write-Host "   - Use modelos menores para melhor performance" -ForegroundColor White
Write-Host "   - Ajuste OLLAMA_NUM_GPU_LAYERS se houver problemas de VRAM" -ForegroundColor White
Write-Host "   - Use OLLAMA_BATCH_SIZE menor se necessário" -ForegroundColor White
Write-Host "   - Configure contexto no .env.local do projeto" -ForegroundColor White

Write-Host "`n✅ Otimização concluída!" -ForegroundColor Green
Write-Host "   Execute './scripts/setup-ollama-config.ps1' para configurar o projeto" -ForegroundColor Yellow
