import * as readline from "readline";
import * as dotenv from "dotenv";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { HybridSemanticSearch } from "../../core/search/HybridSemanticSearch";

dotenv.config();

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const pergunta = await new Promise<string>((resolve) => rl.question("Pergunta: ", resolve));
  rl.close();

  const embeddings = new OllamaEmbeddings({
    model: process.env.EMBEDDING_MODEL || "nomic-embed-text:latest",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
  });
  const search = new HybridSemanticSearch(embeddings, "lancedb_cache", "base");

  const cacheExiste = await search.verificarCache();
  if (!cacheExiste) {
    console.log("❌ LanceDB não encontrado. Rode: npm run create-lancedb");
    return;
  }

  const resultados = await search.buscar(pergunta, 8);
  console.log(`Encontrados ${resultados.length} resultados`);
  resultados.forEach((r, i) => {
    console.log(`${i + 1}. Score=${r.score.toFixed(3)} | ${r.chunk?.id}`);
  });
}

if (require.main === module) {
  main().catch(console.error);
}


