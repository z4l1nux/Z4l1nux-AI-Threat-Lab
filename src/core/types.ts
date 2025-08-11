export interface Resultado {
  pageContent: string;
  metadata: Record<string, any>;
}

export interface ResultadoComScore {
  documento: Resultado;
  score: number;
  chunk?: ChunkInfo;
}

export interface ConfiguracaoDB {
  collectionName: string;
  url: string;
}

export interface ConfiguracaoOllama {
  model: string;
  baseUrl: string;
}

export interface PromptData {
  pergunta: string;
  base_conhecimento: string;
}

// Novos tipos para controle de versão e cache
export interface DocumentoInfo {
  nomeArquivo: string;
  caminhoCompleto: string;
  hashArquivo: string;
  tamanhoArquivo: number;
  dataModificacao: Date;
  dataProcessamento: Date;
  chunks: ChunkInfo[];
}

export interface ChunkInfo {
  id: string;
  pageContent: string;
  metadata: Record<string, any>;
  embedding: number[];
  score?: number;
}

export interface CacheDB {
  versao: string;
  dataCriacao: Date;
  dataUltimaAtualizacao: Date;
  documentos: DocumentoInfo[];
  configuracoes: {
    chunkSize: number;
    chunkOverlap: number;
    modelEmbedding: string;
  };
}

export interface ProcessamentoResultado {
  documentosNovos: string[];
  documentosModificados: string[];
  documentosRemovidos: string[];
  totalChunks: number;
  tempoProcessamento: number;
  estatisticasProcessamento?: EstatisticasProcessamento;
}

export interface EstatisticasProcessamento {
  totalDocumentos: number;
  documentosProcessados: number;
  totalChunks: number;
  chunksProcessados: number;
  tokensConsumidos: number;
  tempoInicio: Date;
  tempoAtual: Date;
  tempoEstimadoRestante?: number;
  taxaProcessamento: number; // chunks por segundo
}

export interface EstatisticasIndiceOtimizado {
  chunksIndexados: number;
  cacheDisponivel: boolean;
  dataCriacaoIndice?: Date;
  tamanhoIndice?: number;
}

export interface EstatisticasCompletas {
  totalDocumentos: number;
  totalChunks: number;
  dataCriacao: Date;
  dataUltimaAtualizacao: Date;
  tamanhoCache: number;
  indiceOtimizado?: EstatisticasIndiceOtimizado;
}

export interface ConfiguracaoVerbosidade {
  mostrarProgresso: boolean;
  mostrarTokens: boolean;
  mostrarTempoEstimado: boolean;
  mostrarDetalhesChunks: boolean;
  mostrarRespostasAPI: boolean;
  intervaloAtualizacao: number; // em milissegundos
} 