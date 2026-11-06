'use client';

import React from 'react';
import { GraduationCap, Database, Cpu, Sparkles, KeyRound, User as UserIcon, Shield } from 'lucide-react';
import { Classroom, HealthStatus, User } from '../lib/types';

interface HeaderProps {
  health: HealthStatus | null;
  classroom: Classroom | null;
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  classroom,
  currentUser,
  onOpenAuth,
}) => {
  return (
    <header className="h-16 border-b border-[#1f293d] bg-[#0a0e1a]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Agorapulse-style vibrant coral/orange badge icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF5B22] to-[#FF844B] flex items-center justify-center shadow-lg shadow-orange-500/25 ring-1 ring-white/10 shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {classroom ? classroom.name : 'AI Teaching Assistant'}
            </h1>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-[#FF5B22] border border-orange-500/25">
              {classroom ? classroom.role : 'Agentic RAG'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {classroom
              ? `${classroom.subject} · Code: ${classroom.joinCode}`
              : 'Socratic Tutoring & Course-Grounded Retrieval · B.Tech CSE (Sem 7)'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs">
        {/* System & DB Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121829] border border-[#232e48] text-slate-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-200">PostgreSQL (Docker)</span>
        </div>

        {/* LLM Engine chip */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121829] border border-[#232e48] text-slate-300 shadow-sm">
          <Cpu className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-medium text-slate-200">Llama 3.1 (Groq)</span>
        </div>

        {/* User Account / Switcher Pill */}
        <button
          type="button"
          onClick={onOpenAuth}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121829] hover:bg-[#182035] border border-[#232e48] hover:border-[#FF5B22]/50 text-slate-200 transition-all cursor-pointer shadow-sm group"
        >
          <div className="w-5 h-5 rounded-lg bg-orange-500/10 text-[#FF5B22] flex items-center justify-center text-xs font-bold">
            {currentUser?.avatar || '👤'}
          </div>
          <span className="font-semibold text-xs group-hover:text-white">
            {currentUser ? currentUser.name : 'Sign In'}
          </span>
          {classroom && (
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              ({classroom.role.toLowerCase()})
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
