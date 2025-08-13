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
  strideCategory: StrideCategory | string; // Allow string for flexibility if AI returns other values
  threatScenario: string;
  capecId: string;
  capecName: string;
  capecDescription: string;
  mitigationRecommendations: string;
  impact: string; // CRITICAL, HIGH, MEDIUM ou LOW
  owaspTop10: string; // Ex: 'A01:2021 - Broken Access Control'
}

export interface ReportData {
  systemInfo: SystemInfo;
  
  threats: IdentifiedThreat[];
  generatedAt: string;
  attackTreeMermaid?: string;
}

export interface StrideCapecMappingEntry {
  stride: StrideCategory | string; // Allow string for flexibility
  capecs: { id: string; name: string; }[];
}
export type StrideCapecMapType = StrideCapecMappingEntry[];

// For Gemini API Image Generation (not used in this app, but good to have for reference if expanding)
export interface GeneratedImage {
  imageBytes: string; // Base64 encoded image
  mimeType: string; // e.g. "image/jpeg"
}