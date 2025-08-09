import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

const CAMINHO_DB = "db";

const promptTemplate = `
Responda a pergunta do usuário:
{pergunta} 

com base nessas informações abaixo:

{base_conhecimento}`;

interface Resultado {
  pageContent: string;
  metadata: any;
}

interface ResultadoComScore {
  documento: Resultado;
  score: number;
}

function criarEmbeddings() {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY é obrigatória. Configure no arquivo .env");
  }
  return new GoogleGenerativeAIEmbeddings({
    modelName: "embedding-001"
  });
}

async function perguntarComGemini(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const pergunta = await new Promise<string>((resolve) => {
    rl.question("Escreva sua pergunta: ", resolve);
  });

  try {
    // carregar o banco de dados
    const funcaoEmbedding = criarEmbeddings(); // usar Gemini embeddings
    
    // Verificar se existe o arquivo de dados
    if (!require('fs').existsSync("vectorstore.json")) {
      console.log("❌ Banco de dados não encontrado!");
      console.log("📝 Execute primeiro: npm run create-db");
      rl.close();
      return;
    }
    
    // Carregar dados do arquivo
    const dbData = JSON.parse(require('fs').readFileSync("vectorstore.json", 'utf8'));
    const db = await MemoryVectorStore.fromDocuments(dbData.documents, funcaoEmbedding);

    // comparar a pergunta do usuario (embedding) com o meu banco de dados
    const resultados = await db.similaritySearchWithScore(pergunta, 8);
    
    if (resultados.length === 0) {
      console.log("Não conseguiu encontrar alguma informação relevante na base");
      rl.close();
      return;
    }
    
    console.log(`Encontrados ${resultados.length} resultados relevantes`);
    resultados.forEach((resultado, index) => {
      console.log(`${index + 1}. Score: ${resultado[1].toFixed(3)}`);
    });

    const textosResultado: string[] = [];
    for (const resultado of resultados) {
      const texto = resultado[0].pageContent;
      textosResultado.push(texto);
    }

    const baseConhecimento = textosResultado.join("\n\n----\n\n");
    const textoPrompt = promptTemplate
      .replace("{pergunta}", pergunta)
      .replace("{base_conhecimento}", baseConhecimento);
    
    const modelo = new ChatGoogleGenerativeAI({
      modelName: "gemini-1.5-flash"
    });
    
    const resposta = await modelo.invoke(textoPrompt);
    console.log("Resposta da IA (Gemini):", resposta.content);
  } catch (error) {
    if (error instanceof Error && error.message.includes("GOOGLE_API_KEY")) {
      console.log("❌ GOOGLE_API_KEY não configurada!");
      console.log("📝 Para usar Gemini, você precisa:");
      console.log("   1. Criar um arquivo .env na raiz do projeto");
      console.log("   2. Adicionar: GOOGLE_API_KEY=sua_chave_aqui");
      console.log("   3. Reiniciar o programa");
    } else {
      console.error("Erro ao processar pergunta:", error);
    }
  } finally {
    rl.close();
  }
}

async function perguntarComOllama(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const pergunta = await new Promise<string>((resolve) => {
    rl.question("Escreva sua pergunta: ", resolve);
  });

  try {
    // carregar o banco de dados usando Gemini embeddings
    const funcaoEmbedding = criarEmbeddings(); // usar Gemini embeddings
    
    // Verificar se existe o arquivo de dados
    if (!require('fs').existsSync("vectorstore.json")) {
      console.log("❌ Banco de dados não encontrado!");
      console.log("📝 Execute primeiro: npm run create-db");
      rl.close();
      return;
    }
    
    // Carregar dados do arquivo
    const dbData = JSON.parse(require('fs').readFileSync("vectorstore.json", 'utf8'));
    const db = await MemoryVectorStore.fromDocuments(dbData.documents, funcaoEmbedding);

    // comparar a pergunta do usuario (embedding) com o meu banco de dados
    const resultados = await db.similaritySearchWithScore(pergunta, 8);
    
    if (resultados.length === 0) {
      console.log("Não conseguiu encontrar alguma informação relevante na base");
      rl.close();
      return;
    }
    
    console.log(`Encontrados ${resultados.length} resultados relevantes`);
    resultados.forEach((resultado, index) => {
      console.log(`${index + 1}. Score: ${resultado[1].toFixed(3)}`);
    });

    const textosResultado: string[] = [];
    for (const resultado of resultados) {
      const texto = resultado[0].pageContent;
      textosResultado.push(texto);
    }

    const baseConhecimento = textosResultado.join("\n\n----\n\n");
    const textoPrompt = promptTemplate
      .replace("{pergunta}", pergunta)
      .replace("{base_conhecimento}", baseConhecimento);
    
    // Usar Ollama com modelo Mistral
    const modelo = new ChatOllama({
      model: "mistral",
      baseUrl: "http://127.0.0.1:11434"
    });
    
    const resposta = await modelo.invoke(textoPrompt);
    console.log("Resposta da IA (Ollama/Mistral):", resposta.content);
  } catch (error) {
    console.error("Erro ao processar pergunta:", error);
    console.log("💡 Verifique se:");
    console.log("   1. O Ollama está rodando: ollama serve");
    console.log("   2. O modelo mistral está instalado: ollama pull mistral");
    console.log("   3. O modelo nomic-embed-text está instalado: ollama pull nomic-embed-text");
  } finally {
    rl.close();
  }
}

async function perguntar(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("Escolha o modelo:");
  console.log("1 - Gemini (Google)");
  console.log("2 - Ollama (Local - Mistral)");

  const escolha = await new Promise<string>((resolve) => {
    rl.question("Digite sua escolha (1 ou 2): ", resolve);
  });

  rl.close();

  if (escolha === "1") {
    await perguntarComGemini();
  } else if (escolha === "2") {
    await perguntarComOllama();
  } else {
    console.log("Escolha inválida. Usando Gemini por padrão.");
    await perguntarComGemini();
  }
}

// Executar o programa
perguntar().catch(console.error); 