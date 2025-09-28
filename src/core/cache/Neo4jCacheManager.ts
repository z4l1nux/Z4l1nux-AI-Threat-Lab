/**
 * Neo4j Cache Manager
 * Gerencia documentos, chunks e embeddings diretamente no Neo4j
 * com índices vetoriais para busca semântica
 */

import neo4j, { Driver, Session, Node, Integer } from 'neo4j-driver';
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import * as crypto from 'crypto';

export interface Neo4jDocument {
  id: string;
  name: string;
  hash: string;
  content: string;
  size: number;
  uploadedAt: string;
  processedSecurely: boolean;
  metadata: any;
}

export interface Neo4jChunk {
  id: string;
  documentId: string;
  content: string;
  index: number;
  size: number;
  embedding: number[];
  metadata: any;
}

export interface Neo4jSearchResult {
  chunk: Neo4jChunk;
  document: Neo4jDocument;
  score: number;
}

export interface ProcessingConfig {
  mostrarProgresso?: boolean;
  mostrarTokens?: boolean;
  mostrarTempoEstimado?: boolean;
  mostrarDetalhesChunks?: boolean;
  mostrarRespostasAPI?: boolean;
  intervaloAtualizacao?: number;
}

export class Neo4jCacheManager {
  private driver: Driver;
  private embeddings: OllamaEmbeddings;
  private splitter: RecursiveCharacterTextSplitter;
  private config: ProcessingConfig;

  constructor(
    neo4jUri: string = process.env.NEO4J_URI || "bolt://localhost:7687",
    neo4jUser: string = process.env.NEO4J_USER || "neo4j", 
    neo4jPassword: string = process.env.NEO4J_PASSWORD || "s3nh4forte",
    embeddings: OllamaEmbeddings,
    config: ProcessingConfig = {}
  ) {
    this.driver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword));
    this.embeddings = embeddings;
    this.config = config;
    
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 500,
      lengthFunction: (text: string) => text.length
    });
  }

  /**
   * Inicializa o banco Neo4j com constraints e índices vetoriais
   */
  async initialize(): Promise<void> {
    const session = this.driver.session();
    
    try {
      console.log("🔧 Inicializando Neo4j Cache Manager...");
      
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
        console.log("✅ Índice vetorial criado para chunks");
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

      console.log("✅ Neo4j Cache Manager inicializado");
      
    } catch (error) {
      console.error("❌ Erro ao inicializar Neo4j:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Processa documento da memória diretamente para Neo4j
   */
  async processDocumentFromMemory(document: {
    name: string;
    content: string;
    metadata: any;
  }): Promise<void> {
    const session = this.driver.session();
    
    try {
      console.log(`🧠 Processando documento: ${document.name}`);
      
      // Gerar ID e hash únicos
      const documentId = `doc_${Date.now()}_${crypto.randomUUID()}`;
      const documentHash = crypto.createHash('sha256').update(document.content).digest('hex');
      
      // Dividir em chunks
      const chunks = await this.splitter.createDocuments([document.content]);
      
      if (chunks.length === 0) {
        throw new Error(`Nenhum chunk gerado para: ${document.name}`);
      }

      console.log(`📄 Gerando embeddings para ${chunks.length} chunks...`);
      
      // Gerar embeddings para todos os chunks
      const embeddings: number[][] = [];
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await this.embeddings.embedQuery(chunks[i].pageContent);
        embeddings.push(embedding);
        
        if (this.config.mostrarProgresso) {
          console.log(`   📊 Chunk ${i + 1}/${chunks.length} processado`);
        }
      }

      // Transação para inserir documento e chunks
      await session.executeWrite(async (tx) => {
        // Inserir documento
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
              source: 'memory_upload'
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

      console.log(`✅ Documento processado: ${document.name} (${chunks.length} chunks)`);
      
    } catch (error: any) {
      console.error(`❌ Erro ao processar documento: ${document.name}`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Busca semântica usando índices vetoriais do Neo4j (com fallback)
   */
  async search(query: string, limit: number = 8): Promise<Neo4jSearchResult[]> {
    const session = this.driver.session();
    
    try {
      // Gerar embedding da query
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

  /**
   * Busca manual por similaridade (fallback quando índices vetoriais não estão disponíveis)
   */
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

  /**
   * Calcula similaridade de cosseno entre dois vetores
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dotProduct / (normA * normB);
  }

  /**
   * Converte propriedade do Neo4j para número de forma segura
   */
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

  /**
   * Converte resultado do Neo4j para Neo4jSearchResult[]
   */
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

  /**
   * Busca semântica: vetorial com fallback para texto
   */
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

  /**
   * Verifica se o cache existe (se há documentos)
   */
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

  /**
   * Obtém estatísticas do cache
   */
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

  /**
   * Limpa todo o cache
   */
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

  /**
   * Fecha conexão com Neo4j
   */
  async close(): Promise<void> {
    await this.driver.close();
  }

}
