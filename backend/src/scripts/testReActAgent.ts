/**
 * Script de Teste do ReAct Agent
 * 
 * Este script testa o agente ReAct de Threat Modeling de forma standalone.
 * 
 * Uso:
 *   cd backend && ts-node src/scripts/testReActAgent.ts
 */

import * as dotenv from 'dotenv';
import { SimpleReActAgent } from '../agents/SimpleReActAgent';
import { SystemInfo } from '../types/index';
import { Neo4jClient } from '../core/graph/Neo4jClient';
import { ModelFactory } from '../core/models/ModelFactory';

// Carregar variáveis de ambiente
dotenv.config({ path: '../../../.env.local' });

// Sistema de teste
const testSystemInfo: SystemInfo = {
  systemName: "E-Commerce API",
  systemVersion: "1.0",
  generalDescription: "API REST para sistema de e-commerce com autenticação JWT, processamento de pagamentos e integração com LLM para recomendações personalizadas",
  components: "API Gateway, Backend Service, LLM Model (GPT-4), Vector Database, Payment Gateway, Database PostgreSQL",
  sensitiveData: "Dados de cartão de crédito, informações pessoais (CPF, e-mail), histórico de compras",
  technologies: "Node.js, Express, PostgreSQL, Redis, OpenAI API, Neo4j",
  authentication: "JWT com refresh tokens, OAuth2 para terceiros",
  userProfiles: "Cliente, Administrador, Suporte",
  externalIntegrations: "Stripe (pagamentos), OpenAI (LLM), SendGrid (e-mails)"
};

async function testReActAgent() {
  console.log('🧪 Teste do ReAct Agent - Threat Modeling\n');
  console.log('═══════════════════════════════════════════════════\n');
  
  try {
    // 1. Verificar conexão Neo4j
    console.log('1️⃣ Verificando conexão Neo4j...');
    const neo4jConnected = await Neo4jClient.testConnection();
    if (!neo4jConnected) {
      throw new Error('❌ Neo4j não está conectado');
    }
    console.log('   ✅ Neo4j conectado\n');
    
    // 2. Inicializar providers
    console.log('2️⃣ Inicializando providers de IA...');
    await ModelFactory.initialize();
    console.log('   ✅ Providers inicializados\n');
    
    // 3. Detectar melhor provider
    console.log('3️⃣ Detectando melhor provider...');
    
    // Verificar disponibilidade de cada provider
    const providers = ModelFactory.getAvailableProviders();
    console.log(`   📊 Providers registrados: ${providers.join(', ')}`);
    
    for (const providerName of providers) {
      const provider = ModelFactory.getProvider(providerName);
      if (provider) {
        try {
          const isAvailable = await provider.isAvailable();
          console.log(`   ${isAvailable ? '✅' : '❌'} ${providerName}: ${isAvailable ? 'Disponível' : 'Indisponível'}`);
        } catch (error) {
          console.log(`   ❌ ${providerName}: Erro - ${error instanceof Error ? error.message : 'Desconhecido'}`);
        }
      }
    }
    
    const provider = await ModelFactory.detectBestProvider();
    
    if (!provider) {
      console.log('⚠️  Nenhum provider disponível, mas continuando com fallback...');
      // Usar um provider mock para teste
      console.log('   🔧 Usando provider mock para demonstração\n');
    } else {
      console.log(`   ✅ Usando provider: ${provider.name}\n`);
    }
    
    // 4. Criar e configurar agente
    console.log('4️⃣ Criando Simple ReAct Agent...');
    const agent = new SimpleReActAgent({
      provider: provider?.name || 'mock',
      model: process.env.MODEL_OLLAMA || 'llama3.1:latest',
      embeddingModel: process.env.EMBEDDING_MODEL || 'nomic-embed-text:latest',
      embeddingProvider: 'ollama',
      maxIterations: 10, // Reduzido para teste
      temperature: 0.1,
      verbose: true
    });
    console.log('   ✅ Agente criado\n');
    
    // 5. Executar análise
    console.log('5️⃣ Executando análise ReAct...');
    console.log('═══════════════════════════════════════════════════\n');
    
    const startTime = Date.now();
    const result = await agent.analyze(testSystemInfo);
    const endTime = Date.now();
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ Análise Completa!\n');
    
    // 6. Exibir resultados
    console.log('📊 MÉTRICAS:');
    console.log(`   Tempo Total: ${result.metrics.totalTime}ms (${(result.metrics.totalTime / 1000).toFixed(1)}s)`);
    console.log(`   Iterações: ${result.metrics.iterations}/${agent['config'].maxIterations}`);
    console.log(`   Chamadas de Ferramentas: ${result.metrics.toolCalls}`);
    console.log(`   Ameaças Geradas: ${result.metrics.threatsGenerated}`);
    console.log(`   CAPECs Únicos: ${result.metrics.uniqueCapecs}`);
    console.log(`   Taxa de Unicidade: ${result.metrics.uniquenessRate.toFixed(1)}%`);
    console.log(`   STRIDE Coverage: ${result.metrics.strideCoverage}/6\n`);
    
    console.log('🎯 AMEAÇAS IDENTIFICADAS:');
    if (result.threats.length > 0) {
      result.threats.forEach((threat, index) => {
        console.log(`\n   ${index + 1}. ${threat.elementName}`);
        console.log(`      STRIDE: ${threat.strideCategory}`);
        console.log(`      CAPEC: ${threat.capecId} - ${threat.capecName}`);
        console.log(`      OWASP: ${threat.owaspTop10}`);
        console.log(`      Impacto: ${threat.impact}`);
        console.log(`      Cenário: ${threat.threatScenario.substring(0, 80)}...`);
      });
    } else {
      console.log('   ⚠️ Nenhuma ameaça foi gerada');
    }
    
    console.log('\n🔍 HISTÓRICO DE AÇÕES:');
    result.actionHistory.slice(0, 5).forEach(action => {
      console.log(`\n   Iteração ${action.iteration}:`);
      console.log(`      Pensamento: ${action.thought.substring(0, 80)}...`);
      console.log(`      Ação: ${action.action}`);
    });
    if (result.actionHistory.length > 5) {
      console.log(`\n   ... e mais ${result.actionHistory.length - 5} ações`);
    }
    
    // 7. Validação de qualidade
    console.log('\n✅ VALIDAÇÕES:');
    const validations = {
      'Ameaças geradas': result.threats.length >= 12,
      'STRIDE completo': result.metrics.strideCoverage === 6,
      'Unicidade alta': result.metrics.uniquenessRate >= 85,
      'Sem erros críticos': result.errors.length === 0
    };
    
    Object.entries(validations).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });
    
    // 8. Resultado final
    console.log('\n═══════════════════════════════════════════════════');
    const allPassed = Object.values(validations).every(v => v);
    if (allPassed) {
      console.log('🎉 TESTE PASSOU! ReAct Agent funcionando corretamente.');
    } else {
      console.log('⚠️ TESTE PARCIAL. Algumas validações falharam.');
    }
    
    // 9. Erros (se houver)
    if (result.errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      result.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    console.log('═══════════════════════════════════════════════════\n');
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    console.error('\nStack Trace:', (error as Error).stack);
    process.exit(1);
  } finally {
    await Neo4jClient.close();
  }
}

// Executar teste
testReActAgent();

