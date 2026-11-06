'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Classroom, Hall, HallMessage, SourceCitation, User } from '../lib/types';
import { fetchHalls, fetchHallMessages, updateHallStatus, createHall } from '../lib/api';
import { getSocket } from '../lib/socket';
import { SourceChip } from './SourceChip';
import { ModeBadge } from './ModeBadge';
import {
  Hash,
  Send,
  Lock,
  Unlock,
  Volume2,
  Users,
  Plus,
  Bot,
  Sparkles,
  Info,
  Check,
  AlertCircle,
  Clock,
  X,
  MessageSquare,
  HelpCircle,
  FileText,
} from 'lucide-react';

interface DiscussionHallProps {
  classroom: Classroom;
  currentUser: User | null;
  onSelectSource: (source: SourceCitation) => void;
}

export const DiscussionHall: React.FC<DiscussionHallProps> = ({
  classroom,
  currentUser,
  onSelectSource,
}) => {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [activeHall, setActiveHall] = useState<Hall | null>(null);
  const [messages, setMessages] = useState<HallMessage[]>([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Array<{ userId: string; name: string }>>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isCreatingHall, setIsCreatingHall] = useState(false);
  const [newHallName, setNewHallName] = useState('');
  const [newHallDesc, setNewHallDesc] = useState('');
  const [newHallType, setNewHallType] = useState<'OPEN' | 'ANNOUNCEMENT'>('OPEN');
  const [showMembersSidebar, setShowMembersSidebar] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isTeacherOrTa = classroom.role === 'TEACHER' || classroom.role === 'TA';

  // Load halls and strictly isolate discussions to the active classroom
  useEffect(() => {
    let isCurrent = true;
    setMessages([]);     // Clear previous messages immediately
    setActiveHall(null); // Reset active hall so old classroom's hall does not linger

    const loadHalls = async () => {
      try {
        const data = await fetchHalls(classroom.id);
        if (!isCurrent) return;
        setHalls(data);
        if (data.length > 0) {
          setActiveHall(data[0]);
        }
      } catch (err) {
        console.error('Failed to load halls:', err);
      }
    };
    loadHalls();

    return () => {
      isCurrent = false;
    };
  }, [classroom.id]);

  // Handle Socket.IO connection and active hall changes
  useEffect(() => {
    if (!activeHall) return;

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    // Fetch initial messages
    fetchHallMessages(activeHall.id)
      .then(setMessages)
      .catch((err) => console.error('Failed to fetch messages:', err));

    // Join hall
    socket.emit('hall:join', {
      hallId: activeHall.id,
      userId: currentUser?.id || 'guest',
      name: currentUser?.name || 'Student',
    });

    const handleNewMessage = (msg: HallMessage) => {
      if (msg.hallId === activeHall.id) {
        setMessages((prev) => {
          // Reconcile optimistic temp messages or prevent duplicates
          const existingIndex = prev.findIndex(
            (m) => m.id === msg.id || (m.id.startsWith('temp-') && m.text === msg.text)
          );
          if (existingIndex !== -1) {
            const next = [...prev];
            next[existingIndex] = msg;
            return next;
          }
          return [...prev, msg];
        });
      }
    };

    const handlePresence = (data: { hallId: string; users: Array<{ userId: string; name: string }> }) => {
      if (data.hallId === activeHall.id) {
        setOnlineUsers(data.users);
      }
    };

    const handleThinking = (data: { hallId: string; active: boolean }) => {
      if (data.hallId === activeHall.id) {
        setIsAiThinking(data.active);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('presence:update', handlePresence);
    socket.on('assistant:thinking', handleThinking);

    return () => {
      socket.emit('hall:leave', { hallId: activeHall.id });
      socket.off('message:new', handleNewMessage);
      socket.off('presence:update', handlePresence);
      socket.off('assistant:thinking', handleThinking);
    };
  }, [activeHall?.id, currentUser?.id, currentUser?.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !activeHall || activeHall.status === 'LOCKED') return;

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: HallMessage = {
      id: tempId,
      hallId: activeHall.id,
      senderId: currentUser?.id,
      senderName: currentUser?.name || 'Student',
      isAssistant: false,
      text: trimmed,
      routeLabel: null,
      sources: [],
      pinned: false,
      createdAt: new Date().toISOString(),
    };

    // Instant optimistic UI update
    setMessages((prev) => [...prev, optimisticMsg]);

    socket.emit('message:send', {
      hallId: activeHall.id,
      text: trimmed,
      senderId: currentUser?.id,
      senderName: currentUser?.name || 'Student',
    });

    setInput('');
  };

  const handleToggleLock = async () => {
    if (!activeHall || !isTeacherOrTa) return;
    const nextStatus = activeHall.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    try {
      const updated = await updateHallStatus(activeHall.id, nextStatus);
      setActiveHall(updated);
      setHalls((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    } catch (err: any) {
      alert(err.message || 'Failed to update hall status');
    }
  };

  const handleCreateHallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHallName.trim()) return;

    try {
      const created = await createHall(
        classroom.id,
        newHallName.trim(),
        newHallDesc.trim() || undefined,
        undefined,
        newHallType
      );
      setHalls((prev) => [...prev, created]);
      setActiveHall(created);
      setIsCreatingHall(false);
      setNewHallName('');
      setNewHallDesc('');
    } catch (err: any) {
      alert(err.message || 'Failed to create hall');
    }
  };

  const handleInsertAssistant = (suffix = '') => {
    setInput((prev) => {
      const prefix = prev.includes('@assistant') ? '' : '@assistant ';
      return `${prefix}${prev}${suffix}`.trim() + ' ';
    });
    inputRef.current?.focus();
  };

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] bg-[#080c16] text-slate-100 overflow-hidden">
      {/* 1. Halls Sidebar */}
      <aside className="w-64 border-r border-white/[0.06] bg-[#0b101d] flex flex-col shrink-0 select-none">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#FF5B22]" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              Discussion Halls
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCreatingHall(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Create new discussion hall"
          >
            <Plus className="w-4 h-4 text-[#FF5B22]" />
          </button>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
            Channels ({halls.length})
          </div>

          {halls.map((hall) => {
            const isActive = activeHall?.id === hall.id;
            const isAnnouncement = hall.type === 'ANNOUNCEMENT';
            const isLocked = hall.status === 'LOCKED';

            return (
              <button
                key={hall.id}
                type="button"
                onClick={() => setActiveHall(hall)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FF5B22]/20 to-[#FF5B22]/5 text-[#FF5B22] border border-[#FF5B22]/30 shadow-xs'
                    : 'text-slate-300 hover:bg-white/[0.04] hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {isAnnouncement ? (
                    <Volume2 className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  ) : (
                    <Hash className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#FF5B22]' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  )}
                  <span className="truncate">{hall.name}</span>
                </div>
                {isLocked && <Lock className="w-3 h-3 text-rose-400 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>

        {/* AI Helper Banner */}
        <div className="p-3.5 m-3 rounded-2xl bg-gradient-to-br from-[#141c30] to-[#0d1322] border border-white/[0.08] shadow-sm text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 font-bold text-[#FF5B22] mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Summon Course AI
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Tag <code className="bg-[#080c16] text-[#FF5B22] font-mono px-1.5 py-0.5 rounded border border-white/[0.06]">@assistant</code> in any doubt to get instant answers cited from course PDFs!
          </p>
        </div>
      </aside>

      {/* 2. Main Chat Center */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#080c16]">
        {/* Hall Header */}
        <div className="h-14 px-6 border-b border-white/[0.06] bg-[#0c1120]/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#141c30] border border-white/[0.08] flex items-center justify-center shrink-0">
              <Hash className="w-4 h-4 text-[#FF5B22]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-white truncate flex items-center gap-2">
                <span>#{activeHall?.name || 'select-hall'}</span>
                {activeHall?.status === 'LOCKED' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </h3>
              {activeHall?.description && (
                <p className="hidden md:block text-[11px] text-slate-400 truncate">
                  {activeHall.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isTeacherOrTa && activeHall && (
              <button
                type="button"
                onClick={handleToggleLock}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#141c30] hover:bg-[#1a243e] border border-white/[0.08] text-slate-200 transition-colors cursor-pointer"
                title={activeHall.status === 'LOCKED' ? 'Unlock hall for discussion' : 'Lock hall (announcements only)'}
              >
                {activeHall.status === 'LOCKED' ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" /> Unlock Hall
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-rose-400" /> Lock Hall
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowMembersSidebar((p) => !p)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                showMembersSidebar
                  ? 'bg-[#FF5B22]/15 border-[#FF5B22]/30 text-[#FF5B22]'
                  : 'bg-[#141c30] border-white/[0.08] text-slate-400 hover:text-white'
              }`}
              title="Toggle Online Members Sidebar"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Stream Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-[#121829] border border-white/[0.08] flex items-center justify-center text-[#FF5B22] mb-3 shadow-lg shadow-orange-500/10">
                <Hash className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-slate-100 text-base">Welcome to #{activeHall?.name}!</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                This is the start of the #{activeHall?.name} discussion hall. Ask a peer a question or tag{' '}
                <strong className="text-[#FF5B22] font-semibold">@assistant</strong> to query syllabus materials.
              </p>

              <button
                type="button"
                onClick={() => handleInsertAssistant()}
                className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-[#FF5B22] text-xs font-bold transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Start with @assistant
              </button>
            </div>
          ) : (
            messages.map((msg) => (
              <article
                key={msg.id}
                className={`flex gap-3.5 max-w-3xl transition-all ${
                  msg.isAssistant
                    ? 'p-4 rounded-2xl bg-gradient-to-br from-[#121829] to-[#0c1120] border border-[#FF5B22]/30 shadow-md shadow-orange-500/5'
                    : 'p-3.5 rounded-2xl bg-[#0f1526]/70 border border-white/[0.06] hover:border-white/[0.1]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-md ${
                    msg.isAssistant
                      ? 'bg-gradient-to-tr from-[#FF5B22] to-[#FF844B] text-white ring-1 ring-white/20'
                      : 'bg-[#18233c] text-slate-200 border border-white/[0.08]'
                  }`}
                >
                  {msg.isAssistant ? <Bot className="w-4 h-4 text-white" /> : msg.senderName.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-100">{msg.senderName}</span>
                    {msg.isAssistant && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-[#FF5B22] border border-orange-500/30">
                        AI Teaching Assistant
                      </span>
                    )}
                    {msg.routeLabel && <ModeBadge route={msg.routeLabel} />}
                    <span className="text-[10px] text-slate-400 ml-auto tabular-nums">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>

                  {/* Sources Chips for AI answers */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-white/[0.06]">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-[#FF5B22]" /> Grounded Sources:
                      </span>
                      {msg.sources.map((src, i) => (
                        <SourceChip
                          key={`${src.fileName}_${src.pageNumber}_${i}`}
                          source={src}
                          onClick={onSelectSource}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))
          )}

          {/* AI Thinking Indicator inside Hall */}
          {isAiThinking && (
            <div className="flex gap-3.5 max-w-xl p-4 rounded-2xl bg-gradient-to-br from-[#121829] to-[#0c1120] border border-[#FF5B22]/30 shadow-lg shadow-orange-500/10 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5B22] to-[#FF844B] flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex flex-col justify-center gap-1">
                <div className="flex items-center gap-2 text-xs text-orange-200 font-bold">
                  <span>AI Tutor is searching course materials…</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B22] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B22] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B22] animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Filtering vectors by relevance and syllabus citations</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Dock & Action Toolbar */}
        <div className="p-4 border-t border-white/[0.06] bg-[#090e1b]/95 backdrop-blur-md">
          {activeHall?.status === 'LOCKED' ? (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-center gap-2 font-medium">
              <Lock className="w-4 h-4" />
              <span>This discussion hall is locked by the instructor. Only teachers can post.</span>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-2">
              {/* Quick AI Trigger Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                <button
                  type="button"
                  onClick={() => handleInsertAssistant()}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-[#FF5B22] font-bold transition-all cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3 h-3" /> Ask @assistant
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertAssistant('explain this concept simply')}
                  className="px-2.5 py-1 rounded-full bg-[#141c30] hover:bg-[#1a243e] border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                >
                  Explain concept
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertAssistant('give a practice question on this')}
                  className="px-2.5 py-1 rounded-full bg-[#141c30] hover:bg-[#1a243e] border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                >
                  Practice question
                </button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2.5">
                <div className="flex-1 relative rounded-2xl bg-[#121829] border border-white/[0.08] focus-within:border-[#FF5B22] focus-within:ring-2 focus-within:ring-[#FF5B22]/20 transition-all shadow-inner">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Message #${activeHall?.name || 'hall'} (type @assistant to ask AI)...`}
                    className="w-full bg-transparent px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="h-11 px-5 rounded-2xl bg-gradient-to-r from-[#FF5B22] to-[#FF7442] hover:from-[#EA4E17] hover:to-[#FF5B22] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer shrink-0"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* 3. Online Members Sidebar (Collapsible) */}
      {showMembersSidebar && (
        <aside className="hidden lg:flex w-60 border-l border-white/[0.06] bg-[#0b101d] flex-col shrink-0 p-4 select-none animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.06]">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#FF5B22]" /> Active Members
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {onlineUsers.length} online
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto flex-1">
            {onlineUsers.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-2">No peers active in hall</div>
            ) : (
              onlineUsers.map((u, i) => (
                <div key={`${u.userId}_${i}`} className="flex items-center gap-2.5 text-xs text-slate-200 p-1.5 rounded-xl hover:bg-white/[0.03]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-[#18233c] text-[10px] font-bold text-white flex items-center justify-center">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate font-medium">{u.name}</span>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* Modal: Create Discussion Hall */}
      {isCreatingHall && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0e1424] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/80">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-[#FF5B22]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Create Discussion Hall</h3>
                  <p className="text-xs text-slate-400">Add a channel for unit study or doubts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingHall(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHallSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hall Name *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold">#</span>
                  <input
                    type="text"
                    placeholder="e.g. unit-3-deadlocks"
                    value={newHallName}
                    onChange={(e) => setNewHallName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#141c30] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5B22] focus:ring-1 focus:ring-[#FF5B22]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="What will members discuss here?"
                  value={newHallDesc}
                  onChange={(e) => setNewHallDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141c30] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5B22] focus:ring-1 focus:ring-[#FF5B22]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hall Permission Type</label>
                <select
                  value={newHallType}
                  onChange={(e: any) => setNewHallType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141c30] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#FF5B22]"
                >
                  <option value="OPEN">Open (All students &amp; teachers can post)</option>
                  <option value="ANNOUNCEMENT">Announcement (Only instructors can post)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingHall(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5B22] to-[#FF7442] hover:from-[#EA4E17] hover:to-[#FF5B22] text-white text-xs font-bold shadow-lg shadow-orange-500/25"
                >
                  Create Hall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
