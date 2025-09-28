import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { OpenAIEmbeddings } from "@langchain/openai";
import { LanceDBSemanticSearch } from "./LanceDBSemanticSearch";
import { HybridSemanticSearch } from "./HybridSemanticSearch";
import { Neo4jSemanticSearch } from "./Neo4jSemanticSearch";

/**
 * Factory para criar instâncias de busca semântica
 * Usa LanceDB como backend padrão
 */
export class SearchFactory {
  /**
   * Cria uma instância de busca semântica (LanceDB por padrão)
   */
  static criarBusca(
    embeddings: any,
    arquivoCache: string = "vectorstore.json",
    pastaBase: string = "base",
    tipo: "lancedb" | "hibrida" | "neo4j" = "lancedb"
  ): LanceDBSemanticSearch | HybridSemanticSearch | Neo4jSemanticSearch {
    if (tipo === "hibrida") {
      console.log("🚀 Usando busca semântica HÍBRIDA (LanceDB + Neo4j)");
      return new HybridSemanticSearch(embeddings, "lancedb_cache", pastaBase);
    }
    if (tipo === "neo4j") {
      console.log("🚀 Usando busca semântica apenas NEO4J (índice vetorial)");
      return new Neo4jSemanticSearch(embeddings);
    }
    console.log("🚀 Usando busca semântica com LanceDB");
    return new LanceDBSemanticSearch(embeddings, "lancedb_cache", pastaBase);
  }

  /**
   * Cria busca com LanceDB (padrão)
   */
  static criarBuscaLanceDB(
    embeddings: any,
    dbPath: string = "lancedb_cache",
    pastaBase: string = "base"
  ): LanceDBSemanticSearch {
    return new LanceDBSemanticSearch(embeddings, dbPath, pastaBase);
  }
}

