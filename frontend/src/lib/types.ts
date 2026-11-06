export type DocumentStatus = 'uploaded' | 'indexing' | 'ready' | 'failed';

export interface DocumentRecord {
  documentId: string;
  fileName: string;
  fileSize: number;
  uploadTime: string;
  pageCount: number;
  status: DocumentStatus;
  emptyPageCount: number;
  warnings?: string[];
  errorMessage?: string;
  checksum: string;
}

export interface SourceCitation {
  fileName: string;
  pageNumber: number;
  snippet?: string;
}

export type RouteLabel = 'factual' | 'conceptual' | 'unsupported' | 'fallback';

export interface ChatMessage {
  id: string;
  role: 'student' | 'assistant' | 'system';
  text: string;
  routeLabel?: RouteLabel;
  sources?: SourceCitation[];
  timestamp: string;
  isGuidingQuestion?: boolean;
}

export interface PageDetails {
  documentId: string;
  fileName: string;
  pageNumber: number;
  text: string;
  isEmpty: boolean;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  services: {
    chromaOnline: boolean;
    hasGoogleKey?: boolean;
    hasOpenAiKey: boolean;
    hasGroqKey: boolean;
  };
}

