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
