/**
 * Factory para busca usando apenas Neo4j
 * Substitui o sistema híbrido LanceDB + Neo4j
 */

import { Neo4jCacheManager } from '../cache/Neo4jCacheManager';
import { OllamaEmbeddings } from "@langchain/ollama";

export interface SearchResult {
  documento: {
    pageContent: string;
    metadata: any;
  };
  score: number;
}

export class Neo4jOnlySearchFactory {
  private cacheManager: Neo4jCacheManager | null = null;
  private embeddings: OllamaEmbeddings;

  constructor(embeddings: OllamaEmbeddings) {
    this.embeddings = embeddings;
  }

  /**
   * Inicializa o sistema de busca
   */
  async initialize(): Promise<void> {
    this.cacheManager = new Neo4jCacheManager(
      process.env.NEO4J_URI || "bolt://localhost:7687",
      process.env.NEO4J_USER || "neo4j",
      process.env.NEO4J_PASSWORD || "s3nh4forte",
      this.embeddings
    );

    await this.cacheManager.initialize();
    console.log("🚀 Sistema de busca Neo4j inicializado");
  }

  /**
   * Busca semântica usando apenas Neo4j
   */
  async buscar(query: string, limit: number = 8): Promise<SearchResult[]> {
    if (!this.cacheManager) {
      throw new Error("Sistema de busca não foi inicializado. Chame initialize() primeiro.");
    }

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
          processedSecurely: result.document.processedSecurely
        }
      },
      score: result.score
    }));
  }

  /**
   * Verifica se o cache existe
   */
  async verificarCache(): Promise<boolean> {
    if (!this.cacheManager) {
      return false;
    }
    return await this.cacheManager.verificarCache();
  }

  /**
   * Obtém estatísticas do sistema
   */
  async obterEstatisticas(): Promise<{ totalChunks: number; totalDocumentos: number }> {
    if (!this.cacheManager) {
      return { totalChunks: 0, totalDocumentos: 0 };
    }
    return await this.cacheManager.obterEstatisticas();
  }

  /**
   * Fecha conexões
   */
  async close(): Promise<void> {
    if (this.cacheManager) {
      await this.cacheManager.close();
    }
  }
}
