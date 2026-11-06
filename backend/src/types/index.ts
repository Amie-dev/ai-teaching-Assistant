export type DocumentStatus = 'uploaded' | 'indexing' | 'ready' | 'failed';

export interface DocumentRecord {
  documentId: string;
  classroomId?: string;
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

export interface PageRecord {
  pageNumber: number;
  text: string;
  isEmpty: boolean;
}

export interface ChunkRecord {
  chunkId: string;
  documentId: string;
  classroomId?: string;
  fileName: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  embedding?: number[];
}

export interface SourceCitation {
  fileName: string;
  pageNumber: number;
  snippet?: string;
}

export type RouteLabel = 'factual' | 'conceptual' | 'unsupported' | 'fallback';

export interface ClassificationResult {
  label: 'factual' | 'conceptual';
  confidence: number;
  reason: string;
}

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  classroomId?: string;
  fileName: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  similarity: number; // 0 to 1
  distance?: number;
}

export interface ChatMessage {
  id: string;
  role: 'student' | 'assistant' | 'system';
  text: string;
  routeLabel?: RouteLabel;
  sources?: SourceCitation[];
  timestamp: string;
  isGuidingQuestion?: boolean;
}

export interface ConversationRecord {
  conversationId: string;
  classroomId?: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  lastRoute?: RouteLabel;
  lastRetrievedChunkIds?: string[];
  socraticTurnCount: number;
  activeConcept?: string;
}

export interface QueryLogRecord {
  id: string;
  timestamp: string;
  conversationId?: string;
  question: string;
  routeLabel: RouteLabel;
  confidence: number;
  retrievedChunkCount: number;
  topSimilarityScore: number;
  retrievedChunkIds: string[];
  latencyMs: number;
}
