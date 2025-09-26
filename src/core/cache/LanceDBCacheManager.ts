import { FileUtils } from '../../utils/fileUtils';
import { CacheDB, DocumentoInfo, ChunkInfo, ProcessamentoResultado, ConfiguracaoVerbosidade } from '../types';
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { DocumentLoaderFactory } from '../../utils/documentLoaders';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ProgressTracker } from '../../utils/ProgressTracker';
import { connect, Connection, Table } from '@lancedb/lancedb';
import * as arrow from 'apache-arrow';
import * as path from 'path';
import * as fs from 'fs';

export class LanceDBCacheManager {
  private db: Connection | null = null;
  private table: Table | null = null;
  private queryCacheTable: Table | null = null;
  private readonly pastaBase: string;
  private readonly embeddings: any;
  private readonly separador: RecursiveCharacterTextSplitter;
  private progressTracker: ProgressTracker | null = null;
  private readonly dbPath: string;
  private readonly queryEmbeddingCache: Map<string, number[]> = new Map();
  private static readonly MAX_QUERY_CACHE_ENTRIES: number = 500;
  private static normalizeQuery(query: string): string {
    const basic = query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
    // Remover acentos/diacríticos
    return basic.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  constructor(
    dbPath: string = "lancedb_cache",
    pastaBase: string = "base",
    embeddings: any,
    configuracaoVerbosidade?: Partial<ConfiguracaoVerbosidade>
  ) {
    this.dbPath = dbPath;
    this.pastaBase = pastaBase;
    this.embeddings = embeddings;
    this.separador = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 500,
      lengthFunction: (text: string) => text.length
    });
    
    if (configuracaoVerbosidade) {
      this.progressTracker = new ProgressTracker(configuracaoVerbosidade);
    }
  }

  /**
   * Inicializa a conexão com o LanceDB
   */
  private async inicializarDB(): Promise<void> {
    if (!this.db) {
      this.db = await connect(this.dbPath);
      
      // Verificar se a tabela existe, se não, criar
      const tabelas = await this.db.tableNames();
      if (!tabelas.includes('chunks')) {
        await this.criarTabela();
      } else {
        this.table = await this.db.openTable('chunks');
      }
      // Inicializar tabela de cache de consultas
      if (!tabelas.includes('query_cache')) {
        await this.criarTabelaQueryCache();
      } else {
        this.queryCacheTable = await this.db.openTable('query_cache');
      }
    }
  }

  /**
   * Cria a tabela de chunks no LanceDB
   */
  private async criarTabela(): Promise<void> {
    if (!this.db) throw new Error("DB não inicializada");

    // Criar schema explícito com coluna de vetor
    const schema = new arrow.Schema([
      new arrow.Field('id', new arrow.Utf8()),
      new arrow.Field('pageContent', new arrow.Utf8()),
      new arrow.Field('vector', new arrow.FixedSizeList(768, new arrow.Field('item', new arrow.Float32()))),
      new arrow.Field('metadata', new arrow.Utf8()),
      new arrow.Field('documentoId', new arrow.Utf8()),
      new arrow.Field('nomeArquivo', new arrow.Utf8()),
      new arrow.Field('hashArquivo', new arrow.Utf8()),
      new arrow.Field('dataProcessamento', new arrow.Utf8()),
      new arrow.Field('chunkIndex', new arrow.Int32())
    ]);

    // Criar tabela vazia com schema
    this.table = await this.db.createTable('chunks', [], { schema });
    console.log("✅ Tabela 'chunks' criada no LanceDB com schema de vetor");
  }

  /**
   * Cria a tabela de cache de queries (query -> embedding) no LanceDB
   */
  private async criarTabelaQueryCache(): Promise<void> {
    if (!this.db) throw new Error("DB não inicializada");

    const schema = new arrow.Schema([
      new arrow.Field('query', new arrow.Utf8()),
      new arrow.Field('vector', new arrow.FixedSizeList(768, new arrow.Field('item', new arrow.Float32()))),
      new arrow.Field('createdAt', new arrow.Utf8())
    ]);

    this.queryCacheTable = await this.db.createTable('query_cache', [], { schema });
    console.log("✅ Tabela 'query_cache' criada no LanceDB");
  }

  /**
   * Carrega o cache do LanceDB
   */
  async carregarCache(): Promise<void> {
    await this.inicializarDB();
    console.log("✅ Cache LanceDB carregado");
  }

  /**
   * Obtém todos os chunks do LanceDB
   */
    async obterTodosChunks(): Promise<ChunkInfo[]> {
    if (!this.table) {
      await this.carregarCache();
    }
    
    try {
      // Usar search sem especificar query para obter todos os dados
      const resultados = await this.table!.search(new Array(768).fill(0)).limit(1000).toArray();
      
      return resultados.map((row: any) => ({
        id: row.id as string,
        pageContent: row.pageContent as string,
        embedding: Array.from(row.vector as Float32Array),
        metadata: {
          ...JSON.parse(row.metadata as string),
          nomeArquivo: row.nomeArquivo,
          hashArquivo: row.hashArquivo
        }
      }));
    } catch (error) {
      console.error("Erro ao obter chunks:", error);
      return [];
    }
  }

  /**
   * Atualiza o cache incrementalmente
   */
  async atualizarCacheIncremental(): Promise<ProcessamentoResultado> {
    const inicio = Date.now();
    
    await this.inicializarDB();
    
    const arquivos = await FileUtils.listarArquivosSuportados(this.pastaBase);
    const documentosExistentes = await this.obterDocumentosExistentes();
    
    const documentosNovos: string[] = [];
    const documentosModificados: string[] = [];
    const documentosRemovidos: string[] = [];
    
    let totalChunks = 0;
    let tokensConsumidos = 0;
    
    // Processar arquivos novos e modificados
    for (const arquivo of arquivos) {
      const hashArquivo = await FileUtils.calcularHashArquivo(arquivo);
      const documentoExistente = documentosExistentes.find(doc => doc.nomeArquivo === path.basename(arquivo));
      
      if (!documentoExistente) {
        // Documento novo
        documentosNovos.push(path.basename(arquivo));
        const resultado = await this.processarDocumento(arquivo, hashArquivo);
        totalChunks += resultado.chunks.length;
        tokensConsumidos += resultado.tokensConsumidos;
      } else if (documentoExistente.hashArquivo !== hashArquivo) {
        // Documento modificado
        documentosModificados.push(path.basename(arquivo));
        
        // Remover chunks antigos
        await this.removerChunksDocumento(documentoExistente.nomeArquivo);
        
        // Processar novamente
        const resultado = await this.processarDocumento(arquivo, hashArquivo);
        totalChunks += resultado.chunks.length;
        tokensConsumidos += resultado.tokensConsumidos;
      }
    }
    
    // Identificar documentos removidos
    for (const doc of documentosExistentes) {
      const arquivoExiste = arquivos.some(arquivo => path.basename(arquivo) === doc.nomeArquivo);
      if (!arquivoExiste) {
        documentosRemovidos.push(doc.nomeArquivo);
        await this.removerChunksDocumento(doc.nomeArquivo);
      }
    }
    
    const tempoProcessamento = Date.now() - inicio;
    
    return {
      documentosNovos,
      documentosModificados,
      documentosRemovidos,
      totalChunks,
      tempoProcessamento,
      estatisticasProcessamento: {
        totalDocumentos: documentosNovos.length + documentosModificados.length,
        documentosProcessados: documentosNovos.length + documentosModificados.length,
        totalChunks,
        chunksProcessados: totalChunks,
        tokensConsumidos,
        tempoInicio: new Date(inicio),
        tempoAtual: new Date(),
        taxaProcessamento: totalChunks / (tempoProcessamento / 1000)
      }
    };
  }

  /**
   * Processa um documento individual
   */
  private async processarDocumento(arquivo: string, hashArquivo: string): Promise<{ chunks: ChunkInfo[], tokensConsumidos: number }> {
    const nomeArquivo = path.basename(arquivo);
    console.log(`📄 Processando: ${nomeArquivo}`);
    
    // Carregar documento
    const loader = DocumentLoaderFactory.createLoader(arquivo);
    const documentos = await loader.load();
    
    // Separar em chunks
    const chunks = await this.separador.splitDocuments(documentos);
    
    // Gerar embeddings
    const embeddings = await this.embeddings.embedDocuments(
      chunks.map(chunk => chunk.pageContent)
    );
    
    // Preparar dados para inserção no LanceDB
    const dadosParaInserir = chunks.map((chunk, index) => ({
      id: `${nomeArquivo}_chunk_${index}`,
      pageContent: chunk.pageContent,
      vector: new Float32Array(embeddings[index]),
      metadata: JSON.stringify({
        ...chunk.metadata,
        source: arquivo,
        chunkIndex: index
      }),
      documentoId: nomeArquivo,
      nomeArquivo: nomeArquivo,
      hashArquivo: hashArquivo,
      dataProcessamento: new Date().toISOString(),
      chunkIndex: index
    }));
    
    // Inserir no LanceDB
    await this.table!.add(dadosParaInserir);
    
    const tokensConsumidos = chunks.reduce((total, chunk) => total + chunk.pageContent.length, 0);
    
    return {
      chunks: dadosParaInserir.map((dado, index) => ({
        id: dado.id,
        pageContent: dado.pageContent,
        embedding: Array.from(dado.vector),
        metadata: JSON.parse(dado.metadata)
      })),
      tokensConsumidos
    };
  }

  /**
   * Remove chunks de um documento específico
   */
  private async removerChunksDocumento(nomeArquivo: string): Promise<void> {
    if (!this.table) return;
    
    await this.table.delete(`"nomeArquivo" = '${nomeArquivo}'`);
  }

  /**
   * Obtém documentos existentes no LanceDB
   */
  private async obterDocumentosExistentes(): Promise<{ nomeArquivo: string, hashArquivo: string }[]> {
    if (!this.table) return [];
    
    try {
      // Usar search com embedding vazio para obter metadados dos documentos
      const resultados = await this.table!.search(new Array(768).fill(0)).limit(1000).toArray();
      
      // Remover duplicatas baseado no nomeArquivo
      const documentosUnicos = new Map<string, string>();
      for (const row of resultados) {
        const nomeArquivo = (row as any).nomeArquivo as string;
        const hashArquivo = (row as any).hashArquivo as string;
        if (!documentosUnicos.has(nomeArquivo)) {
          documentosUnicos.set(nomeArquivo, hashArquivo);
        }
      }
      
      return Array.from(documentosUnicos.entries()).map(([nomeArquivo, hashArquivo]) => ({
        nomeArquivo,
        hashArquivo
      }));
    } catch (error) {
      console.error("Erro ao obter documentos existentes:", error);
      return [];
    }
  }

  /**
   * Realiza busca semântica no LanceDB
   */
  async buscarSemantica(query: string, k: number = 5): Promise<ChunkInfo[]> {
    if (!this.table) {
      await this.carregarCache();
    }
    
    try {
      // Obter embedding da query com cache (memória + LanceDB)
      const queryEmbedding = await this.obterEmbeddingConsulta(query);
      
      // Realizar busca por similaridade usando a coluna vector
      const resultados = await this.table!.vectorSearch(new Float32Array(queryEmbedding))
        .limit(k)
        .toArray();
      
      // Converter para ChunkInfo
      return resultados.map((row: any) => ({
        id: row.id as string,
        pageContent: row.pageContent as string,
        embedding: Array.from(row.vector as Float32Array),
        metadata: {
          ...JSON.parse(row.metadata as string),
          nomeArquivo: row.nomeArquivo,
          hashArquivo: row.hashArquivo
        }
      }));
    } catch (error) {
      console.error("Erro na busca semântica:", error);
      return [];
    }
  }

  /**
   * Obtém o embedding de uma consulta usando cache em memória e persistente no LanceDB
   */
  private async obterEmbeddingConsulta(query: string): Promise<number[]> {
    const norm = LanceDBCacheManager.normalizeQuery(query);
    // Cache em memória
    const existente = this.queryEmbeddingCache.get(norm);
    if (existente) return existente;

    // Cache persistente em LanceDB (best-effort)
    try {
      if (!this.queryCacheTable) {
        await this.inicializarDB();
      }
      if (this.queryCacheTable) {
        // Buscar até 2000 registros e filtrar em memória
        const registros = await this.queryCacheTable.search(new Array(768).fill(0)).limit(2000).toArray();
        const encontrado = registros.find((r: any) => (r.query as string) === norm);
        if (encontrado) {
          const emb = Array.from(encontrado.vector as Float32Array);
          this.colocarNoCache(norm, emb);
          return emb;
        }
      }
    } catch {
      // Ignorar erros de cache persistente
    }

    // Gerar via API e persistir
    const gerado = await this.embeddings.embedQuery(norm);
    this.colocarNoCache(norm, gerado);

    try {
      if (this.queryCacheTable) {
        await this.queryCacheTable.add([
          {
            query: norm,
            vector: new Float32Array(gerado),
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } catch {
      // Ignorar erros de escrita no cache persistente
    }

    return gerado;
  }

  private colocarNoCache(query: string, emb: number[]): void {
    if (this.queryEmbeddingCache.size >= LanceDBCacheManager.MAX_QUERY_CACHE_ENTRIES) {
      const primeiro = this.queryEmbeddingCache.keys().next();
      if (!primeiro.done) {
        this.queryEmbeddingCache.delete(primeiro.value);
      }
    }
    this.queryEmbeddingCache.set(query, emb);
  }

  /**
   * Verifica se o cache existe
   */
  async verificarCache(): Promise<boolean> {
    try {
      await this.inicializarDB();
      const tabelas = await this.db!.tableNames();
      return tabelas.includes('chunks');
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  async obterEstatisticas(): Promise<{ totalChunks: number, totalDocumentos: number }> {
    if (!this.table) {
      await this.carregarCache();
    }
    
    const totalChunks = await this.table!.countRows();
    const documentos = await this.obterDocumentosExistentes();
    
    return {
      totalChunks,
      totalDocumentos: documentos.length
    };
  }

  /**
   * Limpa todo o cache
   */
  async limparCache(): Promise<void> {
    if (this.db) {
      await this.db.dropTable('chunks');
      this.table = null;
    }
    console.log("🗑️ Cache LanceDB limpo");
  }
}
