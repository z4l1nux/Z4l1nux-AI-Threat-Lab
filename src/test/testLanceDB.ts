import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { SearchFactory } from "../core/search/SearchFactory";
import * as dotenv from "dotenv";

dotenv.config();

async function testarLanceDB() {
  console.log('🧪 Testando Sistema RAG com LanceDB...\n');

  const embeddings = new OllamaEmbeddings({
    model: process.env.EMBEDDING_MODEL || "nomic-embed-text:latest",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
  });

  const search = SearchFactory.criarBuscaLanceDB(embeddings);

  // Verificar se o cache LanceDB existe
  console.log("🔍 Verificando cache LanceDB...");
  const cacheExiste = await search.verificarCache();
  
  if (!cacheExiste) {
    console.log("❌ Cache LanceDB não encontrado!");
    console.log("📝 Execute primeiro: npm run create-lancedb");
    return;
  }

  console.log("✅ Cache LanceDB encontrado!");

  // Obter estatísticas
  console.log("\n📊 Obtendo estatísticas...");
  const estatisticas = await search.obterEstatisticas();
  console.log(`📄 Total de documentos: ${estatisticas.totalDocumentos}`);
  console.log(`📊 Total de chunks: ${estatisticas.totalChunks}`);

  const perguntas = [
    "O que é LanceDB?",
    "Quais são as vantagens do LanceDB?",
    "Como funciona a busca semântica?",
    "Quais documentos estão na base?",
    "Explique o sistema RAG"
  ];

  console.log("\n🔍 Testando busca semântica...\n");

  for (const pergunta of perguntas) {
    console.log(`❓ Pergunta: ${pergunta}`);
    
    try {
      const inicio = Date.now();
      const resultado = await search.buscar(pergunta, 3);
      const tempo = Date.now() - inicio;
      
      console.log(`⏱️ Tempo de busca: ${tempo}ms`);
      console.log(`🔍 Resultados encontrados: ${resultado.length}`);
      
      resultado.forEach((chunk, index) => {
        console.log(`\n📄 Resultado ${index + 1}:`);
        console.log(`📁 Arquivo: ${chunk.documento.metadata.source || 'N/A'}`);
        console.log(`📝 Conteúdo: ${chunk.documento.pageContent.substring(0, 200)}...`);
        console.log(`📊 Score: ${chunk.score.toFixed(4)}`);
      });
      
    } catch (error) {
      console.error(`❌ Erro ao buscar: ${error}`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }

  console.log('🎉 Teste LanceDB concluído!');
}

if (require.main === module) {
  testarLanceDB().catch(console.error);
}
