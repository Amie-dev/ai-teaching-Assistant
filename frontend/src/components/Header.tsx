'use client';

import React from 'react';
import { GraduationCap, Database, Cpu, Sparkles } from 'lucide-react';
import { HealthStatus } from '../lib/types';

interface HeaderProps {
  health: HealthStatus | null;
}

export const Header: React.FC<HeaderProps> = ({ health }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight">AI Teaching Assistant</h1>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Agentic RAG
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Socratic Tutoring & Course-Grounded Retrieval · B.Tech CSE (Sem 7)
          </p>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300">
          <Database className={`w-3.5 h-3.5 ${health?.services.chromaOnline ? 'text-emerald-400' : 'text-blue-400'}`} />
          <span>{health?.services.chromaOnline ? 'ChromaDB Active' : 'Vector Store Ready'}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Llama 3.1 (Groq)</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>LangGraph.js</span>
        </div>
      </div>
    </header>
  );
};
