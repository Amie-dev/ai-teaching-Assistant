import { ChatMessage, DocumentRecord, HealthStatus, PageDetails, RouteLabel } from './types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch system status');
  return res.json();
}

export async function fetchDocuments(): Promise<DocumentRecord[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  const data = await res.json();
  return data.documents || [];
}

export async function uploadDocuments(files: File[]): Promise<DocumentRecord[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const res = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to upload documents');
  }

  return data.documents || [];
}

export async function deleteDocument(documentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${documentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message || 'Failed to delete document');
  }
}

export async function fetchDocumentPage(documentId: string, pageNumber: number): Promise<PageDetails> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/pages/${pageNumber}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message || 'Failed to fetch page text');
  }
  return res.json();
}

export interface ChatResponse {
  success: boolean;
  conversationId: string;
  message: ChatMessage;
  route: RouteLabel;
  confidence: number;
  latencyMs: number;
  socraticTurnCount: number;
}

export async function sendChatMessage(
  question: string,
  conversationId?: string,
  forceDirectAnswer = false
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      conversationId,
      forceDirectAnswer,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to send chat message');
  }

  return data;
}
