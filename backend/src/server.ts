import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as dotenv from 'dotenv';
import neo4j from 'neo4j-driver';
import { OllamaProvider } from './core/models/providers/OllamaProvider';
import { OpenRouterProvider } from './core/models/providers/OpenRouterProvider';
import { GeminiProvider } from './core/models/providers/GeminiProvider';
import { SemanticSearchFactory } from './core/search/SemanticSearchFactory';
import { Neo4jClient } from './core/graph/Neo4jClient';
import { DocumentLoaderFactory } from './utils/documentLoaders';
import { SearchResult, RAGContext } from './types/index';
import { ModelFactory } from './core/models/ModelFactory';

// Carregar variáveis de ambiente
console.log('🔧 Diretório atual:', process.cwd());
const dotenvResult = dotenv.config({ path: '../.env.local' });
console.log('🔧 Dotenv resultado:', dotenvResult.error ? dotenvResult.error.message : 'Carregado com sucesso');
console.log('🔧 OLLAMA_BASE_URL:', process.env.OLLAMA_BASE_URL);
console.log('🔧 OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'Configurado' : 'Não configurado');
console.log('🔧 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Configurado' : 'Não configurado');

// Inicializar providers APÓS carregar variáveis de ambiente
const ollamaProvider = new OllamaProvider();
const openrouterProvider = new OpenRouterProvider();
const geminiProvider = new GeminiProvider();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Configurar CORS - Aceitar múltiplas origens (dev, produção, WSL2)
const allowedOrigins = [
  'http://localhost:5173',  // Desenvolvimento (Vite dev server)
  'http://localhost:4173',  // Produção (Vite preview)
  'http://127.0.0.1:5173',  // Desenvolvimento (127.0.0.1)
  'http://127.0.0.1:4173',  // Produção (127.0.0.1)
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (ex: Postman, curl)
    if (!origin) return callback(null, true);
    
    // Verificar se está na lista de origens permitidas
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Permitir qualquer IP local (WSL2, rede local)
    // Exemplos: http://172.21.123.93:4173, http://10.255.255.254:4173
    const isLocalNetwork = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+):(5173|4173)$/i.test(origin);
    
    if (isLocalNetwork) {
      return callback(null, true);
    }
    
    console.warn(`⚠️ Origem bloqueada pelo CORS: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configurar multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const isSupported = DocumentLoaderFactory.isExtensionSupported(file.originalname);
    if (isSupported) {
      cb(null, true);
    } else {
      cb(new Error(`Extensão não suportada: ${file.originalname}`));
    }
  }
});

// Instância global do sistema de busca
let searchFactory: SemanticSearchFactory | null = null;

// Flag para rastrear o status de inicialização automática
let ragAutoInitialized = false;
let ragInitializationInProgress = false;

// Middleware para verificar se o sistema está inicializado
const requireInitialized = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!searchFactory) {
    return res.status(503).json({
      error: 'Sistema RAG não inicializado',
      message: 'Execute POST /api/initialize primeiro'
    });
  }
  next();
};

// Rotas

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const neo4jConnected = await Neo4jClient.testConnection();
    const ragInitialized = searchFactory !== null || ragAutoInitialized;
    const ragStatus = ragInitializationInProgress ? 'initializing' : (ragInitialized ? 'initialized' : 'not_initialized');
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        neo4j: neo4jConnected ? 'connected' : 'disconnected',
        rag: ragStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Listar modelos disponíveis
app.get('/api/models/available', async (req, res) => {
  try {
    console.log('🔍 Verificando variáveis de ambiente:');
    console.log('OLLAMA_BASE_URL:', process.env.OLLAMA_BASE_URL || 'Não configurado');
    console.log('MODEL_OLLAMA:', process.env.MODEL_OLLAMA || 'Não configurado');
    console.log('EMBEDDING_MODEL:', process.env.EMBEDDING_MODEL || 'Não configurado');
    console.log('OLLAMA_TIMEOUT:', process.env.OLLAMA_TIMEOUT || '300000ms');
    console.log('OLLAMA_MAX_RETRIES:', process.env.OLLAMA_MAX_RETRIES || '2');
    console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'Configurado' : 'Não configurado');
    console.log('MODEL_OPENROUTER:', process.env.MODEL_OPENROUTER || 'Não configurado');
    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Configurado' : 'Não configurado');
    console.log('MODEL_GEMINI:', process.env.MODEL_GEMINI || 'Não configurado');
    
    const models = [];
    const embeddings = [];
    const warnings = [];
    const errors = [];


    // Ollama models - verificar disponibilidade
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://172.21.112.1:11434';
    const ollamaModel = process.env.MODEL_OLLAMA || 'llama3.1:latest';
    const ollamaEmbedding = process.env.EMBEDDING_MODEL || process.env.EMBEDDING_MODEL_OLLAMA || 'nomic-embed-text:latest';
    
    const isOllamaAvailable = await ollamaProvider.isAvailable();
    
    if (isOllamaAvailable) {
      models.push({
        id: ollamaModel,
        name: `Ollama: ${ollamaModel}`,
        provider: 'ollama',
        available: true
      });

      embeddings.push({
        id: ollamaEmbedding,
        name: `Ollama: ${ollamaEmbedding}`,
        provider: 'ollama',
        available: true
      });
    }

    // OpenRouter models - verificar disponibilidade
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    const openrouterModel = process.env.MODEL_OPENROUTER;
    const openrouterEmbedding = process.env.EMBEDDING_MODEL_OPENROUTER || 'text-embedding-3-small';
    
    const isOpenRouterAvailable = await openrouterProvider.isAvailable();
    
    if (isOpenRouterAvailable && openrouterModel) {
      models.push({
        id: openrouterModel,
        name: `OpenRouter: ${openrouterModel.split('/').pop()}`,
        provider: 'openrouter',
        available: true
      });

      embeddings.push({
        id: openrouterEmbedding,
        name: `OpenRouter: ${openrouterEmbedding}`,
        provider: 'openrouter',
        available: true
      });
    }

    // Gemini models - verificar disponibilidade
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.MODEL_GEMINI;
    const geminiEmbedding = process.env.EMBEDDING_MODEL_GEMINI || 'text-embedding-004';
    
    const isGeminiAvailable = await geminiProvider.isAvailable();
    
    if (isGeminiAvailable && geminiModel) {
      models.push({
        id: geminiModel,
        name: `Gemini: ${geminiModel}`,
        provider: 'gemini',
        available: true
      });

      embeddings.push({
        id: geminiEmbedding,
        name: `Gemini: ${geminiEmbedding}`,
        provider: 'gemini',
        available: true
      });
    }

    // Validar configuração padrão
    const defaultConfig = {
      model: models.length > 0 ? models[0].id : '',
      provider: models.length > 0 ? models[0].provider : '',
      embedding: embeddings.length > 0 ? embeddings[0].id : '',
      embeddingProvider: embeddings.length > 0 ? embeddings[0].provider : ''
    };

    // Adicionar validações se não há modelos configurados
    if (models.length === 0) {
      errors.push('Nenhum modelo configurado. Configure pelo menos um provider: OLLAMA_BASE_URL + MODEL_OLLAMA, OPENROUTER_API_KEY + MODEL_OPENROUTER ou GEMINI_API_KEY + MODEL_GEMINI');
    }

    if (embeddings.length === 0) {
      warnings.push('Nenhum modelo de embedding configurado. Configure EMBEDDING_MODEL ou use um dos padrões');
    }

    const response = {
      models,
      embeddings,
      providers: {
        ollama: isOllamaAvailable,
        openrouter: isOpenRouterAvailable,
        gemini: isGeminiAvailable
      },
      defaultConfig,
      validation: {
        warnings,
        errors
      }
    };
    
    console.log('📤 Resposta enviada:', JSON.stringify(response, null, 2));
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao listar modelos disponíveis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Inicializar sistema RAG
app.post('/api/initialize', async (req, res) => {
  try {
    console.log('🚀 Inicializando sistema RAG...');
    ragInitializationInProgress = true;
    
    // Inicializar ModelFactory primeiro
    await ModelFactory.initialize();
    
    // Testar conexão Neo4j primeiro
    const neo4jConnected = await Neo4jClient.testConnection();
    console.log(`🔍 Resultado do teste Neo4j: ${neo4jConnected} (tipo: ${typeof neo4jConnected})`);
    
    if (!neo4jConnected) {
      ragInitializationInProgress = false;
      throw new Error('Não foi possível conectar ao Neo4j');
    }
    
    // Inicializar sistema de busca
    searchFactory = SemanticSearchFactory.createSearch();
    await searchFactory.initialize();
    
    // Marcar como inicializado
    ragAutoInitialized = true;
    ragInitializationInProgress = false;
    
    // Obter estatísticas
    const stats = await searchFactory.getStatistics();
    
    res.json({
      message: 'Sistema RAG inicializado com sucesso',
      timestamp: new Date().toISOString(),
      statistics: stats
    });
    
  } catch (error) {
    console.error('❌ Erro ao inicializar sistema RAG:', error);
    searchFactory = null;
    ragAutoInitialized = false;
    ragInitializationInProgress = false;
    
    res.status(500).json({
      error: 'Falha ao inicializar sistema RAG',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload de documento
app.post('/api/documents/upload', requireInitialized, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Nenhum arquivo enviado'
      });
    }

    console.log(`📄 Processando upload: ${req.file.originalname}`);
    
    // Processar arquivo
    const content = await DocumentLoaderFactory.processFileFromBuffer(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Não foi possível extrair conteúdo do arquivo'
      });
    }

    // Processar documento no sistema RAG
    await searchFactory!.processDocument({
      name: req.file.originalname,
      content,
      metadata: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date().toISOString(),
        source: 'file_upload'
      }
    });

    // Obter estatísticas atualizadas
    const stats = await searchFactory!.getStatistics();

    res.json({
      message: 'Documento processado com sucesso',
      document: {
        name: req.file.originalname,
        size: req.file.size,
        contentLength: content.length
      },
      statistics: stats
    });

  } catch (error) {
    console.error('❌ Erro ao processar upload:', error);
    res.status(500).json({
      error: 'Falha ao processar documento',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload de texto direto
app.post('/api/documents/text', requireInitialized, async (req, res) => {
  try {
    const { name, content, modelConfig } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({
        error: 'Nome e conteúdo são obrigatórios'
      });
    }

    console.log(`📝 Processando texto: ${name}`);
    if (modelConfig) {
      console.log(`🤖 Usando modelo: ${modelConfig.model} (${modelConfig.provider})`);
      console.log(`🔗 Usando embedding: ${modelConfig.embedding} (${modelConfig.embeddingProvider})`);
    }

    // Processar documento no sistema RAG
    await searchFactory!.processDocument({
      name,
      content,
      metadata: {
        originalName: name,
        mimeType: 'text/plain',
        size: content.length,
        uploadedAt: new Date().toISOString(),
        source: 'text_input',
        modelConfig: modelConfig || null
      }
    });

    // Obter estatísticas atualizadas
    const stats = await searchFactory!.getStatistics();

    res.json({
      message: 'Texto processado com sucesso',
      document: {
        name,
        contentLength: content.length
      },
      statistics: stats
    });

  } catch (error) {
    console.error('❌ Erro ao processar texto:', error);
    res.status(500).json({
      error: 'Falha ao processar texto',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Busca RAG
app.post('/api/search', requireInitialized, async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Query é obrigatória'
      });
    }

    console.log(`🔍 Executando busca RAG: "${query.substring(0, 50)}..."`);

    const results = await searchFactory!.search(query, limit);

    res.json({
      query,
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na busca RAG:', error);
    res.status(500).json({
      error: 'Falha na busca',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Busca com contexto RAG para threat modeling
app.post('/api/search/context', requireInitialized, async (req, res) => {
  try {
    const { query, limit = 5, systemContext, modelConfig } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Query é obrigatória'
      });
    }

    console.log(`🎯 Buscando contexto RAG para threat modeling: "${query.substring(0, 50)}..."`);
    if (systemContext) {
      console.log(`🔍 Filtro de contexto aplicado: Sistema "${systemContext}"`);
    }
    if (modelConfig) {
      console.log(`🤖 Usando modelo: ${modelConfig.model} (${modelConfig.provider})`);
      console.log(`🔗 Usando embedding: ${modelConfig.embedding} (${modelConfig.embeddingProvider})`);
    }

    const contextData = await searchFactory!.searchRAGContext(query, limit, systemContext, modelConfig);

    res.json({
      query,
      systemContext,
      ...contextData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na busca de contexto:', error);
    res.status(500).json({
      error: 'Falha na busca de contexto',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Buscar mapeamento STRIDE-CAPEC
app.get('/api/stride-capec-mapping', async (req, res) => {
  try {
    // Verificar se o RAG está inicializado
    if (!searchFactory) {
      console.warn('⚠️ RAG não inicializado ao buscar mapeamento STRIDE-CAPEC');
      return res.status(503).json({
        error: 'Sistema RAG não inicializado',
        message: 'Inicialize o sistema RAG primeiro e faça upload do arquivo de mapeamento STRIDE-CAPEC',
        mapping: [],
        initialized: false
      });
    }

    console.log('📋 Buscando mapeamento STRIDE-CAPEC no RAG...');

    // Buscar documentos que contenham mapeamento STRIDE-CAPEC
    // 🔥 IMPORTANTE: Limite aumentado para 150 chunks para garantir diversidade de CAPECs
    // Isso evita repetição quando o relatório tiver 30-50+ ameaças
    let results;
    try {
      results = await searchFactory.search('STRIDE CAPEC mapping categoria', 150);
    } catch (error) {
      console.warn('⚠️ Busca semântica falhou, tentando busca textual direta:', error);
      
      // Fallback: busca textual direta no Neo4j
      const session = Neo4jClient.getSession();
      try {
        const neo4jResult = await session.run(`
          MATCH (d:Document)-[:CONTAINS]->(c:Chunk)
          WHERE toLower(c.content) CONTAINS toLower($query)
          RETURN c AS chunk, d AS document, 1.0 AS score
          ORDER BY c.index
          LIMIT $limit
        `, {
          query: 'STRIDE CAPEC',
          limit: neo4j.int(50)
        });

        results = neo4jResult.records.map(record => ({
          documento: {
            pageContent: record.get('chunk').properties.content,
            metadata: {
              documentId: record.get('document').properties.id,
              documentName: record.get('document').properties.name,
              chunkIndex: record.get('chunk').properties.index,
              uploadedAt: record.get('document').properties.uploadedAt
            }
          },
          score: record.get('score')
        }));
        
        console.log(`📄 Busca textual encontrou ${results.length} resultados`);
      } finally {
        await session.close();
      }
    }

    // ===== LOGS DETALHADOS STRIDE-CAPEC =====
    console.log('\n📚 ===== BUSCA DE MAPEAMENTO STRIDE-CAPEC =====');
    console.log(`📈 Total de chunks encontrados: ${results.length}`);
    
    // Agrupar por documento
    const docsMap = new Map<string, any>();
    results.forEach((result) => {
      const docId = result.documento.metadata.documentId || 'unknown';
      const docName = result.documento.metadata.documentName || 'Documento desconhecido';
      
      if (!docsMap.has(docId)) {
        docsMap.set(docId, {
          documentName: docName,
          documentId: docId,
          chunks: []
        });
      }
      
      docsMap.get(docId)!.chunks.push({
        chunkIndex: result.documento.metadata.chunkIndex || 0,
        score: result.score,
        contentPreview: result.documento.pageContent.substring(0, 80).replace(/\n/g, ' ')
      });
    });
    
    console.log(`📚 Total de documentos CAPEC utilizados: ${docsMap.size}`);
    console.log('\n📄 Documentos STRIDE-CAPEC consultados:');
    
    let counter = 1;
    docsMap.forEach((doc) => {
      console.log(`\n  ${counter}. 📄 "${doc.documentName}"`);
      console.log(`     🆔 ID: ${doc.documentId}`);
      console.log(`     📦 Chunks: ${doc.chunks.length}`);
      doc.chunks.slice(0, 3).forEach((chunk: any, idx: number) => {
        console.log(`       ${idx + 1}. Chunk #${chunk.chunkIndex} - Score: ${chunk.score.toFixed(4)}`);
        console.log(`          "${chunk.contentPreview}..."`);
      });
      if (doc.chunks.length > 3) {
        console.log(`       ... e mais ${doc.chunks.length - 3} chunks`);
      }
      counter++;
    });
    console.log('===============================================\n');

    if (!results || results.length === 0) {
      console.warn('⚠️ Nenhum documento de mapeamento encontrado no RAG');
      return res.status(404).json({
        error: 'Mapeamento STRIDE-CAPEC não encontrado',
        message: 'Faça upload de um documento JSON contendo o mapeamento STRIDE-CAPEC no painel RAG',
        mapping: [],
        initialized: true
      });
    }

    // Extrair CAPECs diretamente via busca semântica por categoria
    const strideCategories = ['Spoofing', 'Tampering', 'Repudiation', 'Information Disclosure', 'Denial of Service', 'Elevation of Privilege'];
    const mappingData: any[] = [];

    for (const category of strideCategories) {
      try {
        // Busca semântica específica para a categoria
        // 🔥 IMPORTANTE: Limite aumentado para 150 chunks para garantir diversidade de CAPECs
        // Isso garante que relatórios com 30-50+ ameaças tenham CAPECs únicos
        const categoryResults = await searchFactory.search(
          `STRIDE ${category} CAPEC attack pattern vulnerability threat`,
          150
        );

        const capecs: any[] = [];
        const capecSet = new Set<string>();

        // Extrair CAPECs únicos dos chunks
        for (const result of categoryResults) {
          const content = result.documento?.pageContent || '';
          const capecRegex = /CAPEC[- ](\d+)[:\-–\s]+([^\n\r]+)/gi;
          let match;

          while ((match = capecRegex.exec(content)) !== null) {
            const id = `CAPEC-${match[1]}`;
            if (!capecSet.has(id)) {
              capecSet.add(id);
              const name = match[2].trim()
                .replace(/^[:\-–\s]+/, '')
                .replace(/\]\(https?:\/\/[^)]+\)/g, '')
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                .replace(/https?:\/\/[^\s]+/g, '')
                .substring(0, 200)
                .trim();
              
              if (name) {
                capecs.push({ id, name });
              }
            }
          }
        }

        if (capecs.length > 0) {
          mappingData.push({
            stride: category,
            capecs: capecs
          });
          console.log(`✅ ${category}: ${capecs.length} CAPECs extraídos`);
        } else {
          console.warn(`⚠️ ${category}: nenhum CAPEC encontrado`);
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao buscar ${category}:`, error);
      }
    }

    if (mappingData.length === 0) {
      console.warn('⚠️ Nenhum mapeamento STRIDE-CAPEC encontrado via busca semântica');
      return res.status(404).json({
        error: 'Mapeamento STRIDE-CAPEC não encontrado',
        message: 'Nenhum documento com CAPECs foi encontrado. Faça upload de um documento de mapeamento STRIDE-CAPEC.',
        mapping: [],
        initialized: true
      });
    }

    console.log(`✅ Mapeamento STRIDE-CAPEC encontrado: ${mappingData.length} categorias`);

    res.json({
      mapping: mappingData,
      sources: results.length,
      timestamp: new Date().toISOString(),
      initialized: true
    });

  } catch (error) {
    console.error('❌ Erro ao buscar mapeamento STRIDE-CAPEC:', error);
    res.status(500).json({
      error: 'Falha ao buscar mapeamento',
      message: error instanceof Error ? error.message : 'Unknown error',
      mapping: [],
      initialized: searchFactory !== null
    });
  }
});

// Deletar documento específico para reimportação
app.delete('/api/documents/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const session = Neo4jClient.getSession();
    
    try {
      // Deletar documento e seus chunks
      const result = await session.run(`
        MATCH (d:Document {id: $documentId})
        OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
        DETACH DELETE d, c
        RETURN count(*) as deleted
      `, { documentId });

      console.log(`🗑️ Documento ${documentId} deletado do Neo4j`);
      
      res.json({ 
        success: true, 
        documentId,
        message: 'Documento deletado com sucesso. Faça upload novamente para reimportar.'
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('❌ Erro ao deletar documento:', error);
    res.status(500).json({ error: 'Erro ao deletar documento' });
  }
});

// Diagnóstico: verificar origem dos CAPECs (se são reais ou mocks)
app.get('/api/debug/capec-validation', async (req, res) => {
  try {
    if (!searchFactory) {
      return res.status(503).json({ error: 'RAG não inicializado' });
    }

    // Buscar alguns CAPECs específicos que apareceram no resultado
    const testCapecs = ['CAPEC-123', 'CAPEC-115', 'CAPEC-98', 'CAPEC-268', 'CAPEC-151'];
    const validation: any = {};

    for (const capecId of testCapecs) {
      // Buscar no Neo4j se esse CAPEC realmente existe
      const results = await searchFactory.search(`${capecId}`, 10);
      
      const found = results.some(r => 
        r.documento?.pageContent?.includes(capecId)
      );

      validation[capecId] = {
        foundInNeo4j: found,
        chunksFound: results.length,
        sampleContent: found ? results[0].documento.pageContent.substring(0, 200) : null
      };
    }

    res.json({
      validation,
      conclusion: Object.values(validation).every((v: any) => v.foundInNeo4j) 
        ? '✅ Todos os CAPECs testados existem na base Neo4j - NÃO SÃO MOCKS'
        : '⚠️ Alguns CAPECs NÃO foram encontrados - podem ser mocks/inventados'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao validar CAPECs' });
  }
});

// Diagnóstico: listar documentos e chunks
app.get('/api/debug/documents', async (req, res) => {
  try {
    const session = Neo4jClient.getSession();
    try {
      const result = await session.run(`
        MATCH (d:Document)
        OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
        RETURN d.id as id, d.name as name, count(c) as chunks
        ORDER BY d.name
      `);

      const documents = result.records.map(record => ({
        id: record.get('id'),
        name: record.get('name'),
        chunks: record.get('chunks').toNumber()
      }));

      res.json({ documents, total: documents.reduce((sum, d) => sum + d.chunks, 0) });
    } finally {
      await session.close();
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar documentos' });
  }
});

// Contar CAPECs por categoria STRIDE usando busca semântica RAG
app.get('/api/stride-capec-counts', async (req, res) => {
  try {
    if (!searchFactory) {
      return res.status(503).json({
        error: 'Sistema RAG não inicializado',
        counts: {},
        initialized: false
      });
    }

    console.log('🔍 Buscando CAPECs por categoria STRIDE via busca semântica...');

    const strideCategories = [
      'Spoofing',
      'Tampering',
      'Repudiation',
      'Information Disclosure',
      'Denial of Service',
      'Elevation of Privilege'
    ];

    const counts: Record<string, Set<string>> = {};
    const allChunksFound: string[] = [];

    // Busca semântica para cada categoria STRIDE
    for (const category of strideCategories) {
      try {
        // Busca semântica focada na categoria
        // 🔥 IMPORTANTE: Limite aumentado para 150 chunks para garantir diversidade de CAPECs
        // Isso garante que relatórios com 30-50+ ameaças tenham CAPECs únicos disponíveis
        const results = await searchFactory.search(
          `STRIDE ${category} CAPEC attack pattern security threat vulnerability`,
          150  // Top 150 chunks mais relevantes (antes: 50)
        );

        console.log(`🔍 ${category}: ${results.length} chunks encontrados`);

        // Extrair CAPECs de todos os chunks encontrados
        const capecIds = new Set<string>();
        
        for (const result of results) {
          const content = result.documento?.pageContent || '';
          allChunksFound.push(content);
          
          // Extrair todos os CAPECs do chunk (formato: CAPEC-123 ou CAPEC 123)
          const capecRegex = /CAPEC[- ](\d+)/gi;
          let match;
          
          while ((match = capecRegex.exec(content)) !== null) {
            capecIds.add(`CAPEC-${match[1]}`);
          }
        }

        counts[category] = capecIds;
        console.log(`✅ ${category}: ${capecIds.size} CAPECs únicos`);

      } catch (error) {
        console.warn(`⚠️ Erro ao buscar ${category}:`, error);
        counts[category] = new Set();
      }
    }

    // Converter Sets para counts
    const finalCounts: Record<string, number> = {};
    for (const [category, capecSet] of Object.entries(counts)) {
      finalCounts[category] = capecSet.size;
    }

    // Deduplica chunks
    const uniqueChunks = new Set(allChunksFound);
    const totalContent = Array.from(uniqueChunks).join('\n\n');

    res.json({
      counts: finalCounts,
      categories: Object.keys(finalCounts),
      totalCategories: Object.keys(finalCounts).length,
      totalChunksAnalyzed: uniqueChunks.size,
      contentSize: totalContent.length,
      timestamp: new Date().toISOString(),
      initialized: true
    });

  } catch (error) {
    console.error('❌ Erro ao contar CAPECs por STRIDE:', error);
    res.status(500).json({ error: 'Falha ao contar CAPECs por STRIDE' });
  }
});

// Função auxiliar para extrair mapeamento STRIDE-CAPEC dos resultados
function extractStrideCapecMapping(results: any[]): any[] {
  try {
    // Concatenar todo o conteúdo relevante
    const fullContent = results
      .map(r => r.documento?.pageContent || '')
      .join('\n\n');

    console.log(`📄 Processando conteúdo de ${results.length} documentos (${fullContent.length} caracteres)`);

    // Estratégia 1: Tentar extrair JSON diretamente
    const jsonMatch = fullContent.match(/\[[\s\S]*?\{[\s\S]*?"stride"[\s\S]*?"capecs"[\s\S]*?\}[\s\S]*?\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].stride && parsed[0].capecs) {
          console.log(`✅ Mapeamento JSON extraído: ${parsed.length} categorias`);
          return parsed;
        }
      } catch (e) {
        console.warn('⚠️ JSON encontrado mas inválido, tentando parsing alternativo');
      }
    }

    // Estratégia 2: Extrair de texto estruturado (Markdown, PDF, etc.)
    const mapping = parseStructuredTextToMapping(fullContent);
    if (mapping.length > 0) {
      console.log(`✅ Mapeamento extraído de texto estruturado: ${mapping.length} categorias`);
      return mapping;
    }

    console.warn('⚠️ Nenhum mapeamento válido encontrado no conteúdo');
    return [];
  } catch (error) {
    console.warn('⚠️ Erro ao extrair mapeamento:', error);
    return [];
  }
}

// Função para extrair mapeamento de texto estruturado (MD, PDF, DOCX, etc.)
function parseStructuredTextToMapping(content: string): any[] {
  try {
    const mapping: any[] = [];
    const strideCategories = [
      'Spoofing',
      'Tampering',
      'Repudiation',
      'Information Disclosure',
      'Denial of Service',
      'Elevation of Privilege'
    ];

    for (const strideCategory of strideCategories) {
      // Procurar seções que mencionam a categoria STRIDE
      // Regex melhorada: captura tudo até a PRÓXIMA categoria de nível 2 (## X.)
      // Ignora sub-títulos (###, ####) dentro da seção
      const categoryRegex = new RegExp(
        `##\\s*\\d+\\.\\s*${strideCategory}[^\\n]*\\n([\\s\\S]*?)(?=##\\s*\\d+\\.\\s*(?:Spoofing|Tampering|Repudiation|Information Disclosure|Denial of Service|Elevation of Privilege)|---\\s*$|$)`,
        'i'
      );
      
      const categoryMatch = content.match(categoryRegex);
      if (!categoryMatch) {
        console.log(`⚠️ Categoria "${strideCategory}" não encontrada no conteúdo`);
        continue;
      }

      const categoryContent = categoryMatch[1];
      console.log(`📋 Processando "${strideCategory}" (${categoryContent.length} caracteres)...`);
      
      const capecs: any[] = [];

      // Extrair CAPECs da seção (formato: CAPEC-XXX: Nome ou CAPEC-XXX - Nome)
      const capecRegex = /CAPEC[- ](\d+)[:\-–\s]+([^\n\r]+)/gi;
      let capecMatch;

      while ((capecMatch = capecRegex.exec(categoryContent)) !== null) {
        const id = `CAPEC-${capecMatch[1]}`;
        const name = capecMatch[2].trim()
          .replace(/^[:\-–\s]+/, '')  // Remove separadores do início
          .replace(/[,;\.]+$/, '')     // Remove pontuação do final
          .replace(/\]\(https?:\/\/[^)]+\)/g, '') // Remove URLs entre ]()
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links, mantém texto
          .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs soltas
          .replace(/[\[\]()]/g, '') // Remove colchetes e parênteses restantes
          .trim();

        if (name && name.length > 0 && name.length < 200) {
          capecs.push({ id, name });
        }
      }

      console.log(`   ✅ Encontrados ${capecs.length} CAPECs em "${strideCategory}"`);

      if (capecs.length > 0) {
        mapping.push({
          stride: strideCategory,
          capecs: capecs
        });
      }
    }

    return mapping;
  } catch (error) {
    console.warn('⚠️ Erro ao parsear texto estruturado:', error);
    return [];
  }
}

// Estatísticas do sistema
app.get('/api/statistics', requireInitialized, async (req, res) => {
  try {
    const stats = await searchFactory!.getStatistics();
    const cacheValid = await searchFactory!.verifyCache();

    res.json({
      ...stats,
      cacheValid,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({
      error: 'Falha ao obter estatísticas',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mapeamento STRIDE-CAPEC
app.get('/api/stride-capec-mapping', requireInitialized, async (req, res) => {
  try {
    console.log('📋 Buscando mapeamento STRIDE-CAPEC no RAG...');
    
    // Buscar documentos relacionados a STRIDE-CAPEC
    const results = await searchFactory!.search('STRIDE CAPEC mapping categoria', 50);
    
    console.log(`📈 Total de chunks encontrados: ${results.length}`);
    
    // Filtrar apenas documentos CAPEC
    const capecDocs = results.filter((result: any) => 
      result.document && (
        result.document.toLowerCase().includes('capec') ||
        result.document.toLowerCase().includes('stride') ||
        result.document.toLowerCase().includes('mapping')
      )
    );
    
    console.log(`📚 Total de documentos CAPEC utilizados: ${capecDocs.length}`);
    
    const documents = [...new Set(capecDocs.map((r: any) => r.document))];
    console.log(`📄 Documentos STRIDE-CAPEC consultados: ${documents.join(', ')}`);
    
    res.json({
      success: true,
      totalChunks: results.length,
      capecDocuments: capecDocs.length,
      documents: documents,
      results: capecDocs
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar mapeamento STRIDE-CAPEC:', error);
    res.status(500).json({
      error: 'Falha ao buscar mapeamento STRIDE-CAPEC',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Limpar cache
app.delete('/api/cache', requireInitialized, async (req, res) => {
  try {
    console.log('🗑️ Limpando cache...');
    await searchFactory!.clearCache();

    res.json({
      message: 'Cache limpo com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    res.status(500).json({
      error: 'Falha ao limpar cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Geração de conteúdo com modelo selecionado
// Função para detectar o melhor provider automaticamente
async function detectBestProvider(): Promise<string> {
  const isOllamaAvailable = await ollamaProvider.isAvailable();
  const isGeminiAvailable = await geminiProvider.isAvailable();
  const isOpenRouterAvailable = await openrouterProvider.isAvailable();
  
  console.log(`🔍 Detecção de providers: Ollama=${isOllamaAvailable}, Gemini=${isGeminiAvailable}, OpenRouter=${isOpenRouterAvailable}`);
  
  // Prioridade: Ollama (local) > Gemini > OpenRouter (nuvem)
  if (isOllamaAvailable) {
    console.log(`✅ Usando Ollama (local) como provider preferido`);
    return 'ollama';
  } else if (isGeminiAvailable) {
    console.log(`✅ Usando Gemini (Google) como provider preferido`);
    return 'gemini';
  } else if (isOpenRouterAvailable) {
    console.log(`✅ Usando OpenRouter (nuvem) como provider preferido`);
    return 'openrouter';
  } else {
    throw new Error('Nenhum provider de IA disponível');
  }
}

app.post('/api/generate-content', requireInitialized, async (req, res) => {
  try {
    const { prompt, modelConfig, format } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório' });
    }
    
    console.log(`🤖 Gerando conteúdo com modelo: ${modelConfig?.model || 'padrão'} (${modelConfig?.provider || 'auto'})`);
    console.log(`🔍 Backend recebeu modelConfig:`, JSON.stringify(modelConfig, null, 2));
    
    let content: string = '';
    let model: string = '';

    // Determinar qual provider usar
    let provider = modelConfig?.provider || 'auto';
    console.log(`🔧 Provider do frontend: ${provider}`);
    
    // Detectar automaticamente o melhor provider se 'auto'
    if (provider === 'auto') {
      console.log(`🔄 Provider é 'auto', detectando automaticamente...`);
      provider = await detectBestProvider();
      console.log(`🔄 Provider detectado automaticamente: ${provider}`);
    } else {
      console.log(`✅ Usando provider do frontend: ${provider}`);
    }
    
    console.log(`🔧 Provider selecionado: ${provider}`);
    
    if (provider === 'ollama') {
      const isOllamaAvailable = await ollamaProvider.isAvailable();
      if (!isOllamaAvailable) {
        console.warn('⚠️ Ollama não disponível, tentando fallback para OpenRouter...');
        
        // Fallback para OpenRouter
        const isOpenRouterAvailable = await openrouterProvider.isAvailable();
        if (isOpenRouterAvailable) {
          const openrouterModel = process.env.MODEL_OPENROUTER;
          if (openrouterModel) {
            console.log(`🔄 Fallback: Usando OpenRouter ${openrouterModel} em vez de Ollama`);
            content = await openrouterProvider.generateContent(prompt, openrouterModel, format);
            model = openrouterModel;
          } else {
            return res.status(500).json({
              error: 'Ollama não disponível e OpenRouter não configurado',
              message: 'Configure Ollama ou OpenRouter'
            });
          }
        } else {
          return res.status(500).json({
            error: 'Nenhum provedor de IA disponível',
            message: 'Ollama e OpenRouter não estão disponíveis'
          });
        }
      } else {
        const ollamaModel = modelConfig?.model || process.env.MODEL_OLLAMA || 'llama3.1:latest';
        console.log(`🔧 Usando modelo Ollama: ${ollamaModel}`);
        console.log(`🔧 Prompt: ${prompt.substring(0, 100)}...`);
        
        try {
          console.log(`🔧 Tentando gerar conteúdo com Ollama...`);
          console.log(`🔧 Tamanho do prompt: ${prompt.length} caracteres`);
          
          // Verificar disponibilidade do Ollama antes de tentar
          const isOllamaAvailable = await ollamaProvider.isAvailable();
          if (!isOllamaAvailable) {
            console.warn('⚠️ Ollama não está disponível, usando OpenRouter diretamente...');
            throw new Error('Ollama não disponível');
          }
          
          content = await ollamaProvider.generateContent(prompt, ollamaModel, format);
          console.log(`✅ Ollama: Resposta gerada com sucesso`);
          console.log(`🔧 Content length: ${content.length}`);
          console.log(`🔧 Content type: ${typeof content}`);
          model = ollamaModel;
        } catch (error) {
          console.error(`❌ Erro no OllamaProvider:`, error);
          console.warn('⚠️ Ollama falhou, tentando fallback para OpenRouter...');
          
          // Fallback inteligente para OpenRouter
          const isOpenRouterAvailable = await openrouterProvider.isAvailable();
          if (isOpenRouterAvailable) {
            const openrouterModel = process.env.MODEL_OPENROUTER;
            if (openrouterModel) {
              console.log(`🔄 Fallback: Usando OpenRouter ${openrouterModel} em vez de Ollama`);
              try {
                content = await openrouterProvider.generateContent(prompt, openrouterModel, format);
                console.log(`✅ OpenRouter: Resposta gerada com sucesso via fallback`);
                model = openrouterModel;
              } catch (fallbackError) {
                console.error(`❌ Erro no fallback OpenRouter:`, fallbackError);
                const errorMsg = error instanceof Error ? error.message : String(error);
                const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                throw new Error(`Ambos Ollama e OpenRouter falharam: Ollama(${errorMsg}), OpenRouter(${fallbackErrorMsg})`);
              }
            } else {
              const errorMsg = error instanceof Error ? error.message : String(error);
              throw new Error(`OpenRouter não configurado. Erro original: ${errorMsg}`);
            }
          } else {
            const errorMsg = error instanceof Error ? error.message : String(error);
            throw new Error(`OpenRouter não disponível. Erro original: ${errorMsg}`);
          }
        }
      }
      
    } else if (provider === 'gemini') {
      const isGeminiAvailable = await geminiProvider.isAvailable();
      if (!isGeminiAvailable) {
        return res.status(500).json({
          error: 'Gemini não disponível',
          message: 'API key do Gemini não está configurada'
        });
      }
      
      const geminiModel = modelConfig?.model || process.env.MODEL_GEMINI || 'gemini-1.5-flash';
      console.log(`🔧 Usando modelo Gemini: ${geminiModel}`);
      console.log(`🔧 Format fornecido:`, format);
      content = await geminiProvider.generateContent(prompt, geminiModel, format);
      console.log(`🔧 Resposta do Gemini: ${content.substring(0, 100)}...`);
      console.log(`🔧 Content length: ${content.length}`);
      console.log(`🔧 Content type: ${typeof content}`);
      model = geminiModel;
      
    } else if (provider === 'openrouter') {
      const isOpenRouterAvailable = await openrouterProvider.isAvailable();
      if (!isOpenRouterAvailable) {
        return res.status(500).json({
          error: 'OpenRouter não disponível',
          message: 'API key do OpenRouter não está configurada'
        });
      }
      
      const openrouterModel = modelConfig?.model || process.env.MODEL_OPENROUTER;
      if (!openrouterModel) {
        return res.status(400).json({
          error: 'Modelo OpenRouter não especificado',
          message: 'Configure MODEL_OPENROUTER ou forneça modelConfig.model'
        });
      }
      
      console.log(`🔧 Usando modelo OpenRouter: ${openrouterModel}`);
      console.log(`🔧 Format fornecido:`, format);
      content = await openrouterProvider.generateContent(prompt, openrouterModel, format);
      console.log(`🔧 Resposta do OpenRouter: ${content.substring(0, 100)}...`);
      console.log(`🔧 Content length: ${content.length}`);
      console.log(`🔧 Content type: ${typeof content}`);
      model = openrouterModel;
      
    } else {
      return res.status(400).json({
        error: 'Provider não suportado',
        message: 'Apenas "ollama", "gemini" e "openrouter" são suportados'
      });
    }

    // Sanitização opcional para respostas de ameaças: remover emojis e normalizar setas
    const sanitizeArrowsAndEmojis = (text: string): string => {
      try {
        // Substituir vários símbolos/setas por uma seta padrão
        const arrowPattern = /[\u2190-\u21FF\u2794\u27A1\u27F5-\u27FF\u2900-\u297F\u2B05-\u2B07]/gu;
        let sanitized = text.replace(arrowPattern, '→');
        // Remover variação emoji (FE0F)
        sanitized = sanitized.replace(/\uFE0F/gu, '');
        // Remover emojis comuns (faixas Unicode)
        const emojiPattern = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
        sanitized = sanitized.replace(emojiPattern, '');
        // Normalizar espaços
        sanitized = sanitized.replace(/\s{2,}/g, ' ').trim();
        return sanitized;
      } catch {
        return text;
      }
    };

    const sanitizeThreatsJsonString = (raw: string): string => {
      try {
        // Remover cercas de código caso venham em bloco ```json ... ```
        let cleaned = raw.trim().replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/,'');
        const data = JSON.parse(cleaned);
        if (data && Array.isArray(data.threats)) {
          for (const t of data.threats) {
            if (typeof t.elementName === 'string') {
              t.elementName = sanitizeArrowsAndEmojis(t.elementName);
            }
            if (typeof t.threatScenario === 'string') {
              t.threatScenario = sanitizeArrowsAndEmojis(t.threatScenario);
            }
            if (typeof t.capecName === 'string') {
              t.capecName = sanitizeArrowsAndEmojis(t.capecName);
            }
            if (typeof t.capecDescription === 'string') {
              t.capecDescription = sanitizeArrowsAndEmojis(t.capecDescription);
            }
            if (typeof t.mitigationRecommendations === 'string') {
              t.mitigationRecommendations = sanitizeArrowsAndEmojis(t.mitigationRecommendations);
            }
          }
          return JSON.stringify(data);
        }
        return raw; // não é o formato esperado
      } catch {
        return raw; // se falhar parsing, retorna original
      }
    };

    // Se o schema indica que é análise de ameaças, sanitizar os campos de texto
    if (format && (format.properties?.threats || (typeof format === 'object' && 'threats' in (format.properties || {})))) {
      content = sanitizeThreatsJsonString(content);
    }

    console.log(`🔧 Content final: "${content}"`);
    console.log(`🔧 Content length: ${content.length}`);
    console.log(`🔧 Content type: ${typeof content}`);
    
    res.json({
      content: content,
      model: model,
      provider: provider,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao gerar conteúdo:', error);
    res.status(500).json({
      error: 'Falha ao gerar conteúdo',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Extensões suportadas
app.get('/api/supported-extensions', (req, res) => {
  res.json({
    extensions: DocumentLoaderFactory.getExtensionsSupported(),
    maxFileSize: process.env.MAX_FILE_SIZE || '10485760'
  });
});

// Middleware de tratamento de erros
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro não tratado:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'Arquivo muito grande',
        message: `Tamanho máximo permitido: ${process.env.MAX_FILE_SIZE || '10MB'}`
      });
    }
  }
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: error.message || 'Unknown error'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  
  if (searchFactory) {
    await searchFactory.close();
  }
  
  await Neo4jClient.close();
  process.exit(0);
});

// Função para inicialização automática do RAG
async function autoInitializeRAG() {
  try {
    console.log('\n🔄 Iniciando sistema RAG automaticamente...');
    ragInitializationInProgress = true;
    
    // 1. Inicializar o RAG
    if (!searchFactory) {
      await ModelFactory.initialize();
      
      const neo4jConnected = await Neo4jClient.testConnection();
      if (!neo4jConnected) {
        throw new Error('Não foi possível conectar ao Neo4j');
      }
      
      searchFactory = SemanticSearchFactory.createSearch();
      await searchFactory.initialize();
      console.log('✅ RAG inicializado com sucesso');
    }
    
    // 2. Fazer upload dos arquivos de knowledge base
    const fs = require('fs');
    const path = require('path');
    
    // Caminho para a pasta knowledge-base (relativo ao backend)
    const knowledgeBasePath = path.join(__dirname, '../../src/knowledge-base');
    
    if (fs.existsSync(knowledgeBasePath)) {
      console.log('📚 Carregando arquivos de conhecimento...');
      
      const files = fs.readdirSync(knowledgeBasePath)
        .filter((file: string) => file.endsWith('.md'))
        .sort((a: string, b: string) => {
          // Priorizar capec-stride-mapping-completo.md
          if (a.includes('capec-stride-mapping')) return -1;
          if (b.includes('capec-stride-mapping')) return 1;
          return a.localeCompare(b);
        });
      
      let successCount = 0;
      
      for (const file of files) {
        try {
          const filePath = path.join(knowledgeBasePath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          console.log(`  📄 Processando: ${file}...`);
          
          // Processar documento usando DocumentLoaderFactory
          await searchFactory!.processDocument({
            name: file,
            content,
            metadata: {
              uploadedAt: new Date().toISOString(),
              source: 'auto-initialization'
            }
          });
          
          console.log(`  ✅ ${file} carregado com sucesso`);
          successCount++;
        } catch (fileError) {
          console.error(`  ❌ Erro ao processar ${file}:`, fileError);
        }
      }
      
      console.log(`\n✅ ${successCount}/${files.length} arquivos de conhecimento carregados com sucesso!\n`);
    } else {
      console.warn(`⚠️ Pasta knowledge-base não encontrada: ${knowledgeBasePath}`);
      console.warn(`   Caminho esperado: ${knowledgeBasePath}`);
    }
    
    // Marcar como inicializado
    ragAutoInitialized = true;
    ragInitializationInProgress = false;
    console.log('✅ Sistema RAG completamente inicializado e pronto para uso!\n');
    
  } catch (error) {
    console.error('❌ Erro na inicialização automática do RAG:', error);
    console.log('💡 O sistema continuará rodando, mas você precisará inicializar manualmente no painel lateral.');
    ragInitializationInProgress = false;
    ragAutoInitialized = false;
  }
}

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor RAG rodando na porta ${PORT}`);
  console.log(`📡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 Neo4j URI: ${process.env.NEO4J_URI || 'bolt://localhost:7687'}`);
  console.log('\n📋 Endpoints disponíveis:');
  console.log('  POST /api/initialize - Inicializar sistema RAG');
  console.log('  GET  /api/health - Status do sistema');
  console.log('  POST /api/documents/upload - Upload de arquivo');
  console.log('  POST /api/documents/text - Upload de texto');
  console.log('  POST /api/search - Busca RAG');
  console.log('  POST /api/search/context - Contexto RAG');
  console.log('  GET  /api/statistics - Estatísticas');
  console.log('  DELETE /api/cache - Limpar cache');
  
  // Inicializar RAG automaticamente
  await autoInitializeRAG();
});

export default app;
