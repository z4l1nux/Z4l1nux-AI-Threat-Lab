import { Neo4jCacheManager } from '../core/cache/Neo4jCacheManager';
import { OllamaEmbeddings } from '@langchain/ollama';

async function testNeo4j() {
  console.log('🔧 Testando conexão com Neo4j...');
  
  try {
    // Configurar embeddings
    const embeddings = new OllamaEmbeddings({
      model: process.env.EMBEDDING_MODEL || "nomic-embed-text:latest",
      baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
    });

    // Configurar Neo4j
    const neo4jUri = process.env.NEO4J_URI || "bolt://localhost:7687";
    const neo4jUser = process.env.NEO4J_USER || "neo4j";
    const neo4jPassword = process.env.NEO4J_PASSWORD || "s3nh4forte";

    console.log(`🔗 Conectando ao Neo4j: ${neo4jUri}`);
    console.log(`👤 Usuário: ${neo4jUser}`);

    const cacheManager = new Neo4jCacheManager(
      neo4jUri,
      neo4jUser,
      neo4jPassword,
      embeddings
    );

    // Inicializar
    await cacheManager.initialize();
    console.log('✅ Neo4j inicializado com sucesso!');

    // Verificar cache
    const cacheValido = await cacheManager.verificarCache();
    console.log(`📊 Cache válido: ${cacheValido}`);

    if (cacheValido) {
      // Obter estatísticas
      const stats = await cacheManager.obterEstatisticas();
      console.log('📈 Estatísticas do Neo4j:');
      console.log(`   - Total de chunks: ${stats.totalChunks}`);
      console.log(`   - Total de documentos: ${stats.totalDocumentos}`);

      // Testar busca
      console.log('\n🔍 Testando busca semântica...');
      const query = "threat modeling security vulnerabilities";
      const resultados = await cacheManager.search(query, 3);
      
      console.log(`✅ Encontrados ${resultados.length} resultados para: "${query}"`);
      resultados.forEach((resultado, index) => {
        console.log(`   ${index + 1}. Score: ${resultado.score.toFixed(3)}`);
        console.log(`      Documento: ${resultado.document.metadata?.nomeArquivo || 'N/A'}`);
        console.log(`      Conteúdo: ${resultado.document.content.substring(0, 100)}...`);
        console.log('');
      });

      // Testar busca específica para threat modeling
      console.log('🔍 Testando busca para threat modeling...');
      const threatQuery = "CloudVault Enterprise Document Management System threat modeling";
      const threatResults = await cacheManager.search(threatQuery, 3);
      
      console.log(`✅ Encontrados ${threatResults.length} resultados para: "${threatQuery}"`);
      threatResults.forEach((resultado, index) => {
        console.log(`   ${index + 1}. Score: ${resultado.score.toFixed(3)}`);
        console.log(`      Documento: ${resultado.document.metadata?.nomeArquivo || 'N/A'}`);
        console.log(`      Conteúdo: ${resultado.document.content.substring(0, 100)}...`);
        console.log('');
      });

    } else {
      console.log('⚠️ Neo4j está vazio. Execute primeiro: npm run create-neo4j');
    }

    await cacheManager.close();
    console.log('✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro no teste do Neo4j:', error);
    process.exit(1);
  }
}

// Executar teste
testNeo4j();
