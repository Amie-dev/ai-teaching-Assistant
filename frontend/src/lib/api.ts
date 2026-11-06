import { ChatMessage, DocumentRecord, HealthStatus, PageDetails, RouteLabel } from './types';

const API_BASE = '/api';

async function safeParseJson<T>(res: Response, defaultErrorMsg: string): Promise<T> {
  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    if (!res.ok) {
      throw new Error(`Backend Error (${res.status}): ${text || defaultErrorMsg}. Please verify backend is running on port 5000.`);
    }
    throw new Error(`Invalid response format: ${text.slice(0, 80)}`);
  }

  if (!res.ok) {
    throw new Error(data?.error?.message || data?.message || defaultErrorMsg);
  }

  return data as T;
}

export async function fetchHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await safeParseJson<HealthStatus>(res, 'Failed to fetch system status');
  } catch (err: any) {
    throw new Error(err.message || 'Cannot reach backend server');
  }
}

export async function fetchDocuments(): Promise<DocumentRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/documents`);
    const data = await safeParseJson<{ documents: DocumentRecord[] }>(res, 'Failed to fetch documents');
    return data.documents || [];
  } catch (err: any) {
    throw new Error(err.message || 'Cannot reach backend documents API');
  }
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

  const data = await safeParseJson<{ documents: DocumentRecord[] }>(res, 'Failed to upload documents');
  return data.documents || [];
}

export async function deleteDocument(documentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${documentId}`, {
    method: 'DELETE',
  });
  await safeParseJson<{ success: boolean }>(res, 'Failed to delete document');
}

export async function fetchDocumentPage(documentId: string, pageNumber: number): Promise<PageDetails> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/pages/${pageNumber}`);
  return await safeParseJson<PageDetails>(res, `Failed to fetch page ${pageNumber}`);
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

  return await safeParseJson<ChatResponse>(res, 'Failed to process chat message');
}
