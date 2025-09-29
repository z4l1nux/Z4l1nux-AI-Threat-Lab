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
echo "Para executar apenas o backend:"
echo "  npm run dev:backend"
echo ""
echo "Para executar apenas o frontend:"
echo "  npm run dev:frontend"
echo ""
echo "Para acessar a versão legacy:"
echo "  http://localhost:3000/legacy"
