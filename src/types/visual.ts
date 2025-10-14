/**
 * Tipos para o Editor Visual de Threat Modeling
 * Adaptado para o projeto Threat Modeling Co-Pilot with AI
 */

export type AssetCategory = 'ai' | 'data' | 'service' | 'external' | 'storage' | 'user';

export type ThreatLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface Asset {
  id: string;
  label: string;
  icon: string;
  category: AssetCategory;
  description: string;
  typicalThreats: string[]; // STRIDE categories ou OWASP LLM IDs
  color: string;
}

export interface VisualNode {
  id: string;
  type: 'asset' | 'boundary';
  data: {
    label: string;
    assetId?: string;
    assetType?: AssetCategory;
    icon?: string;
    threatLevel?: ThreatLevel;
    threats?: string[];
    description?: string;
    trustLevel?: 'internal' | 'dmz' | 'external' | 'third-party';
  };
  position: { x: number; y: number };
  style?: Record<string, any>;
  width?: number;
  height?: number;
}

export interface VisualEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  data?: {
    dataType?: string;
    encrypted?: boolean;
    authenticated?: boolean;
    crossesBoundary?: boolean;
    bidirectional?: boolean;
  };
  animated?: boolean;
  style?: Record<string, any>;
  markerEnd?: any;
  markerStart?: any;
}

export interface TrustBoundary {
  id: string;
  label: string;
  nodeIds: string[];
  trustLevel: 'internal' | 'dmz' | 'external' | 'third-party';
  color: string;
}

export interface VisualDiagram {
  id: string;
  name: string;
  description: string;
  nodes: VisualNode[];
  edges: VisualEdge[];
  boundaries: TrustBoundary[];
  createdAt: string;
  updatedAt: string;
}

