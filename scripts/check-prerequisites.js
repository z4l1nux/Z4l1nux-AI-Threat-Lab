#!/usr/bin/env node

/**
 * Script de Verificação de Pré-requisitos
 * 
 * Verifica se todos os requisitos para executar o projeto estão instalados:
 * - Node.js 18+
 * - npm
 * - Neo4j (opcional, mas recomendado)
 * - Ollama (opcional, mas recomendado)
 */

const { execSync } = require('child_process');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command) {
  try {
    return execSync(command, { stdio: 'pipe' }).toString().trim();
  } catch (error) {
    return null;
  }
}

function checkService(host, port, name) {
  return new Promise((resolve) => {
    const req = http.request(
      { host, port, method: 'GET', timeout: 2000 },
      (res) => resolve(true)
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
}

async function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'bright');
  log('║   🔍 Verificação de Pré-requisitos                        ║', 'bright');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'bright');

  let allOk = true;

  // 1. Node.js
  log('🔍 Verificando Node.js...', 'cyan');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (majorVersion >= 18) {
    log(`✅ Node.js ${nodeVersion} instalado`, 'green');
  } else {
    log(`❌ Node.js ${nodeVersion} (requer 18+)`, 'red');
    log('   Instale em: https://nodejs.org/', 'yellow');
    allOk = false;
  }

  // 2. npm
  log('\n🔍 Verificando npm...', 'cyan');
  const npmVersion = execCommand('npm --version');
  if (npmVersion) {
    log(`✅ npm ${npmVersion} instalado`, 'green');
  } else {
    log('❌ npm não encontrado', 'red');
    allOk = false;
  }

  // 3. Neo4j
  log('\n🔍 Verificando Neo4j...', 'cyan');
  const neo4jRunning = await checkService('localhost', 7687, 'Neo4j');
  if (neo4jRunning) {
    log('✅ Neo4j está rodando em localhost:7687', 'green');
  } else {
    log('⚠️  Neo4j não detectado em localhost:7687', 'yellow');
    log('   Instale Neo4j Desktop ou Docker:', 'yellow');
    log('   - Desktop: https://neo4j.com/download/', 'yellow');
    log('   - Docker: docker run -p 7687:7687 -p 7474:7474 neo4j', 'yellow');
  }

  // 4. Ollama
  log('\n🔍 Verificando Ollama...', 'cyan');
  const ollamaRunning = await checkService('localhost', 11434, 'Ollama');
  if (ollamaRunning) {
    log('✅ Ollama está rodando em localhost:11434', 'green');
  } else {
    log('⚠️  Ollama não detectado em localhost:11434', 'yellow');
    log('   Instale Ollama: https://ollama.ai/', 'yellow');
  }

  // 5. Git
  log('\n🔍 Verificando Git...', 'cyan');
  const gitVersion = execCommand('git --version');
  if (gitVersion) {
    log(`✅ ${gitVersion}`, 'green');
  } else {
    log('⚠️  Git não encontrado (opcional)', 'yellow');
  }

  // Sumário
  log('\n╔═══════════════════════════════════════════════════════════╗', 'bright');
  if (allOk) {
    log('║   ✅ Todos os requisitos obrigatórios estão OK!           ║', 'green');
  } else {
    log('║   ⚠️  Alguns requisitos estão faltando                    ║', 'yellow');
  }
  log('╚═══════════════════════════════════════════════════════════╝\n', 'bright');

  if (!allOk) {
    log('💡 Instale os requisitos faltantes e execute novamente:', 'yellow');
    log('   npm run check-prerequisites\n', 'bright');
    process.exit(1);
  }
}

main();

