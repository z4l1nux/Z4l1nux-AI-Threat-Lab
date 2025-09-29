#!/bin/bash

echo "🚀 Configurando projeto Threat Modeling Full-Stack TypeScript..."

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
npm install

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd src/client
npm install
cd ../..

# Build do backend
echo "🔨 Compilando backend TypeScript..."
npm run build:backend

# Build do frontend
echo "🔨 Compilando frontend React..."
npm run build:frontend

echo "✅ Setup concluído!"
echo ""
echo "Para executar em desenvolvimento:"
echo "  npm run dev"
echo ""
echo "Para acessar a aplicação:"
echo "  http://localhost:3000"
