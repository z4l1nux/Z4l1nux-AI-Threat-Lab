import * as dotenv from 'dotenv';
import { OllamaEmbeddings } from '@langchain/ollama';
import { Neo4jCacheManager } from '../core/cache/Neo4jCacheManager';

dotenv.config();

async function main(): Promise<void> {
  const embeddings = new OllamaEmbeddings({
    model: process.env.EMBEDDING_MODEL || 'nomic-embed-text:latest',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'
  });
  const cache = new Neo4jCacheManager(
    process.env.NEO4J_URI || "bolt://localhost:7687",
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "s3nh4forte",
    embeddings
  );

  console.log('🧹 Limpando cache Neo4j e reprocessando base (não interativo)...');
  await cache.limparCache();
  
  console.log('✅ Concluído!');
  console.log('📊 Cache Neo4j limpo e pronto para novos documentos');
}

main().catch((err) => {
  console.error('Erro no reprocessamento não interativo:', err);
  process.exit(1);
});


