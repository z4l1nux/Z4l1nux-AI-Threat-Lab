#!/usr/bin/env ts-node

/**
 * Script de Setup - Z4l1nux AI Threat Lab
 * 
 * Este script verifica pré-requisitos e prepara o ambiente
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

console.log('\n\x1b[1m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
console.log('\x1b[1m║   🚀 Z4l1nux AI Threat Lab - Setup                       ║\x1b[0m');
console.log('\x1b[1m╚═══════════════════════════════════════════════════════════╝\x1b[0m');

// Verificar versão do Node.js
console.log('\n\x1b[36m🔍 Verificando versão do Node.js...\x1b[0m');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.log('\x1b[31m❌ Node.js v18+ é necessário. Versão atual:', nodeVersion, '\x1b[0m');
  process.exit(1);
}

console.log('\x1b[32m✅ Node.js', nodeVersion, 'detectado\x1b[0m');

// Verificar arquivo .env.local
console.log('\n\x1b[36m🔍 Verificando arquivo .env.local...\x1b[0m');
const projectRoot = path.resolve(__dirname, '../../../');
const envPath = path.join(projectRoot, '.env.local');

if (!fs.existsSync(envPath)) {
  console.log('\x1b[33m⚠️  Arquivo .env.local não encontrado\x1b[0m');
  console.log('\x1b[33m   Crie um arquivo .env.local na raiz do projeto\x1b[0m');
} else {
  console.log('\x1b[32m✅ Arquivo .env.local encontrado\x1b[0m');
}

// Verificar se backend está compilado
console.log('\n\x1b[36m🔨 Compilando backend TypeScript...\x1b[0m');
try {
  const backendDistPath = path.join(projectRoot, 'backend', 'dist', 'server.js');
  
  if (!fs.existsSync(backendDistPath)) {
    console.log('\x1b[33m⚠️  Backend não compilado, compilando agora...\x1b[0m');
    execSync('npm run build:backend', { 
      stdio: 'inherit',
      cwd: projectRoot 
    });
    console.log('\x1b[32m✅ Backend compilado com sucesso\x1b[0m');
  } else {
    console.log('\x1b[32m✅ Backend já compilado\x1b[0m');
  }
} catch (error: any) {
  console.log('\x1b[31m❌ Erro ao compilar backend:', error.message, '\x1b[0m');
  process.exit(1);
}

// Verificar se frontend está compilado
console.log('\n\x1b[36m🔨 Verificando build do frontend...\x1b[0m');
try {
  const frontendDistPath = path.join(projectRoot, 'dist', 'index.html');
  
  if (!fs.existsSync(frontendDistPath)) {
    console.log('\x1b[33m⚠️  Frontend não compilado, compilando agora...\x1b[0m');
    execSync('npm run build:frontend', { 
      stdio: 'inherit',
      cwd: projectRoot 
    });
    console.log('\x1b[32m✅ Frontend compilado com sucesso\x1b[0m');
  } else {
    console.log('\x1b[32m✅ Frontend já compilado\x1b[0m');
  }
} catch (error: any) {
  console.log('\x1b[31m❌ Erro ao compilar frontend:', error.message, '\x1b[0m');
  process.exit(1);
}

console.log('\x1b[32m\n╔═══════════════════════════════════════════════════════════╗\x1b[0m');
console.log('\x1b[32m║   ✅ Setup concluído com sucesso!                         ║\x1b[0m');
console.log('\x1b[32m╚═══════════════════════════════════════════════════════════╝\x1b[0m');

console.log('\n\x1b[36m📋 Próximos passos:\x1b[0m');
console.log('\x1b[33m   1. Configure suas credenciais Neo4j em .env.local (raiz)\x1b[0m');
console.log('\x1b[33m   2. Inicie o Neo4j (Desktop ou Docker)\x1b[0m');
console.log('\x1b[33m   3. Execute:\x1b[0m');
console.log('\x1b[1m      - npm run dev:full    (modo desenvolvimento)\x1b[0m');
console.log('\x1b[1m      - npm start           (modo produção)\x1b[0m');
console.log('');

// Verificar se Neo4j está rodando
console.log('\n\x1b[36m🔍 Verificando Neo4j...\x1b[0m');
try {
  execSync('curl -s http://localhost:7474 > /dev/null', { 
    stdio: 'pipe',
    cwd: projectRoot 
  });
  console.log('\x1b[32m✅ Neo4j está rodando em http://localhost:7474\x1b[0m');
} catch (error) {
  console.log('\x1b[33m⚠️  Neo4j não está rodando ou não está acessível\x1b[0m');
  console.log('\x1b[33m   Execute: docker-compose up -d neo4j\x1b[0m');
}

console.log('');