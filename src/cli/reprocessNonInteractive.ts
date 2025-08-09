import * as dotenv from 'dotenv';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { LanceDBCacheManager } from '../core/cache/LanceDBCacheManager';

dotenv.config();

const PASTA_BASE = 'base';
const DB_PATH = 'lancedb_cache';

async function main(): Promise<void> {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY é obrigatória. Configure no arquivo .env');
  }

  const embeddings = new GoogleGenerativeAIEmbeddings({ modelName: 'embedding-001' });
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


