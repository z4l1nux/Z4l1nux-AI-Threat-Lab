#!/bin/bash

# Script de Teste de Integração - Z4l1nux AI Threat Lab
# Testa o sistema RAG completo e valida funcionalidades

set -e

echo "🧪 Z4l1nux AI Threat Lab - Teste de Integração"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado. Instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    error "npm não está instalado."
    exit 1
fi

# Verificar se o Docker está rodando
if ! docker info &> /dev/null; then
    error "Docker não está rodando. Inicie o Docker primeiro."
    exit 1
fi

# Verificar se o Neo4j está rodando
log "Verificando se o Neo4j está rodando..."
if ! docker ps | grep -q "threat-modeling-neo4j"; then
    warning "Neo4j não está rodando. Iniciando..."
    docker-compose up -d neo4j
    log "Aguardando Neo4j inicializar..."
    sleep 30
fi

# Verificar se o arquivo .env.local existe
if [ ! -f ".env.local" ]; then
    error "Arquivo .env.local não encontrado. Crie o arquivo de configuração primeiro."
    echo "Consulte o README.md para instruções de configuração."
    exit 1
fi

# Verificar se as dependências estão instaladas
log "Verificando dependências..."
if [ ! -d "node_modules" ]; then
    log "Instalando dependências do frontend..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    log "Instalando dependências do backend..."
    cd backend && npm install && cd ..
fi

# Verificar se o backend está compilado
log "Compilando backend..."
cd backend && npm run build && cd ..

# Testar conexão com Neo4j
log "Testando conexão com Neo4j..."
cd backend && npm run test-rag

if [ $? -eq 0 ]; then
    success "Teste RAG concluído com sucesso!"
else
    error "Teste RAG falhou. Verifique os logs acima."
    exit 1
fi

# Testar se o backend responde
log "Testando se o backend está respondendo..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    success "Backend está respondendo"
else
    warning "Backend não está respondendo. Inicie com 'npm run dev:backend'"
fi

# Verificar se o frontend está compilado
log "Verificando build do frontend..."
if [ ! -d "dist" ]; then
    log "Compilando frontend..."
    npm run build
fi

success "Todos os testes de integração passaram!"
echo ""
echo "🎉 Sistema validado com sucesso!"
echo ""
echo "Para usar o sistema:"
echo "1. Inicie o backend: npm run dev:backend"
echo "2. Inicie o frontend: npm run dev"
echo "3. Acesse: http://localhost:5173"
echo ""
echo "Para executar testes unitários:"
echo "npm test"
echo ""
echo "Para executar testes com UI:"
echo "npm run test:ui"
