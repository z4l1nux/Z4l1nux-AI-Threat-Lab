// Serviço para comunicação com o backend RAG
export interface RAGSearchResult {
  documento: {
    pageContent: string;
    metadata: any;
  };
  score: number;
}

export interface RAGContext {
  context: string;
  sources: RAGSearchResult[];
  totalDocuments: number;
  confidence: number;
}

export interface DocumentUploadResult {
  message: string;
  document: {
    name: string;
    size: number;
    contentLength: number;
  };
  statistics: {
    totalChunks: number;
    totalDocumentos: number;
  };
}

export interface SystemStatistics {
  totalChunks: number;
  totalDocumentos: number;
  cacheValid: boolean;
  timestamp: string;
}

class RAGService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  }

  async checkHealth(): Promise<{
    status: string;
    services: {
      neo4j: string;
      rag: string;
    };
  }> {
    const response = await fetch(`${this.baseURL}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }

  async initialize(): Promise<{
    message: string;
    statistics: SystemStatistics;
  }> {
    const response = await fetch(`${this.baseURL}/api/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to initialize RAG system');
    }

    return response.json();
  }

  async uploadDocument(file: File): Promise<DocumentUploadResult> {
    const formData = new FormData();
    formData.append('document', file);

    const response = await fetch(`${this.baseURL}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload document');
    }

    return response.json();
  }

  async uploadText(name: string, content: string): Promise<DocumentUploadResult> {
    const response = await fetch(`${this.baseURL}/api/documents/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload text');
    }

    return response.json();
  }

  async search(query: string, limit: number = 5): Promise<{
    query: string;
    results: RAGSearchResult[];
    count: number;
  }> {
    const response = await fetch(`${this.baseURL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Search failed');
    }

    return response.json();
  }

  async searchContext(query: string, limit: number = 5): Promise<RAGContext & { query: string }> {
    const response = await fetch(`${this.baseURL}/api/search/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Context search failed');
    }

    return response.json();
  }

  async getStatistics(): Promise<SystemStatistics> {
    const response = await fetch(`${this.baseURL}/api/statistics`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get statistics');
    }

    return response.json();
  }

  async clearCache(): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/api/cache`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to clear cache');
    }

    return response.json();
  }

  async getSupportedExtensions(): Promise<{
    extensions: string[];
    maxFileSize: string;
  }> {
    const response = await fetch(`${this.baseURL}/api/supported-extensions`);
    
    if (!response.ok) {
      throw new Error('Failed to get supported extensions');
    }

    return response.json();
  }
}

export const ragService = new RAGService();
