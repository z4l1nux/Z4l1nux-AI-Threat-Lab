#!/bin/bash

# Script para configurar Ollama automaticamente baseado nos modelos disponíveis
# RTX 4050 (6GB VRAM) - Configurações otimizadas

echo "🚀 Configurando Ollama para RTX 4050 (6GB VRAM)..."

# Verificar se .env.local existe
if [ ! -f ".env.local" ]; then
    echo "📝 Criando .env.local..."
    touch .env.local
fi

# Backup do .env.local existente
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup
    echo "💾 Backup criado: .env.local.backup"
fi

# Adicionar configurações Ollama ao .env.local
echo ""
echo "🔧 Adicionando configurações Ollama ao .env.local..."

# Verificar se já existem configurações Ollama
if grep -q "OLLAMA_DEFAULT_CONTEXT_SIZE" .env.local; then
    echo "⚠️  Configurações Ollama já existem no .env.local"
    echo "   Removendo configurações antigas..."
    # Remover linhas antigas do Ollama
    sed -i '/^# OLLAMA/,/^OLLAMA_/d' .env.local
fi

# Adicionar configurações otimizadas
cat >> .env.local << 'EOF'

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
EOF

echo "✅ Configurações adicionadas ao .env.local"
echo ""
echo "📋 Configurações aplicadas:"
echo "   - Contexto padrão: 8192 tokens"
echo "   - Modelos leves: 4096-8192 tokens"
echo "   - Modelos médios: 4096-6144 tokens"
echo "   - Compressão automática: habilitada"
echo "   - Compressão agressiva: configurável por modelo"
echo "   - Contexto RAG: configurável por tipo de sistema"
echo ""
echo "🎯 Próximos passos:"
echo "   1. Reinicie o backend: npm run dev:full"
echo "   2. Teste com um modelo: phi4-mini:latest ou mistral:latest"
echo "   3. Monitore VRAM: nvidia-smi"
echo "   4. Ajuste configurações no .env.local se necessário"
echo ""
echo "💡 Dicas:"
echo "   - Use phi4-mini:latest para melhor contexto (4k tokens)"
echo "   - Use mistral:latest para melhor equilíbrio (4k tokens)"
echo "   - Configure OLLAMA_LIMITED_CONTEXT_* para modelos específicos"
echo "   - Configure OLLAMA_AGGRESSIVE_COMPRESS_* para compressão agressiva"
