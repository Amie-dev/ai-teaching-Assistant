'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '../components/Header';
import { ClassroomSwitcher } from '../components/ClassroomSwitcher';
import { DiscussionHall } from '../components/DiscussionHall';
import { DocumentPanel } from '../components/DocumentPanel';
import { ChatPane } from '../components/ChatPane';
import { ClassroomMembers } from '../components/ClassroomMembers';
import { SourceViewer } from '../components/SourceViewer';
import {
  ChatMessage,
  Classroom,
  DocumentRecord,
  HealthStatus,
  SourceCitation,
  User,
} from '../lib/types';
import {
  fetchHealth,
  fetchDocuments,
  uploadDocuments,
  deleteDocument,
  sendChatMessage,
  fetchClassrooms,
  createClassroom,
  deleteClassroom,
  joinClassroom,
  getActiveRole,
  setActiveRole,
  UserRole,
} from '../lib/api';
import {
  MessageSquare,
  Bot,
  Files,
  Users,
} from 'lucide-react';

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [activeRole, setActiveRoleState] = useState<UserRole>('TEACHER');
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [activeClassroomId, setActiveClassroomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'halls' | 'assistant' | 'resources' | 'members'>('halls');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [selectedSource, setSelectedSource] = useState<SourceCitation | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Load classrooms and health
  const loadClassrooms = async () => {
    try {
      const crList = await fetchClassrooms();
      setClassrooms(crList);
      if (crList.length > 0 && (!activeClassroomId || !crList.some((c) => c.id === activeClassroomId))) {
        setActiveClassroomId(crList[0].id);
      }
    } catch (err) {
      console.error('Failed to load classrooms:', err);
    }
  };

  useEffect(() => {
    const role = getActiveRole();
    setActiveRoleState(role);

    fetchHealth()
      .then(setHealth)
      .catch(() => null);

    loadClassrooms();
  }, []);

  // Reload classroom resources and enforce strict classroom isolation
  useEffect(() => {
    if (!activeClassroomId) return;
    setDocuments([]);             // Clear document list for the new classroom
    setMessages([]);              // Clear private chat messages to prevent cross-classroom leaks
    setConversationId(undefined); // Reset conversation session ID
    setSelectedSource(null);      // Dismiss any open source drawer

    fetchDocuments(activeClassroomId)
      .then((docs) => {
        // Enforce client-side check that all docs match active classroom
        const scoped = docs.filter((d) => d.classroomId === activeClassroomId);
        setDocuments(scoped);
      })
      .catch((err) => console.error('Failed to load classroom documents:', err));
  }, [activeClassroomId]);

  const activeClassroom = classrooms.find((c) => c.id === activeClassroomId) || classrooms[0] || null;

  // Handle Role Toggle (Teacher vs Student)
  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setActiveRoleState(role);
    loadClassrooms();
  };

  // Handle classroom creation (Teacher)
  const handleCreateClassroom = async (name: string, subject: string, description?: string) => {
    const newCr = await createClassroom(name, subject, description);
    setClassrooms((prev) => [newCr, ...prev]);
    setActiveClassroomId(newCr.id);
  };

  // Handle classroom deletion (Teacher)
  const handleDeleteClassroom = async (classroomId: string) => {
    await deleteClassroom(classroomId);
    const updated = classrooms.filter((c) => c.id !== classroomId);
    setClassrooms(updated);
    if (activeClassroomId === classroomId) {
      setActiveClassroomId(updated[0]?.id || null);
    }
  };

  // Handle classroom join (Student / Teacher)
  const handleJoinClassroom = async (joinCode: string) => {
    const joined = await joinClassroom(joinCode);
    setClassrooms((prev) => {
      const exists = prev.some((c) => c.id === joined.id);
      return exists ? prev : [joined, ...prev];
    });
    setActiveClassroomId(joined.id);
  };

  // Handle uploading documents (Teacher) strictly to active classroom
  const handleUpload = async (files: File[]) => {
    if (!activeClassroomId) return;
    setIsUploading(true);
    try {
      const newDocs = await uploadDocuments(files, activeClassroomId);
      setDocuments((prev) => {
        const ids = new Set(newDocs.map((d) => d.documentId));
        return [
          ...newDocs.filter((d) => d.classroomId === activeClassroomId),
          ...prev.filter((d) => !ids.has(d.documentId) && d.classroomId === activeClassroomId),
        ];
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle deleting a document (Teacher)
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

  // Handle sending private chat message
  const handleSendMessage = async (text: string, forceDirectAnswer = false) => {
    const studentMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'student',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, studentMessage]);
    setIsChatLoading(true);

    try {
      const res = await sendChatMessage(text, conversationId, forceDirectAnswer, activeClassroomId || undefined);
      if (res.conversationId) {
        setConversationId(res.conversationId);
      }
      setMessages((prev) => [...prev, res.message]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        text: `Error processing question: ${err.message || 'Please verify backend server is running.'}`,
        routeLabel: 'unsupported',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const currentUser: User = useMemo(
    () => ({
      id: activeRole === 'TEACHER' ? 'b0fbe529-4fcb-48ac-8d26-74c5a37c98c3' : 'c5d5b382-e2c6-4f69-91c7-d8a44b655758',
      name: activeRole === 'TEACHER' ? 'Prof. Ria Pyne (Teacher)' : 'Aminul Islam (Student)',
      email: activeRole === 'TEACHER' ? 'teacher@brainware.edu' : 'student@brainware.edu',
      avatar: activeRole === 'TEACHER' ? '👩‍🏫' : '👨‍🎓',
    }),
    [activeRole]
  );

  const isTeacher = activeRole === 'TEACHER';

  return (
    <div className="flex h-screen w-screen bg-[#0a0e1a] text-slate-100 overflow-hidden font-sans">
      {/* 1. Leftmost Classroom Switcher Rail */}
      <ClassroomSwitcher
        classrooms={classrooms}
        activeClassroomId={activeClassroomId}
        onSelectClassroom={setActiveClassroomId}
        onCreateClassroom={handleCreateClassroom}
        onDeleteClassroom={handleDeleteClassroom}
        onJoinClassroom={handleJoinClassroom}
        activeRole={activeRole}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header with Role Switcher */}
        <Header
          health={health}
          classroom={activeClassroom}
          activeRole={activeRole}
          onRoleChange={handleRoleChange}
        />

        {/* Classroom Navigation Tabs */}
        {activeClassroom && (
          <nav
            aria-label="Classroom Sections"
            className="h-13 border-b border-white/[0.08] bg-[#0a0f1d]/90 backdrop-blur-md px-5 sm:px-6 flex items-center justify-between shrink-0 shadow-xs"
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('halls')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'halls'
                    ? 'bg-gradient-to-r from-[#FF5B22] to-[#FF7442] text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discussion Halls</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('assistant')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'assistant'
                    ? 'bg-gradient-to-r from-[#FF5B22] to-[#FF7442] text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Socratic AI Assistant</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('resources')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'resources'
                    ? 'bg-gradient-to-r from-[#FF5B22] to-[#FF7442] text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Files className="w-3.5 h-3.5" />
                <span>Course Resources</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'resources' ? 'bg-black/30 text-white' : 'bg-[#141c30] text-slate-300'
                }`}>
                  {documents.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('members')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'members'
                    ? 'bg-gradient-to-r from-[#FF5B22] to-[#FF7442] text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Members &amp; Settings</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#101728] border border-white/[0.06]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[11px] font-medium text-slate-300">
                  Grounded: <strong className="text-white font-bold">{activeClassroom.name}</strong>
                </span>
              </div>
            </div>
          </nav>
        )}

        {/* Tab View Container */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {activeTab === 'halls' && activeClassroom && (
            <DiscussionHall
              classroom={activeClassroom}
              currentUser={currentUser}
              onSelectSource={setSelectedSource}
            />
          )}

          {activeTab === 'assistant' && (
            <div className="flex-1 flex h-full overflow-hidden">
              <DocumentPanel
                documents={documents}
                onUpload={handleUpload}
                onDelete={handleDelete}
                isLoading={isUploading}
                isTeacher={isTeacher}
              />
              <ChatPane
                messages={messages}
                onSendMessage={handleSendMessage}
                onSelectSource={setSelectedSource}
                isLoading={isChatLoading}
                hasDocuments={documents.length > 0}
              />
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="flex-1 flex h-full overflow-hidden">
              <DocumentPanel
                documents={documents}
                onUpload={handleUpload}
                onDelete={handleDelete}
                isLoading={isUploading}
                isTeacher={isTeacher}
              />
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0a0e1a]">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF5B22] mb-4 shadow-lg shadow-orange-500/10">
                  <Files className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Classroom Course Resources</h3>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
                  PDF documents uploaded here are isolated to <span className="text-[#FF5B22] font-semibold">{activeClassroom?.name}</span>. Vectors are generated using Google text embeddings and cited page-by-page by the AI.
                </p>
                <div className="p-4 rounded-xl bg-[#121829] border border-[#232e48] text-xs text-slate-300 max-w-sm text-left space-y-1.5">
                  <div className="font-semibold text-white">Ingestion Checklist:</div>
                  <div>✓ Page-level text extraction with checksum duplicate avoidance</div>
                  <div>✓ Recursive chunking with 600-char window and 100-char overlap</div>
                  <div>✓ Vector embeddings mapped with classroomId filter</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && activeClassroom && (
            <ClassroomMembers classroom={activeClassroom} />
          )}

          {/* Slide-over Source Viewer */}
          {selectedSource && (
            <SourceViewer
              source={selectedSource}
              documentId={documents.find((d) => d.fileName === selectedSource.fileName)?.documentId}
              onClose={() => setSelectedSource(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
