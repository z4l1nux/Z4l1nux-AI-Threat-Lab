import neo4j, { Driver, Session, Node, Integer } from 'neo4j-driver';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import * as crypto from 'crypto';
import { Neo4jDocument, Neo4jChunk, Neo4jSearchResult, DocumentUpload } from '../../types/index';

export class Neo4jCacheManager {
  private driver: Driver;
  private splitter: RecursiveCharacterTextSplitter;

  constructor(
    neo4jUri: string,
    neo4jUser: string, 
    neo4jPassword: string
  ) {
    // Validar parâmetros obrigatórios
    if (!neo4jUri) {
      throw new Error("❌ Neo4j URI é obrigatório");
    }
    if (!neo4jUser) {
      throw new Error("❌ Neo4j USER é obrigatório");
    }
    if (!neo4jPassword) {
      throw new Error("❌ Neo4j PASSWORD é obrigatório");
    }

    this.driver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword));
    
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 500,
      lengthFunction: (text: string) => text.length
    });
  }

  // Método para obter labels baseados no provedor de embedding
  private getEmbeddingLabels(embeddingProvider: string): { documentLabel: string; chunkLabel: string } {
    switch (embeddingProvider) {
      case 'ollama':
        return { documentLabel: 'Document:Ollama', chunkLabel: 'Chunk:Ollama' };
      case 'openrouter':
        return { documentLabel: 'Document:OpenRouter', chunkLabel: 'Chunk:OpenRouter' };
      default:
        return { documentLabel: 'Document:Ollama', chunkLabel: 'Chunk:Ollama' }; // Ollama como padrão
    }
  }

  // Método para obter dimensões do embedding baseado no provedor
  private getEmbeddingDimensions(embeddingProvider: string): number {
    switch (embeddingProvider) {
      case 'ollama':
        return 768;
      case 'openrouter':
        return 1536;
      default:
        return 768; // Ollama como padrão
    }
  }

  async initialize(): Promise<void> {
    const session = this.driver.session();
    
    try {
      console.log("🔧 Inicializando Neo4j Cache Manager com labels por provedor...");
      
      // Criar constraints únicos para cada tipo de documento
      const providers = ['Gemini', 'Ollama', 'OpenRouter'];
      
      for (const provider of providers) {
        await session.run(`
          CREATE CONSTRAINT document_${provider.toLowerCase()}_id_unique IF NOT EXISTS
          FOR (d:Document) REQUIRE d.id IS UNIQUE
        `);
        
        await session.run(`
          CREATE CONSTRAINT chunk_${provider.toLowerCase()}_id_unique IF NOT EXISTS
          FOR (c:Chunk) REQUIRE c.id IS UNIQUE
        `);
      }
      
            // Criar índices vetoriais para cada provedor
            const embeddingDimensions = {
              'Ollama': 768,
              'OpenRouter': 1536
            };
      
      for (const [provider, dimensions] of Object.entries(embeddingDimensions)) {
        try {
          await session.run(`
            CREATE VECTOR INDEX chunk_${provider.toLowerCase()}_embeddings IF NOT EXISTS
            FOR (c:Chunk) ON (c.embedding)
            OPTIONS {indexConfig: {
              \`vector.dimensions\`: ${dimensions},
              \`vector.similarity_function\`: 'cosine'
            }}
          `);
          console.log(`✅ Índice vetorial criado para ${provider} (${dimensions} dimensões)`);
        } catch (error) {
          console.warn(`⚠️ Erro ao criar índice vetorial para ${provider}:`, error);
        }
      }
      
      console.log("✅ Neo4j Cache Manager inicializado com labels por provedor");
      
    } finally {
      await session.close();
    }
  }

        async processDocumentFromMemory(document: DocumentUpload, modelConfig?: any): Promise<void> {
          // Determinar labels baseados no provedor de embedding
          // Usar Ollama como padrão
          let embeddingProvider = modelConfig?.embeddingProvider || 'ollama';
    
    const labels = this.getEmbeddingLabels(embeddingProvider);
    
    const session = this.driver.session();
    
    try {
      const provider = modelConfig?.provider || 'ollama';
      console.log(`🧠 Processando documento com ${provider} usando labels ${labels.documentLabel}: ${document.name}`);
      
      // Gerar hash do conteúdo (para detectar mudanças)
      const documentHash = crypto.createHash('sha256').update(document.content).digest('hex');
      
      // Usar hash baseado no nome para ID consistente
      const documentId = crypto.createHash('md5').update(document.name).digest('hex');
      
      // Verificar se documento já existe
      const existingDoc = await session.run(`
        MATCH (d:${labels.documentLabel} {id: $documentId})
        RETURN d.hash as hash
      `, { documentId });

      const shouldUpdate = existingDoc.records.length > 0 && 
                          existingDoc.records[0].get('hash') !== documentHash;
      
      if (existingDoc.records.length > 0) {
        if (shouldUpdate) {
          console.log(`🔄 Documento existente encontrado, atualizando: ${document.name}`);
          // Deletar chunks antigos
        await session.run(`
          MATCH (d:${labels.documentLabel} {id: $documentId})-[:CONTAINS]->(c:${labels.chunkLabel})
          DETACH DELETE c
        `, { documentId });
        } else {
          console.log(`⏭️ Documento idêntico já existe, pulando: ${document.name}`);
          return;
        }
      }
      
      // Dividir em chunks
      const chunks = await this.splitter.createDocuments([document.content]);
      
      if (chunks.length === 0) {
        throw new Error(`Nenhum chunk gerado para: ${document.name}`);
      }

      console.log(`📄 Gerando embeddings ${provider} para ${chunks.length} chunks...`);
      
      // Gerar embeddings para todos os chunks
      const embeddings: number[][] = [];
      for (let i = 0; i < chunks.length; i++) {
        try {
          let embedding: number[];
          
          if (embeddingProvider === 'ollama') {
            // Usar Ollama para embeddings
            console.log(`🔗 Usando Ollama para embedding do chunk ${i + 1}`);
            try {
              const response = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://172.21.112.1:11434'}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: modelConfig?.embeddingProvider === 'ollama' ? 'nomic-embed-text:latest' : (modelConfig?.embedding || process.env.EMBEDDING_MODEL || 'nomic-embed-text:latest'),
                  prompt: chunks[i].pageContent
                })
              });
              
              if (response.ok) {
                const data = await response.json() as { embedding: number[] };
                embedding = data.embedding;
              } else {
                throw new Error(`Ollama embedding failed: ${response.statusText}`);
              }
            } catch (error) {
              console.error(`❌ Erro com Ollama embedding:`, error);
              throw new Error(`Falha ao gerar embedding com Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
                 } else {
                   // Fallback para Ollama se não for especificado
                   console.log(`🔗 Usando Ollama para embedding do chunk ${i + 1} (fallback)`);
                   try {
                     const response = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://172.21.112.1:11434'}/api/embeddings`, {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({
                         model: 'nomic-embed-text:latest',
                         prompt: chunks[i].pageContent
                       })
                     });

                     if (response.ok) {
                       const data = await response.json() as { embedding: number[] };
                       embedding = data.embedding;
                     } else {
                       throw new Error(`Ollama embedding failed: ${response.statusText}`);
                     }
                   } catch (error) {
                     console.error(`❌ Erro com Ollama embedding:`, error);
                     throw new Error(`Falha ao gerar embedding com Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
                   }
                 }
          embeddings.push(embedding);
          
          // Log de progresso
          if ((i + 1) % 5 === 0 || i === chunks.length - 1) {
            console.log(`📊 Progresso embeddings: ${i + 1}/${chunks.length}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao gerar embedding para chunk ${i}:`, error);
          throw error;
        }
      }

      // Transação para inserir/atualizar documento e chunks
      await session.executeWrite(async (tx) => {
        // Inserir/atualizar documento
        await tx.run(`
          MERGE (d:${labels.documentLabel} {id: $documentId})
          SET d.name = $name,
              d.hash = $hash,
              d.content = $content,
              d.size = $size,
              d.uploadedAt = $uploadedAt,
              d.processedSecurely = $processedSecurely,
              d.metadata = $metadata
        `, {
          documentId,
          name: document.name,
          hash: documentHash,
          content: document.content,
          size: document.content.length,
          uploadedAt: new Date().toISOString(),
          processedSecurely: true,
          metadata: JSON.stringify(document.metadata)
        });

        // Inserir chunks
        for (let i = 0; i < chunks.length; i++) {
          const chunkId = `${documentId}_chunk_${i}`;
          
          await tx.run(`
            CREATE (c:${labels.chunkLabel} {
              id: $chunkId,
              documentId: $documentId,
              content: $content,
              index: $index,
              size: $size,
              embedding: $embedding,
              metadata: $metadata
            })
          `, {
            chunkId,
            documentId,
            content: chunks[i].pageContent,
            index: i,
            size: chunks[i].pageContent.length,
            embedding: embeddings[i],
            metadata: JSON.stringify({
              ...document.metadata,
              chunkIndex: i,
              source: 'memory_upload',
              embeddingModel: 'gemini-embedding-001'
            })
          });

          // Criar relacionamento
          await tx.run(`
            MATCH (d:Document {id: $documentId})
            MATCH (c:Chunk {id: $chunkId})
            MERGE (d)-[:CONTAINS]->(c)
          `, { documentId, chunkId });
        }
      });

      const action = shouldUpdate ? 'atualizado' : 'criado';
      console.log(`✅ Documento ${action} com ${embeddingProvider}: ${document.name} (${chunks.length} chunks)`);
      
    } catch (error: any) {
      console.error(`❌ Erro ao processar documento: ${document.name}`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

        async search(query: string, limit: number = 8, modelConfig?: any): Promise<Neo4jSearchResult[]> {
          // Determinar labels baseados no provedor de embedding
          // Usar Ollama como padrão
          let embeddingProvider = modelConfig?.embeddingProvider || 'ollama';
    
    const labels = this.getEmbeddingLabels(embeddingProvider);
    
    const session = this.driver.session();
    
    try {
      // Gerar embedding da query
      const provider = embeddingProvider;
      console.log(`🔍 Gerando embedding ${provider} para query usando labels ${labels.chunkLabel}: "${query.substring(0, 50)}..."`);
      
      let queryEmbedding: number[];
      
      if (embeddingProvider === 'ollama') {
        // Usar Ollama para embeddings
        console.log(`🔗 Usando Ollama para embedding da query`);
        try {
          const response = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://172.21.112.1:11434'}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: modelConfig?.embeddingProvider === 'ollama' ? 'nomic-embed-text:latest' : (modelConfig?.embedding || process.env.EMBEDDING_MODEL || 'nomic-embed-text:latest'),
              prompt: query
            })
          });
          
          if (response.ok) {
            const data = await response.json() as { embedding: number[] };
            queryEmbedding = data.embedding;
          } else {
            throw new Error(`Ollama embedding failed: ${response.statusText}`);
          }
        } catch (error) {
          console.error(`❌ Erro com Ollama embedding:`, error);
          throw new Error(`Falha ao gerar embedding com Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
             } else {
               // Fallback para Ollama se não for especificado
               console.log(`🔗 Usando Ollama para embedding da query (fallback)`);
               try {
                 const response = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://172.21.112.1:11434'}/api/embeddings`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({
                     model: 'nomic-embed-text:latest',
                     prompt: query
                   })
                 });

                 if (response.ok) {
                   const data = await response.json() as { embedding: number[] };
                   queryEmbedding = data.embedding;
                 } else {
                   throw new Error(`Ollama embedding failed: ${response.statusText}`);
                 }
               } catch (error) {
                 console.error(`❌ Erro com Ollama embedding:`, error);
                 throw new Error(`Falha ao gerar embedding com Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
               }
             }
      
      // Tentar busca vetorial primeiro
      try {
        const result = await session.run(`
          CALL db.index.vector.queryNodes('chunk_${embeddingProvider.toLowerCase()}_embeddings', $k, $queryEmbedding)
          YIELD node AS chunk, score
          MATCH (d:${labels.documentLabel})-[:CONTAINS]->(chunk)
          RETURN chunk, d AS document, score
          ORDER BY score DESC
          LIMIT $limit
        `, {
          k: limit,
          queryEmbedding,
          limit: neo4j.int(limit)
        });

        console.log(`✅ Busca vetorial Gemini encontrou ${result.records.length} resultados`);
        return this.parseSearchResults(result);
        
      } catch (vectorError: any) {
        console.warn("⚠️ Índice vetorial não disponível, usando busca por similaridade manual:", vectorError.message);
        
        // Fallback: busca manual por similaridade
        return await this.manualSimilaritySearch(queryEmbedding, limit, session, labels);
      }
      
    } catch (error: any) {
      console.error("❌ Erro na busca semântica:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  private async manualSimilaritySearch(queryEmbedding: number[], limit: number, session: any, labels: { documentLabel: string; chunkLabel: string }): Promise<Neo4jSearchResult[]> {
    // Buscar todos os chunks e calcular similaridade manualmente
    const result = await session.run(`
      MATCH (d:${labels.documentLabel})-[:CONTAINS]->(c:${labels.chunkLabel})
      RETURN c AS chunk, d AS document
      LIMIT 100
    `);

    const results: Neo4jSearchResult[] = [];
    
    for (const record of result.records) {
      const chunkNode = record.get('chunk') as Node;
      const docNode = record.get('document') as Node;
      
      const chunkEmbedding = chunkNode.properties.embedding as number[];
      const score = this.cosineSimilarity(queryEmbedding, chunkEmbedding);

      const chunk: Neo4jChunk = {
        id: chunkNode.properties.id as string,
        documentId: chunkNode.properties.documentId as string,
        content: chunkNode.properties.content as string,
        index: this.safeToNumber(chunkNode.properties.index),
        size: this.safeToNumber(chunkNode.properties.size),
        embedding: chunkEmbedding,
        metadata: JSON.parse(chunkNode.properties.metadata as string)
      };

      const document: Neo4jDocument = {
        id: docNode.properties.id as string,
        name: docNode.properties.name as string,
        hash: docNode.properties.hash as string,
        content: docNode.properties.content as string,
        size: this.safeToNumber(docNode.properties.size),
        uploadedAt: docNode.properties.uploadedAt as string,
        processedSecurely: docNode.properties.processedSecurely as boolean,
        metadata: JSON.parse(docNode.properties.metadata as string)
      };

      results.push({ chunk, document, score });
    }

    // Ordenar por score e limitar
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dotProduct / (normA * normB);
  }

  private safeToNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    if (value && typeof value.toNumber === 'function') {
      return value.toNumber();
    }
    if (value && typeof value.low === 'number') {
      return value.low; // Neo4j Integer
    }
    return parseInt(String(value)) || 0;
  }

  private parseSearchResults(result: any): Neo4jSearchResult[] {
    const results: Neo4jSearchResult[] = [];
    
    for (const record of result.records) {
      const chunkNode = record.get('chunk') as Node;
      const docNode = record.get('document') as Node;
      const score = record.get('score') as number;

      const chunk: Neo4jChunk = {
        id: chunkNode.properties.id as string,
        documentId: chunkNode.properties.documentId as string,
        content: chunkNode.properties.content as string,
        index: this.safeToNumber(chunkNode.properties.index),
        size: this.safeToNumber(chunkNode.properties.size),
        embedding: chunkNode.properties.embedding as number[],
        metadata: JSON.parse(chunkNode.properties.metadata as string)
      };

      const document: Neo4jDocument = {
        id: docNode.properties.id as string,
        name: docNode.properties.name as string,
        hash: docNode.properties.hash as string,
        content: docNode.properties.content as string,
        size: this.safeToNumber(docNode.properties.size),
        uploadedAt: docNode.properties.uploadedAt as string,
        processedSecurely: docNode.properties.processedSecurely as boolean,
        metadata: JSON.parse(docNode.properties.metadata as string)
      };

      results.push({ chunk, document, score });
    }

    return results;
  }

  async hybridSearch(query: string, limit: number = 8, modelConfig?: any): Promise<Neo4jSearchResult[]> {
    // Usar apenas busca Neo4j (sem híbrido)
    return await this.search(query, limit, modelConfig);
  }

  async verificarCache(): Promise<boolean> {
    const session = this.driver.session();
    
    try {
      const result = await session.run(`
        MATCH (d:Document) 
        RETURN count(d) AS documentCount
      `);
      
      const count = (result.records[0]?.get('documentCount') as Integer)?.toNumber() || 0;
      return count > 0;
      
    } catch (error) {
      return false;
    } finally {
      await session.close();
    }
  }

  async obterEstatisticas(): Promise<{ totalChunks: number; totalDocumentos: number }> {
    const session = this.driver.session();
    
    try {
            // Contar documentos e chunks de todos os provedores
            const providers = ['Ollama', 'OpenRouter'];
      let totalDocumentos = 0;
      let totalChunks = 0;
      
      for (const provider of providers) {
        try {
          const result = await session.run(`
            MATCH (d:Document:${provider})
            OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk:${provider})
            RETURN count(DISTINCT d) AS totalDocumentos, count(c) AS totalChunks
          `);
          
          const record = result.records[0];
          const docCount = (record?.get('totalDocumentos') as Integer)?.toNumber() || 0;
          const chunkCount = (record?.get('totalChunks') as Integer)?.toNumber() || 0;
          
          totalDocumentos += docCount;
          totalChunks += chunkCount;
          
          console.log(`📊 ${provider}: ${docCount} documentos, ${chunkCount} chunks`);
        } catch (error) {
          console.warn(`⚠️ Erro ao contar estatísticas para ${provider}:`, error);
        }
      }
      
      return { totalChunks, totalDocumentos };
      
    } finally {
      await session.close();
    }
  }

  async limparCache(): Promise<void> {
    const session = this.driver.session();
    
    try {
      await session.run(`
        MATCH (d:Document)
        DETACH DELETE d
      `);
      
      await session.run(`
        MATCH (c:Chunk)
        DELETE c
      `);
      
      console.log("🗑️ Cache Neo4j limpo");
      
    } finally {
      await session.close();
    }
  }

  async close(): Promise<void> {
    await this.driver.close();
  }
}
