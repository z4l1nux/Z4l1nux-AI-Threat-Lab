import * as readline from "readline";
import * as dotenv from "dotenv";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { SearchFactory } from "../../core/search/SearchFactory";

dotenv.config();

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const pergunta = await new Promise<string>((resolve) => rl.question("Pergunta: ", resolve));
  rl.close();

  const embeddings = new OllamaEmbeddings({
    model: process.env.EMBEDDING_MODEL || "nomic-embed-text:latest",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
  });
  const search = SearchFactory.criarBusca(embeddings, "", "base", "neo4j");

  await (search as any).garantirIndiceVetorial?.();
  const ok = await (search as any).verificarCache();
  if (!ok) {
    console.log("❌ Grafo sem dados. Rode: npm run sync-neo4j");
    return;
  }

  const resultados = await (search as any).buscar(pergunta, 8);
  console.log(`Encontrados ${resultados.length} resultados`);
  resultados.forEach((r: any, i: number) => console.log(`${i + 1}. Score=${r.score.toFixed(3)} | ${r.chunk?.id}`));
}

if (require.main === module) {
  main().catch(console.error);
}


