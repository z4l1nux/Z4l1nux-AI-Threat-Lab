// Serviço otimizado para comunicação com o backend RAG
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

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class RAGService {
  private baseURL: string;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 segundo

  constructor() {
    this.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  }

  private isCacheValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && this.isCacheValid(entry)) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    context: string,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        console.warn(`⚠️ ${context} (tentativa ${attempt}/${retries}):`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error(`${context} falhou após ${retries} tentativas`);
  }

  async checkHealth(): Promise<{
    status: string;
    services: {
      neo4j: string;
      rag: string;
    };
  }> {
    const cacheKey = 'health';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const result = await this.retryRequest(
      async () => {
        const response = await fetch(`${this.baseURL}/api/health`);
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.statusText}`);
        }
        return response.json() as Promise<{
          status: string;
          services: {
            neo4j: string;
            rag: string;
          };
        }>;
      },
      'Health check'
    );

    this.setCache(cacheKey, result, 30000); // Cache por 30 segundos
    return result;
  }

  async initialize(): Promise<{
    message: string;
    statistics: SystemStatistics;
  }> {
    return await this.retryRequest(
      async () => {
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

        return response.json() as Promise<{
          message: string;
          statistics: SystemStatistics;
        }>;
      },
      'Initialize RAG system'
    );
  }

  async uploadDocument(file: File): Promise<DocumentUploadResult> {
    return await this.retryRequest(
      async () => {
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

        const result = await response.json();
        
        // Invalidar cache de estatísticas
        this.cache.delete('statistics');
        
        return result;
      },
      'Upload document'
    );
  }

  async uploadText(name: string, content: string): Promise<DocumentUploadResult> {
    return await this.retryRequest(
      async () => {
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

        const result = await response.json();
        
        // Invalidar cache de estatísticas
        this.cache.delete('statistics');
        
        return result;
      },
      'Upload text'
    );
  }

  async search(query: string, limit: number = 5): Promise<{
    query: string;
    results: RAGSearchResult[];
    count: number;
  }> {
    const cacheKey = `search:${query}:${limit}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const result = await this.retryRequest(
      async () => {
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

        return response.json() as Promise<{
          query: string;
          results: RAGSearchResult[];
          count: number;
        }>;
      },
      'Search'
    );

    this.setCache(cacheKey, result, 60000); // Cache por 1 minuto
    return result;
  }

  async searchContext(query: string, limit: number = 5): Promise<RAGContext & { query: string }> {
    const cacheKey = `context:${query}:${limit}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const result = await this.retryRequest(
      async () => {
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

        return response.json() as Promise<RAGContext & { query: string }>;
      },
      'Context search'
    );

    this.setCache(cacheKey, result, 60000); // Cache por 1 minuto
    return result;
  }

  async getStatistics(): Promise<SystemStatistics> {
    const cacheKey = 'statistics';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const result = await this.retryRequest(
      async () => {
        const response = await fetch(`${this.baseURL}/api/statistics`);
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to get statistics');
        }

        return response.json() as Promise<SystemStatistics>;
      },
      'Get statistics'
    );

    this.setCache(cacheKey, result, 30000); // Cache por 30 segundos
    return result;
  }

  async clearCache(): Promise<{ message: string }> {
    return await this.retryRequest(
      async () => {
        const response = await fetch(`${this.baseURL}/api/cache`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to clear cache');
        }

        // Limpar cache local também
        this.cache.clear();
        
        return response.json() as Promise<{ message: string }>;
      },
      'Clear cache'
    );
  }

  async getSupportedExtensions(): Promise<{
    extensions: string[];
    maxFileSize: string;
  }> {
    const cacheKey = 'extensions';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const result = await this.retryRequest(
      async () => {
        const response = await fetch(`${this.baseURL}/api/supported-extensions`);
        
        if (!response.ok) {
          throw new Error('Failed to get supported extensions');
        }

        return response.json() as Promise<{
          extensions: string[];
          maxFileSize: string;
        }>;
      },
      'Get supported extensions'
    );

    this.setCache(cacheKey, result, 300000); // Cache por 5 minutos
    return result;
  }

  // Método para limpar cache local
  clearLocalCache(): void {
    this.cache.clear();
  }

  // Método para obter estatísticas do cache local
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

export const ragService = new RAGService();