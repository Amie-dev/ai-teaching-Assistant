'use client';

import React from 'react';
import { GraduationCap, Database, Cpu, Sparkles, KeyRound, Shield, Check, Copy } from 'lucide-react';
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
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <header className="h-16 border-b border-[#1f293d] bg-[#0a0e1a]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
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
            <span
              className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                activeRole === 'TEACHER'
                  ? 'bg-orange-500/10 text-[#FF5B22] border-orange-500/25'
                  : 'bg-sky-500/10 text-sky-400 border-sky-500/25'
              }`}
            >
              Active Role: {activeRole}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {classroom
              ? `${classroom.subject}`
              : 'Socratic Tutoring & Course-Grounded Retrieval · B.Tech CSE (Sem 7)'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs">
        {/* Classroom Join Code Pill */}
        {classroom && (
          <button
            type="button"
            onClick={() => handleCopyCode(classroom.joinCode)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121829] hover:bg-[#182035] border border-[#232e48] text-slate-300 transition-colors cursor-pointer"
            title="Click to copy join code"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#FF5B22]" />
            <span className="font-mono font-bold text-[#FF5B22]">{classroom.joinCode}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
          </button>
        )}

        {/* Database & Chroma Health Chips */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121829] border border-[#232e48] text-slate-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-200">PostgreSQL + ChromaDB</span>
        </div>

        {/* Direct UI Role Switcher: Teacher vs Student */}
        <div className="flex items-center p-1 rounded-xl bg-[#121829] border border-[#232e48]">
          <button
            type="button"
            onClick={() => onRoleChange('TEACHER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeRole === 'TEACHER'
                ? 'bg-[#FF5B22] text-white shadow-md shadow-orange-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Teacher: Can create/delete classrooms, upload/delete resources, lock halls"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Teacher</span>
          </button>

          <button
            type="button"
            onClick={() => onRoleChange('STUDENT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeRole === 'STUDENT'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Student: Can join classrooms, create discussion halls, chat with AI"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>
        </div>
      </div>
    </header>
  );
};
