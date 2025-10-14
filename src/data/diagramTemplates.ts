/**
 * Templates de Diagramas Predefinidos
 * Para facilitar modelagem rápida de arquiteturas comuns
 */

import { Node, Edge } from 'reactflow';

export interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ai' | 'web' | 'mobile' | 'data' | 'enterprise';
  icon: string;
  nodes: Node[];
  edges: Edge[];
}

// ==========================================
// TEMPLATE 1: LLM Chatbot com RAG
// ==========================================
export const LLM_CHATBOT_TEMPLATE: DiagramTemplate = {
  id: 'llm-chatbot-rag',
  name: 'LLM Chatbot com RAG',
  description: 'Chatbot com Large Language Model e Retrieval-Augmented Generation',
  category: 'ai',
  icon: '🤖',
  nodes: [
    // Boundary External
    {
      id: 'boundary-external',
      type: 'boundary',
      position: { x: 50, y: 50 },
      data: { label: 'External Zone', trustLevel: 'external' },
      style: { width: 300, height: 200, zIndex: -1 }
    },
    // User
    {
      id: 'user-1',
      type: 'custom',
      position: { x: 100, y: 100 },
      data: {
        label: 'End User',
        icon: '👨‍💻',
        assetId: 'end-user',
        assetType: 'user'
      }
    },
    // Boundary Internal
    {
      id: 'boundary-internal',
      type: 'boundary',
      position: { x: 450, y: 50 },
      data: { label: 'Internal Zone', trustLevel: 'internal' },
      style: { width: 600, height: 500, zIndex: -1 }
    },
    // Internal Assets
    {
      id: 'webapp-1',
      type: 'custom',
      position: { x: 500, y: 100 },
      data: {
        label: 'Web Application',
        icon: '🌐',
        assetId: 'web-app',
        assetType: 'service'
      }
    },
    {
      id: 'backend-1',
      type: 'custom',
      position: { x: 700, y: 100 },
      data: {
        label: 'Backend Service',
        icon: '⚙️',
        assetId: 'backend-service',
        assetType: 'service'
      }
    },
    {
      id: 'llm-1',
      type: 'custom',
      position: { x: 500, y: 250 },
      data: {
        label: 'LLM Model',
        icon: '🧠',
        assetId: 'llm-model',
        assetType: 'ai'
      }
    },
    {
      id: 'vector-db-1',
      type: 'custom',
      position: { x: 700, y: 250 },
      data: {
        label: 'Vector Database',
        icon: '🗃️',
        assetId: 'vector-database',
        assetType: 'storage'
      }
    },
    {
      id: 'database-1',
      type: 'custom',
      position: { x: 900, y: 250 },
      data: {
        label: 'Database',
        icon: '💾',
        assetId: 'database',
        assetType: 'storage'
      }
    },
    // Boundary Third-party
    {
      id: 'boundary-thirdparty',
      type: 'boundary',
      position: { x: 500, y: 400 },
      data: { label: 'Third-party Zone', trustLevel: 'third-party' },
      style: { width: 300, height: 120, zIndex: -1 }
    },
    {
      id: 'openai-1',
      type: 'custom',
      position: { x: 550, y: 450 },
      data: {
        label: 'OpenAI API',
        icon: '🔌',
        assetId: 'openai-api',
        assetType: 'external'
      }
    }
  ],
  edges: [
    {
      id: 'e1',
      source: 'user-1',
      target: 'webapp-1',
      label: 'queries',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
      data: { dataType: 'HTTPS', encrypted: true }
    },
    {
      id: 'e2',
      source: 'webapp-1',
      target: 'backend-1',
      label: 'API requests',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
      data: { dataType: 'HTTPS', encrypted: true }
    },
    {
      id: 'e3',
      source: 'backend-1',
      target: 'llm-1',
      label: 'prompts',
      animated: true,
      style: { stroke: '#8b5cf6', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#8b5cf6' },
      data: { dataType: 'gRPC/SSL', encrypted: true }
    },
    {
      id: 'e4',
      source: 'llm-1',
      target: 'vector-db-1',
      label: 'RAG retrieval',
      animated: true,
      style: { stroke: '#8b5cf6', strokeWidth: 3 },
      markerEnd: { type: 'arrowclosed', color: '#8b5cf6' },
      markerStart: { type: 'arrowclosed', color: '#8b5cf6' },
      data: { dataType: 'gRPC/SSL', encrypted: true, bidirectional: true }
    },
    {
      id: 'e5',
      source: 'backend-1',
      target: 'database-1',
      label: 'user data',
      animated: true,
      style: { stroke: '#10b981', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#10b981' },
      data: { dataType: 'HTTPS', encrypted: true }
    },
    {
      id: 'e6',
      source: 'llm-1',
      target: 'openai-1',
      label: 'API calls',
      animated: true,
      style: { stroke: '#ef4444', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#ef4444' },
      data: { dataType: 'HTTPS', encrypted: true, crossesBoundary: true }
    }
  ]
};

// ==========================================
// TEMPLATE 2: Web Application Simples
// ==========================================
export const WEB_APP_TEMPLATE: DiagramTemplate = {
  id: 'web-app-simple',
  name: 'Web Application Simples',
  description: 'Aplicação web com frontend, backend e banco de dados',
  category: 'web',
  icon: '🌐',
  nodes: [
    {
      id: 'boundary-external',
      type: 'boundary',
      position: { x: 50, y: 50 },
      data: { label: 'External', trustLevel: 'external' },
      style: { width: 250, height: 150, zIndex: -1 }
    },
    {
      id: 'user-1',
      type: 'custom',
      position: { x: 100, y: 100 },
      data: { label: 'End User', icon: '👨‍💻', assetId: 'end-user', assetType: 'user' }
    },
    {
      id: 'boundary-dmz',
      type: 'boundary',
      position: { x: 400, y: 50 },
      data: { label: 'DMZ', trustLevel: 'dmz' },
      style: { width: 300, height: 150, zIndex: -1 }
    },
    {
      id: 'webapp-1',
      type: 'custom',
      position: { x: 450, y: 100 },
      data: { label: 'Web App', icon: '🌐', assetId: 'web-app', assetType: 'service' }
    },
    {
      id: 'lb-1',
      type: 'custom',
      position: { x: 600, y: 100 },
      data: { label: 'Load Balancer', icon: '⚖️', assetId: 'load-balancer', assetType: 'service' }
    },
    {
      id: 'boundary-internal',
      type: 'boundary',
      position: { x: 800, y: 50 },
      data: { label: 'Internal', trustLevel: 'internal' },
      style: { width: 400, height: 300, zIndex: -1 }
    },
    {
      id: 'backend-1',
      type: 'custom',
      position: { x: 850, y: 100 },
      data: { label: 'Backend', icon: '⚙️', assetId: 'backend-service', assetType: 'service' }
    },
    {
      id: 'database-1',
      type: 'custom',
      position: { x: 1000, y: 100 },
      data: { label: 'Database', icon: '💾', assetId: 'database', assetType: 'storage' }
    },
    {
      id: 'cache-1',
      type: 'custom',
      position: { x: 850, y: 250 },
      data: { label: 'Cache', icon: '⚡', assetId: 'cache', assetType: 'storage' }
    }
  ],
  edges: [
    {
      id: 'e1',
      source: 'user-1',
      target: 'webapp-1',
      label: 'HTTPS',
      animated: true,
      style: { stroke: '#10b981', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#10b981' },
      data: { dataType: 'HTTPS', encrypted: true, crossesBoundary: true }
    },
    {
      id: 'e2',
      source: 'webapp-1',
      target: 'lb-1',
      label: 'requests',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3b82f6' }
    },
    {
      id: 'e3',
      source: 'lb-1',
      target: 'backend-1',
      label: 'API calls',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
      data: { crossesBoundary: true }
    },
    {
      id: 'e4',
      source: 'backend-1',
      target: 'database-1',
      label: 'queries',
      animated: true,
      style: { stroke: '#f59e0b', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#f59e0b' }
    },
    {
      id: 'e5',
      source: 'backend-1',
      target: 'cache-1',
      label: 'cache ops',
      animated: true,
      style: { stroke: '#6b7280', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#6b7280' },
      markerStart: { type: 'arrowclosed', color: '#6b7280' },
      data: { bidirectional: true }
    }
  ]
};

// ==========================================
// TEMPLATE 3: ML Pipeline
// ==========================================
export const ML_PIPELINE_TEMPLATE: DiagramTemplate = {
  id: 'ml-pipeline',
  name: 'ML Pipeline',
  description: 'Pipeline de Machine Learning com treinamento e deploy',
  category: 'ai',
  icon: '🔧',
  nodes: [
    {
      id: 'scientist-1',
      type: 'custom',
      position: { x: 100, y: 100 },
      data: { label: 'Data Scientist', icon: '👨‍🔬', assetId: 'data-scientist', assetType: 'user' }
    },
    {
      id: 'pipeline-1',
      type: 'custom',
      position: { x: 300, y: 100 },
      data: { label: 'ML Pipeline', icon: '🔧', assetId: 'ml-pipeline', assetType: 'service' }
    },
    {
      id: 'training-data-1',
      type: 'custom',
      position: { x: 500, y: 50 },
      data: { label: 'Training Data', icon: '📊', assetId: 'training-data', assetType: 'data' }
    },
    {
      id: 'model-1',
      type: 'custom',
      position: { x: 500, y: 150 },
      data: { label: 'Trained Model', icon: '🎯', assetId: 'trained-model', assetType: 'ai' }
    },
    {
      id: 'registry-1',
      type: 'custom',
      position: { x: 700, y: 100 },
      data: { label: 'Model Registry', icon: '📚', assetId: 'model-registry', assetType: 'storage' }
    },
    {
      id: 'backend-1',
      type: 'custom',
      position: { x: 900, y: 100 },
      data: { label: 'Backend Service', icon: '⚙️', assetId: 'backend-service', assetType: 'service' }
    }
  ],
  edges: [
    {
      id: 'e1',
      source: 'scientist-1',
      target: 'pipeline-1',
      label: 'config',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3b82f6' }
    },
    {
      id: 'e2',
      source: 'pipeline-1',
      target: 'training-data-1',
      label: 'read data',
      animated: true,
      style: { stroke: '#10b981', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#10b981' }
    },
    {
      id: 'e3',
      source: 'pipeline-1',
      target: 'model-1',
      label: 'train',
      animated: true,
      style: { stroke: '#8b5cf6', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#8b5cf6' }
    },
    {
      id: 'e4',
      source: 'model-1',
      target: 'registry-1',
      label: 'publish',
      animated: true,
      style: { stroke: '#f59e0b', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#f59e0b' }
    },
    {
      id: 'e5',
      source: 'registry-1',
      target: 'backend-1',
      label: 'deploy',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3b82f6' }
    }
  ]
};

export const ALL_TEMPLATES: DiagramTemplate[] = [
  LLM_CHATBOT_TEMPLATE,
  WEB_APP_TEMPLATE,
  ML_PIPELINE_TEMPLATE
];

export const TEMPLATE_CATEGORIES = [
  { id: 'ai', label: 'AI/ML', icon: '🤖' },
  { id: 'web', label: 'Web Apps', icon: '🌐' },
  { id: 'mobile', label: 'Mobile', icon: '📱' },
  { id: 'data', label: 'Data', icon: '📊' },
  { id: 'enterprise', label: 'Enterprise', icon: '🏢' }
];

export function getTemplateById(id: string): DiagramTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id);
}

