import neo4j, { Driver, Session, Node, Integer } from 'neo4j-driver';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import * as crypto from 'crypto';
import { Neo4jDocument, Neo4jChunk, Neo4jSearchResult, DocumentUpload } from '../../types/index';

export class Neo4jCacheManager {
  private driver: Driver;
  private embeddings: GoogleGenerativeAIEmbeddings;
  private splitter: RecursiveCharacterTextSplitter;

  constructor(
    neo4jUri: string = process.env.NEO4J_URI || "bolt://localhost:7687",
    neo4jUser: string = process.env.NEO4J_USER || "neo4j", 
    neo4jPassword: string = process.env.NEO4J_PASSWORD || "s3nh4forte"
  ) {
    this.driver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword));
    
    // Configurar embeddings do Gemini
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY!,
      model: process.env.EMBEDDING_MODEL || "text-embedding-004"
    });
    
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 500,
      lengthFunction: (text: string) => text.length
    });
  }

  async initialize(): Promise<void> {
    const session = this.driver.session();
    
    try {
      console.log("🔧 Inicializando Neo4j Cache Manager com Gemini embeddings...");
      
      // Criar constraints únicos
      await session.run(`
        CREATE CONSTRAINT document_id_unique IF NOT EXISTS
        FOR (d:Document) REQUIRE d.id IS UNIQUE
      `);
      
      await session.run(`
        CREATE CONSTRAINT chunk_id_unique IF NOT EXISTS  
        FOR (c:Chunk) REQUIRE c.id IS UNIQUE
      `);

      // Criar índices vetoriais para busca semântica
      try {
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
        console.log("✅ Índice vetorial criado para chunks (Gemini embeddings)");
      } catch (error: any) {
        if (!error.message.includes("already exists")) {
          console.log("⚠️ Índice vetorial já existe ou versão Neo4j não suporta");
        }
      }

      // Criar índices de texto para busca híbrida
      await session.run(`
        CREATE TEXT INDEX document_name_text IF NOT EXISTS
        FOR (d:Document) ON (d.name)
      `);
      
      await session.run(`
        CREATE TEXT INDEX chunk_content_text IF NOT EXISTS  
        FOR (c:Chunk) ON (c.content)
      `);

      console.log("✅ Neo4j Cache Manager inicializado com Gemini");
      
    } catch (error) {
      console.error("❌ Erro ao inicializar Neo4j:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async processDocumentFromMemory(document: DocumentUpload): Promise<void> {
    const session = this.driver.session();
    
    try {
      console.log(`🧠 Processando documento com Gemini: ${document.name}`);
      
      // Gerar hash do conteúdo (para detectar mudanças)
      const documentHash = crypto.createHash('sha256').update(document.content).digest('hex');
      
      // Usar hash baseado no nome para ID consistente
      const documentId = crypto.createHash('md5').update(document.name).digest('hex');
      
      // Verificar se documento já existe
      const existingDoc = await session.run(`
        MATCH (d:Document {id: $documentId})
        RETURN d.hash as hash
      `, { documentId });

      const shouldUpdate = existingDoc.records.length > 0 && 
                          existingDoc.records[0].get('hash') !== documentHash;
      
      if (existingDoc.records.length > 0) {
        if (shouldUpdate) {
          console.log(`🔄 Documento existente encontrado, atualizando: ${document.name}`);
          // Deletar chunks antigos
          await session.run(`
            MATCH (d:Document {id: $documentId})-[:CONTAINS]->(c:Chunk)
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

      console.log(`📄 Gerando embeddings Gemini para ${chunks.length} chunks...`);
      
      // Gerar embeddings para todos os chunks usando Gemini
      const embeddings: number[][] = [];
      for (let i = 0; i < chunks.length; i++) {
        try {
          const embedding = await this.embeddings.embedQuery(chunks[i].pageContent);
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
          MERGE (d:Document {id: $documentId})
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
            CREATE (c:Chunk {
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
              embeddingModel: 'gemini-text-embedding-004'
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
      console.log(`✅ Documento ${action} com Gemini: ${document.name} (${chunks.length} chunks)`);
      
    } catch (error: any) {
      console.error(`❌ Erro ao processar documento: ${document.name}`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async search(query: string, limit: number = 8): Promise<Neo4jSearchResult[]> {
    const session = this.driver.session();
    
    try {
      // Gerar embedding da query usando Gemini
      console.log(`🔍 Gerando embedding Gemini para query: "${query.substring(0, 50)}..."`);
      const queryEmbedding = await this.embeddings.embedQuery(query);
      
      // Tentar busca vetorial primeiro
      try {
        const result = await session.run(`
          CALL db.index.vector.queryNodes('chunk_embeddings', $k, $queryEmbedding)
          YIELD node AS chunk, score
          MATCH (d:Document)-[:CONTAINS]->(chunk)
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
        return await this.manualSimilaritySearch(queryEmbedding, limit, session);
      }
      
    } catch (error: any) {
      console.error("❌ Erro na busca semântica:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  private async manualSimilaritySearch(queryEmbedding: number[], limit: number, session: any): Promise<Neo4jSearchResult[]> {
    // Buscar todos os chunks e calcular similaridade manualmente
    const result = await session.run(`
      MATCH (d:Document)-[:CONTAINS]->(c:Chunk)
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

  async hybridSearch(query: string, limit: number = 8): Promise<Neo4jSearchResult[]> {
    try {
      // Tentar busca vetorial primeiro
      return await this.search(query, limit);
    } catch (error: any) {
      console.warn("⚠️ Busca híbrida falhou, usando fallback:", error.message);
      
      // Fallback para busca textual simples
      const session = this.driver.session();
      try {
        const result = await session.run(`
          MATCH (d:Document)-[:CONTAINS]->(c:Chunk)
          WHERE c.content CONTAINS $query
          RETURN c AS chunk, d AS document, 1.0 AS score
          ORDER BY c.index
          LIMIT $limit
        `, {
          query: query.toLowerCase(),
          limit: neo4j.int(limit)
        });

        return this.parseSearchResults(result);
        
      } catch (textError: any) {
        console.warn("⚠️ Busca textual falhou:", textError.message);
        throw textError;
      } finally {
        await session.close();
      }
    }
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
      const result = await session.run(`
        MATCH (d:Document)
        OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
        RETURN count(DISTINCT d) AS totalDocumentos, count(c) AS totalChunks
      `);
      
      const record = result.records[0];
      const totalDocumentos = (record?.get('totalDocumentos') as Integer)?.toNumber() || 0;
      const totalChunks = (record?.get('totalChunks') as Integer)?.toNumber() || 0;
      
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
