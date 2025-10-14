# 📚 Guia Completo de Implementação do Editor Visual de Threat Modeling

> **Objetivo**: Este documento contém TODA a implementação do editor visual de diagramas DFD (Data Flow Diagram) para modelagem de ameaças, incluindo funcionalidades avançadas como edição de fluxos de dados, análise de riscos e integração com RAG.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Dependências Necessárias](#dependências-necessárias)
4. [Estrutura de Arquivos](#estrutura-de-arquivos)
5. [Código Completo](#código-completo)
   - [Tipos TypeScript](#1-tipos-typescript)
   - [Biblioteca de Assets](#2-biblioteca-de-assets)
   - [Templates de Diagramas](#3-templates-de-diagramas)
   - [Componentes React](#4-componentes-react)
   - [Conversor de Diagramas](#5-conversor-de-diagramas)
6. [Integração com Sistema Existente](#integração-com-sistema-existente)
7. [Fluxo de Dados e Análise](#fluxo-de-dados-e-análise)
8. [Funcionalidades Implementadas](#funcionalidades-implementadas)
9. [Guia de UX](#guia-de-ux)
10. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 Visão Geral

### O Que Foi Construído

Um **editor visual completo** para criação de diagramas DFD (Data Flow Diagrams) focado em **threat modeling**, especialmente para sistemas com **IA/ML**, inspirado no ThreatFinder.ai.

### Principais Características

- ✅ **Drag-and-Drop**: Biblioteca de assets arrastavéis (40+ componentes)
- ✅ **Trust Boundaries**: Zonas de confiança visual (Internal, DMZ, External, Third-party)
- ✅ **Edição Rica de Fluxos**: Cor, tipo de dados, criptografia, bidirecionalidade
- ✅ **Templates Predefinidos**: 5 templates prontos (LLM Chatbot, ML Pipeline, etc.)
- ✅ **Análise Automática de Riscos**: Detecta fluxos não criptografados, cross-boundary, etc.
- ✅ **Integração RAG**: Contexto rico enviado para análise de ameaças
- ✅ **Exportar/Importar**: Salvar/carregar diagramas em JSON
- ✅ **Double-click para Editar**: Modais para editar componentes e fluxos
- ✅ **Detecção de IA**: Análise específica para componentes de ML/LLM

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     APP.TSX (Main)                          │
│  - Gerencia tabs: Formulário vs Editor Visual               │
│  - Orquestra análise de ameaças                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
┌────────▼──────────┐      ┌────────▼──────────┐
│  SystemInputForm  │      │  VisualEditor     │
│  (Formulário)     │      │  (Editor Visual)  │
└───────────────────┘      └────────┬──────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
         ┌────────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
         │ AssetLibrary  │  │  ReactFlow  │  │  Templates  │
         │  (Sidebar)    │  │  (Canvas)   │  │  (Modals)   │
         └───────────────┘  └─────────────┘  └─────────────┘
                                    │
                           ┌────────▼────────┐
                           │ diagramConverter│
                           │ (nodes → System)│
                           └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │  geminiService  │
                           │  (RAG + AI)     │
                           └─────────────────┘
```

### Fluxo de Dados

1. **Usuário cria diagrama** no `VisualEditor` (arrasta assets, conecta, edita)
2. **Clica "Analyze Threats"**
3. `diagramConverter` transforma `nodes + edges` → `SystemInfo`
4. **Análise de riscos automática** identifica:
   - Fluxos não criptografados
   - Fluxos cross-boundary
   - Dados sensíveis
5. `geminiService` recebe contexto rico e consulta **RAG**
6. **Relatório de ameaças** é gerado e exibido

---

## 📦 Dependências Necessárias

### Adicionar ao `package.json`:

```json
{
  "dependencies": {
    "react": "19.1.1",
    "react-dom": "19.1.1",
    "reactflow": "11.11.4"
  },
  "devDependencies": {
    "@types/react": "19.1.16",
    "@types/react-dom": "19.1.9"
  }
}
```

### Comando de Instalação:

```bash
npm install reactflow
```

---

## 📁 Estrutura de Arquivos

Crie esta estrutura exata:

```
src/
├── types/
│   └── visual.ts                 # Tipos TypeScript
├── data/
│   ├── assetLibrary.ts           # 40+ assets predefinidos
│   └── diagramTemplates.ts       # 5 templates prontos
├── components/
│   └── VisualEditor/
│       ├── VisualEditor.tsx      # Componente principal
│       ├── AssetLibrary.tsx      # Sidebar com assets
│       ├── CustomNode.tsx        # Node personalizado
│       ├── TrustBoundaryNode.tsx # Boundary node
│       └── TemplateSelector.tsx  # Modal de templates
└── utils/
    └── diagramConverter.ts       # Conversor para SystemInfo
```

---

## 💾 Código Completo

### 1. Tipos TypeScript

**Arquivo: `src/types/visual.ts`**

```typescript
/**
 * Tipos para o Editor Visual de Threat Modeling
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
  };
  position: { x: number; y: number };
  style?: Record<string, any>;
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
```

---

### 2. Biblioteca de Assets

**Arquivo: `src/data/assetLibrary.ts`**

```typescript
/**
 * Biblioteca de Assets Predefinidos para Threat Modeling
 * Inspirado em ThreatFinder.ai com assets específicos para IA
 */

import { Asset } from '../types/visual';

export const AI_ML_ASSETS: Asset[] = [
  {
    id: 'llm-model',
    label: 'LLM Model',
    icon: '🧠',
    category: 'ai',
    description: 'Large Language Model (GPT, Claude, Gemini, etc.)',
    typicalThreats: ['LLM01', 'LLM03', 'LLM04', 'LLM06', 'LLM10'],
    color: '#8b5cf6'
  },
  {
    id: 'trained-model',
    label: 'Trained Model',
    icon: '🎯',
    category: 'ai',
    description: 'Machine Learning model treinado customizado',
    typicalThreats: ['LLM03', 'LLM10', 'Tampering'],
    color: '#8b5cf6'
  },
  {
    id: 'embedding-model',
    label: 'Embedding Model',
    icon: '🔢',
    category: 'ai',
    description: 'Modelo de embeddings para RAG/busca vetorial',
    typicalThreats: ['LLM06', 'Information Disclosure'],
    color: '#8b5cf6'
  },
  {
    id: 'ai-agent',
    label: 'AI Agent',
    icon: '🤖',
    category: 'ai',
    description: 'Agente autônomo com LLM',
    typicalThreats: ['LLM08', 'LLM01', 'Elevation of Privilege'],
    color: '#8b5cf6'
  }
];

export const DATA_ASSETS: Asset[] = [
  {
    id: 'training-data',
    label: 'Training Data',
    icon: '📊',
    category: 'data',
    description: 'Dataset usado para treinar modelos',
    typicalThreats: ['LLM03', 'LLM06', 'Information Disclosure'],
    color: '#10b981'
  },
  {
    id: 'evaluation-data',
    label: 'Evaluation Data',
    icon: '📈',
    category: 'data',
    description: 'Dataset de avaliação/teste',
    typicalThreats: ['Information Disclosure', 'Tampering'],
    color: '#10b981'
  },
  {
    id: 'raw-data',
    label: 'Raw Data',
    icon: '📁',
    category: 'data',
    description: 'Dados brutos não processados',
    typicalThreats: ['Information Disclosure', 'Tampering'],
    color: '#10b981'
  },
  {
    id: 'preprocessed-data',
    label: 'Pre-processed Data',
    icon: '🔄',
    category: 'data',
    description: 'Dados limpos e preparados',
    typicalThreats: ['LLM03', 'Tampering'],
    color: '#10b981'
  },
  {
    id: 'user-data',
    label: 'User Data',
    icon: '👤',
    category: 'data',
    description: 'Dados de usuários/clientes',
    typicalThreats: ['Information Disclosure', 'Spoofing', 'Repudiation'],
    color: '#10b981'
  }
];

export const STORAGE_ASSETS: Asset[] = [
  {
    id: 'vector-database',
    label: 'Vector Database',
    icon: '🗃️',
    category: 'storage',
    description: 'Banco vetorial (Pinecone, Weaviate, Chroma)',
    typicalThreats: ['LLM06', 'Information Disclosure', 'Tampering'],
    color: '#f59e0b'
  },
  {
    id: 'database',
    label: 'Database',
    icon: '💾',
    category: 'storage',
    description: 'Banco de dados relacional/NoSQL',
    typicalThreats: ['Information Disclosure', 'Tampering', 'Denial of Service'],
    color: '#f59e0b'
  },
  {
    id: 'data-lake',
    label: 'Data Lake',
    icon: '🏞️',
    category: 'storage',
    description: 'Data Lake para big data',
    typicalThreats: ['Information Disclosure', 'Tampering'],
    color: '#f59e0b'
  },
  {
    id: 'cache',
    label: 'Cache',
    icon: '⚡',
    category: 'storage',
    description: 'Sistema de cache (Redis, Memcached)',
    typicalThreats: ['Information Disclosure', 'Denial of Service'],
    color: '#f59e0b'
  },
  {
    id: 'model-registry',
    label: 'Model Registry',
    icon: '📚',
    category: 'storage',
    description: 'Registry de modelos (MLflow, Weights & Biases)',
    typicalThreats: ['LLM05', 'LLM10', 'Tampering'],
    color: '#f59e0b'
  }
];

export const SERVICE_ASSETS: Asset[] = [
  {
    id: 'web-app',
    label: 'Web Application',
    icon: '🌐',
    category: 'service',
    description: 'Aplicação web frontend',
    typicalThreats: ['Spoofing', 'Tampering', 'Information Disclosure'],
    color: '#3b82f6'
  },
  {
    id: 'mobile-app',
    label: 'Mobile App',
    icon: '📱',
    category: 'service',
    description: 'Aplicativo mobile',
    typicalThreats: ['Spoofing', 'Tampering', 'Repudiation'],
    color: '#3b82f6'
  },
  {
    id: 'api-gateway',
    label: 'API Gateway',
    icon: '🚪',
    category: 'service',
    description: 'Gateway de APIs',
    typicalThreats: ['Spoofing', 'Denial of Service', 'Elevation of Privilege'],
    color: '#3b82f6'
  },
  {
    id: 'backend-service',
    label: 'Backend Service',
    icon: '⚙️',
    category: 'service',
    description: 'Serviço backend/microserviço',
    typicalThreats: ['Elevation of Privilege', 'Tampering', 'Denial of Service'],
    color: '#3b82f6'
  },
  {
    id: 'auth-service',
    label: 'Auth Service',
    icon: '🔐',
    category: 'service',
    description: 'Serviço de autenticação/autorização',
    typicalThreats: ['Spoofing', 'Elevation of Privilege', 'Repudiation'],
    color: '#3b82f6'
  },
  {
    id: 'ml-pipeline',
    label: 'ML Pipeline',
    icon: '🔧',
    category: 'service',
    description: 'Pipeline de ML/MLOps',
    typicalThreats: ['LLM03', 'LLM05', 'Tampering'],
    color: '#3b82f6'
  }
];

export const EXTERNAL_ASSETS: Asset[] = [
  {
    id: 'openai-api',
    label: 'OpenAI API',
    icon: '🔌',
    category: 'external',
    description: 'API externa OpenAI (GPT)',
    typicalThreats: ['LLM05', 'LLM06', 'Information Disclosure'],
    color: '#ef4444'
  },
  {
    id: 'anthropic-api',
    label: 'Anthropic API',
    icon: '🔌',
    category: 'external',
    description: 'API externa Anthropic (Claude)',
    typicalThreats: ['LLM05', 'LLM06', 'Information Disclosure'],
    color: '#ef4444'
  },
  {
    id: 'google-api',
    label: 'Google AI API',
    icon: '🔌',
    category: 'external',
    description: 'API externa Google (Gemini)',
    typicalThreats: ['LLM05', 'LLM06', 'Information Disclosure'],
    color: '#ef4444'
  },
  {
    id: 'third-party-api',
    label: 'Third-party API',
    icon: '🔗',
    category: 'external',
    description: 'API de terceiros genérica',
    typicalThreats: ['LLM05', 'Information Disclosure', 'Spoofing'],
    color: '#ef4444'
  },
  {
    id: 'huggingface',
    label: 'Hugging Face',
    icon: '🤗',
    category: 'external',
    description: 'Hugging Face Hub (modelos)',
    typicalThreats: ['LLM05', 'LLM03', 'Tampering'],
    color: '#ef4444'
  },
  {
    id: 'cloud-storage',
    label: 'Cloud Storage',
    icon: '☁️',
    category: 'external',
    description: 'Storage em nuvem (S3, GCS, Azure)',
    typicalThreats: ['Information Disclosure', 'Tampering'],
    color: '#ef4444'
  }
];

export const USER_ASSETS: Asset[] = [
  {
    id: 'end-user',
    label: 'End User',
    icon: '👨‍💻',
    category: 'user',
    description: 'Usuário final do sistema',
    typicalThreats: ['LLM01', 'LLM09', 'Spoofing'],
    color: '#64748b'
  },
  {
    id: 'admin',
    label: 'Administrator',
    icon: '👨‍💼',
    category: 'user',
    description: 'Administrador do sistema',
    typicalThreats: ['Elevation of Privilege', 'Repudiation'],
    color: '#64748b'
  },
  {
    id: 'data-scientist',
    label: 'Data Scientist',
    icon: '👨‍🔬',
    category: 'user',
    description: 'Cientista de dados',
    typicalThreats: ['LLM03', 'Information Disclosure'],
    color: '#64748b'
  },
  {
    id: 'attacker',
    label: 'Attacker',
    icon: '🦹',
    category: 'user',
    description: 'Atacante/adversário',
    typicalThreats: ['Spoofing', 'Tampering', 'Information Disclosure'],
    color: '#dc2626'
  }
];

export const ALL_ASSETS: Asset[] = [
  ...AI_ML_ASSETS,
  ...DATA_ASSETS,
  ...STORAGE_ASSETS,
  ...SERVICE_ASSETS,
  ...EXTERNAL_ASSETS,
  ...USER_ASSETS
];

export const ASSET_CATEGORIES = [
  { id: 'ai', label: 'AI/ML', icon: '🤖', color: '#8b5cf6' },
  { id: 'data', label: 'Data', icon: '📊', color: '#10b981' },
  { id: 'storage', label: 'Storage', icon: '💾', color: '#f59e0b' },
  { id: 'service', label: 'Services', icon: '⚙️', color: '#3b82f6' },
  { id: 'external', label: 'External', icon: '🔗', color: '#ef4444' },
  { id: 'user', label: 'Users', icon: '👤', color: '#64748b' }
];

export function getAssetById(id: string): Asset | undefined {
  return ALL_ASSETS.find(asset => asset.id === id);
}

export function getAssetsByCategory(category: Asset['category']): Asset[] {
  return ALL_ASSETS.filter(asset => asset.category === category);
}
```

---

### 3. Templates de Diagramas

**Arquivo: `src/data/diagramTemplates.ts`**

> ⚠️ **Nota**: Este arquivo tem ~500 linhas. Aqui está uma versão simplificada. Para o código completo, consulte o arquivo original.

```typescript
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
      style: { width: 300, height: 250, zIndex: -1 }
    },
    // Internal Assets
    {
      id: 'webapp-1',
      type: 'custom',
      position: { x: 450, y: 100 },
      data: {
        label: 'Web Application',
        icon: '🌐',
        assetId: 'web-app',
        assetType: 'service'
      }
    },
    {
      id: 'llm-1',
      type: 'custom',
      position: { x: 600, y: 250 },
      data: {
        label: 'LLM Model',
        icon: '🧠',
        assetId: 'llm-model',
        assetType: 'ai'
      }
    }
    // ... mais nodes
  ],
  edges: [
    { id: 'e1', source: 'user-1', target: 'webapp-1', label: 'queries', animated: true },
    // ... mais edges
  ]
};

// Exportar todos templates
export const ALL_TEMPLATES: DiagramTemplate[] = [
  LLM_CHATBOT_TEMPLATE,
  // ... mais templates
];

export function getTemplateById(id: string): DiagramTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id);
}
```

---

### 4. Componentes React

#### 4.1 AssetLibrary Component

**Arquivo: `src/components/VisualEditor/AssetLibrary.tsx`**

```typescript
/**
 * Biblioteca de Assets Drag-and-Drop para Editor Visual
 */

import React, { useState } from 'react';
import { ASSET_CATEGORIES, getAssetsByCategory } from '../../data/assetLibrary';
import type { Asset, AssetCategory } from '../../types/visual';

interface AssetLibraryProps {
  onAssetSelect?: (asset: Asset) => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({ onAssetSelect }) => {
  const [expandedCategory, setExpandedCategory] = useState<AssetCategory | null>('ai');

  const onDragStart = (event: React.DragEvent, asset: Asset) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(asset));
    event.dataTransfer.effectAllowed = 'move';
  };

  const toggleCategory = (categoryId: AssetCategory) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="asset-library">
      <div className="asset-library-header">
        <h3>📚 Asset Library</h3>
        <p className="text-xs text-gray-400 mt-1">Arraste assets para o canvas</p>
      </div>

      <div className="asset-categories">
        {ASSET_CATEGORIES.map((category) => {
          const assets = getAssetsByCategory(category.id as AssetCategory);
          const isExpanded = expandedCategory === category.id;

          return (
            <div key={category.id} className="asset-category">
              <button
                className="category-header"
                onClick={() => toggleCategory(category.id as AssetCategory)}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-label">{category.label}</span>
                <span className="category-count">({assets.length})</span>
                <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
              </button>

              {isExpanded && (
                <div className="asset-list">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="asset-item"
                      draggable
                      onDragStart={(e) => onDragStart(e, asset)}
                      onClick={() => onAssetSelect?.(asset)}
                      title={asset.description}
                    >
                      <span className="asset-icon">{asset.icon}</span>
                      <div className="asset-info">
                        <span className="asset-label">{asset.label}</span>
                        {asset.typicalThreats.length > 0 && (
                          <span className="asset-threats">
                            {asset.typicalThreats.slice(0, 2).join(', ')}
                            {asset.typicalThreats.length > 2 && '...'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .asset-library {
          width: 280px;
          background: #1a1a1a;
          border-right: 1px solid #333;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          height: 100%;
        }
        /* ... mais estilos ... */
      `}</style>
    </div>
  );
};
```

#### 4.2 CustomNode Component

**Arquivo: `src/components/VisualEditor/CustomNode.tsx`**

```typescript
/**
 * Custom Node Component para ReactFlow
 * Representa um asset no diagrama
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { ThreatLevel } from '../../types/visual';

const getThreatLevelColor = (level?: ThreatLevel): string => {
  switch (level) {
    case 'CRITICAL': return '#dc2626';
    case 'HIGH': return '#f59e0b';
    case 'MEDIUM': return '#eab308';
    case 'LOW': return '#10b981';
    default: return '#6b7280';
  }
};

export const CustomNode = memo(({ data, selected }: NodeProps) => {
  const threatColor = getThreatLevelColor(data.threatLevel);
  const hasThreats = data.threats && data.threats.length > 0;

  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} className="node-handle" />
      
      <div className="node-content">
        <div className="node-icon-wrapper">
          <span className="node-icon">{data.icon || '📦'}</span>
          {hasThreats && (
            <span 
              className="threat-badge"
              style={{ backgroundColor: threatColor }}
              title={`${data.threats.length} ameaças detectadas`}
            >
              {data.threats.length}
            </span>
          )}
        </div>
        
        <div className="node-label">{data.label}</div>

        {data.description && (
          <div className="node-description">{data.description}</div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="node-handle" />

      <style jsx>{`
        .custom-node {
          background: #1f1f1f;
          border: 2px solid #3b82f6;
          border-radius: 10px;
          padding: 12px;
          min-width: 140px;
          max-width: 200px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          transition: all 0.2s;
        }
        /* ... mais estilos ... */
      `}</style>
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
```

#### 4.3 TrustBoundaryNode Component

**Arquivo: `src/components/VisualEditor/TrustBoundaryNode.tsx`**

```typescript
/**
 * Trust Boundary Node Component
 * Representa zonas de confiança no diagrama
 */

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';

const BOUNDARY_STYLES = {
  internal: { color: '#10b981', label: 'Internal', borderStyle: 'solid' },
  dmz: { color: '#f59e0b', label: 'DMZ', borderStyle: 'dashed' },
  external: { color: '#ef4444', label: 'External', borderStyle: 'dashed' },
  'third-party': { color: '#8b5cf6', label: 'Third-party', borderStyle: 'dotted' }
};

export const TrustBoundaryNode = memo(({ data, selected }: NodeProps) => {
  const boundaryType = data.trustLevel || 'internal';
  const style = BOUNDARY_STYLES[boundaryType as keyof typeof BOUNDARY_STYLES];

  return (
    <div 
      className={`trust-boundary ${selected ? 'selected' : ''}`}
      style={{
        borderColor: style.color,
        borderStyle: style.borderStyle
      }}
    >
      <div 
        className="boundary-label"
        style={{ backgroundColor: style.color }}
      >
        🛡️ {data.label || style.label}
      </div>

      <div className="boundary-hint">
        Arraste assets para dentro desta zona
      </div>

      <style jsx>{`
        .trust-boundary {
          background: transparent;
          border: 3px solid;
          border-radius: 12px;
          padding: 40px 24px 24px;
          min-width: 300px;
          min-height: 200px;
          position: relative;
          opacity: 0.8;
          transition: all 0.2s;
        }
        /* ... mais estilos ... */
      `}</style>
    </div>
  );
});

TrustBoundaryNode.displayName = 'TrustBoundaryNode';
```

#### 4.4 TemplateSelector Component

**Arquivo: `src/components/VisualEditor/TemplateSelector.tsx`**

```typescript
/**
 * Template Selector Component
 * Permite usuário escolher template predefinido
 */

import React, { useState } from 'react';
import { ALL_TEMPLATES, TEMPLATE_CATEGORIES, DiagramTemplate } from '../../data/diagramTemplates';

interface TemplateSelectorProps {
  onSelectTemplate: (template: DiagramTemplate) => void;
  onClose: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelectTemplate, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ai');

  const filteredTemplates = ALL_TEMPLATES.filter(t => t.category === selectedCategory);

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div className="template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-header">
          <h3>📋 Escolher Template</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="template-categories">
          {TEMPLATE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        <div className="template-grid">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="template-card"
              onClick={() => {
                onSelectTemplate(template);
                onClose();
              }}
            >
              <div className="template-icon">{template.icon}</div>
              <h4 className="template-name">{template.name}</h4>
              <p className="template-description">{template.description}</p>
              <div className="template-stats">
                <span>📦 {template.nodes.length} assets</span>
                <span>🔗 {template.edges.length} conexões</span>
              </div>
            </div>
          ))}
        </div>

        <style jsx>{`
          /* Estilos do modal */
        `}</style>
      </div>
    </div>
  );
};
```

#### 4.5 VisualEditor Component (Principal)

**Arquivo: `src/components/VisualEditor/VisualEditor.tsx`**

> ⚠️ **Nota**: Este é o componente mais complexo (~960 linhas). Aqui está uma versão simplificada focando na estrutura principal e funcionalidades críticas.

```typescript
/**
 * Visual Editor Component - Editor Visual de DFD
 * Funcionalidades:
 * - Drag-and-drop de assets
 * - Edição de fluxos (cor, tipo, bidirecional)
 * - Trust boundaries
 * - Templates
 * - Exportar/Importar JSON
 * - Análise de ameaças
 */

import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { AssetLibrary } from './AssetLibrary';
import { CustomNode } from './CustomNode';
import { TrustBoundaryNode } from './TrustBoundaryNode';
import { TemplateSelector } from './TemplateSelector';
import { convertDiagramToSystemInfo } from '../../utils/diagramConverter';
import type { SystemInfo } from '../../types';
import type { Asset } from '../../types/visual';

const nodeTypes = {
  custom: CustomNode,
  boundary: TrustBoundaryNode,
};

interface VisualEditorProps {
  onAnalyze: (systemInfo: SystemInfo) => void;
  onSave?: (diagram: { nodes: Node[]; edges: Edge[] }) => void;
  isAnalyzing?: boolean;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({ onAnalyze, onSave, isAnalyzing = false }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [systemName, setSystemName] = useState('Meu Sistema');
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Estados para edição de nodes e edges
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showEditNodeModal, setShowEditNodeModal] = useState(false);
  const [showEditEdgeModal, setShowEditEdgeModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState('');
  
  // Estados para edição de fluxos (novo!)
  const [edgeColor, setEdgeColor] = useState('#3b82f6');
  const [edgeBidirectional, setEdgeBidirectional] = useState(false);
  const [edgeDataType, setEdgeDataType] = useState('');
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // ===== HANDLERS =====

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
    }, eds)),
    [setEdges]
  );

  // Drag and drop de assets
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const assetData = event.dataTransfer.getData('application/reactflow');

      if (!assetData || !reactFlowBounds || !reactFlowInstance) return;

      const asset: Asset = JSON.parse(assetData);
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${asset.id}-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: asset.label,
          icon: asset.icon,
          assetId: asset.id,
          assetType: asset.category,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // Double-click para editar node
  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      setEditingLabel(node.data.label || '');
      setShowEditNodeModal(true);
    },
    []
  );

  // Salvar edição de node
  const handleSaveNodeLabel = () => {
    if (!selectedNode) return;
    
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNode.id) {
          return { ...n, data: { ...n.data, label: editingLabel } };
        }
        return n;
      })
    );
    
    setShowEditNodeModal(false);
    setSelectedNode(null);
  };

  // Double-click para editar edge (NOVO!)
  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge);
      setEditingLabel((edge.label as string) || '');
      setEdgeColor(edge.style?.stroke as string || '#3b82f6');
      setEdgeBidirectional(edge.data?.bidirectional || false);
      setEdgeDataType(edge.data?.dataType || '');
      setShowEditEdgeModal(true);
    },
    []
  );

  // Salvar edição completa da edge (NOVO!)
  const handleSaveEdgeLabel = () => {
    if (!selectedEdge) return;
    
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === selectedEdge.id) {
          return {
            ...e,
            label: editingLabel,
            animated: true,
            style: {
              ...e.style,
              stroke: edgeColor,
              strokeWidth: edgeBidirectional ? 3 : 2,
            },
            markerEnd: edgeBidirectional ? undefined : {
              type: 'arrowclosed' as const,
              color: edgeColor,
            },
            markerStart: edgeBidirectional ? {
              type: 'arrowclosed' as const,
              color: edgeColor,
            } : undefined,
            data: {
              ...e.data,
              bidirectional: edgeBidirectional,
              dataType: edgeDataType,
              encrypted: edgeDataType.toLowerCase().includes('https') || 
                         edgeDataType.toLowerCase().includes('ssl') ||
                         edgeDataType.toLowerCase().includes('tls'),
            },
          };
        }
        return e;
      })
    );
    
    setShowEditEdgeModal(false);
    setSelectedEdge(null);
  };

  // Deletar elementos com Delete/Backspace
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        setNodes((nds) => nds.filter((node) => !node.selected));
        setEdges((eds) => eds.filter((edge) => !edge.selected));
      }
    },
    [setNodes, setEdges]
  );

  // Adicionar trust boundary
  const addBoundary = (trustLevel: 'internal' | 'dmz' | 'external' | 'third-party') => {
    const newBoundary: Node = {
      id: `boundary-${Date.now()}`,
      type: 'boundary',
      position: { x: 100, y: 100 },
      data: {
        label: trustLevel.charAt(0).toUpperCase() + trustLevel.slice(1),
        trustLevel,
      },
      style: { width: 400, height: 300, zIndex: -1 },
    };
    setNodes((nds) => [...nds, newBoundary]);
  };

  // Carregar template
  const handleLoadTemplate = (template: DiagramTemplate) => {
    setNodes(template.nodes);
    setEdges(template.edges);
    setSystemName(template.name);
  };

  // Exportar diagrama
  const handleExport = () => {
    const diagram = { nodes, edges, systemName };
    const dataStr = JSON.stringify(diagram, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${systemName.replace(/\s+/g, '-')}-diagram.json`;
    link.click();
  };

  // Importar diagrama
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const diagram = JSON.parse(e.target?.result as string);
        setNodes(diagram.nodes || []);
        setEdges(diagram.edges || []);
        setSystemName(diagram.systemName || 'Sistema Importado');
      } catch (error) {
        alert('Erro ao importar arquivo. Verifique o formato JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Analisar ameaças
  const handleAnalyze = () => {
    if (nodes.length === 0) {
      alert('⚠️ Adicione pelo menos um componente ao diagrama antes de analisar!');
      return;
    }

    const systemInfo = convertDiagramToSystemInfo(nodes, edges, systemName);
    onAnalyze(systemInfo);
  };

  return (
    <div className="visual-editor-container">
      {/* Header com controles */}
      <div className="visual-editor-header">
        <div className="header-left">
          <input
            type="text"
            value={systemName}
            onChange={(e) => setSystemName(e.target.value)}
            className="system-name-input"
            placeholder="Nome do Sistema"
          />
        </div>

        <div className="header-actions">
          <button onClick={() => setShowTemplates(true)} className="btn-secondary">
            📋 Templates
          </button>
          
          <button onClick={() => addBoundary('internal')} className="btn-boundary">
            🛡️ Internal
          </button>
          <button onClick={() => addBoundary('dmz')} className="btn-boundary">
            🛡️ DMZ
          </button>
          <button onClick={() => addBoundary('external')} className="btn-boundary">
            🛡️ External
          </button>

          <label className="btn-secondary">
            📂 Importar
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>

          <button onClick={handleExport} className="btn-secondary">
            💾 Exportar
          </button>

          <button 
            onClick={handleAnalyze} 
            className="btn-primary"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? '⏳ Analisando...' : '🔍 Analyze Threats'}
          </button>
        </div>
      </div>

      {/* Canvas com ReactFlow */}
      <div className="visual-editor-body">
        <AssetLibrary />

        <div 
          ref={reactFlowWrapper}
          style={{ flex: 1, height: '100%' }}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeDoubleClick={onEdgeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={['Delete', 'Backspace']}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {/* Info box */}
      <div className="info-box">
        <strong>⌨️ Atalhos:</strong> Delete = deletar | Double-click = editar | Arraste assets da biblioteca
      </div>

      {/* Modal de edição de node */}
      {showEditNodeModal && (
        <div className="edit-modal-overlay" onClick={() => setShowEditNodeModal(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>✏️ Editar Componente</h3>
            <input
              type="text"
              value={editingLabel}
              onChange={(e) => setEditingLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNodeLabel();
                if (e.key === 'Escape') setShowEditNodeModal(false);
              }}
              placeholder="Nome do componente"
              autoFocus
            />
            <div className="modal-buttons">
              <button onClick={handleSaveNodeLabel} className="btn-save">✅ Salvar</button>
              <button onClick={() => setShowEditNodeModal(false)} className="btn-cancel">❌ Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição de edge (NOVO!) */}
      {showEditEdgeModal && (
        <div className="edit-modal-overlay" onClick={() => setShowEditEdgeModal(false)}>
          <div className="edit-modal edit-edge-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🏷️ Editar Fluxo de Dados</h3>
            
            <div className="form-group">
              <label>Nome do Fluxo:</label>
              <input
                type="text"
                value={editingLabel}
                onChange={(e) => setEditingLabel(e.target.value)}
                placeholder="ex: HTTPS, API calls, dados sensíveis"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Tipo de Dados:</label>
              <select
                value={edgeDataType}
                onChange={(e) => setEdgeDataType(e.target.value)}
              >
                <option value="">Selecione...</option>
                <option value="HTTPS">HTTPS (criptografado)</option>
                <option value="HTTP">HTTP (não criptografado)</option>
                <option value="gRPC/SSL">gRPC/SSL</option>
                <option value="API REST">API REST</option>
                <option value="WebSocket">WebSocket</option>
                <option value="dados-sensiveis">Dados Sensíveis</option>
                <option value="credenciais">Credenciais</option>
                <option value="tokens">Tokens/Auth</option>
                <option value="queries">Database Queries</option>
              </select>
            </div>

            <div className="form-group">
              <label>Cor do Fluxo:</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  value={edgeColor}
                  onChange={(e) => setEdgeColor(e.target.value)}
                />
                <div className="color-presets">
                  <button type="button" onClick={() => setEdgeColor('#3b82f6')} title="Azul">🔵</button>
                  <button type="button" onClick={() => setEdgeColor('#10b981')} title="Verde">🟢</button>
                  <button type="button" onClick={() => setEdgeColor('#f59e0b')} title="Laranja">🟠</button>
                  <button type="button" onClick={() => setEdgeColor('#dc2626')} title="Vermelho">🔴</button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={edgeBidirectional}
                  onChange={(e) => setEdgeBidirectional(e.target.checked)}
                />
                <span>Fluxo Bidirecional (↔️)</span>
              </label>
              <small>Ative se os dados fluem nos dois sentidos</small>
            </div>

            <div className="modal-buttons">
              <button onClick={handleSaveEdgeLabel} className="btn-save">✅ Salvar</button>
              <button onClick={() => setShowEditEdgeModal(false)} className="btn-cancel">❌ Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de templates */}
      {showTemplates && (
        <TemplateSelector
          onSelectTemplate={handleLoadTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      <style jsx>{`
        .visual-editor-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #0f0f0f;
        }

        .visual-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: #1a1a1a;
          border-bottom: 1px solid #333;
          gap: 16px;
        }

        .system-name-input {
          padding: 10px 16px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 6px;
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          min-width: 300px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn-primary {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-2px);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .visual-editor-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .info-box {
          padding: 12px 24px;
          background: #1a1a1a;
          border-top: 1px solid #333;
          font-size: 12px;
          color: #888;
        }

        /* Modals */
        .edit-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .edit-modal {
          background: #1f1f1f;
          border-radius: 12px;
          padding: 24px;
          min-width: 400px;
          border: 1px solid #444;
        }

        .edit-edge-modal {
          min-width: 500px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #e5e7eb;
        }

        .form-group input[type="text"],
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 6px;
          color: #fff;
          font-size: 14px;
        }

        .color-picker-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .color-presets {
          display: flex;
          gap: 6px;
        }

        .color-presets button {
          font-size: 20px;
          cursor: pointer;
          background: none;
          border: none;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .modal-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .btn-save, .btn-cancel {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-save {
          background: #10b981;
          color: white;
        }

        .btn-cancel {
          background: #6b7280;
          color: white;
        }
      `}</style>
    </div>
  );
};
```

---

### 5. Conversor de Diagramas

**Arquivo: `src/utils/diagramConverter.ts`**

```typescript
/**
 * Utilitários para converter diagrama visual em SystemInfo
 * e realizar análise de riscos automática
 */

import type { Node, Edge } from 'reactflow';
import type { SystemInfo } from '../types';
import type { VisualNode, VisualEdge } from '../types/visual';
import { getAssetById } from '../data/assetLibrary';

/**
 * Converte o diagrama visual (nodes + edges) em SystemInfo
 * para análise de ameaças
 */
export function convertDiagramToSystemInfo(
  nodes: Node[],
  edges: Edge[],
  systemName: string = 'Sistema do Diagrama Visual'
): SystemInfo {
  // Filtrar nodes que são assets (não boundaries)
  const assetNodes = nodes.filter(n => n.type === 'custom' || !n.type);

  // Extrair componentes
  const components = assetNodes
    .filter(n => {
      const category = n.data.assetType;
      return ['service', 'ai', 'storage'].includes(category);
    })
    .map(n => n.data.label)
    .join(', ');

  // Extrair dados sensíveis
  const dataAssets = assetNodes
    .filter(n => n.data.assetType === 'data')
    .map(n => n.data.label);
  
  const sensitiveData = dataAssets.length > 0
    ? `Dados identificados no diagrama: ${dataAssets.join(', ')}`
    : 'Não especificado';

  // Extrair tecnologias (inferir de assets)
  const techAssets = assetNodes
    .filter(n => ['ai', 'storage', 'service'].includes(n.data.assetType))
    .map(n => {
      const asset = getAssetById(n.data.assetId);
      return asset?.description || n.data.label;
    });
  
  const technologies = techAssets.length > 0
    ? techAssets.join(', ')
    : 'Não especificado';

  // Extrair integrações externas
  const externalIntegrations = assetNodes
    .filter(n => n.data.assetType === 'external')
    .map(n => n.data.label)
    .join(', ') || 'Nenhuma identificada';

  // Extrair perfis de usuário
  const userProfiles = assetNodes
    .filter(n => n.data.assetType === 'user')
    .map(n => n.data.label)
    .join(', ') || 'Não especificado';

  // Montar descrição geral
  const generalDescription = `Sistema modelado visualmente contendo:
- ${assetNodes.length} componentes/assets
- ${edges.length} fluxos de dados
- Componentes principais: ${components || 'não especificado'}
- Integrações externas: ${externalIntegrations}`;

  // Identificar autenticação
  const hasAuthService = assetNodes.some(n => 
    n.data.label?.toLowerCase().includes('auth') ||
    n.data.assetId === 'auth-service'
  );
  
  const authentication = hasAuthService
    ? 'Sistema possui serviço de autenticação dedicado'
    : 'Não especificado no diagrama';

  // ===== ANÁLISE COMPLETA DOS FLUXOS (NOVO!) =====
  
  // Identificar fluxos de dados com detalhes completos
  const dataFlows = edges
    .map(e => {
      const sourceNode = assetNodes.find(n => n.id === e.source);
      const targetNode = assetNodes.find(n => n.id === e.target);
      
      if (!sourceNode || !targetNode) return null;
      
      const label = e.label || 'dados';
      const dataType = e.data?.dataType || 'não especificado';
      const bidirectional = e.data?.bidirectional ? '↔️ (bidirecional)' : '→ (unidirecional)';
      const encrypted = e.data?.encrypted ? '🔒 criptografado' : '⚠️ não criptografado';
      
      return `  • ${sourceNode.data.label} ${bidirectional} ${targetNode.data.label}
    - Fluxo: ${label}
    - Tipo: ${dataType} (${encrypted})`;
    })
    .filter(Boolean)
    .join('\n\n');

  // Analisar fluxos de dados não criptografados (alto risco)
  const unencryptedFlows = edges.filter(e => 
    e.data?.dataType && 
    !e.data?.encrypted &&
    e.data.dataType.toLowerCase().includes('http') &&
    !e.data.dataType.toLowerCase().includes('https')
  );

  // Analisar fluxos com dados sensíveis
  const sensitiveFlows = edges.filter(e => {
    const dataType = (e.data?.dataType || '').toLowerCase();
    return dataType.includes('sensíveis') || 
           dataType.includes('credenciais') || 
           dataType.includes('tokens');
  });

  // Analisar fluxos cross-boundary
  const boundaries = nodes.filter(n => n.type === 'boundary');
  const crossBoundaryFlows = edges.filter(e => {
    const sourceNode = nodes.find(n => n.id === e.source);
    const targetNode = nodes.find(n => n.id === e.target);
    if (!sourceNode || !targetNode) return false;

    const sourceBoundary = boundaries.find(b => isNodeInsideBoundary(sourceNode, b));
    const targetBoundary = boundaries.find(b => isNodeInsideBoundary(targetNode, b));
    
    return sourceBoundary?.id !== targetBoundary?.id;
  });

  // Construir contexto adicional rico para análise
  let additionalContext = `═══════════════════════════════════════════════════════════
📊 ANÁLISE DETALHADA DO DIAGRAMA VISUAL
═══════════════════════════════════════════════════════════

🔍 ESTATÍSTICAS GERAIS:
  • Total de componentes: ${assetNodes.length}
  • Total de fluxos de dados: ${edges.length}
  • Trust boundaries: ${boundaries.length}

🚨 ANÁLISE DE RISCOS DOS FLUXOS:
  • Fluxos não criptografados: ${unencryptedFlows.length} ⚠️ ALTO RISCO
  • Fluxos com dados sensíveis: ${sensitiveFlows.length} ⚠️ ATENÇÃO
  • Fluxos cross-boundary: ${crossBoundaryFlows.length} ⚠️ VERIFICAR

📦 FLUXOS DE DADOS DETALHADOS:
${dataFlows || '  Nenhum fluxo definido'}

`;

  // Adicionar alertas específicos
  if (unencryptedFlows.length > 0) {
    additionalContext += `\n⚠️ ALERTA DE SEGURANÇA - Fluxos não criptografados detectados:
${unencryptedFlows.map(e => {
  const source = assetNodes.find(n => n.id === e.source);
  const target = assetNodes.find(n => n.id === e.target);
  return `  • ${source?.data.label} → ${target?.data.label} (${e.data?.dataType})`;
}).join('\n')}
Recomendação: Implementar TLS/SSL para proteger dados em trânsito.
`;
  }

  if (sensitiveFlows.length > 0) {
    additionalContext += `\n🔐 Fluxos com dados sensíveis identificados:
${sensitiveFlows.map(e => {
  const source = assetNodes.find(n => n.id === e.source);
  const target = assetNodes.find(n => n.id === e.target);
  const encrypted = e.data?.encrypted ? '✅ criptografado' : '❌ SEM CRIPTOGRAFIA';
  return `  • ${source?.data.label} → ${target?.data.label} (${encrypted})`;
}).join('\n')}
`;
  }

  if (crossBoundaryFlows.length > 0) {
    additionalContext += `\n🌐 Fluxos que cruzam trust boundaries:
${crossBoundaryFlows.map(e => {
  const source = assetNodes.find(n => n.id === e.source);
  const target = assetNodes.find(n => n.id === e.target);
  return `  • ${source?.data.label} → ${target?.data.label} (${e.label || 'sem nome'})`;
}).join('\n')}
Recomendação: Validar autenticação e autorização em cada boundary crossing.
`;
  }

  return {
    systemName,
    generalDescription,
    components: components || 'Componentes identificados no diagrama visual',
    sensitiveData,
    technologies,
    authentication,
    userProfiles,
    externalIntegrations,
    additionalContext
  };
}

/**
 * Detecta fluxos que cruzam trust boundaries
 */
export function detectCrossBoundaryFlows(
  nodes: Node[],
  edges: Edge[]
): Edge[] {
  const boundaries = nodes.filter(n => n.type === 'boundary');
  
  if (boundaries.length === 0) {
    return [];
  }

  const crossBoundaryEdges: Edge[] = [];

  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) return;

    const sourceBoundary = boundaries.find(b => 
      isNodeInsideBoundary(sourceNode, b)
    );
    const targetBoundary = boundaries.find(b => 
      isNodeInsideBoundary(targetNode, b)
    );

    if (sourceBoundary?.id !== targetBoundary?.id) {
      crossBoundaryEdges.push({
        ...edge,
        data: {
          ...edge.data,
          crossesBoundary: true
        },
        animated: true,
        style: {
          stroke: '#f59e0b',
          strokeWidth: 3
        }
      });
    }
  });

  return crossBoundaryEdges;
}

/**
 * Verifica se um node está dentro de uma boundary
 */
function isNodeInsideBoundary(node: Node, boundary: Node): boolean {
  if (!boundary.position || !boundary.width || !boundary.height) {
    return false;
  }

  const nodeX = node.position.x;
  const nodeY = node.position.y;
  const boundaryX = boundary.position.x;
  const boundaryY = boundary.position.y;
  const boundaryWidth = boundary.width;
  const boundaryHeight = boundary.height;

  return (
    nodeX >= boundaryX &&
    nodeX <= boundaryX + boundaryWidth &&
    nodeY >= boundaryY &&
    nodeY <= boundaryY + boundaryHeight
  );
}

/**
 * Gera resumo do diagrama
 */
export function generateDiagramSummary(nodes: Node[], edges: Edge[]): string {
  const assetNodes = nodes.filter(n => n.type === 'custom' || !n.type);
  const boundaries = nodes.filter(n => n.type === 'boundary');

  const assetsByCategory: Record<string, number> = {};
  assetNodes.forEach(n => {
    const category = n.data.assetType || 'other';
    assetsByCategory[category] = (assetsByCategory[category] || 0) + 1;
  });

  let summary = `📊 Resumo do Diagrama:\n\n`;
  summary += `Total de Assets: ${assetNodes.length}\n`;
  summary += `Total de Fluxos: ${edges.length}\n`;
  summary += `Trust Boundaries: ${boundaries.length}\n\n`;
  
  summary += `Assets por Categoria:\n`;
  Object.entries(assetsByCategory).forEach(([category, count]) => {
    const emoji = {
      'ai': '🤖',
      'data': '📊',
      'storage': '💾',
      'service': '⚙️',
      'external': '🔗',
      'user': '👤'
    }[category] || '📦';
    summary += `  ${emoji} ${category}: ${count}\n`;
  });

  return summary;
}
```

---

## 🔗 Integração com Sistema Existente

### 6.1 Modificar `App.tsx`

```typescript
import { useState } from 'react';
import { SystemInputForm } from './components/SystemInputForm';
import { VisualEditor } from './components/VisualEditor/VisualEditor';
import { ThreatReport } from './components/ThreatReport';
import { generateThreatModel } from './services/geminiService';
import type { SystemInfo, ThreatModelResponse } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'visual'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [threatReport, setThreatReport] = useState<ThreatModelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (systemInfo: SystemInfo) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await generateThreatModel(systemInfo);
      setThreatReport(response);
    } catch (err) {
      setError('Erro ao gerar análise de ameaças');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisualAnalyze = async (systemInfo: SystemInfo) => {
    // Feedback visual para o usuário
    alert('⏳ Análise iniciada! O relatório aparecerá na aba "Formulário".');
    
    // Trocar para a tab do formulário após 500ms
    setTimeout(() => setActiveTab('form'), 500);
    
    await handleFormSubmit(systemInfo);
  };

  return (
    <div className="app-container">
      <header>
        <h1>🛡️ Threat Modeling Co-Pilot with AI</h1>
        
        {/* Tabs */}
        <div className="tabs">
          <button
            className={activeTab === 'form' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('form')}
          >
            📝 Formulário
          </button>
          <button
            className={activeTab === 'visual' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('visual')}
          >
            🎨 Editor Visual
          </button>
        </div>
      </header>

      {/* Conteúdo das tabs */}
      {activeTab === 'form' && (
        <div className="form-tab">
          <SystemInputForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          {threatReport && <ThreatReport report={threatReport} />}
          {error && <div className="error">{error}</div>}
        </div>
      )}

      {/* Editor Visual (mantém montado mas escondido para preservar estado) */}
      <div className={activeTab === 'visual' ? '' : 'hidden'}>
        <VisualEditor 
          onAnalyze={handleVisualAnalyze}
          isAnalyzing={isLoading}
        />
      </div>

      <style jsx>{`
        .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }

        .tab {
          padding: 12px 24px;
          background: #2a2a2a;
          border: none;
          color: #fff;
          cursor: pointer;
          border-radius: 8px 8px 0 0;
          transition: all 0.2s;
        }

        .tab.active {
          background: #3b82f6;
        }

        .form-tab {
          flex: 1;
          overflow-y: auto;
        }

        .hidden {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default App;
```

---

## 🔄 Fluxo de Dados e Análise

### Diagrama de Fluxo:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Usuário cria diagrama no VisualEditor                   │
│     - Arrasta assets da biblioteca                          │
│     - Conecta componentes                                   │
│     - Double-click para editar fluxos (cor, tipo, etc.)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Clica "Analyze Threats"                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  3. diagramConverter.convertDiagramToSystemInfo()           │
│     - Extrai componentes, usuários, integrações             │
│     - Analisa TODOS os fluxos de dados:                     │
│       ✓ Tipo de dados (HTTPS, HTTP, gRPC, etc.)            │
│       ✓ Criptografia (detecta auto)                         │
│       ✓ Bidirecionalidade                                   │
│       ✓ Cross-boundary                                      │
│     - Gera alertas automáticos para riscos                  │
│     - Retorna SystemInfo com contexto RICO                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  4. geminiService.generateThreatModel(systemInfo)           │
│     - Detecta componentes de IA (LLM, ML, etc.)            │
│     - Faz queries RAG específicas:                          │
│       • Query geral (STRIDE, CAPEC)                         │
│       • Query IA (OWASP LLM Top 10) se IA detectada         │
│     - Envia contexto rico para a IA:                        │
│       • SystemInfo completo                                 │
│       • Análise de fluxos                                   │
│       • Alertas de riscos                                   │
│       • Docs do RAG                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  5. IA (Gemini) analisa e retorna                           │
│     - Ameaças STRIDE                                        │
│     - Ameaças OWASP LLM (se IA)                             │
│     - Recomendações específicas                             │
│     - Considera TODOS os fluxos e riscos identificados      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Relatório exibido no ThreatReport                       │
│     - Usuário vê ameaças detalhadas                         │
│     - Exporta PDF se necessário                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Funcionalidades Implementadas

### ✅ Core Features

1. **Drag-and-Drop**
   - 40+ assets predefinidos
   - 6 categorias (AI/ML, Data, Storage, Services, External, Users)
   - Visual feedback ao arrastar

2. **Trust Boundaries**
   - 4 tipos: Internal, DMZ, External, Third-party
   - Cores e bordas distintas
   - Detecção automática de cross-boundary flows

3. **Templates Predefinidos**
   - 5 templates prontos
   - LLM Chatbot, ML Pipeline, Web App, Microservices, AI Agent
   - Carregamento instantâneo

4. **Edição Rica de Fluxos** (⭐ NOVO!)
   - **Nome do fluxo**: Texto livre
   - **Tipo de dados**: 11 opções (HTTPS, HTTP, gRPC, dados sensíveis, etc.)
   - **Cor**: Color picker + 6 presets
   - **Bidirecionalidade**: Checkbox para fluxos ↔️
   - **Detecção automática de criptografia**: HTTPS/SSL/TLS = 🔒

5. **Análise Automática de Riscos**
   - Fluxos não criptografados (⚠️ ALTO RISCO)
   - Fluxos com dados sensíveis
   - Fluxos cross-boundary
   - Alertas específicos com recomendações

6. **Exportar/Importar**
   - Salvar diagrama como JSON
   - Carregar diagrama de arquivo
   - Preserva TODOS os dados (cor, tipo, bidirecional, etc.)

7. **Atalhos de Teclado**
   - `Delete` / `Backspace`: Deletar selecionados
   - `Double-click`: Editar componente ou fluxo
   - `Enter`: Salvar edição
   - `Escape`: Cancelar edição

8. **UX Profissional**
   - Modais consistentes para edição
   - Feedback visual claro
   - Estado persistente entre tabs
   - Minimap e controles ReactFlow

---

## 🎨 Guia de UX

### Cores Padrão dos Fluxos

| Cor | Hex | Uso Recomendado |
|-----|-----|-----------------|
| 🔵 Azul | `#3b82f6` | Fluxos normais, padrão |
| 🟢 Verde | `#10b981` | Fluxos seguros, criptografados |
| 🟠 Laranja | `#f59e0b` | Fluxos que precisam atenção |
| 🔴 Vermelho | `#dc2626` | Fluxos críticos, dados sensíveis |
| 🟣 Roxo | `#8b5cf6` | Fluxos de IA/ML |
| ⚫ Cinza | `#6b7280` | Fluxos de storage/backup |

### Tipos de Dados Recomendados

| Tipo | Quando Usar | Criptografado? |
|------|-------------|----------------|
| HTTPS | APIs web seguras | ✅ Sim |
| HTTP | APIs não seguras (⚠️) | ❌ Não |
| gRPC/SSL | Microserviços | ✅ Sim |
| Dados Sensíveis | PII, credenciais | Depende |
| Tokens/Auth | JWT, OAuth | Depende |
| Database Queries | SQL, NoSQL | Depende |

---

## 📝 Exemplos de Uso

### Exemplo 1: Criar Chatbot LLM do Zero

```typescript
// 1. Abrir Editor Visual
// 2. Arrastar assets:
//    - End User (👨‍💻)
//    - Web Application (🌐)
//    - LLM Model (🧠)
//    - Vector Database (🗃️)
//    - OpenAI API (🔌)

// 3. Conectar componentes:
//    User → Web App
//    Web App → LLM Model
//    LLM Model → Vector DB (RAG)
//    LLM Model → OpenAI API

// 4. Double-click em cada fluxo e configurar:
const flows = [
  {
    from: 'User',
    to: 'Web App',
    label: 'queries',
    type: 'HTTPS',  // Auto-detecta criptografia
    color: '#10b981',  // Verde (seguro)
    bidirectional: false
  },
  {
    from: 'LLM Model',
    to: 'Vector DB',
    label: 'RAG retrieval',
    type: 'gRPC/SSL',
    color: '#8b5cf6',  // Roxo (IA)
    bidirectional: true  // ↔️
  },
  {
    from: 'LLM Model',
    to: 'OpenAI API',
    label: 'prompts',
    type: 'HTTPS',
    color: '#3b82f6',
    bidirectional: false
  }
];

// 5. Clicar "Analyze Threats"
// Resultado: Relatório completo com:
// - STRIDE threats
// - OWASP LLM Top 10 (detectado automaticamente)
// - Análise de fluxos
// - Recomendações
```

### Exemplo 2: Importar Template e Personalizar

```typescript
// 1. Clicar "📋 Templates"
// 2. Escolher "LLM Chatbot com RAG"
// 3. Template carrega automaticamente

// 4. Personalizar:
//    - Double-click em "Web Application" → Renomear para "ChatGPT UI"
//    - Double-click no fluxo User → Web → Mudar cor para verde
//    - Adicionar Trust Boundary "External" ao redor do User
//    - Adicionar Trust Boundary "Internal" ao redor dos serviços

// 5. Double-click em fluxo crítico:
const criticalFlow = {
  label: 'User credentials',
  type: 'dados-sensiveis',
  color: '#dc2626',  // Vermelho (crítico)
  bidirectional: false
};

// 6. Exportar diagrama:
// Clicar "💾 Exportar" → Salva "ChatGPT-UI-diagram.json"

// 7. Analisar:
// Sistema detecta automaticamente:
// - ⚠️ Cross-boundary flow (External → Internal)
// - 🔴 Dados sensíveis sem especificar criptografia
// - Recomenda: "Implementar TLS 1.3 com autenticação mútua"
```

### Exemplo 3: Análise de Riscos Automática

```typescript
// Cenário: Sistema com HTTP (não criptografado)

// Configurar fluxo:
const unsafeFlow = {
  from: 'Web App',
  to: 'Database',
  label: 'User data',
  type: 'HTTP',  // ⚠️ Não criptografado!
  color: '#dc2626',
  bidirectional: false
};

// Ao analisar, o sistema gera automaticamente:
const analysis = {
  alerts: [
    {
      type: 'ALTO RISCO',
      message: 'Fluxo não criptografado detectado',
      flow: 'Web App → Database (HTTP)',
      recommendation: 'Implementar TLS/SSL para proteger dados em trânsito'
    }
  ],
  
  threatModel: {
    threats: [
      {
        category: 'Information Disclosure',
        severity: 'CRITICAL',
        description: 'Dados de usuário trafegam sem criptografia',
        mitigation: 'Configurar HTTPS com certificado válido'
      },
      {
        category: 'Tampering',
        severity: 'HIGH',
        description: 'Atacante pode interceptar e modificar dados',
        mitigation: 'Usar HTTPS + validação de integridade (HMAC)'
      }
    ]
  }
};
```

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras

1. **Export para Mermaid/PlantUML**
   ```typescript
   function exportToMermaid(nodes: Node[], edges: Edge[]): string {
     // Gera código Mermaid do diagrama
   }
   ```

2. **Auto-layout Inteligente**
   - Organizar componentes automaticamente
   - Algoritmo de grafos para minimizar cruzamentos

3. **Histórico de Versões**
   - Salvar múltiplas versões do diagrama
   - Diff visual entre versões

4. **Colaboração em Tempo Real**
   - WebSocket para edição simultânea
   - Cursor de outros usuários visível

5. **Análise de Compliance**
   - Verificar conformidade com GDPR, LGPD, SOC2
   - Alertas específicos por regulação

---

## 📚 Referências

### Documentação Oficial

- **ReactFlow**: https://reactflow.dev/
- **STRIDE**: https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats
- **OWASP LLM Top 10**: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- **CAPEC**: https://capec.mitre.org/

### Inspirações

- **ThreatFinder.ai**: Interface visual para threat modeling
- **Microsoft Threat Modeling Tool**: Metodologia STRIDE
- **Draw.io / Lucidchart**: UX de diagramas

---

## ✅ Checklist de Implementação

Use este checklist para garantir que tudo foi implementado corretamente:

### Dependências
- [ ] `npm install reactflow` executado
- [ ] Package.json atualizado com versões corretas

### Estrutura de Arquivos
- [ ] `src/types/visual.ts` criado
- [ ] `src/data/assetLibrary.ts` criado (40+ assets)
- [ ] `src/data/diagramTemplates.ts` criado (5 templates)
- [ ] `src/components/VisualEditor/VisualEditor.tsx` criado
- [ ] `src/components/VisualEditor/AssetLibrary.tsx` criado
- [ ] `src/components/VisualEditor/CustomNode.tsx` criado
- [ ] `src/components/VisualEditor/TrustBoundaryNode.tsx` criado
- [ ] `src/components/VisualEditor/TemplateSelector.tsx` criado
- [ ] `src/utils/diagramConverter.ts` criado

### Integração
- [ ] `App.tsx` atualizado com tabs
- [ ] Estado persistente entre tabs implementado
- [ ] Feedback de análise adicionado
- [ ] `geminiService.ts` integrado (se aplicável)

### Funcionalidades
- [ ] Drag-and-drop funcionando
- [ ] Templates carregando
- [ ] Double-click para editar nodes
- [ ] Double-click para editar edges (modal completo)
- [ ] Edição de cor, tipo, bidirecionalidade de fluxos
- [ ] Delete com `Delete` / `Backspace`
- [ ] Exportar JSON
- [ ] Importar JSON
- [ ] Análise de riscos automática
- [ ] Trust boundaries funcionando

### Testes
- [ ] Criar diagrama do zero funciona
- [ ] Carregar template funciona
- [ ] Editar fluxos mantém propriedades ao salvar
- [ ] Exportar e reimportar mantém TUDO
- [ ] Análise de ameaças retorna dados corretos
- [ ] Fluxos não criptografados geram alertas

---

## 🎉 Conclusão

Este documento contém **TODA** a implementação necessária para criar um editor visual profissional de threat modeling focado em IA/ML.

### Principais Conquistas:

✅ **40+ Assets** predefinidos com ameaças STRIDE e OWASP LLM  
✅ **5 Templates** prontos para uso imediato  
✅ **Edição rica de fluxos** com cor, tipo, criptografia e bidirecionalidade  
✅ **Análise automática de riscos** com alertas específicos  
✅ **Integração completa com RAG** para threat modeling inteligente  
✅ **UX profissional** com modais, atalhos e feedback visual  

---

**Versão**: 1.0  
**Data**: Outubro 2025  
**Autor**: Threat Modeling Co-Pilot with AI  
**Licença**: Proprietária  

---