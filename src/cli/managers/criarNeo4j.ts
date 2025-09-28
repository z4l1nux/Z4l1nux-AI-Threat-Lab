import * as dotenv from "dotenv";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Neo4jCacheManager } from "../../core/cache/Neo4jCacheManager";

dotenv.config();

async function main() {
  try {
    const embeddings = new OllamaEmbeddings({
      model: process.env.EMBEDDING_MODEL || "nomic-embed-text:latest",
      baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
    });
    const cache = new Neo4jCacheManager(
      process.env.NEO4J_URI || "bolt://localhost:7687",
      process.env.NEO4J_USER || "neo4j",
      process.env.NEO4J_PASSWORD || "s3nh4forte",
      embeddings
    );
    await cache.initialize();

    // Verificar se o Neo4j está funcionando
    const stats = await cache.obterEstatisticas();
    console.log("🎉 Neo4j inicializado com sucesso!");
    console.log(`📊 Estatísticas: ${stats.totalDocumentos} documentos, ${stats.totalChunks} chunks`);
    
    await cache.close();
  } catch (err) {
    console.error("❌ Erro na inicialização do Neo4j:", err);
  }
}

if (require.main === module) {
  main().catch(console.error);
}


