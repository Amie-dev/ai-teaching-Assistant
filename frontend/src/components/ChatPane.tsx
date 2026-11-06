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
      className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950/20"
    >
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 shadow-lg shadow-purple-500/10">
              <Sparkles className="w-7 h-7" aria-hidden="true" />
            </div>

            <h2 className="text-xl font-bold text-slate-100 tracking-tight text-balance">
              Welcome to Your AI Teaching Assistant
            </h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed text-pretty">
              Ask any question from your course materials. The assistant automatically identifies
              factual queries to deliver concise grounded answers, or conceptual questions to guide
              you through interactive Socratic reasoning.
            </p>

            {!hasDocuments && (
              <div
                role="note"
                className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 max-w-md"
              >
                <HelpCircle className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
                <span>
                  Tip: Upload your course PDF in the left panel to ground answers in your syllabus.
                </span>
              </div>
            )}

            {/* Starter Prompt Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full text-left">
              <button
                type="button"
                onClick={() => handleSamplePrompt('What is the difference between a process and a thread?')}
                className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-colors text-xs text-slate-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer"
              >
                <div className="flex items-center gap-2 font-semibold text-blue-400 mb-1">
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" /> Factual / Direct Query
                </div>
                <div className="flex items-center justify-between text-slate-400 group-hover:text-slate-200">
                  <span>&ldquo;What is the difference between a process and a thread?&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSamplePrompt('Why does Quicksort degrade to O(n^2) time on sorted input?')}
                className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-colors text-xs text-slate-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer"
              >
                <div className="flex items-center gap-2 font-semibold text-purple-400 mb-1">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Conceptual / Socratic Query
                </div>
                <div className="flex items-center justify-between text-slate-400 group-hover:text-slate-200">
                  <span>&ldquo;Why does Quicksort degrade to O(n^2) time on sorted input?&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
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
                    ? 'bg-gradient-to-tr from-cyan-600 to-blue-600'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                }`}
              >
                {msg.role === 'student' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
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
                      className="opacity-0 group-hover/msg:opacity-100 p-1 text-slate-400 hover:text-slate-200 rounded transition-opacity cursor-pointer focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-purple-400"
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
                      ? 'bg-purple-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-900/90 text-slate-200 rounded-tl-none border border-slate-800/80 shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Sources Chips */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1" aria-label="Referenced sources">
                    <span className="text-[11px] font-medium text-slate-400 mr-1">
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

        {/* Loading Bubble - AI Native 3-Dot Pulse */}
        {isLoading && (
          <div className="flex gap-3 max-w-3xl mr-auto animate-in fade-in duration-200" aria-live="polite">
            <div aria-hidden="true" className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 text-white shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-slate-900/90 border border-slate-800 text-slate-300 text-sm flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Reasoning with course material</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:200ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse [animation-delay:400ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Socratic Skip Control (User Story U9) */}
      {canRequestDirectAnswer && !isLoading && (
        <div className="px-6 py-2.5 bg-purple-950/30 border-t border-purple-500/20 flex items-center justify-between animate-in fade-in duration-200">
          <span className="text-xs text-purple-300">
            Working through the concept? You can skip guidance to receive the direct answer.
          </span>
          <button
            type="button"
            onClick={() => handleSubmit(undefined, true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Just Give Me the Answer
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <form onSubmit={(e) => handleSubmit(e)} className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative rounded-2xl bg-slate-800/80 border border-slate-700/80 focus-within:border-purple-500/80 focus-within:ring-1 focus-within:ring-purple-500/50 transition-colors shadow-inner">
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
            className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white shadow-lg shadow-purple-500/20 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
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
