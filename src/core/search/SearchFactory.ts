import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { LanceDBSemanticSearch } from "./LanceDBSemanticSearch";

/**
 * Factory para criar instâncias de busca semântica
 * Usa LanceDB como backend padrão
 */
export class SearchFactory {
  /**
   * Cria uma instância de busca semântica (LanceDB por padrão)
   */
  static criarBusca(
    embeddings: GoogleGenerativeAIEmbeddings,
    arquivoCache: string = "vectorstore.json",
    pastaBase: string = "base",
    tipo: "lancedb" = "lancedb"
  ): LanceDBSemanticSearch {
    
    console.log("🚀 Usando busca semântica com LanceDB");
    return new LanceDBSemanticSearch(embeddings, "lancedb_cache", pastaBase);
  }

  /**
   * Cria busca com LanceDB (padrão)
   */
  static criarBuscaLanceDB(
    embeddings: GoogleGenerativeAIEmbeddings,
    dbPath: string = "lancedb_cache",
    pastaBase: string = "base"
  ): LanceDBSemanticSearch {
    return new LanceDBSemanticSearch(embeddings, dbPath, pastaBase);
  }
}

