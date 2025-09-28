import { OllamaEmbeddings } from "@langchain/ollama";
import { SemanticSearch } from "../core/search/SemanticSearch";
import { OptimizedSemanticSearch } from "../core/search/OptimizedSemanticSearch";
import * as dotenv from "dotenv";

dotenv.config();

async function testarPerformance() {
  console.log('🏃‍♂️ Teste de Performance: Busca Tradicional vs Otimizada\n');

  const embeddings = new OllamaEmbeddings({
    model: process.env.EMBEDDING_MODEL || "nomic-embed-text:latest",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
  });

  // Criar instâncias das duas implementações
  const buscaTradicional = new SemanticSearch(embeddings, "vectorstore.json");
  const buscaOtimizada = new OptimizedSemanticSearch(embeddings, "vectorstore.json");

  const perguntasTeste = [
    "Quais são os livros disponíveis?",
    "Informações sobre funcionários",
    "Dados da empresa",
    "Projetos em desenvolvimento",
    "Segurança e vulnerabilidades"
  ];

  console.log("🔍 Verificando caches...");
  
  const cacheTradicionalOK = await buscaTradicional.verificarCache();
  const cacheOtimizadoOK = await buscaOtimizada.verificarCache();
  
  if (!cacheTradicionalOK || !cacheOtimizadoOK) {
    console.log("❌ Cache não encontrado. Execute primeiro: npm run create-db");
    return;
  }

  console.log("✅ Caches verificados\n");

  // Aquecimento (para garantir que índices sejam carregados)
  console.log("🔥 Aquecimento...");
  await buscaOtimizada.buscar("teste", 1);
  console.log("✅ Aquecimento concluído\n");

  // Teste de performance
  for (const pergunta of perguntasTeste) {
    console.log(`❓ Testando: "${pergunta}"`);
    
    // Busca Tradicional
    const inicioTradicional = Date.now();
    const resultadoTradicional = await buscaTradicional.buscar(pergunta, 5);
    const tempoTradicional = Date.now() - inicioTradicional;
    
    // Busca Otimizada
    const inicioOtimizada = Date.now();
    const resultadoOtimizada = await buscaOtimizada.buscar(pergunta, 5);
    const tempoOtimizada = Date.now() - inicioOtimizada;
    
    // Calcular melhoria
    const melhoria = ((tempoTradicional - tempoOtimizada) / tempoTradicional * 100).toFixed(1);
    const fatorMelhoria = (tempoTradicional / tempoOtimizada).toFixed(1);
    
    console.log(`  📊 Tradicional: ${tempoTradicional}ms (${resultadoTradicional.length} resultados)`);
    console.log(`  🚀 Otimizada:   ${tempoOtimizada}ms (${resultadoOtimizada.length} resultados)`);
    console.log(`  📈 Melhoria:    ${melhoria}% (${fatorMelhoria}x mais rápida)`);
    
    // Verificar se resultados são similares
    const scoresMediosTradicional = resultadoTradicional.reduce((acc, r) => acc + r.score, 0) / resultadoTradicional.length;
    const scoresMediosOtimizada = resultadoOtimizada.reduce((acc, r) => acc + r.score, 0) / resultadoOtimizada.length;
    const diferencaScores = Math.abs(scoresMediosTradicional - scoresMediosOtimizada);
    
    if (diferencaScores < 0.01) {
      console.log(`  ✅ Qualidade mantida (diferença de scores: ${diferencaScores.toFixed(4)})`);
    } else {
      console.log(`  ⚠️  Diferença de qualidade: ${diferencaScores.toFixed(4)}`);
    }
    
    console.log();
  }

  // Estatísticas finais
  console.log("📊 Estatísticas dos Sistemas:");
  
  const statsTradicional = buscaTradicional.obterEstatisticas();
  const statsOtimizada = buscaOtimizada.obterEstatisticas();
  
  console.log("\n📖 Sistema Tradicional:");
  console.log(`  - Total de documentos: ${statsTradicional.totalDocumentos}`);
  console.log(`  - Total de chunks: ${statsTradicional.totalChunks}`);
  
  console.log("\n🚀 Sistema Otimizado:");
  console.log(`  - Total de documentos: ${statsOtimizada.totalDocumentos}`);
  console.log(`  - Total de chunks: ${statsOtimizada.totalChunks}`);
  
  if (statsOtimizada.indiceOtimizado) {
    console.log(`  - Chunks indexados: ${statsOtimizada.indiceOtimizado.chunksIndexados}`);
    console.log(`  - Cache disponível: ${statsOtimizada.indiceOtimizado.cacheDisponivel ? '✅' : '❌'}`);
  }

  console.log('\n🎉 Teste de performance concluído!');
}

// Executar o teste
testarPerformance().catch(console.error);
