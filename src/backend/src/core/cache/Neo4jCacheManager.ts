import neo4j, { Driver, Session, Node, Integer } from 'neo4j-driver';
import { RecursiveCharacterTextSplitter, MarkdownTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import * as crypto from 'crypto';
import { Neo4jDocument, Neo4jChunk, Neo4jSearchResult, DocumentUpload } from '../../types/index';

export class Neo4jCacheManager {
  private driver: Driver;
  private splitter: RecursiveCharacterTextSplitter;
  private markdownSplitter: MarkdownTextSplitter;
  private embeddingCache: Map<string, number[]> = new Map();
  private ollamaUnavailableUntil: number | null = null; // circuit breaker simples

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
    
    // Splitter padrão para textos genéricos
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 4000,
      chunkOverlap: 800,
      lengthFunction: (text: string) => text.length
    });

    // Splitter específico para Markdown que respeita headers e estrutura
    this.markdownSplitter = new MarkdownTextSplitter({
      chunkSize: 8000,  // Maior para manter seções completas
      chunkOverlap: 1000
    });
  }

  // Método para obter labels simplificados (apenas nomic-embed-text)
  private getEmbeddingLabels(embeddingProvider: string): { documentLabel: string; chunkLabel: string } {
    // Sempre usar labels simples, independente do provedor
    return { documentLabel: 'Document', chunkLabel: 'Chunk' };
  }

  private async pingOllama(timeoutMs: number = 1000): Promise<boolean> {
    try {
      const base = process.env.OLLAMA_BASE_URL;
      if (!base) return false;
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${base}/api/tags`, { signal: controller.signal });
      clearTimeout(t);
      return res.ok;
    } catch {
      return false;
    }
  }

  // Método para obter dimensões do embedding (apenas nomic-embed-text)
  private getEmbeddingDimensions(embeddingProvider: string): number {
    // Sempre usar 768 dimensões (nomic-embed-text)
    return 768;
  }

  // Método para determinar o melhor provedor de embedding disponível
  private async getBestAvailableEmbeddingProvider(requestedProvider?: string): Promise<string> {
    // Se um provedor específico foi solicitado, verificar se está realmente disponível
    if (requestedProvider) {
      if (requestedProvider === 'ollama' && process.env.OLLAMA_BASE_URL) {
        // Verificar se Ollama está realmente disponível
        try {
          const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/tags`, { 
            method: 'GET',
            signal: AbortSignal.timeout(5000) // 5s timeout
          });
          if (response.ok) {
            console.log('🔄 Usando Ollama para embeddings (solicitado e disponível)');
            return 'ollama';
          }
        } catch (error) {
          console.warn('⚠️ Ollama solicitado mas não disponível, tentando fallback...');
        }
      }
      if (requestedProvider === 'gemini' && process.env.GEMINI_API_KEY) {
        console.log('🔄 Usando Gemini para embeddings (solicitado e disponível)');
        return 'gemini';
      }
      if (requestedProvider === 'openrouter' && (process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY)) {
        console.log('🔄 Usando OpenAI para embeddings (solicitado e disponível)');
        return 'openai'; // OpenRouter usa OpenAI para embeddings
      }
    }

    // Fallback: verificar provedores disponíveis na ordem de prioridade
    // 1. Gemini (mais confiável, bom custo-benefício)
    if (process.env.GEMINI_API_KEY) {
      console.log('🔄 Usando Gemini para embeddings (fallback automático)');
      return 'gemini';
    }
    
    // 2. OpenAI (via OpenRouter config ou direto)
    if (process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY) {
      console.log('🔄 Usando OpenAI para embeddings (fallback automático)');
      return 'openai';
    }
    
    // 3. Ollama (local, mais rápido) - só se realmente disponível
    if (process.env.OLLAMA_BASE_URL && process.env.EMBEDDING_MODEL) {
      try {
        const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/tags`, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5s timeout
        });
        if (response.ok) {
          console.log('🔄 Usando Ollama para embeddings (fallback automático)');
          return 'ollama';
        }
      } catch (error) {
        console.warn('⚠️ Ollama configurado mas não disponível, pulando...');
      }
    }

    // Se nenhum disponível, usar Gemini como último recurso (mais confiável)
    if (process.env.GEMINI_API_KEY) {
      console.log('🔄 Usando Gemini como último recurso para embeddings');
      return 'gemini';
    }

    // Se realmente nenhum disponível, erro
    throw new Error('❌ Nenhum provedor de embedding disponível. Configure pelo menos um: Gemini, OpenAI ou Ollama.');
  }

  // Método para obter modelo de embedding baseado na configuração e provider
  private getEmbeddingModel(modelConfig?: any, provider?: string): string {
    // Usar modelo do modelConfig APENAS se o provider coincidir
    if (modelConfig?.embedding && modelConfig?.embeddingProvider && provider && modelConfig.embeddingProvider === provider) {
      return modelConfig.embedding;
    }
    
    // Caso contrário, usar modelo específico do provider
    if (provider === 'gemini' && process.env.EMBEDDING_MODEL_GEMINI) {
      return process.env.EMBEDDING_MODEL_GEMINI;
    } else if ((provider === 'openrouter' || provider === 'openai') && process.env.EMBEDDING_MODEL_OPENROUTER) {
      return process.env.EMBEDDING_MODEL_OPENROUTER;
    } else if (provider === 'ollama' && process.env.EMBEDDING_MODEL) {
      return process.env.EMBEDDING_MODEL;
    }
    
    // Fallback padrão por provider
    if (provider === 'gemini') {
      return 'text-embedding-004';
    } else if (provider === 'openrouter' || provider === 'openai') {
      return 'text-embedding-3-small';
    } else {
      return 'nomic-embed-text:latest';
    }
  }

  /**
   * Limpar cache de embeddings
   */
  clearEmbeddingCache(): void {
    this.embeddingCache.clear();
    console.log('🧹 Cache de embeddings limpo');
  }

  /**
   * Obter estatísticas do cache
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.embeddingCache.size,
      maxSize: 100
    };
  }

  async initialize(): Promise<void> {
    const session = this.driver.session();
    
    try {
      console.log("🔧 Inicializando Neo4j Cache Manager com labels por provedor...");
      
      // Criar constraints únicos para cada tipo de documento
      const providers = ['Ollama', 'OpenRouter'];
      
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

      // Evitar documentos duplicados por conteúdo
      await session.run(`
        CREATE CONSTRAINT document_hash_unique IF NOT EXISTS
        FOR (d:Document) REQUIRE d.hash IS UNIQUE
      `);
      
            // Criar índices vetoriais para cada provedor
            // Criar índice vetorial único para nomic-embed-text (768 dimensões)
            try {
              await session.run(`
                CREATE VECTOR INDEX chunk_embeddings IF NOT EXISTS
                FOR (c:Chunk) ON (c.embedding)
                OPTIONS {indexConfig: {
                  \`vector.dimensions\`: 768,
                  \`vector.similarity_function\`: 'cosine'
                }}
              `);
              console.log(`✅ Índice vetorial único criado para nomic-embed-text (768 dimensões)`);
            } catch (error) {
              console.warn(`⚠️ Erro ao criar índice vetorial único:`, error);
            }
      
      console.log("✅ Neo4j Cache Manager inicializado com índice único para nomic-embed-text");
      
    } finally {
      await session.close();
    }
  }

        async processDocumentFromMemory(document: DocumentUpload, modelConfig?: any): Promise<void> {
          // Usar estrutura unificada (sem labels específicos de provedor)
          const session = this.driver.session();
    
    try {
      // Detectar provider de embedding disponível automaticamente
      const requestedProvider = modelConfig?.embeddingProvider;
      const provider = await this.getBestAvailableEmbeddingProvider(requestedProvider);
      
      console.log(`🧠 Processando documento com embedding ${provider}: ${document.name}`);
      
      // Gerar hash do conteúdo (para detectar mudanças)
      const documentHash = crypto.createHash('sha256').update(document.content).digest('hex');
      
      // Usar hash baseado no nome para ID consistente
      const documentId = crypto.createHash('md5').update(document.name).digest('hex');
      
      // Verificar se documento já existe pelo ID (nome) ou pelo HASH (conteúdo)
      const existingDoc = await session.run(`
        MATCH (d:Document {id: $documentId})
        RETURN d.hash as hash
      `, { documentId });

      const shouldUpdate = existingDoc.records.length > 0 && 
                          existingDoc.records[0].get('hash') !== documentHash;
      
      // Se já existir um documento com o mesmo conteúdo (hash), pular reimportação
      const existingByHash = await session.run(`
        MATCH (d:Document {hash: $documentHash})
        RETURN d.id as id, d.name as name
      `, { documentHash });

      if (existingByHash.records.length > 0) {
        const existingId = existingByHash.records[0].get('id');
        const existingName = existingByHash.records[0].get('name');
        // Se o mesmo conteúdo já estiver presente (mesmo hash), não reprocessar
        if (existingId !== documentId || !shouldUpdate) {
          console.log(`⏭️ Documento com mesmo conteúdo já existe (${existingName}). Pulando: ${document.name}`);
          return;
        }
      }

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
      
      // Dividir em chunks - usar MarkdownSplitter para arquivos .md
      const isMarkdown = document.name.toLowerCase().endsWith('.md');
      const splitterToUse = isMarkdown ? this.markdownSplitter : this.splitter;
      
      if (isMarkdown) {
        console.log(`📝 Usando MarkdownTextSplitter para ${document.name} (respeita estrutura de headers)`);
      }
      
      const chunks = await splitterToUse.createDocuments([document.content]);
      
      if (chunks.length === 0) {
        throw new Error(`Nenhum chunk gerado para: ${document.name}`);
      }

      // Usar o provider já verificado como disponível
      console.log(`📄 Gerando embeddings ${provider} para ${chunks.length} chunks...`);
      
      // Gerar embeddings para todos os chunks
      const embeddings: number[][] = [];
      for (let i = 0; i < chunks.length; i++) {
        try {
          let embedding: number[];
          
          if (provider === 'ollama') {
            console.log(`🔗 Usando Ollama para embedding do chunk ${i + 1}`);
            const baseUrl = process.env.OLLAMA_BASE_URL ?? '';
            const response = await fetch(`${baseUrl}/api/embeddings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: this.getEmbeddingModel(modelConfig, 'ollama'),
                prompt: chunks[i].pageContent
              })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json() as { embedding: number[] };
            embedding = data.embedding;
          } else if (provider === 'gemini') {
            console.log(`🔗 Usando Gemini para embedding do chunk ${i + 1}`);
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
            const embeddingModel = genAI.getGenerativeModel({ 
              model: this.getEmbeddingModel(modelConfig, 'gemini')
            });
            
            const result = await embeddingModel.embedContent(chunks[i].pageContent);
            embedding = result.embedding.values;
          } else if (provider === 'openai') {
            // Usar OpenAI para embeddings (OpenRouter não suporta embeddings)
            console.log(`🔗 Usando OpenAI para embedding do chunk ${i + 1}`);
            const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
            
            if (!apiKey) {
              throw new Error('OPENAI_API_KEY ou OPENROUTER_API_KEY não configurada');
            }
            
            try {
              const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: this.getEmbeddingModel(modelConfig, provider),
                  input: chunks[i].pageContent
                })
              });

              if (response.ok) {
                const data = await response.json() as { data: Array<{ embedding: number[] }> };
                embedding = data.data[0].embedding;
              } else {
                const errorText = await response.text();
                console.error(`❌ Erro na resposta da OpenAI:`, errorText);
                throw new Error(`OpenAI embedding failed: ${response.statusText}`);
              }
            } catch (error) {
              console.warn(`⚠️ Erro com OpenAI embedding:`, error);
              throw new Error(`Falha ao gerar embedding com OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else {
            throw new Error(`Provider de embedding não suportado: ${provider}. Use 'ollama', 'gemini' ou 'openai'.`);
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
              embeddingModel: 'nomic-embed-text:latest'
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
      console.log(`✅ Documento ${action} com ${provider}: ${document.name} (${chunks.length} chunks)`);
      
    } catch (error: any) {
      console.error(`❌ Erro ao processar documento: ${document.name}`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

        async search(query: string, limit: number = 8, modelConfig?: any): Promise<Neo4jSearchResult[]> {
          // Usar estrutura unificada (sem labels específicos de provedor)
          const session = this.driver.session();
    
    try {
      // Detectar provider disponível automaticamente
      const requestedProvider = modelConfig?.embeddingProvider;
      let provider = await this.getBestAvailableEmbeddingProvider(requestedProvider);
      const baseProvider = provider;
      console.log(`🔍 Gerando embedding (com fallback) iniciando por ${provider} para query: "${query.substring(0, 50)}..."`);
      
      let queryEmbedding: number[];
      
      // Verificar cache primeiro
      const cacheKey = `${baseProvider}:${query}`;
      if (this.embeddingCache.has(cacheKey)) {
        console.log(`⚡ Cache hit para embedding: "${query.substring(0, 30)}..."`);
        queryEmbedding = this.embeddingCache.get(cacheKey)!;
      } else {
        console.log(`🔄 Cache miss, gerando novo embedding...`);
        
        if (provider === 'ollama') {
          // Se Ollama está marcado indisponível ou ping falhar, usar Gemini direto
          const canTry = !this.ollamaUnavailableUntil || Date.now() > this.ollamaUnavailableUntil;
          const reachable = canTry ? await this.pingOllama(800) : false;
          if (!reachable) {
            console.warn('⚠️ Ollama indisponível, utilizando Gemini diretamente para esta query');
            provider = 'gemini';
          }
        }

        if (provider === 'ollama') {
          // Usar Ollama para embeddings
          console.log(`🔗 Usando Ollama para embedding da query`);
          try {
            const response = await fetch(`${process.env.OLLAMA_BASE_URL ?? ''}/api/embeddings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: this.getEmbeddingModel(modelConfig, 'ollama'),
                prompt: query
              })
            });
            
            if (response.ok) {
              const data = await response.json() as { embedding: number[] };
              queryEmbedding = data.embedding;
              
              // Armazenar no cache (limitar tamanho do cache)
              if (this.embeddingCache.size < 100) {
                this.embeddingCache.set(cacheKey, queryEmbedding);
                console.log(`💾 Embedding armazenado no cache (${this.embeddingCache.size}/100)`);
              }
            } else {
              throw new Error(`Ollama embedding failed: ${response.statusText}`);
            }
          } catch (error) {
            console.warn(`⚠️ Ollama embedding falhou, tentando fallback...`);
            this.ollamaUnavailableUntil = Date.now() + 5 * 60 * 1000; // 5 min cooldown
            // FALLBACK: Gemini somente
            try {
              console.log(`↪️ Fallback: Gemini embedding`);
              const { GoogleGenerativeAI } = await import('@google/generative-ai');
              const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
              const embeddingModel = genAI.getGenerativeModel({ model: this.getEmbeddingModel(modelConfig, 'gemini') });
              const result = await embeddingModel.embedContent(query);
              queryEmbedding = result.embedding.values;
              if (this.embeddingCache.size < 100) {
                this.embeddingCache.set(cacheKey, queryEmbedding);
                console.log(`💾 Embedding armazenado no cache (${this.embeddingCache.size}/100)`);
              }
            } catch (gerr) {
              // sem OpenAI por padrão para evitar terceiros; propagar erro para escolha do outro caminho
              throw gerr;
            }
          }
        } else if (provider === 'gemini') {
          // Usar Gemini para embeddings
          console.log(`🔗 Usando Gemini para embedding da query`);
          try {
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
            const embeddingModel = genAI.getGenerativeModel({ 
              model: this.getEmbeddingModel(modelConfig, 'gemini')
            });
            
            const result = await embeddingModel.embedContent(query);
            queryEmbedding = result.embedding.values;
            
            // Armazenar no cache (limitar tamanho do cache)
            if (this.embeddingCache.size < 100) {
              this.embeddingCache.set(cacheKey, queryEmbedding);
              console.log(`💾 Embedding armazenado no cache (${this.embeddingCache.size}/100)`);
            }
          } catch (error) {
            console.warn(`⚠️ Erro com Gemini embedding, tentando fallback para Ollama...`, error);
            // Fallback para Ollama
            const response = await fetch(`${process.env.OLLAMA_BASE_URL ?? ''}/api/embeddings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: this.getEmbeddingModel(modelConfig, 'ollama'),
                prompt: query
              })
            });
            if (!response.ok) throw new Error(`Ollama embedding failed: ${response.statusText}`);
            const data = await response.json() as { embedding: number[] };
            queryEmbedding = data.embedding;
            if (this.embeddingCache.size < 100) {
              this.embeddingCache.set(cacheKey, queryEmbedding);
              console.log(`💾 Embedding armazenado no cache (${this.embeddingCache.size}/100)`);
            }
          }
        } else if (provider === 'openai' || provider === 'openrouter') {
          // Usar OpenAI para embeddings (OpenRouter não suporta embeddings)
          console.log(`🔗 Usando OpenAI para embedding da query`);
          const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
          
          if (!apiKey) {
            throw new Error('OPENAI_API_KEY ou OPENROUTER_API_KEY não configurada');
          }
          
          try {
            const response = await fetch('https://api.openai.com/v1/embeddings', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: this.getEmbeddingModel(modelConfig, provider),
                input: query
              })
            });

            if (response.ok) {
              const data = await response.json() as { data: Array<{ embedding: number[] }> };
              queryEmbedding = data.data[0].embedding;
              
              // Armazenar no cache (limitar tamanho do cache)
              if (this.embeddingCache.size < 100) {
                this.embeddingCache.set(cacheKey, queryEmbedding);
                console.log(`💾 Embedding armazenado no cache (${this.embeddingCache.size}/100)`);
              }
            } else {
              const errorText = await response.text();
              console.error(`❌ Erro na resposta da OpenAI:`, errorText);
              throw new Error(`OpenAI embedding failed: ${response.statusText}`);
            }
          } catch (error) {
            console.warn(`⚠️ Erro com OpenAI embedding:`, error);
            throw new Error(`Falha ao gerar embedding com OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          throw new Error(`Provider de embedding não suportado: ${provider}. Use 'ollama', 'gemini' ou 'openai'.`);
        }
      }
      
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

        console.log(`✅ Busca vetorial encontrou ${result.records.length} resultados`);
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
      // Contar todos os documentos e chunks (sem labels específicos de provedor)
      const result = await session.run(`
        MATCH (d:Document)
        OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
        RETURN count(DISTINCT d) AS totalDocumentos, count(c) AS totalChunks
      `);
      
      const record = result.records[0];
      const totalDocumentos = (record?.get('totalDocumentos') as Integer)?.toNumber() || 0;
      const totalChunks = (record?.get('totalChunks') as Integer)?.toNumber() || 0;
      
      console.log(`📊 Total: ${totalDocumentos} documentos, ${totalChunks} chunks`);
      
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
