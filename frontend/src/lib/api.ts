import {
  ChatMessage,
  Classroom,
  DocumentRecord,
  Hall,
  HallMessage,
  HealthStatus,
  Member,
  PageDetails,
  RouteLabel,
  User,
} from './types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ai_tutor_token');
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('ai_tutor_token', token);
  } else {
    localStorage.removeItem('ai_tutor_token');
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
    throw new Error(data?.error || data?.message || defaultErrorMsg);
  }

  return data as T;
}

// ----------------- Auth APIs -----------------

export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await safeParseJson<{ user: User; token: string }>(res, 'Failed to login');
  setAuthToken(data.token);
  return data;
}

export async function signupUser(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await safeParseJson<{ user: User; token: string }>(res, 'Failed to signup');
  setAuthToken(data.token);
  return data;
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      setAuthToken(null);
      return null;
    }
    const data = await safeParseJson<{ user: User }>(res, 'Failed to get current user');
    return data.user;
  } catch {
    return null;
  }
}

// ----------------- Classroom APIs -----------------

export async function fetchClassrooms(): Promise<Classroom[]> {
  const res = await fetch(`${API_BASE}/classrooms`, {
    headers: { ...getAuthHeaders() },
  });
  const data = await safeParseJson<{ classrooms: Classroom[] }>(res, 'Failed to fetch classrooms');
  return data.classrooms || [];
}

export async function createClassroom(name: string, subject: string, description?: string): Promise<Classroom> {
  const res = await fetch(`${API_BASE}/classrooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ name, subject, description }),
  });
  const data = await safeParseJson<{ classroom: Classroom }>(res, 'Failed to create classroom');
  return data.classroom;
}

export async function joinClassroom(joinCode: string): Promise<Classroom> {
  const res = await fetch(`${API_BASE}/classrooms/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ joinCode }),
  });
  const data = await safeParseJson<{ classroom: Classroom }>(res, 'Failed to join classroom');
  return data.classroom;
}

export async function fetchClassroomDetails(classroomId: string): Promise<Classroom> {
  const res = await fetch(`${API_BASE}/classrooms/${classroomId}`, {
    headers: { ...getAuthHeaders() },
  });
  const data = await safeParseJson<{ classroom: Classroom }>(res, 'Failed to fetch classroom');
  return data.classroom;
}

export async function fetchMembers(classroomId: string): Promise<Member[]> {
  const res = await fetch(`${API_BASE}/classrooms/${classroomId}/members`, {
    headers: { ...getAuthHeaders() },
  });
  const data = await safeParseJson<{ members: Member[] }>(res, 'Failed to load members');
  return data.members || [];
}

// ----------------- Discussion Halls APIs -----------------

export async function fetchHalls(classroomId: string): Promise<Hall[]> {
  const res = await fetch(`${API_BASE}/classrooms/${classroomId}/halls`, {
    headers: { ...getAuthHeaders() },
  });
  const data = await safeParseJson<{ halls: Hall[] }>(res, 'Failed to load discussion halls');
  return data.halls || [];
}

export async function createHall(
  classroomId: string,
  name: string,
  description?: string,
  topic?: string,
  type: 'OPEN' | 'PRIVATE' | 'ANNOUNCEMENT' = 'OPEN'
): Promise<Hall> {
  const res = await fetch(`${API_BASE}/classrooms/${classroomId}/halls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ name, description, topic, type }),
  });
  const data = await safeParseJson<{ hall: Hall }>(res, 'Failed to create hall');
  return data.hall;
}

export async function fetchHallMessages(hallId: string): Promise<HallMessage[]> {
  const res = await fetch(`${API_BASE}/classrooms/halls/${hallId}/messages`, {
    headers: { ...getAuthHeaders() },
  });
  const data = await safeParseJson<{ messages: HallMessage[] }>(res, 'Failed to fetch messages');
  return data.messages || [];
}

export async function updateHallStatus(hallId: string, status: 'ACTIVE' | 'LOCKED' | 'ARCHIVED'): Promise<Hall> {
  const res = await fetch(`${API_BASE}/classrooms/halls/${hallId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ status }),
  });
  const data = await safeParseJson<{ hall: Hall }>(res, 'Failed to update hall status');
  return data.hall;
}

// ----------------- Resources / Documents APIs -----------------

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  return await safeParseJson<HealthStatus>(res, 'Failed to fetch system status');
}

export async function fetchDocuments(classroomId?: string): Promise<DocumentRecord[]> {
  const url = classroomId ? `${API_BASE}/documents?classroomId=${classroomId}` : `${API_BASE}/documents`;
  const res = await fetch(url, {
    headers: { ...getAuthHeaders() },
  });
  const data = await safeParseJson<{ documents: DocumentRecord[] }>(res, 'Failed to fetch documents');
  return data.documents || [];
}

export async function uploadDocuments(files: File[], classroomId?: string): Promise<DocumentRecord[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  if (classroomId) {
    formData.append('classroomId', classroomId);
  }

  const res = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: formData,
  });

  const data = await safeParseJson<{ documents: DocumentRecord[] }>(res, 'Failed to upload documents');
  return data.documents || [];
}

export async function deleteDocument(documentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${documentId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  await safeParseJson<{ success: boolean }>(res, 'Failed to delete document');
}

export async function fetchDocumentPage(documentId: string, pageNumber: number): Promise<PageDetails> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/pages/${pageNumber}`);
  return await safeParseJson<PageDetails>(res, `Failed to fetch page ${pageNumber}`);
}

// ----------------- Chat APIs -----------------

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
  forceDirectAnswer = false,
  classroomId?: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      question,
      conversationId,
      forceDirectAnswer,
      classroomId,
    }),
  });

  return await safeParseJson<ChatResponse>(res, 'Failed to process chat message');
}
