import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { SearchFactory } from "../core/search/SearchFactory";
import * as dotenv from "dotenv";

dotenv.config();

async function testarRAG() {
  console.log('🧪 Testando Sistema RAG com novos tipos de arquivo...\n');

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const search = SearchFactory.criarBusca(embeddings, "vectorstore.json", "base", "lancedb");

  const perguntas = [
    // Perguntas sobre XML (livros)
    "Quais são os livros disponíveis no XML?",
    "Quem é o autor do livro Dom Casmurro?",
    "Qual é o gênero do livro 1984?",
    
    // Perguntas sobre JSON (empresa)
    "Quantos funcionários a empresa tem?",
    "Qual é o nome da empresa?",
    "Quais são os projetos da empresa?",
    "Quem é o desenvolvedor senior?",
    
    // Perguntas sobre CSV (funcionários)
    "Quantos funcionários estão no CSV?",
    "Qual é a profissão da Ana Silva?",
    "Quem trabalha em São Paulo?",
    "Qual é o salário do Carlos Santos?"
  ];

  for (const pergunta of perguntas) {
    console.log(`❓ Pergunta: ${pergunta}`);
    
    try {
      const resultado = await search.buscar(pergunta, 3);
      
      console.log(`🔍 Resultados encontrados: ${resultado.length}`);
      
      resultado.forEach((chunk, index) => {
        console.log(`\n📄 Resultado ${index + 1}:`);
        console.log(`📁 Arquivo: ${chunk.documento.metadata.source}`);
        console.log(`📝 Conteúdo: ${chunk.documento.pageContent.substring(0, 200)}...`);
        console.log(`📊 Score: ${chunk.score.toFixed(4)}`);
      });
      
    } catch (error) {
      console.error(`❌ Erro ao buscar: ${error}`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }

  console.log('🎉 Teste RAG concluído!');
}

// Executar o teste
testarRAG().catch(console.error); 