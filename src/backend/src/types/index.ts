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

export interface SearchResult {
  documento: {
    pageContent: string;
    metadata: any;
  };
  score: number;
}

export interface DocumentUpload {
  name: string;
  content: string;
  metadata: {
    originalName: string;
    mimeType: string;
    uploadedAt: string;
    source: string;
  };
}

export interface RAGContext {
  relevantChunks: SearchResult[];
  totalDocuments: number;
  searchQuery: string;
  confidence: number;
}

// Tipos compartilhados com frontend (para Threat Modeling)
export interface SystemInfo {
  systemName: string;
  systemVersion: string;
  generalDescription: string;
  components: string;
  sensitiveData: string;
  technologies: string;
  authentication: string;
  userProfiles: string;
  externalIntegrations: string;
  criticalData?: string; // Adicionado para consistência
  additionalContext?: string; // Contexto adicional do diagrama visual
}

export enum StrideCategory {
  SPOOFING = "Falsificação (Spoofing)",
  TAMPERING = "Adulteração (Tampering)",
  REPUDIATION = "Repúdio (Repudiation)",
  INFORMATION_DISCLOSURE = "Divulgação de Informações (Information Disclosure)",
  DENIAL_OF_SERVICE = "Negação de Serviço (Denial of Service)",
  ELEVATION_OF_PRIVILEGE = "Elevação de Privilégio (Elevation of Privilege)",
}

export interface IdentifiedThreat {
  id: string;
  elementName: string;
  strideCategory: StrideCategory | string; // Allow string for flexibility
  threatScenario: string;
  capecId: string;
  capecName: string;
  capecDescription: string;
  mitigationRecommendations: string;
  impact: string; // CRITICAL, HIGH, MEDIUM ou LOW
  owaspTop10: string; // Ex: 'A01:2021' OU 'LLM01' para sistemas de IA
  securityFramework?: string; // Framework adicional
}

export interface ReportData {
  systemInfo: SystemInfo;
  threats: IdentifiedThreat[];
  generatedAt: string;
  attackTreeMermaid?: string;
}

export interface StrideCapecMappingEntry {
  stride: StrideCategory | string;
  capecs: { id: string; name: string; }[];
}

export type StrideCapecMapType = StrideCapecMappingEntry[];
