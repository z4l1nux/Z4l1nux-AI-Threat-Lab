import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { ResultadoComScore, ChunkInfo } from "../types";
import { Neo4jClient } from "../graph/Neo4jClient";

export class Neo4jSemanticSearch {
  private readonly embeddings: OllamaEmbeddings;
  private readonly database?: string;

  constructor(embeddings: OllamaEmbeddings, neo4jDatabase?: string) {
    this.embeddings = embeddings;
    this.database = neo4jDatabase;
  }

  async verificarCache(): Promise<boolean> {
    // Verifica se há nós Chunk no grafo
    const session = Neo4jClient.getSession(this.database);
    try {
      const res = await session.run("MATCH (c:Chunk) RETURN count(c) AS n");
      const n = res.records[0]?.get("n").toInt?.() ?? res.records[0]?.get("n") ?? 0;
      return n > 0;
    } finally {
      await session.close();
    }
  }

  async garantirIndiceVetorial(): Promise<void> {
    // Cria índice vetorial se não existir (Neo4j 5.11+)
    const session = Neo4jClient.getSession(this.database);
    try {
      await session.run(
        `CREATE VECTOR INDEX chunk_vector_index IF NOT EXISTS
         FOR (c:Chunk) ON (c.vector)
         OPTIONS { indexConfig: {
           	"vector.dimensions": 768,
            "vector.similarity_function": "cosine"
         }}`
      );
    } finally {
      await session.close();
    }
  }

  async buscar(query: string, k: number = 5): Promise<ResultadoComScore[]> {
    const session = Neo4jClient.getSession(this.database);
    try {
      const qvec = await this.embeddings.embedQuery(query);
      const res = await session.run(
        `CALL db.index.vector.queryNodes('chunk_vector_index', $k, $q) YIELD node, score
         RETURN node.id AS id, node.pageContent AS pageContent, node.chunkIndex AS chunkIndex, score
         ORDER BY score DESC`,
        { k, q: qvec }
      );
      const items: ResultadoComScore[] = res.records.map(rec => {
        const id = rec.get("id") as string;
        const pageContent = rec.get("pageContent") as string;
        const score = rec.get("score") as number;
        const chunk: ChunkInfo = { id, pageContent, metadata: { chunkIndex: rec.get("chunkIndex") }, embedding: [] };
        return { documento: { pageContent, metadata: chunk.metadata }, score, chunk };
      });
      return items;
    } finally {
      await session.close();
    }
  }
}


