export type DocumentStatus = 'uploaded' | 'indexing' | 'ready' | 'failed';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

export interface Classroom {
  id: string;
  name: string;
  subject: string;
  description?: string;
  joinCode: string;
  role: 'TEACHER' | 'TA' | 'STUDENT';
  status: 'ACTIVE' | 'ARCHIVED';
  aiEnabled: boolean;
  socraticTurnLimit: number;
  memberCount: number;
  resourceCount?: number;
  hallCount?: number;
  createdAt: string;
}

export interface Hall {
  id: string;
  classroomId: string;
  name: string;
  description?: string;
  topic?: string;
  type: 'OPEN' | 'PRIVATE' | 'ANNOUNCEMENT';
  status: 'ACTIVE' | 'LOCKED' | 'ARCHIVED';
  messageCount?: number;
  createdById?: string;
  createdAt: string;
}

export interface HallMessage {
  id: string;
  hallId: string;
  senderId?: string | null;
  senderName: string;
  isAssistant: boolean;
  text: string;
  routeLabel?: RouteLabel | null;
  sources?: SourceCitation[];
  pinned?: boolean;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'TEACHER' | 'TA' | 'STUDENT';
  joinedAt: string;
}

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
  version?: string;
  timestamp: string;
  services: {
    chromaOnline: boolean;
    hasGoogleKey?: boolean;
    hasOpenAiKey: boolean;
    hasGroqKey: boolean;
  };
}
