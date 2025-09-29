import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import * as fs from 'fs';
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { OllamaEmbeddings } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Neo4jOnlySearchFactory } from "../core/search/Neo4jOnlySearchFactory";
import { PromptTemplates } from "../utils/PromptTemplates";
import { SecureDocumentProcessor, SecureUploadFile } from '../utils/SecureDocumentProcessor';
import { ThreatModelingService, ThreatModelingRequest } from '../utils/ThreatModelingService';
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do React (quando buildado)
app.use(express.static(path.join(__dirname, '../../public/react')));

// Servir arquivos estáticos originais como fallback
app.use('/legacy', express.static(path.join(__dirname, '../../public')));

// Configuração segura do multer - usa memória em vez de disco
const upload = multer({ 
  storage: multer.memoryStorage(), // Armazenar em memória para processamento seguro
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limite
    files: 10 // máximo 10 arquivos
  },
  fileFilter: function (req, file, cb) {
    // Aceitar tipos permitidos ou application/octet-stream para detectar por extensão
    const allowedTypes = [
      'application/pdf',
      'text/plain', 
      'text/markdown',
      'text/x-markdown',
      'application/octet-stream', // Permitir para detectar por extensão
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
      chat: [] as Array<{
        id: string;
        name: string;
        value: string;
        model: string;
        enabled: boolean;
        recommended?: boolean;
      }>,
      embedding: {
        model: process.env.EMBEDDING_MODEL || 'nomic-embed-text:latest',
        provider: 'ollama'
      }
    };

    // Adicionar Ollama se configurado
    if (process.env.MODEL_OLLAMA) {
      models.chat.push({
        id: 'ollama',
        name: `🦙 ${process.env.MODEL_OLLAMA} (Local)`,
        value: '1',
        model: process.env.MODEL_OLLAMA,
        enabled: true
      });
    }

    // Adicionar OpenRouter se configurado
    if (process.env.MODEL_OPENROUTER && process.env.OPENROUTER_API_KEY) {
      models.chat.push({
        id: 'openrouter',
        name: `🧠 ${process.env.MODEL_OPENROUTER} (OpenRouter)`,
        value: '2',
        model: process.env.MODEL_OPENROUTER,
        enabled: true,
        recommended: true
      });
    }

    // Se nenhum modelo estiver configurado, usar padrões
    if (models.chat.length === 0) {
      models.chat.push(
        {
          id: 'ollama',
          name: '🦙 mistral (Local)',
          value: '1',
          model: 'mistral',
          enabled: true
        },
        {
          id: 'openrouter',
          name: '🧠 deepseek/deepseek-r1:free (OpenRouter)',
          value: '2',
          model: 'deepseek/deepseek-r1:free',
          enabled: false,
          recommended: true
        }
      );
    }

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

async function criarEmbeddings() {
  console.log("🔧 Configurando embeddings...");
  console.log(`🔧 OLLAMA_BASE_URL: ${process.env.OLLAMA_BASE_URL}`);
  console.log(`🔧 EMBEDDING_MODEL: ${process.env.EMBEDDING_MODEL}`);
  
  // Prioridade 1: Ollama (local e sem limites de quota)
  try {
    console.log("🦙 Tentando conectar ao Ollama...");
    const embeddings = new OllamaEmbeddings({
      model: process.env.EMBEDDING_MODEL || "nomic-embed-text:latest",
      baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
    });
    
    // Testar se o Ollama está funcionando
    console.log("🧪 Testando conexão com Ollama...");
    await embeddings.embedQuery("teste de conexão");
    console.log("✅ Ollama funcionando corretamente!");
    return embeddings;
  } catch (error) {
    console.warn("⚠️ Ollama não disponível:", error);
  }
  
  // Fallback: Embeddings mock para desenvolvimento
  console.warn("⚠️ Usando embeddings simulados (apenas para desenvolvimento)");
  console.warn("📝 Para produção, configure:");
  console.warn("   1. Ollama rodando localmente com modelo nomic-embed-text:latest");
  console.warn("   2. OPENROUTER_API_KEY para modelos de chat");
  
  return new MockEmbeddings() as any;
}

// Inicializações únicas (reuso entre requisições para ativar cache em memória)
let embeddingsSingleton: any;
let semanticSearch: Neo4jOnlySearchFactory | null = null;

// Inicializar embeddings de forma assíncrona
(async () => {
  try {
    embeddingsSingleton = await criarEmbeddings();
    semanticSearch = new Neo4jOnlySearchFactory(embeddingsSingleton);
    await semanticSearch.initialize();
    console.log("🚀 Sistema RAG Neo4j inicializado com sucesso!");
  } catch (error) {
    console.error("❌ Erro na inicialização:", error);
  }
})();

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
    logs.push(`🧠 Modo de busca: Neo4j`);

    // Aguardar inicialização do sistema
    if (!semanticSearch) {
      logs.push("⏳ Aguardando inicialização do sistema...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (!semanticSearch) {
        throw new Error("Sistema ainda não foi inicializado. Tente novamente em alguns segundos.");
      }
    }

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
      throw new Error("Banco de dados Neo4j não encontrado ou vazio. Faça upload de documentos primeiro.");
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
    
    const modeloNome = modelo === '1' ? 'Ollama (Local)' : 'DeepSeek (OpenRouter)';
    logs.push(`🤖 Gerando resposta com modelo: ${modeloNome}`);
    
    let resposta;
    if (modelo === '1') {
      // Usar Ollama
      const modeloAI = new ChatOllama({
        model: process.env.MODEL_OLLAMA || "mistral",
        baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
        temperature: 0.1,  // Menor temperatura para respostas mais consistentes
      });
      resposta = (modeloAI as any).invoke
        ? await (modeloAI as any).invoke(textoPrompt as any)
        : await (modeloAI as any).call({ input: textoPrompt });
    } else if (modelo === '2') {
      // Usar OpenRouter com DeepSeek
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY é obrigatória. Configure no arquivo .env");
      }
      const modeloAI = new ChatOpenAI({
        modelName: process.env.MODEL_OPENROUTER || "deepseek/deepseek-r1:free",
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

// Nova função para threat modeling usando o serviço dedicado
async function processarThreatModeling(request: ThreatModelingRequest, modelo: string): Promise<any> {
  const logs: string[] = [];
  
  try {
    logs.push("🔄 Iniciando análise de threat modeling...");
    logs.push(`🧠 Modo de busca: Neo4j`);

    // Aguardar inicialização do sistema
    if (!semanticSearch) {
      logs.push("⏳ Aguardando inicialização do sistema...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (!semanticSearch) {
        throw new Error("Sistema ainda não foi inicializado. Tente novamente em alguns segundos.");
      }
    }

    // Cache de resposta completa
    const responseKey = `threat::${modelo}::${JSON.stringify(request)}`;
    const respostaCacheada = getCache(responseCache, responseKey, RESPONSE_CACHE_TTL_MS);
    if (respostaCacheada) {
      logs.push("⚡ Cache HIT (threat modeling)");
      return { ...respostaCacheada, logs };
    }

    // Verificar se o cache existe
    const cacheValido = await semanticSearch.verificarCache();
    if (!cacheValido) {
      throw new Error("Banco de dados Neo4j não encontrado ou vazio. Faça upload de documentos primeiro.");
    }
    
    logs.push("📁 Carregando banco de dados...");
    logs.push("🔍 Buscando resultados relevantes...");
    
    // Buscar contexto relevante para threat modeling
    const query = `${request.systemName} ${request.systemType} ${request.description} threat modeling security vulnerabilities`;
    const resultados = await semanticSearch.buscar(query, 8);
    
    if (resultados.length === 0) {
      throw new Error("Não conseguiu encontrar informações relevantes para threat modeling na base");
    }
    
    logs.push(`✅ Encontrados ${resultados.length} resultados relevantes`);
    resultados.forEach((resultado: any, index: number) => {
      logs.push(`${index + 1}. Score: ${resultado.score.toFixed(3)}`);
    });

    const textosResultado: string[] = [];
    for (const r of resultados) textosResultado.push(r.documento.pageContent);
    const baseConhecimento = textosResultado.join("\n\n----\n\n");
    
    // Gerar prompt usando o serviço dedicado
    let textoPrompt = ThreatModelingService.generateThreatModelingPrompt(request, baseConhecimento);
    
    const modeloNome = modelo === '1' ? 'Ollama (Local)' : 'DeepSeek (OpenRouter)';
    logs.push(`🤖 Gerando análise de threat modeling com modelo: ${modeloNome}`);
    
    let resposta;
      if (modelo === '1') {
        // Usar Ollama com structured outputs (JSON Schema)
        const modeloAI = new ChatOllama({
          model: process.env.MODEL_OLLAMA || "mistral",
          baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
          temperature: 0.1,  // Menor temperatura para respostas mais consistentes
        });
        
        // Obter o JSON Schema para structured outputs
        const schema = ThreatModelingService.getThreatModelingSchema();
        
        // Tentar primeiro com structured outputs
        try {
          logs.push(`🔧 Usando structured outputs com JSON Schema...`);
          
          // Usar o método structured outputs do Ollama
          if ((modeloAI as any).invoke) {
            resposta = await (modeloAI as any).invoke({
              input: textoPrompt,
              format: schema
            });
          } else {
            // Fallback para método antigo se structured outputs não estiver disponível
            resposta = await (modeloAI as any).call({ 
              input: textoPrompt,
              format: schema
            });
          }
          
          logs.push(`✅ Structured output recebido`);
          
        } catch (error) {
          logs.push(`⚠️ Erro com structured outputs: ${error}`);
          
          // Fallback: tentar sem structured outputs
          try {
            logs.push(`🔄 Tentando sem structured outputs...`);
            resposta = (modeloAI as any).invoke
              ? await (modeloAI as any).invoke(textoPrompt as any)
              : await (modeloAI as any).call({ input: textoPrompt });
            
            // Verificar se a resposta contém recusa ou é genérica
            const respostaTexto = typeof resposta === 'string' ? resposta : resposta?.content || resposta?.text || '';
            if (respostaTexto.includes("I'm sorry, but I can't assist") || 
                respostaTexto.includes("I cannot help") ||
                respostaTexto.includes("I'm not able to") ||
                respostaTexto.includes("The provided information includes") ||
                respostaTexto.includes("success") && respostaTexto.includes("message")) {
              
              logs.push(`⚠️ Primeiro prompt recusado ou genérico, tentando prompt alternativo...`);
              
              // Tentar prompt alternativo mais direto
              textoPrompt = ThreatModelingService.generateAlternativePrompt(request);
              resposta = (modeloAI as any).invoke
                ? await (modeloAI as any).invoke(textoPrompt as any)
                : await (modeloAI as any).call({ input: textoPrompt });
              
              logs.push(`🔄 Prompt alternativo enviado`);
              
              // Verificar se o segundo prompt também falhou
              const respostaTexto2 = typeof resposta === 'string' ? resposta : resposta?.content || resposta?.text || '';
              if (respostaTexto2.includes("I'm sorry, but I can't assist") || 
                  respostaTexto2.includes("I cannot help") ||
                  respostaTexto2.includes("The provided information includes") ||
                  respostaTexto2.includes("success") && respostaTexto2.includes("message")) {
                
                logs.push(`⚠️ Segundo prompt também falhou, tentando prompt super direto...`);
                
                // Tentar prompt super direto
                textoPrompt = ThreatModelingService.generateDirectThreatPrompt(request);
                resposta = (modeloAI as any).invoke
                  ? await (modeloAI as any).invoke(textoPrompt as any)
                  : await (modeloAI as any).call({ input: textoPrompt });
                
                logs.push(`🔄 Prompt super direto enviado`);
              }
            }
          } catch (fallbackError) {
            logs.push(`❌ Erro no fallback: ${fallbackError}`);
            throw fallbackError;
          }
        }
      } else if (modelo === '2') {
      // Usar OpenRouter com DeepSeek
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY é obrigatória. Configure no arquivo .env");
      }
      const modeloAI = new ChatOpenAI({
        modelName: process.env.MODEL_OPENROUTER || "deepseek/deepseek-r1:free",
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
    
    logs.push("✅ Análise de threat modeling gerada com sucesso!");
    
    // Extrair resposta do modelo
    const respostaTexto = resposta.content || resposta.text || resposta;
    console.log('🤖 Resposta do modelo:', respostaTexto ? respostaTexto.substring(0, 200) + '...' : 'RESPOSTA VAZIA');
    
    if (!respostaTexto || respostaTexto.trim() === '') {
      throw new Error("Modelo retornou resposta vazia");
    }
    
    const payload: ResponsePayload = {
      success: true,
      resposta: respostaTexto,
      logs: logs,
      resultadosEncontrados: resultados.length,
      scores: resultados.map((r: any) => r.score)
    };
    
    setCache(responseCache, responseKey, payload);
    return payload;
    
  } catch (error: any) {
    logs.push(`❌ Erro: ${error.message}`);
    return {
      success: false,
      error: error.message,
      logs: logs
    };
  }
}

// Rotas
app.get('/', (req, res) => {
  // Tentar servir o React build primeiro, fallback para HTML original
  const reactIndex = path.join(__dirname, '../../public/react/index.html');
  const legacyIndex = path.join(__dirname, '../../public/index.html');
  
  if (require('fs').existsSync(reactIndex)) {
    res.sendFile(reactIndex);
  } else {
    res.sendFile(legacyIndex);
  }
});

// Rota para acessar a versão legacy
app.get('/legacy', (req, res) => {
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

// Novo endpoint para threat modeling
app.post('/api/threat-modeling', async (req, res) => {
  try {
    const { systemName, systemType, sensitivity, description, assets, modelo } = req.body;
    
    if (!systemName || !systemType || !sensitivity || !description || !assets || !modelo) {
      return res.status(400).json({
        success: false,
        error: 'Todos os campos são obrigatórios'
      });
    }
    
    const request: ThreatModelingRequest = {
      systemName,
      systemType,
      sensitivity,
      description,
      assets
    };
    
    const resultado = await processarThreatModeling(request, modelo);
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
    const hasDatabase = semanticSearch ? await semanticSearch.verificarCache() : false;
    const hasOpenRouterApiKey = !!process.env.OPENROUTER_API_KEY;
    
    res.json({
      database: hasDatabase,
      openRouterApiKey: hasOpenRouterApiKey,
      status: hasDatabase ? 'ready' : 'not_ready',
      searchMode: 'neo4j'
    });
  } catch (error) {
    res.json({
      database: false,
      openRouterApiKey: !!process.env.OPENROUTER_API_KEY,
      status: 'not_ready',
      searchMode: 'neo4j'
    });
  }
});

// Endpoint seguro para upload de documentos para enriquecer o contexto
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

    logs.push(`🔒 Processamento seguro iniciado para ${files.length} arquivo(s)`);
    
    // Converter arquivos para formato seguro
    const secureFiles: SecureUploadFile[] = files.map(file => ({
      originalname: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size
    }));

    // Criar embeddings
    const embeddings = await criarEmbeddings();
    
    // Processar com verificações de segurança
    const processor = new SecureDocumentProcessor();
    const resultado = await processor.processDocumentsSecurely(secureFiles, embeddings);
    
    // Combinar logs
    logs.push(...resultado.logs);
    
    if (!resultado.success) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo foi processado com sucesso',
        logs: logs,
        securityResults: resultado.results,
        summary: resultado.summary
      });
    }

    res.json({
      success: true,
      message: `${resultado.processed} documento(s) processado(s) com segurança`,
      logs: logs,
      securityResults: resultado.results,
      summary: {
        filesUploaded: files.length,
        filesProcessed: resultado.processed,
        filesRejected: resultado.rejected,
        securityChecks: resultado.results.length
      }
    });

  } catch (error: any) {
    console.error('Erro no processamento seguro de documentos:', error);
    logs.push(`❌ Erro crítico: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: error.message,
      logs: logs
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`🔑 OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? 'Configurada' : 'Não configurada'}`);
  console.log(`🦙 Ollama Base URL: ${process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'}`);
  console.log(`🧠 Embedding Model: ${process.env.EMBEDDING_MODEL || 'nomic-embed-text:latest'}`);
}); 