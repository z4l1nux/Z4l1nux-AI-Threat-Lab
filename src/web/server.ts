import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import * as fs from 'fs';
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SearchFactory } from "../core/search/SearchFactory";
import { PromptTemplates } from "../utils/PromptTemplates";
import { LanceDBCacheManager } from "../core/cache/LanceDBCacheManager";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Criar diretório 'uploads' se não existir
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Manter nome original com timestamp para evitar conflitos
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${cleanName}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limite
  },
  fileFilter: function (req, file, cb) {
    // Aceitar apenas PDFs, TXT, MD, DOCX
    const allowedTypes = [
      'application/pdf',
      'text/plain', 
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.match(/\.(pdf|txt|md|docx|doc)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use PDF, TXT, MD ou DOCX.'));
    }
  }
});

// Endpoint para buscar modelos disponíveis
app.get('/api/models', (req, res) => {
  try {
    const models = {
      chat: [
        { 
          id: 'gemini', 
          name: '🤖 Gemini (Google)', 
          value: '1',
          model: process.env.MODEL_GEMINI || 'gemini-1.5-flash',
          enabled: !!process.env.GOOGLE_API_KEY
        },
        { 
          id: 'ollama', 
          name: '🦙 Ollama (Local)', 
          value: '2',
          model: process.env.MODEL_OLLAMA || 'mistral',
          enabled: true // Ollama sempre disponível se estiver rodando
        },
        { 
          id: 'deepseek', 
          name: '🧠 DeepSeek (OpenRouter)', 
          value: '3',
          model: process.env.MODEL_DEEPSEEK || 'deepseek/deepseek-r1:free',
          enabled: !!process.env.OPENROUTER_API_KEY,
          recommended: true
        }
      ],
      embedding: {
        model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
        provider: 'openrouter' // ou 'ollama', 'google' baseado na configuração
      }
    };

    // Adicionar modelos dinâmicos do .env se existirem
    console.log('🔍 CUSTOM_MODELS env raw:', JSON.stringify(process.env.CUSTOM_MODELS));
    
    // Modelos hardcoded como exemplo até resolver o problema do .env
    const customModels = [
      {"id":"llama2","name":"🦙 Llama2 (Local)","value":"4","model":"llama2","enabled":true},
      {"id":"claude","name":"🤖 Claude (OpenRouter)","value":"5","model":"anthropic/claude-3-haiku","enabled":true}
    ];
    
    console.log('🔍 Using hardcoded custom models:', customModels);
    models.chat.push(...customModels);

    res.json(models);
  } catch (error) {
    console.error('Erro ao buscar modelos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Template será selecionado dinamicamente baseado na pergunta

// Implementação mock para embeddings quando APIs não estão disponíveis
class MockEmbeddings {
  async embedDocuments(texts: string[]): Promise<number[][]> {
    console.log("🔧 Usando embeddings mock (para desenvolvimento)");
    // Gerar embeddings simulados baseados no hash do texto
    return texts.map(text => {
      const hash = this.simpleHash(text);
      const embedding = Array.from({length: 384}, (_, i) => 
        Math.sin(hash * (i + 1)) * Math.cos(hash / (i + 1)) / Math.sqrt(i + 1)
      );
      return embedding;
    });
  }

  async embedQuery(text: string): Promise<number[]> {
    const embeddings = await this.embedDocuments([text]);
    return embeddings[0];
  }

  private simpleHash(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

function criarEmbeddings() {
  console.log("🔧 Configurando embeddings...");
  
  // Temporariamente desabilitado devido a quota excedida
  // if (process.env.GOOGLE_API_KEY) {
  //   console.log("🔧 Tentando Google Embeddings (embedding-001)");
  //   try {
  //     return new GoogleGenerativeAIEmbeddings({
  //       modelName: "embedding-001"
  //     });
  //   } catch (error) {
  //     console.warn("⚠️ Google API com problemas:", (error as Error).message);
  //   }
  // }
  
  // Prioridade 1: Ollama (local e sem limites de quota)
  try {
    console.log("🦙 Usando Ollama para embeddings (nomic-embed-text)");
    return new OllamaEmbeddings({
      model: "nomic-embed-text",
      baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
    });
  } catch (error) {
    console.warn("⚠️ Ollama não disponível:", error);
  }
  
  // Prioridade 3: OpenRouter (experimental)
  if (process.env.OPENROUTER_API_KEY) {
    console.log("⚠️ Tentando OpenRouter para embeddings (experimental)");
    try {
      return new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENROUTER_API_KEY,
        configuration: {
          baseURL: "https://openrouter.ai/api/v1",
        },
        modelName: "text-embedding-ada-002",
      });
    } catch (error) {
      console.warn("❌ OpenRouter não suporta embeddings");
    }
  }
  
  // Fallback: Embeddings mock para desenvolvimento
  console.warn("⚠️ Usando embeddings simulados (apenas para desenvolvimento)");
  console.warn("📝 Para produção, configure uma das opções:");
  console.warn("   1. GOOGLE_API_KEY com quota disponível");
  console.warn("   2. Ollama rodando localmente");
  console.warn("   3. OPENROUTER_API_KEY (experimental)");
  
  return new MockEmbeddings() as any;
}

// Inicializações únicas (reuso entre requisições para ativar cache em memória)
const embeddingsSingleton = criarEmbeddings();
const SEARCH_MODE = (process.env.SEARCH_MODE || 'hibrida') as 'hibrida' | 'lancedb' | 'neo4j';
const semanticSearch = SearchFactory.criarBusca(embeddingsSingleton, "vectorstore.json", "base", SEARCH_MODE);

// Caches em memória (processo) para acelerar requisições repetidas
type CacheEntry<T> = { ts: number; value: T };
type ResponsePayload = {
  success: boolean;
  resposta: any;
  logs: string[];
  resultadosEncontrados: number;
  scores: number[];
};
const RESPONSE_CACHE_TTL_MS = parseInt(process.env.RESPONSE_CACHE_TTL_MS || '300000', 10); // 5 min
const RETRIEVAL_CACHE_TTL_MS = parseInt(process.env.RETRIEVAL_CACHE_TTL_MS || '300000', 10); // 5 min
const responseCache = new Map<string, CacheEntry<ResponsePayload>>();
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
      return { ...respostaCacheada, logs };
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
    
    const modeloNome = modelo === '1' ? 'Gemini' : modelo === '2' ? 'Ollama/Mistral' : 'DeepSeek (OpenRouter)';
    logs.push(`🤖 Gerando resposta com modelo: ${modeloNome}`);
    
    let resposta;
    if (modelo === '1') {
      // Usar Gemini
      const modeloAI = new ChatGoogleGenerativeAI({
        modelName: process.env.MODEL_GEMINI || "gemini-1.5-flash"
      });
      resposta = (modeloAI as any).invoke
        ? await (modeloAI as any).invoke(textoPrompt as any)
        : await (modeloAI as any).call({ input: textoPrompt });
    } else if (modelo === '2') {
      // Usar Ollama
      const modeloAI = new ChatOllama({
        model: process.env.MODEL_OLLAMA || "mistral",
        baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
        format: "json" // Adicionar formato para compatibilidade
      });
      resposta = (modeloAI as any).invoke
        ? await (modeloAI as any).invoke(textoPrompt as any)
        : await (modeloAI as any).call({ input: textoPrompt });
    } else if (modelo === '3') {
      // Usar OpenRouter com DeepSeek
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY é obrigatória. Configure no arquivo .env");
      }
      const modeloAI = new ChatOpenAI({
        modelName: process.env.MODEL_DEEPSEEK || "deepseek/deepseek-r1:free",
        openAIApiKey: process.env.OPENROUTER_API_KEY,
        configuration: {
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Sistema RAG"
          }
        }
      });
      resposta = await modeloAI.invoke(textoPrompt as any);
    }
    
    logs.push("✅ Resposta gerada com sucesso!");
    
    const payload: ResponsePayload = {
      success: true,
      resposta: resposta.content,
      logs: logs,
      resultadosEncontrados: retrieval.resultados.length,
      scores: retrieval.resultados.map((r: any) => r.score)
    };
    setCache(responseCache, responseKey, payload);
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
    const hasGoogleApiKey = !!process.env.GOOGLE_API_KEY;
    const hasOpenRouterApiKey = !!process.env.OPENROUTER_API_KEY;
    
    res.json({
      database: hasDatabase,
      googleApiKey: hasGoogleApiKey,
      openRouterApiKey: hasOpenRouterApiKey,
      status: hasDatabase && (hasGoogleApiKey || hasOpenRouterApiKey) ? 'ready' : 'not_ready',
      searchMode: SEARCH_MODE
    });
  } catch (error) {
    res.json({
      database: false,
      googleApiKey: !!process.env.GOOGLE_API_KEY,
      openRouterApiKey: !!process.env.OPENROUTER_API_KEY,
      status: 'not_ready',
      searchMode: SEARCH_MODE
    });
  }
});

// Endpoint para upload de documentos para enriquecer o contexto
app.post('/api/upload-documents', upload.array('documents', 10), async (req, res) => {
  const logs: string[] = [];
  
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo foi enviado',
        logs: ['❌ Nenhum arquivo foi enviado']
      });
    }

    logs.push(`📁 ${files.length} arquivo(s) recebido(s) para processamento`);
    
    // Mover arquivos para a pasta base do projeto
    const baseDir = path.join(__dirname, '../../base');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    const movedFiles: string[] = [];
    
    for (const file of files) {
      const sourcePath = file.path;
      const destPath = path.join(baseDir, file.filename);
      
      // Mover arquivo para pasta base
      fs.renameSync(sourcePath, destPath);
      movedFiles.push(file.filename);
      logs.push(`📄 Arquivo movido: ${file.originalname} → ${file.filename}`);
    }

    logs.push('🔄 Iniciando atualização incremental do LanceDB...');

    // Criar embeddings e processar documentos
    const embeddings = criarEmbeddings();
    const cacheManager = new LanceDBCacheManager(
      "lancedb_cache", 
      "base", 
      embeddings,
      {
        mostrarProgresso: false,
        mostrarTokens: false,
        mostrarTempoEstimado: false,
        mostrarDetalhesChunks: false,
        mostrarRespostasAPI: false,
        intervaloAtualizacao: 5000
      }
    );

    const resultado = await cacheManager.atualizarCacheIncremental();
    
    logs.push('✅ Atualização incremental concluída!');
    logs.push(`📊 Resumo do processamento:`);
    logs.push(`   📄 Documentos novos: ${resultado.documentosNovos.length}`);
    logs.push(`   ✏️ Documentos modificados: ${resultado.documentosModificados.length}`);
    logs.push(`   🗑️ Documentos removidos: ${resultado.documentosRemovidos.length}`);

    res.json({
      success: true,
      message: `${files.length} documento(s) processado(s) com sucesso`,
      logs: logs,
      summary: {
        filesUploaded: files.length,
        filesProcessed: movedFiles,
        documentsAdded: resultado.documentosNovos.length,
        documentsModified: resultado.documentosModificados.length,
        documentsRemoved: resultado.documentosRemovidos.length
      }
    });

  } catch (error: any) {
    console.error('Erro no upload de documentos:', error);
    logs.push(`❌ Erro: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: error.message,
      logs: logs
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`🔑 Google API Key: ${process.env.GOOGLE_API_KEY ? 'Configurada' : 'Não configurada'}`);
  console.log(`🔑 OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? 'Configurada' : 'Não configurada'}`);
}); 