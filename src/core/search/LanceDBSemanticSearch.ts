import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { LanceDBCacheManager } from "../cache/LanceDBCacheManager";
import { ChunkInfo, ResultadoComScore } from "../types";

/**
 * Implementação de busca semântica usando LanceDB
 * Oferece melhor performance e escalabilidade que o sistema JSON customizado
 */
export class LanceDBSemanticSearch {
  private cacheManager: LanceDBCacheManager;
  private embeddings: any;

  constructor(
    embeddings: any,
    dbPath: string = "lancedb_cache",
    pastaBase: string = "base"
  ) {
    this.embeddings = embeddings;
    this.cacheManager = new LanceDBCacheManager(dbPath, pastaBase, embeddings);
  }

  /**
   * Verifica se o cache LanceDB existe
   */
  async verificarCache(): Promise<boolean> {
    return await this.cacheManager.verificarCache();
  }

  /**
   * Realiza busca semântica usando LanceDB
   */
  async buscar(query: string, k: number = 5): Promise<ResultadoComScore[]> {
    try {
      // Verificar se o cache existe
      const cacheExiste = await this.verificarCache();
      if (!cacheExiste) {
        throw new Error("Cache LanceDB não encontrado. Execute primeiro: npm run create-db");
      }

      console.log(`🔍 Buscando no LanceDB: "${query}"`);
      
      // Realizar busca semântica no LanceDB
      const resultados = await this.cacheManager.buscarSemantica(query, k);
      
      // Converter para formato de resultado com score
      const resultadosComScore: ResultadoComScore[] = resultados.map((chunk, index) => ({
        documento: {
          pageContent: chunk.pageContent,
          metadata: chunk.metadata
        },
        score: 1.0 - (index * 0.1), // Score baseado na posição (LanceDB já ordena por relevância)
        chunk: chunk
      }));

      console.log(`✅ Encontrados ${resultadosComScore.length} resultados no LanceDB`);
      
      return resultadosComScore;
      
    } catch (error) {
      console.error("❌ Erro durante busca no LanceDB:", error);
      throw error;
    }
  }

  /**
   * Atualiza o cache LanceDB incrementalmente
   */
  async atualizarCache(): Promise<void> {
    console.log("🔄 Atualizando cache LanceDB...");
    await this.cacheManager.atualizarCacheIncremental();
    console.log("✅ Cache LanceDB atualizado");
  }

  /**
   * Obtém estatísticas do cache LanceDB
   */
  async obterEstatisticas(): Promise<{ totalChunks: number, totalDocumentos: number }> {
    return await this.cacheManager.obterEstatisticas();
  }

  /**
   * Limpa o cache LanceDB
   */
  async limparCache(): Promise<void> {
    await this.cacheManager.limparCache();
  }

  /**
   * Obtém todos os chunks do cache LanceDB
   */
  async obterTodosChunks(): Promise<ChunkInfo[]> {
    return await this.cacheManager.obterTodosChunks();
  }
}
