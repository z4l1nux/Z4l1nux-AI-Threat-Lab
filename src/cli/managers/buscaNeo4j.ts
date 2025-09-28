import * as readline from "readline";
import * as dotenv from "dotenv";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Neo4jOnlySearchFactory } from "../../core/search/Neo4jOnlySearchFactory";

dotenv.config();

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const pergunta = await new Promise<string>((resolve) => rl.question("Pergunta: ", resolve));
  rl.close();

  const embeddings = new OllamaEmbeddings({
    model: process.env.EMBEDDING_MODEL || "nomic-embed-text:latest",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
  });
  const search = Neo4jOnlySearchFactory.criarBusca(embeddings);
  await search.initialize();

  const ok = await search.verificarCache();
  if (!ok) {
    console.log("❌ Grafo sem dados. Rode: npm run sync-neo4j");
    return;
  }

  const resultados = await search.buscar(pergunta, 8);
  console.log(`Encontrados ${resultados.length} resultados`);
  resultados.forEach((r: any, i: number) => console.log(`${i + 1}. Score=${r.score.toFixed(3)} | ${r.chunk?.id}`));
}

if (require.main === module) {
  main().catch(console.error);
}


