/**
 * Detecção de Componentes de IA em Sistemas
 * 
 * Este módulo detecta automaticamente se um sistema contém componentes de IA/ML
 * analisando o SystemInfo através de 60+ palavras-chave classificadas em 3 níveis.
 * 
 * Quando IA é detectada, o sistema adiciona uma query RAG específica para buscar
 * conhecimento sobre OWASP LLM Top 10, AI TRiSM, NIST AI RMF, etc.
 */

import type { SystemInfo } from '../../types';

export interface AIDetectionResult {
  hasAI: boolean;
  aiComponents: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Detecta componentes de IA no sistema analisando descrição, componentes,
 * tecnologias e integrações externas.
 * 
 * @param systemInfo Informações do sistema
 * @returns Resultado da detecção com nível de confiança
 */
export function detectAIComponents(systemInfo: SystemInfo): AIDetectionResult {
  const textToAnalyze = [
    systemInfo.generalDescription || '',
    systemInfo.components || '',
    systemInfo.technologies || '',
    systemInfo.externalIntegrations || '',
    systemInfo.additionalContext || ''
  ].join(' ').toLowerCase();

  // ===== PALAVRAS-CHAVE DE IA (3 NÍVEIS DE CONFIANÇA) =====
  
  const aiKeywords = {
    // Alta confiança: Termos específicos de IA/ML
    high: [
      'llm', 'large language model', 'gpt', 'gemini', 'claude', 'llama',
      'modelo de linguagem', 'machine learning', 'aprendizado de máquina',
      'deep learning', 'aprendizado profundo', 'rede neural', 'neural network',
      'inteligência artificial', 'artificial intelligence', 'ai', 'ia',
      'chatbot', 'assistente virtual', 'virtual assistant',
      'processamento de linguagem natural', 'nlp', 'natural language processing',
      'visão computacional', 'computer vision', 'reconhecimento de imagem',
      'rag', 'retrieval augmented generation', 'embedding', 'vector database',
      'transformers', 'attention mechanism', 'bert', 'gpt-4', 'gpt-3',
      'openai', 'anthropic', 'hugging face'
    ],
    
    // Média confiança: Tecnologias/APIs relacionadas a IA
    medium: [
      'api openai', 'api anthropic', 'api google ai', 'google ai',
      'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'langchain',
      'modelo preditivo', 'predictive model', 'classificação', 'classification',
      'regressão', 'regression', 'clustering', 'agrupamento',
      'recomendação', 'recommendation', 'personalização', 'personalization',
      'fine-tuning', 'prompt engineering', 'few-shot learning',
      'zero-shot', 'transfer learning', 'model training', 'inference',
      'modelo treinado', 'trained model', 'ml pipeline', 'mlops',
      'model registry', 'feature store', 'vector store', 'pinecone',
      'weaviate', 'chroma', 'milvus', 'qdrant'
    ],
    
    // Baixa confiança: Termos genéricos que podem indicar IA
    low: [
      'automação', 'automation', 'otimização', 'optimization',
      'análise de dados', 'data analysis', 'predição', 'prediction',
      'detecção', 'detection', 'reconhecimento', 'recognition',
      'aprendizado', 'learning', 'treinamento', 'training',
      'modelo', 'model', 'algoritmo', 'algorithm'
    ]
  };

  let highConfidenceMatches: string[] = [];
  let mediumConfidenceMatches: string[] = [];
  let lowConfidenceMatches: string[] = [];

  // Detectar palavras-chave de alta confiança
  aiKeywords.high.forEach(keyword => {
    if (textToAnalyze.includes(keyword)) {
      highConfidenceMatches.push(keyword);
    }
  });

  // Detectar palavras-chave de média confiança
  aiKeywords.medium.forEach(keyword => {
    if (textToAnalyze.includes(keyword)) {
      mediumConfidenceMatches.push(keyword);
    }
  });

  // Detectar palavras-chave de baixa confiança (somente se não tiver high/medium)
  if (highConfidenceMatches.length === 0 && mediumConfidenceMatches.length === 0) {
    aiKeywords.low.forEach(keyword => {
      if (textToAnalyze.includes(keyword)) {
        lowConfidenceMatches.push(keyword);
      }
    });
  }

  const allMatches = [...highConfidenceMatches, ...mediumConfidenceMatches, ...lowConfidenceMatches];
  const hasAI = allMatches.length > 0;

  // Determinar nível de confiança
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  if (highConfidenceMatches.length >= 2) {
    // 2+ matches de alta confiança = HIGH
    confidence = 'HIGH';
  } else if (highConfidenceMatches.length >= 1) {
    // 1 match de alta confiança = HIGH
    confidence = 'HIGH';
  } else if (mediumConfidenceMatches.length >= 2) {
    // 2+ matches de média confiança = MEDIUM
    confidence = 'MEDIUM';
  } else if (mediumConfidenceMatches.length >= 1) {
    // 1 match de média confiança = MEDIUM
    confidence = 'MEDIUM';
  } else {
    // Apenas low confidence matches
    confidence = 'LOW';
  }

  return {
    hasAI,
    aiComponents: allMatches,
    confidence: hasAI ? confidence : 'LOW'
  };
}

/**
 * Gera a query RAG específica para sistemas com IA.
 * Esta query busca conhecimento sobre OWASP LLM Top 10, AI TRiSM, NIST AI RMF, etc.
 */
export function generateAIThreatQuery(confidence: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  if (confidence === 'HIGH') {
    return 'OWASP LLM Top 10 prompt injection AI TRiSM NIST AI RMF inteligência artificial machine learning segurança IA threats vulnerabilities model poisoning adversarial attacks';
  } else if (confidence === 'MEDIUM') {
    return 'OWASP LLM AI TRiSM machine learning security threats vulnerabilities modelo treinado';
  } else {
    return 'AI security machine learning vulnerabilities automation';
  }
}

