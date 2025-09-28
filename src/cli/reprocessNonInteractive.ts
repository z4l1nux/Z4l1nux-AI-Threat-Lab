import * as dotenv from 'dotenv';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { LanceDBCacheManager } from '../core/cache/LanceDBCacheManager';

dotenv.config();

const PASTA_BASE = 'base';
const DB_PATH = 'lancedb_cache';

async function main(): Promise<void> {
  const embeddings = new OllamaEmbeddings({
    model: process.env.EMBEDDING_MODEL || 'nomic-embed-text:latest',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'
  });
  const cache = new LanceDBCacheManager(DB_PATH, PASTA_BASE, embeddings, {
    mostrarProgresso: true,
    mostrarTokens: true,
    mostrarTempoEstimado: true,
    mostrarDetalhesChunks: false,
    mostrarRespostasAPI: false,
    intervaloAtualizacao: 1000,
  });

  console.log('🧹 Limpando cache e reprocessando base (não interativo)...');
  await cache.limparCache();
  const resultado = await cache.atualizarCacheIncremental();

  console.log('✅ Concluído!');
  console.log(`📄 Documentos processados: ${resultado.documentosNovos.length}`);
  console.log(`📊 Total de chunks: ${resultado.totalChunks}`);
  console.log(`⏱️ Tempo: ${resultado.tempoProcessamento}ms`);
}

main().catch((err) => {
  console.error('Erro no reprocessamento não interativo:', err);
  process.exit(1);
});


