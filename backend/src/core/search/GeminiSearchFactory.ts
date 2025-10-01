import { Neo4jCacheManager } from '../cache/Neo4jCacheManager';
import { SearchResult } from '../../types/index';

export class GeminiSearchFactory {
  private cacheManager: Neo4jCacheManager | null = null;

  constructor() {
    // Constructor vazio - inicialização será feita no initialize()
  }

  static criarBusca(): GeminiSearchFactory {
    return new GeminiSearchFactory();
  }

  async initialize(): Promise<void> {
    this.cacheManager = new Neo4jCacheManager(
      process.env.NEO4J_URI || "bolt://localhost:7687",
      process.env.NEO4J_USER || "neo4j",
      process.env.NEO4J_PASSWORD || "s3nh4forte"
    );

    await this.cacheManager.initialize();
    console.log("🚀 Sistema de busca Gemini + Neo4j inicializado");
  }

  async buscar(query: string, limit: number = 8): Promise<SearchResult[]> {
    if (!this.cacheManager) {
      throw new Error("Sistema de busca não foi inicializado. Chame initialize() primeiro.");
    }

    console.log(`🔍 Buscando com Gemini: "${query.substring(0, 50)}..." (limite: ${limit})`);
    const results = await this.cacheManager.hybridSearch(query, limit);
    
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
          embeddingModel: 'gemini-text-embedding-004',
          searchScore: result.score
        }
      },
      score: result.score
    }));
  }

  async buscarContextoRAG(query: string, limit: number = 5): Promise<{
    context: string;
    sources: SearchResult[];
    totalDocuments: number;
    confidence: number;
  }> {
    const results = await this.buscar(query, limit);
    
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

    const stats = await this.obterEstatisticas();
    
    return {
      context,
      sources: results,
      totalDocuments: stats.totalDocumentos,
      confidence
    };
  }

  async verificarCache(): Promise<boolean> {
    if (!this.cacheManager) {
      return false;
    }
    return await this.cacheManager.verificarCache();
  }

  async obterEstatisticas(): Promise<{ totalChunks: number; totalDocumentos: number }> {
    if (!this.cacheManager) {
      return { totalChunks: 0, totalDocumentos: 0 };
    }
    return await this.cacheManager.obterEstatisticas();
  }

  async processarDocumento(document: {
    name: string;
    content: string;
    metadata: any;
  }): Promise<void> {
    if (!this.cacheManager) {
      throw new Error("Sistema de busca não foi inicializado.");
    }

    await this.cacheManager.processDocumentFromMemory({
      name: document.name,
      content: document.content,
      metadata: {
        ...document.metadata,
        uploadedAt: new Date().toISOString(),
        source: 'api_upload'
      }
    });
  }

  async limparCache(): Promise<void> {
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
