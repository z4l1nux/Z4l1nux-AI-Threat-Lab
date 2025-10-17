#!/bin/bash

# Script para otimizar Ollama para RTX 4050 (6GB VRAM)
# Configurações otimizadas para diferentes modelos

echo "🚀 Otimizando Ollama para RTX 4050 (6GB VRAM)..."

# Função para configurar modelo com contexto otimizado
configure_model() {
    local model_name=$1
    local context_size=$2
    local description=$3
    
    echo "📦 Configurando $model_name ($description)"
    echo "   Contexto: $context_size tokens"
    
    # Parar modelo se estiver rodando
    ollama stop $model_name 2>/dev/null || true
    
    # Configurar com contexto otimizado
    ollama run $model_name --numa --ctx-size $context_size &
    
    echo "✅ $model_name configurado com sucesso"
    echo ""
}

# Configurações otimizadas para RTX 4050
echo "🔧 Configurações recomendadas para RTX 4050:"
echo ""

# Modelos leves (melhor performance)
configure_model "llama3.1:8b" 8192 "Llama 3.1 8B - Equilibrio performance/memória"
configure_model "gemma2:9b" 16384 "Gemma 2 9B - Excelente contexto, mais eficiente"
configure_model "mistral:7b" 8192 "Mistral 7B - Boa performance geral"

# Modelos médios (se tiver VRAM extra)
configure_model "llama3.1:70b" 4096 "Llama 3.1 70B - Modelo maior, contexto reduzido"

echo "🎯 Configurações aplicadas!"
echo ""
echo "💡 Dicas de uso:"
echo "   - Use llama3.1:8b para melhor equilíbrio"
echo "   - Use gemma2:9b para contexto maior (16k tokens)"
echo "   - Use mistral:7b para performance consistente"
echo ""
echo "⚠️  Monitoramento:"
echo "   - Verifique uso de VRAM: nvidia-smi"
echo "   - Ajuste contexto se necessário"
echo "   - Reinicie Ollama se houver problemas de memória"
