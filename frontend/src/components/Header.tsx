'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Database,
  KeyRound,
  Shield,
  User,
  Check,
  Copy,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Classroom, HealthStatus } from '../lib/types';
import { UserRole } from '../lib/api';

interface HeaderProps {
  health: HealthStatus | null;
  classroom: Classroom | null;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  classroom,
  activeRole,
  onRoleChange,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#080c16]/90 backdrop-blur-xl px-5 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm shadow-black/40">
      {/* Left: Branding & Active Classroom */}
      <div className="flex items-center gap-3.5">
        <div className="relative group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF5B22] via-[#FF6D38] to-[#FFA07A] flex items-center justify-center text-white shadow-lg shadow-orange-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105 shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#080c16]" />
        </div>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
              {classroom ? classroom.name : 'AI Teaching Assistant'}
            </h1>

            {classroom && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#141c30] text-slate-300 border border-white/[0.08]">
                <BookOpen className="w-2.5 h-2.5 text-[#FF5B22]" />
                {classroom.subject}
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B22]" />
            <span>Socratic Tutoring &amp; RAG Grounding</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">B.Tech CSE Sem 7</span>
          </p>
        </div>
      </div>

      {/* Right Controls: Join Code, Health & Segmented Role Toggle */}
      <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
        {/* Classroom Join Code Pill */}
        {classroom && (
          <button
            type="button"
            onClick={() => handleCopyCode(classroom.joinCode)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121829] hover:bg-[#1a233b] border border-white/[0.08] hover:border-[#FF5B22]/40 text-slate-200 transition-all cursor-pointer group shadow-xs"
            title="Click to copy join code to clipboard"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#FF5B22] group-hover:rotate-12 transition-transform" />
            <span className="text-[11px] font-medium text-slate-400">Code:</span>
            <span className="font-mono font-extrabold text-[#FF5B22] tracking-wider">{classroom.joinCode}</span>
            {copied ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                <Check className="w-3 h-3" /> Copied
              </span>
            ) : (
              <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
            )}
          </button>
        )}

        {/* Database & Vector Store Health Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121829] border border-white/[0.08] text-slate-300 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-300">Docker RAG Ready</span>
        </div>

        {/* Segmented Zero-Friction Role Switcher (Teacher vs Student) */}
        <div className="flex items-center p-1 rounded-xl bg-[#101728] border border-white/[0.08] shadow-inner">
          <button
            type="button"
            onClick={() => onRoleChange('TEACHER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeRole === 'TEACHER'
                ? 'bg-gradient-to-r from-[#FF5B22] to-[#FF7442] text-white shadow-md shadow-orange-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
            title="Teacher Mode: Full control to create classrooms, delete classrooms, manage PDFs, and lock halls"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Teacher</span>
          </button>

          <button
            type="button"
            onClick={() => onRoleChange('STUDENT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeRole === 'STUDENT'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
            title="Student Mode: Join classrooms, create discussion halls, chat, and summon Socratic AI"
          >
            <User className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>
        </div>
      </div>
    </header>
  );
};
