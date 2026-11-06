'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { DocumentPanel } from '../components/DocumentPanel';
import { ChatPane } from '../components/ChatPane';
import { SourceViewer } from '../components/SourceViewer';
import {
  ChatMessage,
  DocumentRecord,
  HealthStatus,
  SourceCitation,
} from '../lib/types';
import {
  fetchHealth,
  fetchDocuments,
  uploadDocuments,
  deleteDocument,
  sendChatMessage,
} from '../lib/api';

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [selectedSource, setSelectedSource] = useState<SourceCitation | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Initial load: fetch health and documents
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [healthRes, docsRes] = await Promise.all([
          fetchHealth().catch(() => null),
          fetchDocuments().catch(() => []),
        ]);
        if (healthRes) setHealth(healthRes);
        setDocuments(docsRes);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };

    loadInitialData();
  }, []);

  // Handle uploading documents
  const handleUpload = async (files: File[]) => {
    setIsUploading(true);
    try {
      const newDocs = await uploadDocuments(files);
      setDocuments((prev) => {
        const ids = new Set(newDocs.map((d) => d.documentId));
        return [...newDocs, ...prev.filter((d) => !ids.has(d.documentId))];
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle deleting a document
  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.documentId !== id));
    if (selectedSource) {
      const matchDoc = documents.find((d) => d.documentId === id);
      if (matchDoc && matchDoc.fileName === selectedSource.fileName) {
        setSelectedSource(null);
      }
    }
  };

  // Handle sending chat message
  const handleSendMessage = async (text: string, forceDirectAnswer = false) => {
    // Optimistic student message
    const studentMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'student',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, studentMessage]);
    setIsChatLoading(true);

    try {
      const res = await sendChatMessage(text, conversationId, forceDirectAnswer);
      if (res.conversationId) {
        setConversationId(res.conversationId);
      }
      setMessages((prev) => [...prev, res.message]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        text: `Error processing question: ${err.message || 'Please check that the backend server is running.'}`,
        routeLabel: 'unsupported',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Find documentId for selected source citation
  const selectedDocRecord = selectedSource
    ? documents.find((d) => d.fileName === selectedSource.fileName)
    : undefined;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
      <Header health={health} />

      <main className="flex-1 flex overflow-hidden">
        {/* Module 1 & 6: Document Ingestion Panel */}
        <DocumentPanel
          documents={documents}
          onUpload={handleUpload}
          onDelete={handleDelete}
          isLoading={isUploading}
        />

        {/* Module 4, 5 & 6: Chat & Socratic Tutoring Pane */}
        <ChatPane
          messages={messages}
          onSendMessage={handleSendMessage}
          onSelectSource={(source) => setSelectedSource(source)}
          isLoading={isChatLoading}
          hasDocuments={documents.length > 0}
        />

        {/* Module 6: Source Viewer Pane */}
        {selectedSource && (
          <SourceViewer
            source={selectedSource}
            documentId={selectedDocRecord?.documentId}
            onClose={() => setSelectedSource(null)}
          />
        )}
      </main>
    </div>
  );
}
