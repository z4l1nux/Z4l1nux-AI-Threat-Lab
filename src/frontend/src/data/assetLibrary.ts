/**
 * Biblioteca de Assets Predefinidos para Threat Modeling
 * Focado em sistemas com IA/ML e aplicações web/empresariais
 */

import { Asset } from '../types/visual';

export const AI_ML_ASSETS: Asset[] = [
  {
    id: 'llm-model',
    label: 'LLM Model',
    icon: '🧠',
    category: 'ai',
    description: 'Large Language Model (GPT, Claude, Gemini, etc.)',
    typicalThreats: ['LLM01', 'LLM03', 'LLM04', 'LLM06', 'LLM10', 'Information Disclosure'],
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
  },
  {
    id: 'prompt-manager',
    label: 'Prompt Manager',
    icon: '📝',
    category: 'ai',
    description: 'Sistema de gerenciamento de prompts',
    typicalThreats: ['LLM01', 'Tampering'],
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
  },
  {
    id: 'sensitive-data',
    label: 'Sensitive Data',
    icon: '🔒',
    category: 'data',
    description: 'Dados sensíveis (PII, credenciais)',
    typicalThreats: ['Information Disclosure', 'Tampering', 'Spoofing'],
    color: '#10b981'
  }
];

export const STORAGE_ASSETS: Asset[] = [
  {
    id: 'vector-database',
    label: 'Vector Database',
    icon: '🗃️',
    category: 'storage',
    description: 'Banco vetorial (Pinecone, Weaviate, Chroma, Neo4j)',
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
  },
  {
    id: 'file-storage',
    label: 'File Storage',
    icon: '📦',
    category: 'storage',
    description: 'Armazenamento de arquivos',
    typicalThreats: ['Information Disclosure', 'Tampering'],
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
  },
  {
    id: 'load-balancer',
    label: 'Load Balancer',
    icon: '⚖️',
    category: 'service',
    description: 'Balanceador de carga',
    typicalThreats: ['Denial of Service', 'Spoofing'],
    color: '#3b82f6'
  },
  {
    id: 'message-queue',
    label: 'Message Queue',
    icon: '📬',
    category: 'service',
    description: 'Fila de mensagens (RabbitMQ, Kafka)',
    typicalThreats: ['Tampering', 'Information Disclosure', 'Repudiation'],
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
  },
  {
    id: 'payment-gateway',
    label: 'Payment Gateway',
    icon: '💳',
    category: 'external',
    description: 'Gateway de pagamento',
    typicalThreats: ['Spoofing', 'Tampering', 'Information Disclosure'],
    color: '#ef4444'
  },
  {
    id: 'oauth-provider',
    label: 'OAuth Provider',
    icon: '🔑',
    category: 'external',
    description: 'Provedor OAuth (Google, GitHub)',
    typicalThreats: ['Spoofing', 'Elevation of Privilege'],
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
  },
  {
    id: 'developer',
    label: 'Developer',
    icon: '👨‍💻',
    category: 'user',
    description: 'Desenvolvedor',
    typicalThreats: ['Tampering', 'Elevation of Privilege'],
    color: '#64748b'
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

