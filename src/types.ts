export interface Resultado {
  pageContent: string;
  metadata: Record<string, any>;
}

export interface ResultadoComScore {
  documento: Resultado;
  score: number;
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