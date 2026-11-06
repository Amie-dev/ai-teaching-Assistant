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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isTeacherOrTa = classroom.role === 'TEACHER' || classroom.role === 'TA';

  // Load halls
  useEffect(() => {
    const loadHalls = async () => {
      try {
        const data = await fetchHalls(classroom.id);
        setHalls(data);
        if (data.length > 0 && !activeHall) {
          setActiveHall(data[0]);
        }
      } catch (err) {
        console.error('Failed to load halls:', err);
      }
    };
    loadHalls();
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

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] bg-[#0a0e1a] text-slate-100 overflow-hidden">
      {/* Halls Sidebar */}
      <aside className="w-64 border-r border-[#1f293d] bg-[#0c1120] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#1f293d] flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Discussion Halls
          </h2>
          <button
            type="button"
            onClick={() => setIsCreatingHall(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#182035] transition-colors cursor-pointer"
            title="Create new discussion hall"
          >
            <Plus className="w-4 h-4 text-[#FF5B22]" />
          </button>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {halls.map((hall) => {
            const isActive = activeHall?.id === hall.id;
            const isAnnouncement = hall.type === 'ANNOUNCEMENT';
            const isLocked = hall.status === 'LOCKED';

            return (
              <button
                key={hall.id}
                type="button"
                onClick={() => setActiveHall(hall)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                  isActive
                    ? 'bg-[#FF5B22]/15 text-[#FF5B22] border border-[#FF5B22]/30 shadow-xs'
                    : 'text-slate-300 hover:bg-[#121829] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {isAnnouncement ? (
                    <Volume2 className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  ) : (
                    <Hash className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  )}
                  <span className="truncate">{hall.name}</span>
                </div>
                {isLocked && <Lock className="w-3 h-3 text-rose-400 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>

        {/* Tip Box */}
        <div className="p-3 m-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[11px] text-orange-200">
          <div className="flex items-center gap-1.5 font-semibold text-[#FF5B22] mb-1">
            <Sparkles className="w-3.5 h-3.5" /> AI In Halls
          </div>
          <p className="leading-relaxed">
            Type <code className="bg-[#121829] px-1 py-0.5 rounded text-white font-mono">@assistant &lt;question&gt;</code> in any hall to summon course-grounded answers!
          </p>
        </div>
      </aside>

      {/* Main Chat Center */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#0a0e1a]">
        {/* Hall Header */}
        <div className="h-14 px-6 border-b border-[#1f293d] bg-[#0c1120]/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Hash className="w-4 h-4 text-[#FF5B22] shrink-0" />
            <h3 className="font-bold text-sm text-white truncate">
              {activeHall?.name || 'Select a hall'}
            </h3>
            {activeHall?.description && (
              <span className="hidden md:inline text-xs text-slate-400 truncate max-w-sm">
                · {activeHall.description}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeHall?.status === 'LOCKED' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}

            {isTeacherOrTa && activeHall && (
              <button
                type="button"
                onClick={handleToggleLock}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#182035] hover:bg-[#232e48] border border-[#232e48] text-slate-200 transition-colors"
                title={activeHall.status === 'LOCKED' ? 'Unlock hall for discussion' : 'Lock hall (read-only)'}
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
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 text-slate-400">
              <div className="w-12 h-12 rounded-xl bg-[#121829] border border-[#232e48] flex items-center justify-center text-slate-500 mb-3">
                <Hash className="w-6 h-6 text-[#FF5B22]" />
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">Welcome to #{activeHall?.name}!</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                This is the beginning of the #{activeHall?.name} discussion hall. Post a doubt or summon the AI tutor.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <article
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  msg.isAssistant
                    ? 'p-4 rounded-2xl bg-[#121829] border border-[#FF5B22]/30 shadow-md shadow-orange-500/5'
                    : 'p-3 rounded-xl bg-[#121829]/60 border border-[#232e48]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                    msg.isAssistant
                      ? 'bg-gradient-to-tr from-[#FF5B22] to-[#FF844B] shadow-md shadow-orange-500/25 ring-1 ring-white/10'
                      : 'bg-[#182035] border border-[#232e48] text-slate-300'
                  }`}
                >
                  {msg.isAssistant ? <Bot className="w-4 h-4 text-white" /> : msg.senderName.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-200">{msg.senderName}</span>
                    {msg.isAssistant && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-[#FF5B22] border border-orange-500/25">
                        AI Tutor
                      </span>
                    )}
                    {msg.routeLabel && (
                      <ModeBadge route={msg.routeLabel} />
                    )}
                    <span className="text-[10px] text-slate-500 ml-auto">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>

                  {/* Sources Chips */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <span className="text-[10px] font-semibold text-slate-400">Sources:</span>
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
            <div className="flex gap-3 max-w-xl p-3.5 rounded-xl bg-[#121829] border border-orange-500/30 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF5B22] to-[#FF844B] flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 text-xs text-orange-200 font-medium">
                <span>AI Tutor is reasoning with classroom PDFs…</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B22] animate-ping" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar or Locked Notice */}
        <div className="p-4 border-t border-[#1f293d] bg-[#0c1120]/90">
          {activeHall?.status === 'LOCKED' ? (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              <span>This discussion hall is locked. Only instructors can post announcements.</span>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
              <div className="flex-1 relative rounded-xl bg-[#121829] border border-[#232e48] focus-within:border-[#FF5B22] focus-within:ring-1 focus-within:ring-[#FF5B22]/50 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Message #${activeHall?.name || 'hall'} (type @assistant to ask AI)…`}
                  className="w-full bg-transparent px-4 py-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!input.trim()}
                className="h-10 px-4 rounded-xl bg-[#FF5B22] hover:bg-[#EA4E17] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition-all cursor-pointer"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Online Members Sidebar */}
      <aside className="hidden lg:flex w-56 border-l border-[#1f293d] bg-[#0c1120] flex-col shrink-0 p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
          <Users className="w-3.5 h-3.5 text-[#FF5B22]" /> Online Members ({onlineUsers.length})
        </h3>

        <div className="space-y-2 overflow-y-auto flex-1">
          {onlineUsers.map((u, i) => (
            <div key={`${u.userId}_${i}`} className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="truncate">{u.name}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Create Hall Modal */}
      {isCreatingHall && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121829] border border-[#232e48] rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white mb-1">Create Discussion Hall</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a new channel for unit study, doubts, or project collaboration.
            </p>

            <form onSubmit={handleCreateHallSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Hall Name</label>
                <input
                  type="text"
                  placeholder="e.g. unit-3-deadlocks"
                  value={newHallName}
                  onChange={(e) => setNewHallName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0e1a] border border-[#232e48] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5B22]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="What is this hall about?"
                  value={newHallDesc}
                  onChange={(e) => setNewHallDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0e1a] border border-[#232e48] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5B22]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Hall Type</label>
                <select
                  value={newHallType}
                  onChange={(e: any) => setNewHallType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0e1a] border border-[#232e48] text-xs text-white focus:outline-none focus:border-[#FF5B22]"
                >
                  <option value="OPEN">Open (All members can post)</option>
                  <option value="ANNOUNCEMENT">Announcement (Instructors only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingHall(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF5B22] hover:bg-[#EA4E17] text-white text-xs font-semibold shadow-md shadow-orange-500/20"
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

