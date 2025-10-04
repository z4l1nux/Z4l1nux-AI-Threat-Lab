import * as dotenv from "dotenv";
import { Neo4jClient } from "../core/graph/Neo4jClient";

const result = dotenv.config({ path: '../../../.env.local' });
console.log('🔍 Resultado do dotenv:', result.error ? result.error.message : 'Carregado com sucesso');

async function createVectorIndexes() {
  try {
    console.log("🚀 Criando índices vetoriais no Neo4j...");
    
    // Verificar variáveis de ambiente
    if (!process.env.NEO4J_URI || !process.env.NEO4J_USER || !process.env.NEO4J_PASSWORD) {
      throw new Error("Variáveis de ambiente do Neo4j não configuradas");
    }
    
    console.log(`🔗 Neo4j URI: ${process.env.NEO4J_URI}`);
    
    // Testar conexão Neo4j
    const neo4jConnected = await Neo4jClient.testConnection();
    if (!neo4jConnected) {
      throw new Error("Não foi possível conectar ao Neo4j. Verifique se o Docker está rodando.");
    }
    
    console.log("✅ Conectado ao Neo4j");
    
    // Criar índices vetoriais
    const driver = Neo4jClient.getDriver();
    const session = driver.session();
    
    try {
      // Índice para embeddings do Ollama
      console.log("🔧 Criando índice vetorial para chunk_ollama_embeddings...");
      await session.run(`
        CREATE VECTOR INDEX chunk_ollama_embeddings IF NOT EXISTS
        FOR (c:Chunk) ON (c.ollamaEmbedding)
        OPTIONS {
          indexConfig: {
            \`vector.dimensions\`: 768,
            \`vector.similarity_function\`: 'cosine'
          }
        }
      `);
      console.log("✅ Índice chunk_ollama_embeddings criado");
      
      // Índice para embeddings do OpenRouter
      console.log("🔧 Criando índice vetorial para chunk_openrouter_embeddings...");
      await session.run(`
        CREATE VECTOR INDEX chunk_openrouter_embeddings IF NOT EXISTS
        FOR (c:Chunk) ON (c.openrouterEmbedding)
        OPTIONS {
          indexConfig: {
            \`vector.dimensions\`: 1024,
            \`vector.similarity_function\`: 'cosine'
          }
        }
      `);
      console.log("✅ Índice chunk_openrouter_embeddings criado");
      
      // Índice para embeddings do Gemini
      console.log("🔧 Criando índice vetorial para chunk_gemini_embeddings...");
      await session.run(`
        CREATE VECTOR INDEX chunk_gemini_embeddings IF NOT EXISTS
        FOR (c:Chunk) ON (c.geminiEmbedding)
        OPTIONS {
          indexConfig: {
            \`vector.dimensions\`: 768,
            \`vector.similarity_function\`: 'cosine'
          }
        }
      `);
      console.log("✅ Índice chunk_gemini_embeddings criado");
      
      // Verificar índices criados
      console.log("🔍 Verificando índices criados...");
      const result = await session.run("SHOW INDEXES");
      const indexes = result.records.map(record => record.get('name'));
      console.log("📋 Índices disponíveis:", indexes);
      
    } finally {
      await session.close();
    }
    
    await Neo4jClient.close();
    
    console.log("\n✅ Índices vetoriais criados com sucesso!");
    console.log("📋 Índices criados:");
    console.log("  - chunk_ollama_embeddings (768 dimensões)");
    console.log("  - chunk_openrouter_embeddings (1024 dimensões)");
    console.log("  - chunk_gemini_embeddings (768 dimensões)");
    
  } catch (err) {
    console.error("❌ Erro ao criar índices vetoriais:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  createVectorIndexes().catch(console.error);
}

export { createVectorIndexes };
