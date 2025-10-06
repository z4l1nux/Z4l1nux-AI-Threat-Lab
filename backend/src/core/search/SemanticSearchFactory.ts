import { Neo4jCacheManager } from '../cache/Neo4jCacheManager';
import { SearchResult } from '../../types/index';

export class SemanticSearchFactory {
  private cacheManager: Neo4jCacheManager | null = null;

  constructor() {
    // Constructor vazio - inicialização será feita no initialize()
  }

  static createSearch(): SemanticSearchFactory {
    return new SemanticSearchFactory();
  }

  async initialize(): Promise<void> {
    // Validar variáveis de ambiente obrigatórias
    if (!process.env.NEO4J_URI) {
      throw new Error("❌ NEO4J_URI não configurado nas variáveis de ambiente");
    }
    if (!process.env.NEO4J_USER) {
      throw new Error("❌ NEO4J_USER não configurado nas variáveis de ambiente");
    }
    if (!process.env.NEO4J_PASSWORD) {
      throw new Error("❌ NEO4J_PASSWORD não configurado nas variáveis de ambiente");
    }

    this.cacheManager = new Neo4jCacheManager(
      process.env.NEO4J_URI,
      process.env.NEO4J_USER,
      process.env.NEO4J_PASSWORD
    );

    await this.cacheManager.initialize();
    console.log("🚀 Sistema de busca semântica + Neo4j inicializado");
  }

  async search(query: string, limit: number = 8, modelConfig?: any): Promise<SearchResult[]> {
    if (!this.cacheManager) {
      throw new Error("Sistema de busca não foi inicializado. Chame initialize() primeiro.");
    }

    const provider = modelConfig?.provider || 'ollama';
    const embeddingModel = this.getEmbeddingModel(provider, modelConfig);
    
    console.log(`🔍 Buscando com ${provider}: "${query.substring(0, 50)}..." (limite: ${limit})`);
    const results = await this.cacheManager.hybridSearch(query, limit, modelConfig);
    
    return results.map(result => ({
      documento: {
        pageContent: result.chunk.content,
        metadata: {
          ...result.chunk.metadata,
          documentName: result.document.name,
          documentId: result.document.id,
          chunkIndex: result.chunk.index,
          uploadedAt: result.document.uploadedAt,
          processedSecurely: result.document.processedSecurely,
          embeddingModel: embeddingModel,
          searchScore: result.score,
          provider: provider
        }
      },
      score: result.score
    }));
  }

  async searchRAGContext(query: string, limit: number = 5, systemContext?: string, modelConfig?: any): Promise<{
    context: string;
    sources: SearchResult[];
    totalDocuments: number;
    confidence: number;
  }> {
    // Buscar mais resultados para filtrar depois se há contexto de sistema
    const searchLimit = systemContext ? limit * 3 : limit;
    let results = await this.search(query, searchLimit, modelConfig);
    
    // Filtrar por contexto de sistema se fornecido
    if (systemContext && systemContext.trim().length > 0) {
      const systemNameLower = systemContext.toLowerCase().trim();
      
      // Filtrar resultados que mencionam o sistema ou são documentos gerais (STRIDE-CAPEC)
      const filteredResults = results.filter(result => {
        const docName = (result.documento.metadata.documentName || '').toLowerCase();
        const content = result.documento.pageContent.toLowerCase();
        
        // Manter documentos STRIDE-CAPEC (sempre úteis)
        const isStrideCapec = docName.includes('stride') || docName.includes('capec') || 
            (content.includes('stride') && content.includes('capec'));
        
        // Manter documentos que mencionam o sistema
        const mentionsSystem = docName.includes(systemNameLower) || content.includes(systemNameLower);
        
        return isStrideCapec || mentionsSystem;
      });
      
      console.log(`🔍 Filtro de sistema "${systemContext}": ${results.length} → ${filteredResults.length} documentos relevantes`);
      
      // Usar resultados filtrados, limitando ao número solicitado
      results = filteredResults.slice(0, limit);
      
      if (filteredResults.length === 0) {
        console.warn(`⚠️ Nenhum documento encontrado para o sistema "${systemContext}". Usando resultados gerais.`);
        results = results.slice(0, limit); // Fallback para resultados gerais
      }
    }
    
    // Calcular confiança baseada nos scores
    const avgScore = results.length > 0 
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length 
      : 0;
    
    const confidence = Math.min(avgScore * 100, 100); // Converter para percentual
    
    // Construir contexto concatenado
    const context = results
      .map((result, index) => {
        const source = result.documento.metadata.documentName || 'Documento desconhecido';
        return `[Fonte ${index + 1}: ${source}]\n${result.documento.pageContent}`;
      })
      .join('\n\n---\n\n');

    const stats = await this.getStatistics();
    
    // Logs otimizados para modelagem de ameaças
    console.log(`\n📊 RAG: ${results.length} chunks encontrados (confiança: ${confidence.toFixed(1)}%)`);
    if (systemContext) {
      console.log(`🎯 Sistema: "${systemContext}"`);
    }
    
    // Agrupar por documento para estatísticas
    const docGroups = new Map<string, { name: string; chunks: number }>();
    results.forEach(result => {
      const docId = result.documento.metadata.documentId || 'unknown';
      const docName = result.documento.metadata.documentName || 'Desconhecido';
      
      if (!docGroups.has(docId)) {
        docGroups.set(docId, { name: docName, chunks: 0 });
      }
      docGroups.get(docId)!.chunks++;
    });
    
    console.log(`📚 Documentos: ${docGroups.size} únicos`);
    docGroups.forEach((doc, docId) => {
      console.log(`   - ${doc.name}: ${doc.chunks} chunks`);
    });
    
    return {
      context,
      sources: results,
      totalDocuments: stats.totalDocumentos,
      confidence
    };
  }

  private getEmbeddingModel(provider: string, modelConfig?: any): string {
    switch (provider) {
      case 'ollama':
        return modelConfig?.embedding || process.env.EMBEDDING_MODEL || 'nomic-embed-text:latest';
      case 'openrouter':
        return 'text-embedding-3-small';
      case 'gemini':
        return 'nomic-embed-text:latest';
      default:
        return 'nomic-embed-text:latest';
    }
  }

  async verifyCache(): Promise<boolean> {
    if (!this.cacheManager) {
      return false;
    }
    return await this.cacheManager.verificarCache();
  }

  async getStatistics(): Promise<{ totalChunks: number; totalDocumentos: number }> {
    if (!this.cacheManager) {
      return { totalChunks: 0, totalDocumentos: 0 };
    }
    return await this.cacheManager.obterEstatisticas();
  }

  async processDocument(document: {
    name: string;
    content: string;
    metadata: any;
  }): Promise<void> {
    if (!this.cacheManager) {
      throw new Error("Sistema de busca não foi inicializado.");
    }

    const modelConfig = document.metadata?.modelConfig;
    await this.cacheManager.processDocumentFromMemory({
      name: document.name,
      content: document.content,
      metadata: {
        ...document.metadata,
        uploadedAt: new Date().toISOString(),
        source: 'api_upload'
      }
    }, modelConfig);
  }

  async clearCache(): Promise<void> {
    if (!this.cacheManager) {
      throw new Error("Sistema de busca não foi inicializado.");
    }
    await this.cacheManager.limparCache();
  }

  async close(): Promise<void> {
    if (this.cacheManager) {
      await this.cacheManager.close();
    }
  }
}
