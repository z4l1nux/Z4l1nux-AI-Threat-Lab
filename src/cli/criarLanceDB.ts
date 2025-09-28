import { OllamaEmbeddings } from "@langchain/ollama";
import { OpenAIEmbeddings } from "@langchain/openai";
import { LanceDBCacheManager } from "../core/cache/LanceDBCacheManager";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

const PASTA_BASE = "base";
const DB_PATH = "lancedb_cache";

function criarEmbeddings() {
  // Usar Ollama Embeddings
  return new OllamaEmbeddings({
    model: process.env.EMBEDDING_MODEL || "nomic-embed-text:latest",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
  });
}

async function mostrarMenu(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("\n🚀 Sistema RAG - Gerenciador de Cache LanceDB");
  console.log("=============================================");
  console.log("1. Atualização Incremental (Recomendado)");
  console.log("2. Reprocessamento Completo");
  console.log("3. Mostrar Estatísticas");
  console.log("4. Limpar Cache");
  console.log("5. Sair");
  console.log("");

  const escolha = await new Promise<string>((resolve) => {
    rl.question("Escolha uma opção (1-5): ", resolve);
  });

  rl.close();
  return escolha;
}

async function executarAtualizacaoIncremental(): Promise<void> {
  try {
    console.log("\n🔄 Iniciando atualização incremental no LanceDB...");
    
    const embeddings = criarEmbeddings();
    const cacheManager = new LanceDBCacheManager(DB_PATH, PASTA_BASE, embeddings, {
      mostrarProgresso: true,
      mostrarTokens: true,
      mostrarTempoEstimado: true,
      mostrarDetalhesChunks: true,
      mostrarRespostasAPI: false,
      intervaloAtualizacao: 2000 // Atualizar a cada 2 segundos
    });
    
    const resultado = await cacheManager.atualizarCacheIncremental();
    
    console.log("\n✅ Atualização incremental no LanceDB concluída!");
    console.log("📊 Resumo:");
    console.log(`   📄 Documentos novos: ${resultado.documentosNovos.length}`);
    console.log(`   ✏️ Documentos modificados: ${resultado.documentosModificados.length}`);
    console.log(`   🗑️ Documentos removidos: ${resultado.documentosRemovidos.length}`);
    console.log(`   📊 Total de chunks: ${resultado.totalChunks}`);
    console.log(`   ⏱️ Tempo de processamento: ${resultado.tempoProcessamento}ms`);
    
    if (resultado.estatisticasProcessamento) {
      console.log("\n📈 Estatísticas detalhadas:");
      console.log(`   🎯 Tokens consumidos: ${resultado.estatisticasProcessamento.tokensConsumidos.toLocaleString()}`);
      console.log(`   ⚡ Taxa média: ${resultado.estatisticasProcessamento.taxaProcessamento.toFixed(2)} chunks/seg`);
    }
    
    if (resultado.documentosNovos.length > 0) {
      console.log("\n📄 Documentos novos processados:");
      resultado.documentosNovos.forEach(doc => console.log(`   ✅ ${doc}`));
    }
    
    if (resultado.documentosModificados.length > 0) {
      console.log("\n✏️ Documentos atualizados:");
      resultado.documentosModificados.forEach(doc => console.log(`   🔄 ${doc}`));
    }
    
    if (resultado.documentosRemovidos.length > 0) {
      console.log("\n🗑️ Documentos removidos:");
      resultado.documentosRemovidos.forEach(doc => console.log(`   ❌ ${doc}`));
    }
    
  } catch (error) {
    console.error("❌ Erro durante atualização incremental:", error);
    if (error instanceof Error && error.message.includes("Ollama")) {
      console.log("\n📝 Para usar Ollama embeddings, você precisa:");
      console.log("   1. Instalar o Ollama: https://ollama.ai/");
      console.log("   2. Baixar o modelo: ollama pull nomic-embed-text");
      console.log("   3. Iniciar o servidor: ollama serve");
      console.log("   4. Executar novamente: npm run create-lancedb");
    }
  }
}

async function executarReprocessamentoCompleto(): Promise<void> {
  try {
    console.log("\n🔄 Iniciando reprocessamento completo no LanceDB...");
    
    const embeddings = criarEmbeddings();
    const cacheManager = new LanceDBCacheManager(DB_PATH, PASTA_BASE, embeddings, {
      mostrarProgresso: true,
      mostrarTokens: true,
      mostrarTempoEstimado: true,
      mostrarDetalhesChunks: true,
      mostrarRespostasAPI: false,
      intervaloAtualizacao: 2000
    });
    
    // Limpar cache existente
    await cacheManager.limparCache();
    
    // Processar todos os documentos
    const resultado = await cacheManager.atualizarCacheIncremental();
    
    console.log("\n✅ Reprocessamento completo no LanceDB concluído!");
    console.log("📊 Resumo:");
    console.log(`   📄 Documentos processados: ${resultado.documentosNovos.length}`);
    console.log(`   📊 Total de chunks: ${resultado.totalChunks}`);
    console.log(`   ⏱️ Tempo de processamento: ${resultado.tempoProcessamento}ms`);
    
    if (resultado.estatisticasProcessamento) {
      console.log("\n📈 Estatísticas detalhadas:");
      console.log(`   🎯 Tokens consumidos: ${resultado.estatisticasProcessamento.tokensConsumidos.toLocaleString()}`);
      console.log(`   ⚡ Taxa média: ${resultado.estatisticasProcessamento.taxaProcessamento.toFixed(2)} chunks/seg`);
    }
    
  } catch (error) {
    console.error("❌ Erro durante reprocessamento completo:", error);
  }
}

async function mostrarEstatisticas(): Promise<void> {
  try {
    console.log("\n📊 Estatísticas do Cache LanceDB");
    console.log("================================");
    
    const embeddings = criarEmbeddings();
    const cacheManager = new LanceDBCacheManager(DB_PATH, PASTA_BASE, embeddings);
    
    const estatisticas = await cacheManager.obterEstatisticas();
    
    console.log(`📄 Total de documentos: ${estatisticas.totalDocumentos}`);
    console.log(`📊 Total de chunks: ${estatisticas.totalChunks}`);
    console.log(`💾 Tamanho do banco: ${DB_PATH}`);
    
    if (estatisticas.totalChunks > 0) {
      console.log(`📈 Média de chunks por documento: ${(estatisticas.totalChunks / estatisticas.totalDocumentos).toFixed(2)}`);
    }
    
  } catch (error) {
    console.error("❌ Erro ao obter estatísticas:", error);
  }
}

async function limparCache(): Promise<void> {
  try {
    console.log("\n🗑️ Limpando cache LanceDB...");
    
    const embeddings = criarEmbeddings();
    const cacheManager = new LanceDBCacheManager(DB_PATH, PASTA_BASE, embeddings);
    
    await cacheManager.limparCache();
    
    console.log("✅ Cache LanceDB limpo com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro ao limpar cache:", error);
  }
}

async function main(): Promise<void> {
  try {
    while (true) {
      const escolha = await mostrarMenu();
      
      switch (escolha) {
        case "1":
          await executarAtualizacaoIncremental();
          break;
        case "2":
          await executarReprocessamentoCompleto();
          break;
        case "3":
          await mostrarEstatisticas();
          break;
        case "4":
          await limparCache();
          break;
        case "5":
          console.log("👋 Saindo...");
          return;
        default:
          console.log("❌ Opção inválida. Tente novamente.");
      }
      
      console.log("\n" + "=".repeat(50) + "\n");
    }
  } catch (error) {
    console.error("❌ Erro fatal:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
