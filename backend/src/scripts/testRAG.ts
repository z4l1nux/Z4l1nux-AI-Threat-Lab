import * as dotenv from "dotenv";
import { GeminiSearchFactory } from "../core/search/GeminiSearchFactory";
import { Neo4jClient } from "../core/graph/Neo4jClient";

dotenv.config({ path: '../.env.local' });

async function testRAGSystem() {
  let searchFactory: GeminiSearchFactory | null = null;
  
  try {
    console.log("🧪 Testando sistema RAG completo...");
    
    // Inicializar sistema
    searchFactory = GeminiSearchFactory.criarBusca();
    await searchFactory.initialize();
    
    // Verificar cache inicial
    const initialStats = await searchFactory.obterEstatisticas();
    console.log(`📊 Estado inicial: ${initialStats.totalDocumentos} documentos, ${initialStats.totalChunks} chunks`);
    
    // Adicionar documento de teste se cache estiver vazio
    if (initialStats.totalDocumentos === 0) {
      console.log("📝 Adicionando documento de teste...");
      
      const testDocument = {
        name: "Guia de Threat Modeling - Teste",
        content: `
# Guia de Threat Modeling para Sistemas Web

## Introdução
O Threat Modeling é uma metodologia essencial para identificar e mitigar ameaças de segurança em sistemas de software.

## Metodologia STRIDE
- **Spoofing**: Falsificação de identidade
- **Tampering**: Adulteração de dados
- **Repudiation**: Repúdio de ações
- **Information Disclosure**: Divulgação não autorizada de informações
- **Denial of Service**: Negação de serviço
- **Elevation of Privilege**: Elevação de privilégios

## Componentes Críticos
### Autenticação
- Implementar autenticação multi-fator (MFA)
- Usar protocolos seguros como OAuth 2.0
- Validar tokens de sessão adequadamente

### Autorização
- Aplicar princípio do menor privilégio
- Implementar controle de acesso baseado em funções (RBAC)
- Validar permissões em cada operação

### Comunicação
- Usar HTTPS/TLS para todas as comunicações
- Implementar certificate pinning em aplicações móveis
- Validar certificados SSL/TLS

## Ameaças Comuns
### Injeção SQL
Ameaça que permite execução de comandos SQL maliciosos através de entradas não validadas.

### Cross-Site Scripting (XSS)
Vulnerabilidade que permite injeção de scripts maliciosos em páginas web.

### Cross-Site Request Forgery (CSRF)
Ataque que força usuários autenticados a executar ações não intencionais.

## Mitigações Recomendadas
1. Validação rigorosa de entrada
2. Sanitização de dados
3. Implementação de CSP (Content Security Policy)
4. Uso de tokens CSRF
5. Criptografia de dados sensíveis
6. Monitoramento e logging de segurança
        `,
        metadata: {
          type: "guide",
          category: "security",
          source: "test_document"
        }
      };
      
      await searchFactory.processarDocumento(testDocument);
      console.log("✅ Documento de teste adicionado");
    }
    
    // Testes de busca
    const testQueries = [
      "Como implementar autenticação segura?",
      "Quais são as ameaças STRIDE?",
      "Mitigações para XSS",
      "Controle de acesso RBAC",
      "Vulnerabilidades de injeção SQL"
    ];
    
    console.log("\n🔍 Executando testes de busca...");
    
    for (const query of testQueries) {
      console.log(`\n📋 Query: "${query}"`);
      
      try {
        const results = await searchFactory.buscar(query, 3);
        console.log(`✅ Encontrados ${results.length} resultados`);
        
        results.forEach((result, index) => {
          console.log(`  ${index + 1}. Score: ${result.score.toFixed(3)} - ${result.documento.pageContent.substring(0, 100)}...`);
        });
        
        // Teste de contexto RAG
        const contextData = await searchFactory.buscarContextoRAG(query, 2);
        console.log(`📊 Contexto: ${contextData.context.length} chars, Confiança: ${contextData.confidence.toFixed(1)}%`);
        
      } catch (error) {
        console.error(`❌ Erro na busca "${query}":`, error);
      }
    }
    
    // Estatísticas finais
    const finalStats = await searchFactory.obterEstatisticas();
    console.log(`\n📊 Estado final: ${finalStats.totalDocumentos} documentos, ${finalStats.totalChunks} chunks`);
    
    console.log("\n✅ Teste RAG concluído com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro no teste RAG:", error);
  } finally {
    if (searchFactory) {
      await searchFactory.close();
    }
    await Neo4jClient.close();
  }
}

async function testPerformance() {
  console.log("\n⚡ Teste de performance...");
  
  const searchFactory = GeminiSearchFactory.criarBusca();
  await searchFactory.initialize();
  
  const query = "ameaças de segurança em aplicações web";
  const iterations = 5;
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await searchFactory.buscar(query, 5);
    const end = Date.now();
    times.push(end - start);
    console.log(`  Iteração ${i + 1}: ${end - start}ms`);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`📊 Tempo médio: ${avgTime.toFixed(2)}ms`);
  
  await searchFactory.close();
}

async function main() {
  try {
    // Verificar conexão Neo4j
    const neo4jConnected = await Neo4jClient.testConnection();
    if (!neo4jConnected) {
      throw new Error("Neo4j não está conectado. Execute 'docker-compose up -d' primeiro.");
    }
    
    await testRAGSystem();
    await testPerformance();
    
  } catch (error) {
    console.error("❌ Erro nos testes:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
