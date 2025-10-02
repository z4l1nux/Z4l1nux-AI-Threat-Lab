import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as dotenv from 'dotenv';
import { GeminiSearchFactory } from './core/search/GeminiSearchFactory';
import { Neo4jClient } from './core/graph/Neo4jClient';
import { DocumentLoaderFactory } from './utils/documentLoaders';
import { SearchResult, RAGContext } from './types/index';

// Carregar variáveis de ambiente
dotenv.config({ path: '../.env.local' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Configurar CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
let searchFactory: GeminiSearchFactory | null = null;

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
    const ragInitialized = searchFactory !== null;
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        neo4j: neo4jConnected ? 'connected' : 'disconnected',
        rag: ragInitialized ? 'initialized' : 'not_initialized'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Inicializar sistema RAG
app.post('/api/initialize', async (req, res) => {
  try {
    console.log('🚀 Inicializando sistema RAG...');
    
    // Testar conexão Neo4j primeiro
    const neo4jConnected = await Neo4jClient.testConnection();
    console.log(`🔍 Resultado do teste Neo4j: ${neo4jConnected} (tipo: ${typeof neo4jConnected})`);
    
    if (!neo4jConnected) {
      throw new Error('Não foi possível conectar ao Neo4j');
    }
    
    // Inicializar sistema de busca
    searchFactory = GeminiSearchFactory.criarBusca();
    await searchFactory.initialize();
    
    // Obter estatísticas
    const stats = await searchFactory.obterEstatisticas();
    
    res.json({
      message: 'Sistema RAG inicializado com sucesso',
      timestamp: new Date().toISOString(),
      statistics: stats
    });
    
  } catch (error) {
    console.error('❌ Erro ao inicializar sistema RAG:', error);
    searchFactory = null;
    
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
    await searchFactory!.processarDocumento({
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
    const stats = await searchFactory!.obterEstatisticas();

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
    const { name, content } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({
        error: 'Nome e conteúdo são obrigatórios'
      });
    }

    console.log(`📝 Processando texto: ${name}`);

    // Processar documento no sistema RAG
    await searchFactory!.processarDocumento({
      name,
      content,
      metadata: {
        originalName: name,
        mimeType: 'text/plain',
        size: content.length,
        uploadedAt: new Date().toISOString(),
        source: 'text_input'
      }
    });

    // Obter estatísticas atualizadas
    const stats = await searchFactory!.obterEstatisticas();

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

    const results = await searchFactory!.buscar(query, limit);

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
    const { query, limit = 5, systemContext } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Query é obrigatória'
      });
    }

    console.log(`🎯 Buscando contexto RAG para threat modeling: "${query.substring(0, 50)}..."`);
    if (systemContext) {
      console.log(`🔍 Filtro de contexto aplicado: Sistema "${systemContext}"`);
    }

    const contextData = await searchFactory!.buscarContextoRAG(query, limit, systemContext);

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
    const results = await searchFactory.buscar('STRIDE CAPEC mapping categoria', 50);

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

    // Extrair e estruturar o mapeamento dos resultados
    const mappingData = extractStrideCapecMapping(results);

    if (mappingData.length === 0) {
      console.warn('⚠️ Mapeamento extraído está vazio');
      return res.status(404).json({
        error: 'Mapeamento STRIDE-CAPEC vazio',
        message: 'O documento carregado não contém um mapeamento válido. Verifique o formato JSON.',
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
      const categoryRegex = new RegExp(
        `(?:##?\\s*)?${strideCategory}[:\\s]*(?:\n|$)([\\s\\S]*?)(?=##?\\s*(?:Spoofing|Tampering|Repudiation|Information Disclosure|Denial of Service|Elevation of Privilege)|$)`,
        'i'
      );
      
      const categoryMatch = content.match(categoryRegex);
      if (!categoryMatch) continue;

      const categoryContent = categoryMatch[1];
      const capecs: any[] = [];

      // Extrair CAPECs da seção (formato: CAPEC-XXX: Nome ou CAPEC-XXX - Nome)
      const capecRegex = /CAPEC[- ](\d+)[:\-–\s]+([^\n\r]+)/gi;
      let capecMatch;

      while ((capecMatch = capecRegex.exec(categoryContent)) !== null) {
        const id = `CAPEC-${capecMatch[1]}`;
        const name = capecMatch[2].trim()
          .replace(/^[:\-–\s]+/, '')  // Remove separadores do início
          .replace(/[,;\.]+$/, '')     // Remove pontuação do final
          .trim();

        if (name && name.length > 0 && name.length < 200) {
          capecs.push({ id, name });
        }
      }

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
    const stats = await searchFactory!.obterEstatisticas();
    const cacheValid = await searchFactory!.verificarCache();

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

// Limpar cache
app.delete('/api/cache', requireInitialized, async (req, res) => {
  try {
    console.log('🗑️ Limpando cache...');
    await searchFactory!.limparCache();

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

// Iniciar servidor
app.listen(PORT, () => {
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
});

export default app;
