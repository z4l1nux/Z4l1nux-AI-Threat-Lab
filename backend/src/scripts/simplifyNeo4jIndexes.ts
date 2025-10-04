import * as dotenv from "dotenv";
import neo4j from 'neo4j-driver';

dotenv.config({ path: '../../../.env.local' });

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

async function simplifyNeo4jIndexes() {
  console.log("🚀 Simplificando índices Neo4j para usar apenas nomic-embed-text...");
  console.log(`🔗 Neo4j URI: ${NEO4J_URI}`);

  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session();

  try {
    // Testar conexão
    await driver.verifyConnectivity();
    console.log("✅ Conexão Neo4j testada com sucesso");

    // 1. Remover índices vetoriais antigos
    console.log("🗑️ Removendo índices vetoriais antigos...");
    
    const indexesToRemove = [
      'chunk_ollama_embeddings',
      'chunk_openrouter_embeddings', 
      'chunk_gemini_embeddings'
    ];

    for (const indexName of indexesToRemove) {
      try {
        await session.run(`DROP INDEX ${indexName} IF EXISTS`);
        console.log(`✅ Índice ${indexName} removido`);
      } catch (error) {
        console.log(`⚠️ Índice ${indexName} não existia ou erro ao remover:`, error);
      }
    }

    // 2. Criar um único índice vetorial para nomic-embed-text (768 dimensões)
    console.log("🔧 Criando índice vetorial único para nomic-embed-text...");
    await session.run(`
      CREATE VECTOR INDEX chunk_embeddings IF NOT EXISTS
      FOR (c:Chunk) ON (c.embedding)
      OPTIONS {
        indexConfig: {
          \`vector.dimensions\`: 768,
          \`vector.similarity_function\`: 'cosine'
        }
      }
    `);
    console.log("✅ Índice chunk_embeddings criado (768 dimensões)");

    // 3. Atualizar chunks existentes para usar propriedade 'embedding' única
    console.log("🔄 Atualizando chunks existentes...");
    
    // Mover embeddings do Ollama para propriedade 'embedding'
    const updateOllama = await session.run(`
      MATCH (c:Chunk)
      WHERE c.ollamaEmbedding IS NOT NULL
      SET c.embedding = c.ollamaEmbedding
      RETURN count(c) as updated
    `);
    console.log(`✅ ${updateOllama.records[0].get('updated')} chunks Ollama atualizados`);

    // 4. Remover propriedades antigas de embedding
    console.log("🧹 Removendo propriedades antigas de embedding...");
    
    await session.run(`
      MATCH (c:Chunk)
      REMOVE c.ollamaEmbedding, c.openrouterEmbedding, c.geminiEmbedding
    `);
    console.log("✅ Propriedades antigas removidas");

    // 5. Simplificar labels - remover sufixos de provedor
    console.log("🏷️ Simplificando labels...");
    
    // Renomear labels de chunks
    await session.run(`
      MATCH (c:Chunk)
      WHERE c:Chunk:Ollama OR c:Chunk:OpenRouter OR c:Chunk:Gemini
      REMOVE c:Chunk:Ollama, c:Chunk:OpenRouter, c:Chunk:Gemini
      SET c:Chunk
    `);
    console.log("✅ Labels de chunks simplificados");

    // Renomear labels de documentos
    await session.run(`
      MATCH (d:Document)
      WHERE d:Document:Ollama OR d:Document:OpenRouter OR d:Document:Gemini
      REMOVE d:Document:Ollama, d:Document:OpenRouter, d:Document:Gemini
      SET d:Document
    `);
    console.log("✅ Labels de documentos simplificados");

    // 6. Verificar índices criados
    console.log("🔍 Verificando índices criados...");
    const result = await session.run("SHOW INDEXES");
    const indexes = result.records.map(record => record.get('name'));
    console.log("📋 Índices disponíveis:", indexes);

    console.log("\n✅ Simplificação concluída com sucesso!");
    console.log("📋 Resumo:");
    console.log("  - Índices antigos removidos");
    console.log("  - Índice único 'chunk_embeddings' criado (768 dimensões)");
    console.log("  - Chunks atualizados para usar propriedade 'embedding' única");
    console.log("  - Labels simplificados para 'Document' e 'Chunk'");

  } catch (error) {
    console.error("❌ Erro ao simplificar índices:", error);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
    console.log("🔌 Conexão Neo4j fechada");
  }
}

if (require.main === module) {
  simplifyNeo4jIndexes();
}

export { simplifyNeo4jIndexes };
