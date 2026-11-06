'use client';

import React, { useState, useEffect } from 'react';
import { Classroom, Member } from '../lib/types';
import { fetchMembers } from '../lib/api';
import { Copy, Check, Users, Shield, GraduationCap, KeyRound, Sparkles } from 'lucide-react';

interface ClassroomMembersProps {
  classroom: Classroom;
}

export const ClassroomMembers: React.FC<ClassroomMembersProps> = ({ classroom }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchMembers(classroom.id)
      .then(setMembers)
      .catch((err) => console.error('Failed to load members:', err));
  }, [classroom.id]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(classroom.joinCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto space-y-6">
      {/* Join Code Card */}
      <div className="p-6 rounded-2xl bg-[#121829] border border-[#232e48] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-black/20">
        <div>
          <div className="flex items-center gap-2 font-bold text-sm text-white mb-1">
            <KeyRound className="w-4 h-4 text-[#FF5B22]" /> Classroom Join Code
          </div>
          <p className="text-xs text-slate-400">
            Share this 6-character code with students to let them join this classroom instantly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-[#0a0e1a] border border-[#232e48] text-base font-mono font-bold tracking-widest text-[#FF5B22]">
            {classroom.joinCode}
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF5B22] hover:bg-[#EA4E17] text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Classroom Settings Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#121829] border border-[#232e48]">
          <span className="text-xs text-slate-400 font-medium">Socratic Reasoning Turn Limit</span>
          <div className="text-lg font-bold text-white mt-1">{classroom.socraticTurnLimit} turns</div>
          <p className="text-[11px] text-slate-500 mt-1">Automatic direct answer after 3 guidance turns</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121829] border border-[#232e48]">
          <span className="text-xs text-slate-400 font-medium">Vector Isolation</span>
          <div className="text-lg font-bold text-emerald-400 mt-1">Enabled (Per-Classroom)</div>
          <p className="text-[11px] text-slate-500 mt-1">Strict boundary preventing cross-course leaks</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121829] border border-[#232e48]">
          <span className="text-xs text-slate-400 font-medium">AI Teaching Assistant</span>
          <div className="text-lg font-bold text-[#FF5B22] mt-1">Active in Halls &amp; Chat</div>
          <p className="text-[11px] text-slate-500 mt-1">Summonable via @assistant in discussion</p>
        </div>
      </div>

      {/* Members Roster */}
      <div className="p-6 rounded-2xl bg-[#121829] border border-[#232e48]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FF5B22]" /> Enrolled Members ({members.length})
          </h3>
          <span className="text-xs text-slate-400">Classroom Roster</span>
        </div>

        <div className="divide-y divide-[#1f293d]">
          {members.map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#182035] border border-[#232e48] flex items-center justify-center text-sm font-bold text-white">
                  {m.avatar || m.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{m.name}</div>
                  <div className="text-[11px] text-slate-400">{m.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {m.role === 'TEACHER' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-500/10 text-[#FF5B22] border border-orange-500/25">
                    <Shield className="w-3 h-3" /> Teacher (Owner)
                  </span>
                ) : m.role === 'TA' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/25">
                    TA
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    <GraduationCap className="w-3 h-3" /> Student
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

