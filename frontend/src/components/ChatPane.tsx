'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SourceCitation } from '../lib/types';
import { ModeBadge } from './ModeBadge';
import { SourceChip } from './SourceChip';
import {
  Send,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

interface ChatPaneProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, forceDirectAnswer?: boolean) => Promise<void>;
  onSelectSource: (source: SourceCitation) => void;
  isLoading: boolean;
  hasDocuments: boolean;
}

export const ChatPane: React.FC<ChatPaneProps> = ({
  messages,
  onSendMessage,
  onSelectSource,
  isLoading,
  hasDocuments,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const lastMessage = messages[messages.length - 1];
  const canRequestDirectAnswer =
    lastMessage &&
    lastMessage.role === 'assistant' &&
    lastMessage.routeLabel === 'conceptual' &&
    lastMessage.isGuidingQuestion;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent, forceDirect = false) => {
    if (e) e.preventDefault();
    if (forceDirect) {
      await onSendMessage('Please give me the direct answer.', true);
      return;
    }

    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    await onSendMessage(trimmed, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSamplePrompt = (promptText: string) => {
    setInput(promptText);
    inputRef.current?.focus();
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <section
      aria-label="Chat Conversation"
      className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-[#0a0e1a]"
    >
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center py-12 px-4">
            {/* Agorapulse-style vibrant icon emblem */}
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-[#FF5B22] mb-4 shadow-lg shadow-orange-500/15">
              <Sparkles className="w-7 h-7" aria-hidden="true" />
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight text-balance">
              Welcome to Your AI Teaching Assistant
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed text-pretty max-w-xl">
              Ask any question from your course materials. The assistant automatically identifies
              factual queries to deliver concise grounded answers, or conceptual questions to guide
              you through interactive Socratic reasoning.
            </p>

            {!hasDocuments && (
              <div
                role="note"
                className="mt-5 p-3 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-300 text-xs flex items-center gap-2 max-w-md"
              >
                <HelpCircle className="w-4 h-4 shrink-0 text-[#FF5B22]" aria-hidden="true" />
                <span>
                  Tip: Upload your course PDF in the left panel to ground answers in your syllabus.
                </span>
              </div>
            )}

            {/* Starter Prompt Suggestions in Agorapulse SaaS Card Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8 w-full text-left">
              <button
                type="button"
                onClick={() => handleSamplePrompt('What is the difference between a process and a thread?')}
                className="p-4 rounded-xl bg-[#121829] hover:bg-[#182035] border border-[#232e48] hover:border-sky-500/50 transition-all text-xs text-slate-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2 font-semibold text-sky-400 mb-1.5">
                  <BookOpen className="w-4 h-4" aria-hidden="true" /> Factual / Direct Query
                </div>
                <div className="flex items-center justify-between text-slate-300 group-hover:text-white">
                  <span>&ldquo;What is the difference between a process and a thread?&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 text-sky-400 transition-all" aria-hidden="true" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSamplePrompt('Why does Quicksort degrade to O(n^2) time on sorted input?')}
                className="p-4 rounded-xl bg-[#121829] hover:bg-[#182035] border border-[#232e48] hover:border-orange-500/50 transition-all text-xs text-slate-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5B22] cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2 font-semibold text-orange-400 mb-1.5">
                  <Sparkles className="w-4 h-4 text-[#FF5B22]" aria-hidden="true" /> Conceptual / Socratic Query
                </div>
                <div className="flex items-center justify-between text-slate-300 group-hover:text-white">
                  <span>&ldquo;Why does Quicksort degrade to O(n^2) time on sorted input?&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 text-[#FF5B22] transition-all" aria-hidden="true" />
                </div>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <article
              key={msg.id}
              aria-label={`${msg.role === 'student' ? 'Student question' : 'Assistant answer'}`}
              className={`flex gap-3 max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                msg.role === 'student' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                aria-hidden="true"
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md ${
                  msg.role === 'student'
                    ? 'bg-gradient-to-tr from-[#FF5B22] to-[#FF844B] ring-1 ring-white/10'
                    : 'bg-[#182035] border border-[#232e48] text-slate-200'
                }`}
              >
                {msg.role === 'student' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4 text-[#FF5B22]" />
                )}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col gap-1.5 max-w-[85%] group/msg">
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between gap-2">
                    <ModeBadge route={msg.routeLabel} isGuiding={msg.isGuidingQuestion} />

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      aria-label={copiedId === msg.id ? 'Copied to clipboard' : 'Copy answer text'}
                      className="opacity-0 group-hover/msg:opacity-100 p-1 text-slate-400 hover:text-slate-200 rounded transition-opacity cursor-pointer focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[#FF5B22]"
                      title="Copy answer"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'student'
                      ? 'bg-gradient-to-r from-[#FF5B22] to-[#F04D1A] text-white rounded-tr-none shadow-md shadow-orange-500/20 font-medium'
                      : 'bg-[#121829] text-slate-100 rounded-tl-none border border-[#232e48] shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Sources Chips */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1" aria-label="Referenced sources">
                    <span className="text-[11px] font-semibold text-slate-400 mr-1">
                      Sources:
                    </span>
                    {msg.sources.map((src, i) => (
                      <SourceChip
                        key={`${src.fileName}_p${src.pageNumber}_${i}`}
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

        {/* Loading Bubble - AI Native 3-Dot Pulse in Agorapulse Coral Palette */}
        {isLoading && (
          <div className="flex gap-3 max-w-3xl mr-auto animate-in fade-in duration-200" aria-live="polite">
            <div aria-hidden="true" className="w-8 h-8 rounded-xl bg-[#182035] border border-[#232e48] flex items-center justify-center shrink-0 text-[#FF5B22] shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-[#121829] border border-[#232e48] text-slate-200 text-sm flex items-center gap-3">
              <span className="text-xs text-slate-300 font-medium">Reasoning with course material</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B22] animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse [animation-delay:200ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse [animation-delay:400ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Socratic Skip Control (User Story U9) */}
      {canRequestDirectAnswer && !isLoading && (
        <div className="px-6 py-2.5 bg-orange-950/25 border-t border-orange-500/25 flex items-center justify-between animate-in fade-in duration-200">
          <span className="text-xs text-orange-200">
            Working through the concept? You can skip guidance to receive the direct answer.
          </span>
          <button
            type="button"
            onClick={() => handleSubmit(undefined, true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FF5B22] hover:bg-[#EA4E17] text-white shadow-md shadow-orange-500/20 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5B22]"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Just Give Me the Answer
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-4 border-t border-[#1f293d] bg-[#0c1120]/90 backdrop-blur-md">
        <form onSubmit={(e) => handleSubmit(e)} className="flex items-end gap-2.5 max-w-4xl mx-auto">
          <div className="flex-1 relative rounded-2xl bg-[#121829] border border-[#232e48] focus-within:border-[#FF5B22] focus-within:ring-1 focus-within:ring-[#FF5B22]/50 transition-all shadow-inner">
            <textarea
              ref={inputRef}
              name="question"
              aria-label="Ask a course question"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a factual question (e.g. definition) or conceptual question (e.g. why/how)…"
              rows={1}
              className="w-full bg-transparent px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none max-h-32 min-h-[48px]"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="h-12 w-12 rounded-2xl bg-[#FF5B22] hover:bg-[#EA4E17] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white shadow-lg shadow-orange-500/25 transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5B22] active:scale-95"
            title="Send message"
          >
            <Send className="w-5 h-5" aria-hidden="true" />
          </button>
        </form>
        <p className="text-[11px] text-center text-slate-500 mt-2">
          Strictly grounded in your uploaded documents · Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </section>
  );
};
