/**
 * Tipos compartilhados para Threat Modeling
 * Usados tanto no frontend quanto no backend
 */

export type SystemType = 'web' | 'api' | 'mobile' | 'desktop' | 'iot' | 'cloud';
export type SensitivityLevel = 'baixa' | 'media' | 'alta' | 'critica';
export type ProbabilityLevel = 'Alta' | 'Média' | 'Baixa';
export type SeverityLevel = 'Crítica' | 'Alta' | 'Média' | 'Baixa';
export type StrideCategory = 'S' | 'T' | 'R' | 'I' | 'D' | 'E';

export interface ThreatModelingRequest {
  systemName: string;
  systemType: SystemType;
  sensitivity: SensitivityLevel;
  description: string;
  assets: string;
  modelo?: string;
}

export interface Threat {
  id: string;
  stride: StrideCategory[];
  categoria: string;
  ameaca: string;
  descricao: string;
  impacto: string;
  probabilidade: ProbabilityLevel;
  severidade: SeverityLevel;
  mitigacao: string;
  capec: string;
  deteccao: string;
}

export interface ThreatModelingResponse {
  success: boolean;
  threats: Threat[];
  source: 'ai' | 'mock' | 'hybrid';
  confidence: number;
  logs?: string[];
  error?: string;
}

export interface CenarioRisco {
  tipo_risco?: string;
  descritivo?: string;
  cenario?: string;
  resumo?: string;
  tipo_de_risco?: string;  // Formato OpenRouter
  descricao?: string;      // Formato OpenRouter
  'Cenário de Risco'?: string;  // Formato OpenRouter novo
  'Descrição'?: string;         // Formato OpenRouter novo
  'Impacto'?: string;           // Formato OpenRouter novo
  'Mitigação'?: string;         // Formato OpenRouter novo
  impacto: string;
  mitigacao: string | string[];
}

export interface CenarioRiscoResponse {
  cenarios_risco: CenarioRisco[];
}

export interface ModelInfo {
  id: string;
  name: string;
  value: string;
  model: string;
  enabled: boolean;
  recommended?: boolean;
}

export interface ModelsResponse {
  chat: ModelInfo[];
  embedding: {
    model: string;
    provider: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  logs?: string[];
}
