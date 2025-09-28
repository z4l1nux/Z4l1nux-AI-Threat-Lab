import * as dotenv from "dotenv";
import { OllamaEmbeddings } from "@langchain/ollama";
import { LanceDBCacheManager } from "../../core/cache/LanceDBCacheManager";
import { Neo4jSyncService } from "../../core/graph/Neo4jSyncService";

dotenv.config();

async function main() {
  try {
    const embeddings = new OllamaEmbeddings({
      model: process.env.EMBEDDING_MODEL || "nomic-embed-text:latest",
      baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
    });
    const cache = new LanceDBCacheManager("lancedb_cache", null, embeddings); // Não usar pasta base
    await cache.carregarCache();

    const sync = new Neo4jSyncService();

    const chunks = await cache.obterTodosChunks();
    const porDocumento = new Map<string, Array<typeof chunks[number]>>();

    for (const c of chunks) {
      const doc = (c.metadata?.source as string) || (c.metadata as any)?.nomeArquivo || "desconhecido";
      if (!porDocumento.has(doc)) porDocumento.set(doc, []);
      porDocumento.get(doc)!.push(c);
    }

    for (const [doc, cs] of porDocumento.entries()) {
      const hash = (cs[0]?.metadata as any)?.hashArquivo || "";
      await sync.upsertDocumento(doc, hash);
      await sync.upsertChunks(doc, cs);
      console.log(`✅ Sincronizado Documento e ${cs.length} chunks: ${doc}`);
    }

    console.log("🎉 Sincronização Neo4j concluída.");
  } catch (err) {
    console.error("❌ Erro na sincronização Neo4j:", err);
  }
}

if (require.main === module) {
  main().catch(console.error);
}


