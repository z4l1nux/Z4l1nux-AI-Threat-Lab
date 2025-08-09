import express from 'express';
import cors from 'cors';
import path from 'path';
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const promptTemplate = `
Responda a pergunta do usuário:
{pergunta} 

com base nessas informações abaixo:

{base_conhecimento}`;

function criarEmbeddings() {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY é obrigatória. Configure no arquivo .env");
  }
  return new GoogleGenerativeAIEmbeddings({
    modelName: "embedding-001"
  });
}

async function processarPergunta(pergunta: string, modelo: string): Promise<any> {
  const logs: string[] = [];
  
  try {
    logs.push("🔄 Iniciando processamento da pergunta...");
    
    // Verificar se existe o arquivo de dados
    if (!fs.existsSync("vectorstore.json")) {
      throw new Error("Banco de dados não encontrado. Execute primeiro: npm run create-db");
    }
    
    logs.push("📁 Carregando banco de dados...");
    
    // Carregar dados do arquivo
    const dbData = JSON.parse(fs.readFileSync("vectorstore.json", 'utf8'));
    const funcaoEmbedding = criarEmbeddings();
    const db = await MemoryVectorStore.fromDocuments(dbData.documents, funcaoEmbedding);

    logs.push("🔍 Buscando resultados relevantes...");
    
    // comparar a pergunta do usuario (embedding) com o meu banco de dados
    const resultados = await db.similaritySearchWithScore(pergunta, 8);
    
    if (resultados.length === 0) {
      throw new Error("Não conseguiu encontrar alguma informação relevante na base");
    }
    
    logs.push(`✅ Encontrados ${resultados.length} resultados relevantes`);
    resultados.forEach((resultado, index) => {
      logs.push(`${index + 1}. Score: ${resultado[1].toFixed(3)}`);
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
    
    logs.push(`🤖 Gerando resposta com modelo: ${modelo === '1' ? 'Gemini' : 'Ollama/Mistral'}`);
    
    let resposta;
    if (modelo === '1') {
      // Usar Gemini
      const modeloAI = new ChatGoogleGenerativeAI({
        modelName: "gemini-1.5-flash"
      });
      resposta = await modeloAI.invoke(textoPrompt);
    } else {
      // Usar Ollama
      const modeloAI = new ChatOllama({
        model: "mistral",
        baseUrl: "http://127.0.0.1:11434",
        format: "json" // Adicionar formato para compatibilidade
      });
      resposta = await modeloAI.invoke(textoPrompt);
    }
    
    logs.push("✅ Resposta gerada com sucesso!");
    
    return {
      success: true,
      resposta: resposta.content,
      logs: logs,
      resultadosEncontrados: resultados.length,
      scores: resultados.map(r => r[1])
    };
    
  } catch (error) {
    logs.push(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    
    return {
      success: false,
      resposta: null,
      logs: logs,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Rotas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.post('/api/perguntar', async (req, res) => {
  try {
    const { pergunta, modelo } = req.body;
    
    if (!pergunta || !modelo) {
      return res.status(400).json({
        success: false,
        error: 'Pergunta e modelo são obrigatórios'
      });
    }
    
    const resultado = await processarPergunta(pergunta, modelo);
    res.json(resultado);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
});

app.get('/api/status', (req, res) => {
  const hasDatabase = fs.existsSync("vectorstore.json");
  const hasApiKey = !!process.env.GOOGLE_API_KEY;
  
  res.json({
    database: hasDatabase,
    apiKey: hasApiKey,
    status: hasDatabase && hasApiKey ? 'ready' : 'not_ready'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Status: ${fs.existsSync("vectorstore.json") ? 'Banco de dados encontrado' : 'Banco de dados não encontrado'}`);
  console.log(`🔑 API Key: ${process.env.GOOGLE_API_KEY ? 'Configurada' : 'Não configurada'}`);
}); 