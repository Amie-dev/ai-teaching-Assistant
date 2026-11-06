'use client';

import React from 'react';
import { GraduationCap, Database, Cpu, Sparkles, Activity } from 'lucide-react';
import { HealthStatus } from '../lib/types';

interface HeaderProps {
  health: HealthStatus | null;
}

export const Header: React.FC<HeaderProps> = ({ health }) => {
  return (
    <header className="h-16 border-b border-[#1f293d] bg-[#0a0e1a]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Agorapulse-style vibrant coral/orange badge icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF5B22] to-[#FF844B] flex items-center justify-center shadow-lg shadow-orange-500/25 ring-1 ring-white/10">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight">AI Teaching Assistant</h1>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-[#FF5B22] border border-orange-500/25">
              Agentic RAG
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Socratic Tutoring & Course-Grounded Retrieval · B.Tech CSE (Sem 7)
          </p>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-3 text-xs">
        {/* ChromaDB / Vector Store status chip */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121829] border border-[#232e48] text-slate-300 shadow-sm">
          <span className={`w-2 h-2 rounded-full ${health?.services.chromaOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-cyan-400'}`} />
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-200">
            {health?.services.chromaOnline ? 'ChromaDB Active' : 'Vector Store Ready'}
          </span>
        </div>

        {/* LLM Engine status chip */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121829] border border-[#232e48] text-slate-300 shadow-sm">
          <Cpu className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-medium text-slate-200">Llama 3.1 (Groq)</span>
        </div>

        {/* Embedding Provider chip */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121829] border border-[#232e48] text-slate-300 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#FF5B22]" />
          <span className="font-medium text-slate-200">
            {health?.services.hasGoogleKey
              ? 'Google Embeddings'
              : health?.services.hasOpenAiKey
              ? 'OpenAI Embeddings'
              : 'Local Embeddings'}
          </span>
        </div>
      </div>
    </header>
  );
};
