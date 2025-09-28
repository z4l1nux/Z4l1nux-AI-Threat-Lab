import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { LanceDBCacheManager } from "../cache/LanceDBCacheManager";
import { Neo4jClient } from "../graph/Neo4jClient";
import { ResultadoComScore, ChunkInfo } from "../types";
import { Session } from "neo4j-driver";

export class HybridSemanticSearch {
  private readonly cacheManager: LanceDBCacheManager;
  private readonly embeddings: any;
  private readonly database?: string;

  constructor(
    embeddings: any,
    dbPath: string = "lancedb_cache",
    pastaBase: string = "base",
    neo4jDatabase?: string
  ) {
    this.embeddings = embeddings;
    this.cacheManager = new LanceDBCacheManager(dbPath, pastaBase, embeddings);
    this.database = neo4jDatabase;
  }

  async verificarCache(): Promise<boolean> {
    return await this.cacheManager.verificarCache();
  }

  private async expandirPorGrafo(chunkIds: string[], maxVizinhosPorChunk: number = 2): Promise<string[]> {
    if (chunkIds.length === 0) return [];
    const session: Session = Neo4jClient.getSession(this.database);
    try {
      const result = await session.run(
        `UNWIND $ids AS cid
         MATCH (c:Chunk {id: cid})<-[:HAS_CHUNK]-(d:Document)
         MATCH (d)-[:HAS_CHUNK]->(c2:Chunk)
         WHERE c2.id <> cid
         WITH cid, collect(DISTINCT c2.id)[0..$limit] AS viz
         RETURN viz AS expandedIds`,
        { ids: chunkIds, limit: maxVizinhosPorChunk }
      );
      const expanded: string[] = [];
      for (const rec of result.records) {
        const arr = rec.get("expandedIds") as string[] | null;
        if (Array.isArray(arr)) expanded.push(...arr);
      }
      return expanded;
    } catch {
      return [];
    } finally {
      await session.close();
    }
  }

  async buscar(query: string, k: number = 5): Promise<ResultadoComScore[]> {
    // 1) Busca vetorial no LanceDB
    const baseResultados = await this.cacheManager.buscarSemantica(query, k);
    const baseIds = baseResultados.map(c => c.id);

    // 2) Expansão via grafo (best-effort)
    const expandidos = await this.expandirPorGrafo(baseIds, 3);
    const idsFinal = Array.from(new Set([...baseIds, ...expandidos])).slice(0, k * 2);

    // 3) Carregar texto dos ids expandidos a partir do LanceDB (fallback simples: já temos baseResultados; para os extras, buscamos todos e filtramos)
    let todos: ChunkInfo[] = baseResultados;
    if (idsFinal.some(id => !baseIds.includes(id))) {
      const todosPossiveis = await this.cacheManager.obterTodosChunks();
      const extras = todosPossiveis.filter(c => idsFinal.includes(c.id) && !baseIds.includes(c.id));
      todos = [...baseResultados, ...extras];
    }

    // 4) Rerank leve: ordem original dos top-k, depois expandidos
    const ordenados = todos.sort((a, b) => {
      const ia = idsFinal.indexOf(a.id);
      const ib = idsFinal.indexOf(b.id);
      return ia - ib;
    }).slice(0, k);

    return ordenados.map((chunk, index) => ({
      documento: { pageContent: chunk.pageContent, metadata: chunk.metadata },
      score: 1.0 - index * 0.05,
      chunk
    }));
  }
}


