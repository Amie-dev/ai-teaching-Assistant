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
  Copy,
  Check,
  Zap,
  RotateCcw,
  Lightbulb,
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
      className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-[#080c16]"
    >
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center py-10 px-4">
            {/* Agorapulse-style vibrant emblem */}
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF5B22] via-[#FF6D38] to-[#FFA07A] flex items-center justify-center text-white shadow-xl shadow-orange-500/25 ring-1 ring-white/20">
                <Sparkles className="w-8 h-8" aria-hidden="true" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#080c16]" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Socratic AI Teaching Assistant
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed max-w-lg">
              Ask anything from your course materials. Factual questions receive direct answers with page citations; conceptual queries guide you through step-by-step Socratic reasoning.
            </p>

            {!hasDocuments && (
              <div
                role="note"
                className="mt-5 p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/25 text-orange-200 text-xs flex items-center gap-2.5 max-w-md shadow-xs"
              >
                <HelpCircle className="w-4 h-4 shrink-0 text-[#FF5B22]" aria-hidden="true" />
                <span>
                  Tip: Upload course PDFs in the Resources tab so answers are grounded strictly in your syllabus.
                </span>
              </div>
            )}

            {/* Starter Prompt Suggestions in Agorapulse Card Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8 w-full text-left">
              <button
                type="button"
                onClick={() => handleSamplePrompt('How do you calculate Mean and Variance?')}
                className="p-4 rounded-2xl bg-[#0f1526]/80 hover:bg-[#151e36] border border-white/[0.08] hover:border-sky-500/40 transition-all text-xs text-slate-200 group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2 font-bold text-sky-400 mb-1.5">
                  <BookOpen className="w-4 h-4" aria-hidden="true" /> Factual / Direct Query
                </div>
                <div className="flex items-center justify-between text-slate-300 group-hover:text-white font-medium">
                  <span>&ldquo;How do you calculate Mean and Variance?&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 text-sky-400 transition-all shrink-0" aria-hidden="true" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSamplePrompt('Why is variance squared instead of taking absolute differences?')}
                className="p-4 rounded-2xl bg-[#0f1526]/80 hover:bg-[#151e36] border border-white/[0.08] hover:border-[#FF5B22]/40 transition-all text-xs text-slate-200 group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2 font-bold text-orange-400 mb-1.5">
                  <Lightbulb className="w-4 h-4 text-[#FF5B22]" aria-hidden="true" /> Conceptual / Socratic Query
                </div>
                <div className="flex items-center justify-between text-slate-300 group-hover:text-white font-medium">
                  <span>&ldquo;Why is variance squared instead of using absolute values?&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 text-[#FF5B22] transition-all shrink-0" aria-hidden="true" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSamplePrompt('What is the Central Limit Theorem?')}
                className="p-4 rounded-2xl bg-[#0f1526]/80 hover:bg-[#151e36] border border-white/[0.08] hover:border-emerald-500/40 transition-all text-xs text-slate-200 group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1.5">
                  <Zap className="w-4 h-4 text-emerald-400" aria-hidden="true" /> Theorem &amp; Properties
                </div>
                <div className="flex items-center justify-between text-slate-300 group-hover:text-white font-medium">
                  <span>&ldquo;What is the Central Limit Theorem?&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 text-emerald-400 transition-all shrink-0" aria-hidden="true" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSamplePrompt('types of ml')}
                className="p-4 rounded-2xl bg-[#0f1526]/80 hover:bg-[#151e36] border border-white/[0.08] hover:border-purple-500/40 transition-all text-xs text-slate-200 group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2 font-bold text-purple-400 mb-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" aria-hidden="true" /> Overview / Taxonomy
                </div>
                <div className="flex items-center justify-between text-slate-300 group-hover:text-white font-medium">
                  <span>&ldquo;What are the types of machine learning?&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 text-purple-400 transition-all shrink-0" aria-hidden="true" />
                </div>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <article
              key={msg.id}
              aria-label={`${msg.role === 'student' ? 'Student question' : 'Assistant answer'}`}
              className={`flex gap-3.5 max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                msg.role === 'student' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                aria-hidden="true"
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs shadow-md ${
                  msg.role === 'student'
                    ? 'bg-gradient-to-tr from-[#FF5B22] to-[#FF844B] text-white ring-1 ring-white/20'
                    : 'bg-[#141c30] border border-white/[0.08] text-slate-200'
                }`}
              >
                {msg.role === 'student' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4 text-[#FF5B22]" />
                )}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col gap-2 max-w-[85%] group/msg">
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between gap-2">
                    <ModeBadge route={msg.routeLabel} isGuiding={msg.isGuidingQuestion} />

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      aria-label={copiedId === msg.id ? 'Copied to clipboard' : 'Copy answer text'}
                      className="opacity-0 group-hover/msg:opacity-100 p-1 text-slate-400 hover:text-white rounded transition-opacity cursor-pointer"
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
                  className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'student'
                      ? 'bg-gradient-to-r from-[#FF5B22] to-[#FF6D38] text-white shadow-lg shadow-orange-500/20'
                      : 'bg-gradient-to-br from-[#0e1424] to-[#0a0f1d] border border-white/[0.08] text-slate-100 shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Socratic Direct Answer Skip Control (PRD FR-5.4) */}
                {msg.role === 'assistant' && msg.isGuidingQuestion && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSubmit(undefined, true)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-40"
                    >
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      <span>Give me the direct answer</span>
                    </button>
                    <span className="text-[11px] text-slate-500">Skip Socratic guidance</span>
                  </div>
                )}

                {/* Sources Section */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">Sources:</span>
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

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3.5 mr-auto max-w-xl animate-in fade-in duration-200">
            <div className="w-9 h-9 rounded-2xl bg-[#141c30] border border-white/[0.08] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[#FF5B22] animate-pulse" />
            </div>
            <div className="p-4 rounded-3xl bg-[#0e1424] border border-white/[0.08] flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-[#FF5B22] font-bold">
                <span>Reasoning with syllabus documents…</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B22] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B22] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B22] animate-bounce [animation-delay:0.4s]" />
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Classifying question &amp; searching ChromaDB vector store</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Prompt Input Dock */}
      <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-[#090e1b]/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto">
          {canRequestDirectAnswer && (
            <div className="mb-2 flex items-center justify-between text-xs text-purple-300 bg-purple-500/10 border border-purple-500/25 px-3.5 py-1.5 rounded-xl">
              <span>Socratic dialogue active. Answer the guiding question or ask for a direct answer.</span>
              <button
                type="button"
                onClick={() => handleSubmit(undefined, true)}
                className="font-bold underline text-white hover:text-purple-200 cursor-pointer ml-2 shrink-0"
              >
                Direct Answer
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2.5 items-end">
            <div className="flex-1 rounded-2xl bg-[#121829] border border-white/[0.08] focus-within:border-[#FF5B22] focus-within:ring-2 focus-within:ring-[#FF5B22]/20 transition-all p-2 shadow-inner">
              <textarea
                ref={inputRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask any question grounded in your course materials... (Enter to send, Shift+Enter for newline)"
                className="w-full bg-transparent p-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message to AI assistant"
              className="h-12 px-5 rounded-2xl bg-gradient-to-r from-[#FF5B22] to-[#FF7442] hover:from-[#EA4E17] hover:to-[#FF5B22] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer shrink-0"
            >
              <span>Send</span>
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          <p className="text-[10px] text-slate-500 text-center mt-2">
            Answers are grounded strictly in your classroom&apos;s uploaded course PDFs.
          </p>
        </div>
      </div>
    </section>
  );
};
