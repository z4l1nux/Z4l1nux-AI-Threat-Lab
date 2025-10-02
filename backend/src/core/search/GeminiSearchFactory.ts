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

  async buscarContextoRAG(query: string, limit: number = 5, systemContext?: string): Promise<{
    context: string;
    sources: SearchResult[];
    totalDocuments: number;
    confidence: number;
  }> {
    // Buscar mais resultados para filtrar depois se há contexto de sistema
    const searchLimit = systemContext ? limit * 3 : limit;
    let results = await this.buscar(query, searchLimit);
    
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

    const stats = await this.obterEstatisticas();
    
    // ===== LOGS DETALHADOS PARA MODELAGEM DE AMEAÇAS =====
    console.log('\n📊 ===== RELATÓRIO DE UTILIZAÇÃO RAG =====');
    console.log(`📈 Total de resultados encontrados: ${results.length} chunks`);
    if (systemContext) {
      console.log(`🎯 Contexto de sistema aplicado: "${systemContext}"`);
    }
    
    // Agrupar por documento
    const documentosUtilizados = new Map<string, {
      documentName: string;
      documentId: string;
      chunks: Array<{
        chunkIndex: number;
        score: number;
        contentPreview: string;
      }>;
    }>();
    
    results.forEach((result) => {
      const docId = result.documento.metadata.documentId || 'unknown';
      const docName = result.documento.metadata.documentName || 'Documento desconhecido';
      
      if (!documentosUtilizados.has(docId)) {
        documentosUtilizados.set(docId, {
          documentName: docName,
          documentId: docId,
          chunks: []
        });
      }
      
      documentosUtilizados.get(docId)!.chunks.push({
        chunkIndex: result.documento.metadata.chunkIndex || 0,
        score: result.score,
        contentPreview: result.documento.pageContent.substring(0, 100).replace(/\n/g, ' ')
      });
    });
    
    console.log(`📚 Total de documentos únicos utilizados: ${documentosUtilizados.size}`);
    console.log('\n📄 Documentos e chunks utilizados na modelagem:');
    
    let chunkCounter = 1;
    documentosUtilizados.forEach((doc, docId) => {
      console.log(`\n  ${chunkCounter}. 📄 Documento: "${doc.documentName}"`);
      console.log(`     🆔 ID: ${doc.documentId}`);
      console.log(`     📦 Chunks utilizados: ${doc.chunks.length}`);
      
      doc.chunks.forEach((chunk, idx) => {
        console.log(`       ${idx + 1}. Chunk #${chunk.chunkIndex} - Score: ${chunk.score.toFixed(4)}`);
        console.log(`          Preview: "${chunk.contentPreview}..."`);
      });
      
      chunkCounter++;
    });
    
    console.log(`\n🎯 Confiança média dos resultados: ${confidence.toFixed(2)}%`);
    console.log(`📊 Total de documentos no sistema: ${stats.totalDocumentos}`);
    console.log(`📦 Total de chunks no sistema: ${stats.totalChunks}`);
    console.log('========================================\n');
    
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
