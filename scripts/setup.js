#!/usr/bin/env node

/**
 * Script de Setup Automático - Funciona em Windows e Linux
 * 
 * Este script:
 * - Verifica pré-requisitos (Node.js, npm)
 * - Instala dependências automaticamente
 * - Verifica configurações do Neo4j
 * - Prepara o ambiente para execução
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para terminal (funciona em ambos os ambientes)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, { 
      stdio: 'inherit', 
      ...options 
    });
  } catch (error) {
    throw error;
  }
}

function checkNodeVersion() {
  log('\n🔍 Verificando versão do Node.js...', 'cyan');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (majorVersion < 18) {
    log(`❌ Node.js ${nodeVersion} detectado. É necessário Node.js 18 ou superior.`, 'red');
    log('   Por favor, atualize o Node.js: https://nodejs.org/', 'yellow');
    process.exit(1);
  }
  
  log(`✅ Node.js ${nodeVersion} detectado`, 'green');
}

function checkNeo4j() {
  log('\n🔍 Verificando configuração do Neo4j...', 'cyan');
  
  const envPath = path.join(__dirname, '..', 'backend', '.env');
  
  if (!fs.existsSync(envPath)) {
    log('⚠️  Arquivo .env não encontrado no backend', 'yellow');
    log('   Criando .env a partir do template...', 'yellow');
    
    const envExample = `# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
MODEL_OLLAMA=llama3.1:latest
EMBEDDING_MODEL=nomic-embed-text:latest
OLLAMA_TIMEOUT=180000
OLLAMA_MAX_RETRIES=2

# OpenRouter Configuration (opcional)
OPENROUTER_API_KEY=
MODEL_OPENROUTER=openai/gpt-4o-mini

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173
`;
    
    fs.writeFileSync(envPath, envExample);
    log('✅ Arquivo .env criado com valores padrão', 'green');
    log('   ⚠️  IMPORTANTE: Configure suas credenciais do Neo4j no arquivo:', 'yellow');
    log(`   📄 ${envPath}`, 'bright');
  } else {
    log('✅ Arquivo .env encontrado', 'green');
  }
}

function installDependencies(directory, name) {
  log(`\n📦 Instalando dependências do ${name}...`, 'cyan');
  
  const fullPath = path.join(__dirname, '..', directory);
  
  if (!fs.existsSync(path.join(fullPath, 'node_modules'))) {
    log(`   Instalando em ${directory}...`, 'yellow');
    try {
      execCommand('npm install', { cwd: fullPath });
      log(`✅ Dependências do ${name} instaladas com sucesso`, 'green');
    } catch (error) {
      log(`❌ Erro ao instalar dependências do ${name}`, 'red');
      throw error;
    }
  } else {
    log(`✅ Dependências do ${name} já instaladas`, 'green');
  }
}

function buildBackend() {
  log('\n🔨 Compilando backend TypeScript...', 'cyan');
  
  const backendPath = path.join(__dirname, '..', 'backend');
  const distPath = path.join(backendPath, 'dist');
  
  if (!fs.existsSync(distPath)) {
    log('   Compilando TypeScript para JavaScript...', 'yellow');
    try {
      execCommand('npm run build', { cwd: backendPath });
      log('✅ Backend compilado com sucesso', 'green');
    } catch (error) {
      log('❌ Erro ao compilar backend', 'red');
      throw error;
    }
  } else {
    log('✅ Backend já compilado', 'green');
  }
}

function buildFrontend() {
  log('\n🔨 Compilando frontend Vite...', 'cyan');
  
  const rootPath = path.join(__dirname, '..');
  const distPath = path.join(rootPath, 'dist');
  
  if (!fs.existsSync(distPath)) {
    log('   Compilando frontend com Vite...', 'yellow');
    try {
      execCommand('npm run build:frontend', { cwd: rootPath });
      log('✅ Frontend compilado com sucesso', 'green');
    } catch (error) {
      log('❌ Erro ao compilar frontend', 'red');
      throw error;
    }
  } else {
    log('✅ Frontend já compilado', 'green');
  }
}

async function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'bright');
  log('║   🚀 Threat Modeling Co-Pilot with AI - Setup            ║', 'bright');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'bright');
  
  try {
    // 1. Verificar Node.js
    checkNodeVersion();
    
    // 2. Instalar dependências raiz
    installDependencies('.', 'projeto raiz');
    
    // 3. Instalar dependências backend
    installDependencies('backend', 'backend');
    
    // 4. Verificar Neo4j
    checkNeo4j();
    
    // 5. Compilar backend
    buildBackend();
    
    // 6. Compilar frontend (apenas se for produção)
    if (process.argv.includes('--production')) {
      buildFrontend();
    }
    
    log('\n╔═══════════════════════════════════════════════════════════╗', 'green');
    log('║   ✅ Setup concluído com sucesso!                         ║', 'green');
    log('╚═══════════════════════════════════════════════════════════╝\n', 'green');
    
    log('📋 Próximos passos:', 'cyan');
    log('   1. Configure suas credenciais Neo4j em backend/.env', 'yellow');
    log('   2. Inicie o Neo4j (Desktop ou Docker)', 'yellow');
    log('   3. Execute:', 'yellow');
    log('      - npm run dev:full    (modo desenvolvimento)', 'bright');
    log('      - npm start           (modo produção)\n', 'bright');
    
  } catch (error) {
    log('\n❌ Erro durante o setup:', 'red');
    log(error.message, 'red');
    log('\n💡 Tente executar manualmente:', 'yellow');
    log('   1. npm install', 'bright');
    log('   2. cd backend && npm install', 'bright');
    log('   3. cd backend && npm run build', 'bright');
    process.exit(1);
  }
}

main();

