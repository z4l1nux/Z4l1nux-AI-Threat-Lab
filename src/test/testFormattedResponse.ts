import { OllamaEmbeddings } from "@langchain/ollama";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { Neo4jOnlySearchFactory } from "../core/search/Neo4jOnlySearchFactory";
import { PromptTemplates } from "../utils/PromptTemplates";
import * as dotenv from "dotenv";

dotenv.config();

async function testarRespostaFormatada() {
  console.log('🎨 Teste de Resposta Formatada com IA\n');

  const embeddings = new OllamaEmbeddings({
    model: process.env.EMBEDDING_MODEL || "nomic-embed-text:latest",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
  });

  const search = Neo4jOnlySearchFactory.criarBusca(embeddings);
  const modelo = new ChatOllama({
    model: process.env.MODEL_OLLAMA || "mistral",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
  });

  const perguntasTeste = [
    "Quais CAPECs estão associados a Repudiation?",
    "Mostre CAPECs relacionados a Information Disclosure",
    "CAPEC-129"
  ];

  for (const pergunta of perguntasTeste) {
    console.log(`❓ Pergunta: ${pergunta}`);
    console.log('='.repeat(80));
    
    try {
      // Buscar resultados
      const resultados = await search.buscar(pergunta, 5);
      
      if (resultados.length === 0) {
        console.log("❌ Nenhum resultado encontrado");
        continue;
      }

      // Preparar base de conhecimento
      const textosResultado = resultados.map(r => r.documento.pageContent);
      const baseConhecimento = textosResultado.join("\n\n----\n\n");
      
      // Selecionar template apropriado
      const promptTemplate = PromptTemplates.getTemplateForQuestion(pergunta);
      const textoPrompt = promptTemplate
        .replace("{pergunta}", pergunta)
        .replace("{base_conhecimento}", baseConhecimento);
      
      // Gerar resposta
      console.log("🤖 Gerando resposta formatada...");
      const resposta = await modelo.invoke(textoPrompt);
      
      console.log("\n📝 RESPOSTA FORMATADA:");
      console.log("-".repeat(40));
      console.log(resposta.content);
      console.log("-".repeat(40));
      
    } catch (error) {
      console.error(`❌ Erro ao processar: ${error}`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }

  console.log('🎉 Teste de resposta formatada concluído!');
}

// Executar o teste
testarRespostaFormatada().catch(console.error);
