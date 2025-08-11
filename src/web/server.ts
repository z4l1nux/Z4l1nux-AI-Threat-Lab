import express from 'express';
import cors from 'cors';
import path from 'path';
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { SearchFactory } from "../core/search/SearchFactory";
import { PromptTemplates } from "../utils/PromptTemplates";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Template será selecionado dinamicamente baseado na pergunta

function criarEmbeddings() {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY é obrigatória. Configure no arquivo .env");
  }
  return new GoogleGenerativeAIEmbeddings({
    modelName: "embedding-001"
  });
}

// Inicializações únicas (reuso entre requisições para ativar cache em memória)
const embeddingsSingleton = criarEmbeddings();
const SEARCH_MODE = (process.env.SEARCH_MODE || 'hibrida') as 'hibrida' | 'lancedb' | 'neo4j';
const semanticSearch = SearchFactory.criarBusca(embeddingsSingleton, "vectorstore.json", "base", SEARCH_MODE);

// Caches em memória (processo) para acelerar requisições repetidas
type CacheEntry<T> = { ts: number; value: T };
const RESPONSE_CACHE_TTL_MS = parseInt(process.env.RESPONSE_CACHE_TTL_MS || '300000', 10); // 5 min
const RETRIEVAL_CACHE_TTL_MS = parseInt(process.env.RETRIEVAL_CACHE_TTL_MS || '300000', 10); // 5 min
const responseCache = new Map<string, CacheEntry<any>>();
const retrievalCache = new Map<string, CacheEntry<{ resultados: any[]; baseConhecimento: string }>>();

function getCache<K>(map: Map<string, CacheEntry<K>>, key: string, ttlMs: number): K | null {
  const now = Date.now();
  const entry = map.get(key);
  if (entry && now - entry.ts < ttlMs) return entry.value;
  if (entry) map.delete(key);
  return null;
}

function setCache<K>(map: Map<string, CacheEntry<K>>, key: string, value: K): void {
  map.set(key, { ts: Date.now(), value });
}

async function processarPergunta(pergunta: string, modelo: string): Promise<any> {
  const logs: string[] = [];
  
  try {
    logs.push("🔄 Iniciando processamento da pergunta...");
    logs.push(`🧠 Modo de busca: ${SEARCH_MODE}`);

    // Cache de resposta completa (pula retrieval e LLM)
    const responseKey = `${modelo}::${pergunta.toLowerCase().trim().replace(/\s+/g, ' ')}`;
    const respostaCacheada = getCache(responseCache, responseKey, RESPONSE_CACHE_TTL_MS);
    if (respostaCacheada) {
      logs.push("⚡ Cache HIT (resposta)");
      return { success: true, resposta: respostaCacheada, logs, resultadosEncontrados: undefined, scores: [] };
    }

    // Verificar se o cache existe
    const cacheValido = await semanticSearch.verificarCache();
    if (!cacheValido) {
      throw new Error("Banco de dados LanceDB não encontrado. Execute primeiro: npm run create-lancedb");
    }
    
    logs.push("📁 Carregando banco de dados...");
    logs.push("🔍 Buscando resultados relevantes...");
    
    // Cache de retrieval (top-k) para a mesma pergunta
    const retrievalKey = pergunta.toLowerCase().trim().replace(/\s+/g, ' ');
    let retrieval = getCache(retrievalCache, retrievalKey, RETRIEVAL_CACHE_TTL_MS);
    if (!retrieval) {
      const resultados = await semanticSearch.buscar(pergunta, 8);
      const textosResultado: string[] = [];
      for (const r of resultados) textosResultado.push(r.documento.pageContent);
      const baseConhecimento = textosResultado.join("\n\n----\n\n");
      retrieval = { resultados, baseConhecimento };
      setCache(retrievalCache, retrievalKey, retrieval);
      logs.push("🗄️ Cache MISS (retrieval)");
    } else {
      logs.push("⚡ Cache HIT (retrieval)");
    }
    
    if (retrieval.resultados.length === 0) {
      throw new Error("Não conseguiu encontrar alguma informação relevante na base");
    }
    
    logs.push(`✅ Encontrados ${retrieval.resultados.length} resultados relevantes`);
    retrieval.resultados.forEach((resultado: any, index: number) => {
      logs.push(`${index + 1}. Score: ${resultado.score.toFixed(3)}`);
    });

    const baseConhecimento = retrieval.baseConhecimento;
    
    // Selecionar template apropriado baseado na pergunta
    const promptTemplate = PromptTemplates.getTemplateForQuestion(pergunta);
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
      resposta = (modeloAI as any).invoke
        ? await (modeloAI as any).invoke(textoPrompt as any)
        : await (modeloAI as any).call({ input: textoPrompt });
    } else {
      // Usar Ollama
      const modeloAI = new ChatOllama({
        model: "mistral",
        baseUrl: "http://127.0.0.1:11434",
        format: "json" // Adicionar formato para compatibilidade
      });
      resposta = (modeloAI as any).invoke
        ? await (modeloAI as any).invoke(textoPrompt as any)
        : await (modeloAI as any).call({ input: textoPrompt });
    }
    
    logs.push("✅ Resposta gerada com sucesso!");
    
    const payload = {
      success: true,
      resposta: resposta.content,
      logs: logs,
      resultadosEncontrados: retrieval.resultados.length,
      scores: retrieval.resultados.map((r: any) => r.score)
    };
    setCache(responseCache, responseKey, payload.resposta);
    return payload;
    
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
  res.sendFile(path.join(__dirname, '../../public/index.html'));
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

app.get('/api/status', async (req, res) => {
  try {
    const hasDatabase = await semanticSearch.verificarCache();
    const hasApiKey = !!process.env.GOOGLE_API_KEY;
    
    res.json({
      database: hasDatabase,
      apiKey: hasApiKey,
      status: hasDatabase && hasApiKey ? 'ready' : 'not_ready',
      searchMode: SEARCH_MODE
    });
  } catch (error) {
    res.json({
      database: false,
      apiKey: !!process.env.GOOGLE_API_KEY,
      status: 'not_ready',
      searchMode: SEARCH_MODE
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`🔑 API Key: ${process.env.GOOGLE_API_KEY ? 'Configurada' : 'Não configurada'}`);
}); 