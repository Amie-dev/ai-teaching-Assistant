'use client';

import React, { useState, useEffect } from 'react';
import { Classroom, Member } from '../lib/types';
import { fetchMembers } from '../lib/api';
import { Copy, Check, Users, Shield, GraduationCap, KeyRound, Sparkles, Database, Cpu } from 'lucide-react';

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
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Join Code Hero Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#121829] via-[#0e1424] to-[#0a0f1d] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xl shadow-black/40">
        <div>
          <div className="flex items-center gap-2.5 font-extrabold text-base text-white mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-[#FF5B22]">
              <KeyRound className="w-4 h-4" />
            </div>
            <span>Classroom Join Code</span>
          </div>
          <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
            Share this 6-character code with students to let them instantly join <strong className="text-white font-bold">{classroom.name}</strong>, participate in discussion halls, and ask grounded questions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-5 py-2.5 rounded-2xl bg-[#080c16] border border-white/[0.12] text-lg font-mono font-extrabold tracking-widest text-[#FF5B22] shadow-inner">
            {classroom.joinCode}
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF5B22] to-[#FF7442] hover:from-[#EA4E17] hover:to-[#FF5B22] text-white text-xs font-bold shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            {copiedCode ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Classroom Settings & Vector Isolation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0e1424] border border-white/[0.06] shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
            <Sparkles className="w-4 h-4 text-[#FF5B22]" /> Socratic Dialogue Limit
          </div>
          <div className="text-xl font-extrabold text-white">{classroom.socraticTurnLimit} Turns</div>
          <p className="text-[11px] text-slate-400 mt-1">Automatic direct answer after 3 guidance steps</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1424] border border-white/[0.06] shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
            <Database className="w-4 h-4 text-emerald-400" /> Vector Isolation Boundary
          </div>
          <div className="text-xl font-extrabold text-emerald-400 flex items-center gap-2">
            <span>Classroom Scoped</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Strict ChromaDB metadata filter preventing cross-course leaks</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1424] border border-white/[0.06] shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
            <Cpu className="w-4 h-4 text-sky-400" /> RAG &amp; Inference Models
          </div>
          <div className="text-base font-extrabold text-white">GPT-OSS 120B &amp; Gemini 2</div>
          <p className="text-[11px] text-slate-400 mt-1">3072-dim embeddings with Llama 3.1 classifier</p>
        </div>
      </div>

      {/* Enrolled Members Roster */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#0e1424] border border-white/[0.06] shadow-xl shadow-black/20">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2.5">
            <Users className="w-4 h-4 text-[#FF5B22]" /> Enrolled Class Members ({members.length})
          </h3>
          <span className="text-xs text-slate-400 font-medium">B.Tech CSE Semester 7</span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {members.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">No members loaded</div>
          ) : (
            members.map((m) => (
              <div key={m.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#141c30] border border-white/[0.08] flex items-center justify-center text-sm font-bold text-white shadow-xs">
                    {m.avatar || m.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{m.name}</span>
                      {m.role === 'TEACHER' && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-[#FF5B22] border border-orange-500/30">
                          Instructor
                        </span>
                      )}
                      {m.role === 'STUDENT' && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                          Student
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{m.email}</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  Enrolled {new Date(m.joinedAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
