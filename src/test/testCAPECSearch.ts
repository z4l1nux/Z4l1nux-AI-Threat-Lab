import { OllamaEmbeddings } from "@langchain/ollama";
import { SearchFactory } from "../core/search/SearchFactory";
import * as dotenv from "dotenv";

dotenv.config();

async function testarBuscaCAPEC() {
  console.log('🔍 Teste Específico: Busca de CAPECs\n');

  const embeddings = new OllamaEmbeddings({
    model: process.env.EMBEDDING_MODEL || "nomic-embed-text:latest",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
  });

  const search = SearchFactory.criarBuscaOtimizada(embeddings, "vectorstore.json");

  const perguntasCAPEC = [
    "Quais CAPECs estão associados a Repudiation?",
    "Mostre CAPECs relacionados a Information Disclosure",
    "Quais são os CAPECs de Spoofing?",
    "CAPECs de Tampering",
    "CAPEC-129",
    "CAPEC-216",
    "CAPEC relacionados a Denial of Service",
    "CAPECs de Elevation of Privilege"
  ];

  for (const pergunta of perguntasCAPEC) {
    console.log(`❓ Pergunta: ${pergunta}`);
    
    try {
      const resultado = await search.buscar(pergunta, 5);
      
      console.log(`🔍 Resultados encontrados: ${resultado.length}`);
      
      if (resultado.length > 0) {
        console.log("📄 Conteúdo relevante encontrado:");
        resultado.forEach((chunk, index) => {
          console.log(`\n${index + 1}. Score: ${chunk.score.toFixed(4)}`);
          console.log(`   Arquivo: ${chunk.documento.metadata.source || 'N/A'}`);
          console.log(`   Conteúdo: ${chunk.documento.pageContent.substring(0, 200)}...`);
        });
      } else {
        console.log("❌ Nenhum resultado relevante encontrado");
      }
      
    } catch (error) {
      console.error(`❌ Erro ao buscar: ${error}`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }

  console.log('🎉 Teste de busca CAPEC concluído!');
}

// Executar o teste
testarBuscaCAPEC().catch(console.error);
