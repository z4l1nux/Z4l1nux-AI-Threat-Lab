import { Neo4jClient } from '../core/graph/Neo4jClient';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../../.env.local' });

/**
 * Script para corrigir o índice vetorial do Neo4j
 * 
 * Problema: O índice foi criado com 768 dimensões, mas o Gemini atual gera 3072 dimensões
 * Solução: Recriar o índice com 3072 dimensões
 */

async function fixVectorIndex() {
  console.log('🔧 Iniciando correção do índice vetorial Neo4j...\n');

  let session = null;
  
  try {
    // Conectar ao Neo4j
    session = Neo4jClient.getSession();
    console.log('✅ Conectado ao Neo4j');

    // 1. Verificar se o índice existe
    console.log('\n📊 Verificando índice existente...');
    const indexCheck = await session.run(`
      SHOW VECTOR INDEXES
      YIELD name, entityType, labelsOrTypes, properties, options
      WHERE name = 'chunk_embeddings'
      RETURN name, options
    `);

    if (indexCheck.records.length > 0) {
      const currentOptions = indexCheck.records[0].get('options');
      console.log('⚠️ Índice existente encontrado:');
      console.log('   Nome: chunk_embeddings');
      console.log('   Configuração atual:', JSON.stringify(currentOptions, null, 2));

      // 2. Dropar o índice antigo
      console.log('\n🗑️  Removendo índice antigo...');
      await session.run(`DROP INDEX chunk_embeddings IF EXISTS`);
      console.log('✅ Índice antigo removido');
      
      // Aguardar um momento para garantir que o índice foi removido
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('ℹ️  Nenhum índice existente encontrado');
    }

    // 3. Criar novo índice com 3072 dimensões
    console.log('\n🆕 Criando novo índice vetorial (3072 dimensões)...');
    await session.run(`
      CREATE VECTOR INDEX chunk_embeddings IF NOT EXISTS
      FOR (c:Chunk) ON (c.embedding)
      OPTIONS {
        indexConfig: {
          \`vector.dimensions\`: 3072,
          \`vector.similarity_function\`: 'cosine'
        }
      }
    `);
    console.log('✅ Novo índice criado com sucesso!');

    // 4. Verificar o novo índice
    console.log('\n🔍 Verificando novo índice...');
    const newIndexCheck = await session.run(`
      SHOW VECTOR INDEXES
      YIELD name, entityType, labelsOrTypes, properties, options
      WHERE name = 'chunk_embeddings'
      RETURN name, options
    `);

    if (newIndexCheck.records.length > 0) {
      const newOptions = newIndexCheck.records[0].get('options');
      console.log('✅ Índice verificado:');
      console.log('   Nome: chunk_embeddings');
      console.log('   Nova configuração:', JSON.stringify(newOptions, null, 2));
    }

    // 5. Verificar quantos chunks existem
    console.log('\n📊 Estatísticas do banco:');
    const stats = await session.run(`
      MATCH (d:Document)-[:CONTAINS]->(c:Chunk)
      RETURN count(DISTINCT d) as totalDocumentos,
             count(c) as totalChunks
    `);

    if (stats.records.length > 0) {
      const record = stats.records[0];
      const totalDocs = record.get('totalDocumentos');
      const totalChunks = record.get('totalChunks');
      
      // Converter Integer do Neo4j para number
      const docsNum = typeof totalDocs === 'object' && totalDocs.toNumber ? totalDocs.toNumber() : totalDocs;
      const chunksNum = typeof totalChunks === 'object' && totalChunks.toNumber ? totalChunks.toNumber() : totalChunks;
      
      console.log(`   Total de documentos: ${docsNum}`);
      console.log(`   Total de chunks: ${chunksNum}`);
    }

    console.log('\n✅ Correção concluída com sucesso!');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - O índice foi recriado com 3072 dimensões');
    console.log('   - Os embeddings existentes devem estar compatíveis');
    console.log('   - Se houver problemas, execute: npm run clean-neo4j');
    console.log('   - Depois reprocesse os documentos: npm run create-neo4j\n');

  } catch (error: any) {
    console.error('\n❌ Erro ao corrigir índice vetorial:', error.message);
    
    if (error.message.includes('vector')) {
      console.log('\n💡 Dicas:');
      console.log('   - Verifique se você está usando Neo4j 5.11+ (Vector Index support)');
      console.log('   - Se necessário, limpe e recrie o banco: npm run clean-neo4j');
    }
    
    throw error;
  } finally {
    if (session) {
      await session.close();
      console.log('🔌 Conexão fechada');
    }
    await Neo4jClient.close();
  }
}

// Executar
fixVectorIndex()
  .then(() => {
    console.log('\n🎉 Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script falhou:', error);
    process.exit(1);
  });

