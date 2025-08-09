import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

dotenv.config();

const PASTA_BASE = "base";

function criarEmbeddings() {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY é obrigatória. Configure no arquivo .env");
  }
  return new GoogleGenerativeAIEmbeddings({
    modelName: "embedding-001"
  });
}

async function criarDb(): Promise<void> {
  try {
    console.log("Criando banco de dados com Gemini embeddings...");
    
    const documentos = await carregarDocumentos();
    const chunks = await dividirChunks(documentos);
    await vetorizarChunks(chunks);
  } catch (error) {
    console.error("Erro ao criar banco de dados:", error);
  }
}

async function carregarDocumentos(): Promise<any[]> {
  const documentos: any[] = [];
  
  if (!fs.existsSync(PASTA_BASE)) {
    console.log(`Pasta ${PASTA_BASE} não encontrada. Criando...`);
    fs.mkdirSync(PASTA_BASE, { recursive: true });
    return documentos;
  }
  
  const arquivos = fs.readdirSync(PASTA_BASE).filter(arquivo => arquivo.endsWith('.pdf'));
  
  for (const arquivo of arquivos) {
    const caminhoCompleto = path.join(PASTA_BASE, arquivo);
    const loader = new PDFLoader(caminhoCompleto);
    const docs = await loader.load();
    documentos.push(...docs);
  }
  
  console.log(`Carregados ${documentos.length} documentos de ${arquivos.length} arquivos PDF`);
  return documentos;
}

async function dividirChunks(documentos: any[]): Promise<any[]> {
  const separadorDocumentos = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 500,
    lengthFunction: (text: string) => text.length
  });
  
  const chunks = await separadorDocumentos.splitDocuments(documentos);
  console.log(`Criados ${chunks.length} chunks`);
  return chunks;
}

async function vetorizarChunks(chunks: any[]): Promise<void> {
  try {
    const embeddings = criarEmbeddings();
    
    const db = await MemoryVectorStore.fromDocuments(chunks, embeddings);
    
    // Salvar os dados em um arquivo para persistência
    const dbData = {
      documents: chunks,
      embeddings: await Promise.all(chunks.map(chunk => embeddings.embedQuery(chunk.pageContent)))
    };
    
    fs.writeFileSync("vectorstore.json", JSON.stringify(dbData, null, 2));
    
    console.log("Banco de Dados criado com sucesso usando Gemini!");
    console.log("Dados salvos em: vectorstore.json");
  } catch (error) {
    if (error instanceof Error && error.message.includes("GOOGLE_API_KEY")) {
      console.log("❌ GOOGLE_API_KEY não configurada!");
      console.log("📝 Para usar Gemini embeddings, você precisa:");
      console.log("   1. Criar um arquivo .env na raiz do projeto");
      console.log("   2. Adicionar: GOOGLE_API_KEY=sua_chave_aqui");
      console.log("   3. Executar novamente: npm run create-db");
    } else {
      console.error("Erro ao vetorizar chunks:", error);
      console.log("💡 Se escolheu Ollama, verifique se:");
      console.log("   1. O Ollama está rodando: ollama serve");
      console.log("   2. O modelo nomic-embed-text está instalado: ollama pull nomic-embed-text");
    }
    throw error;
  }
}

// Executar a criação do banco de dados
criarDb().catch(console.error);