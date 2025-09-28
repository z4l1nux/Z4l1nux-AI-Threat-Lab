import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { OpenAIEmbeddings } from "@langchain/openai";
// Removido ChatPromptTemplate para evitar dependência faltante
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { SearchFactory } from "../core/search/SearchFactory";
import { PromptTemplates } from "../utils/PromptTemplates";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

const CAMINHO_DB = "db";

// Template será selecionado dinamicamente baseado na pergunta

interface Resultado {
  pageContent: string;
  metadata: any;
}

interface ResultadoComScore {
  documento: Resultado;
  score: number;
}

function criarEmbeddings() {
  // Usar Ollama Embeddings
  return new OllamaEmbeddings({
    model: process.env.EMBEDDING_MODEL || "nomic-embed-text:latest",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
  });
}


async function perguntarComOllama(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const pergunta = await new Promise<string>((resolve) => {
    rl.question("Escreva sua pergunta: ", resolve);
  });

  try {
    const embeddings = criarEmbeddings();
    const semanticSearch = SearchFactory.criarBusca(embeddings, "vectorstore.json", "base", "lancedb");
    
    // Verificar se o cache existe
    const cacheValido = await semanticSearch.verificarCache();
    if (!cacheValido) {
      console.log("❌ Banco de dados LanceDB não encontrado!");
      console.log("📝 Execute primeiro: npm run create-lancedb");
      rl.close();
      return;
    }
    
    // Realizar busca semântica
    const resultados = await semanticSearch.buscar(pergunta, 8);
    
    if (resultados.length === 0) {
      console.log("Não conseguiu encontrar alguma informação relevante na base");
      rl.close();
      return;
    }
    
    console.log(`Encontrados ${resultados.length} resultados relevantes`);
    resultados.forEach((resultado: any, index: number) => {
      console.log(`${index + 1}. Score: ${resultado.score.toFixed(3)}`);
    });

    const textosResultado: string[] = [];
    for (const resultado of resultados) {
      const texto = resultado.documento.pageContent;
      textosResultado.push(texto);
    }

    const baseConhecimento = textosResultado.join("\n\n----\n\n");
    
    // Selecionar template apropriado baseado na pergunta
    const promptTemplate = PromptTemplates.getTemplateForQuestion(pergunta);
    const textoPrompt = promptTemplate
      .replace("{pergunta}", pergunta)
      .replace("{base_conhecimento}", baseConhecimento);
    
    // Usar Ollama com modelo Mistral
    const modelo = new ChatOllama({
      model: "mistral",
      baseUrl: "http://127.0.0.1:11434"
    });
    
    // Algumas versões expõem .invoke, outras usam .call com {input}
    const resposta: any = (modelo as any).invoke
      ? await (modelo as any).invoke(textoPrompt as any)
      : await (modelo as any).call({ input: textoPrompt });
    console.log("Resposta da IA (Ollama/Mistral):", resposta.content);
  } catch (error) {
    console.error("Erro ao processar pergunta:", error);
    console.log("💡 Verifique se:");
    console.log("   1. O Ollama está rodando: ollama serve");
    console.log("   2. O modelo mistral está instalado: ollama pull mistral");
    console.log("   3. O modelo nomic-embed-text está instalado: ollama pull nomic-embed-text");
  } finally {
    rl.close();
  }
}

async function perguntar(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("Escolha o modelo:");
  console.log("1 - Ollama (Local)");
  console.log("2 - DeepSeek (OpenRouter)");

  const escolha = await new Promise<string>((resolve) => {
    rl.question("Digite sua escolha (1 ou 2): ", resolve);
  });

  rl.close();

  if (escolha === "1") {
    await perguntarComOllama();
  } else if (escolha === "2") {
    console.log("❌ DeepSeek via CLI ainda não implementado. Use a interface web.");
  } else {
    console.log("Escolha inválida. Usando Ollama por padrão.");
    await perguntarComOllama();
  }
}

// Executar o programa
perguntar().catch(console.error); 