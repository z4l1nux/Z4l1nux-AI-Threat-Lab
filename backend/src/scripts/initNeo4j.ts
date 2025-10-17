import * as dotenv from "dotenv";
import { GeminiSearchFactory } from "../core/search/GeminiSearchFactory";
import { Neo4jClient } from "../core/graph/Neo4jClient";

const result = dotenv.config({ path: '../../../.env.local' });
console.log('🔍 Resultado do dotenv:', result.error ? result.error.message : 'Carregado com sucesso');
console.log('🔍 GEMINI_API_KEY presente:', !!process.env.GEMINI_API_KEY);

async function main() {
  try {
    console.log("🚀 Inicializando Neo4j para Z4l1nux AI Threat Lab...");
    
    // Verificar variáveis de ambiente
    if (!process.env.GEMINI_API_KEY) {
      console.log('🔍 Variáveis disponíveis:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
      throw new Error("GEMINI_API_KEY não configurada");
    }
    
    console.log("🔑 Chave Gemini configurada");
    console.log(`🔗 Neo4j URI: ${process.env.NEO4J_URI || 'bolt://localhost:7687'}`);
    
    // Testar conexão Neo4j
    const neo4jConnected = await Neo4jClient.testConnection();
    if (!neo4jConnected) {
      throw new Error("Não foi possível conectar ao Neo4j. Verifique se o Docker está rodando.");
    }
    
    // Inicializar sistema de busca
    const searchFactory = GeminiSearchFactory.criarBusca();
    await searchFactory.initialize();

    // Verificar se o Neo4j está funcionando
    const stats = await searchFactory.obterEstatisticas();
    console.log("🎉 Neo4j inicializado com sucesso!");
    console.log(`📊 Estatísticas: ${stats.totalDocumentos} documentos, ${stats.totalChunks} chunks`);
    
    // Teste básico de embedding
    console.log("🧪 Testando geração de embeddings Gemini...");
    const testResults = await searchFactory.buscar("teste de conectividade", 1);
    console.log(`✅ Teste de busca concluído (${testResults.length} resultados)`);
    
    await searchFactory.close();
    await Neo4jClient.close();
    
    console.log("\n✅ Inicialização concluída com sucesso!");
    console.log("📋 Próximos passos:");
    console.log("  1. Execute 'npm run dev:backend' para iniciar o servidor");
    console.log("  2. Execute 'npm run dev' para iniciar o frontend");
    console.log("  3. Ou execute 'npm run dev:full' para iniciar ambos");
    
  } catch (err) {
    console.error("❌ Erro na inicialização do Neo4j:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
