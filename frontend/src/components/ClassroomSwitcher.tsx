'use client';

import React, { useState } from 'react';
import { Classroom } from '../lib/types';
import { UserRole } from '../lib/api';
import { Plus, LogIn, GraduationCap, Trash2, X, Sparkles, BookOpen } from 'lucide-react';

interface ClassroomSwitcherProps {
  classrooms: Classroom[];
  activeClassroomId: string | null;
  onSelectClassroom: (id: string) => void;
  onCreateClassroom: (name: string, subject: string, description?: string) => Promise<void>;
  onDeleteClassroom: (id: string) => Promise<void>;
  onJoinClassroom: (joinCode: string) => Promise<void>;
  activeRole: UserRole;
}

export const ClassroomSwitcher: React.FC<ClassroomSwitcherProps> = ({
  classrooms,
  activeClassroomId,
  onSelectClassroom,
  onCreateClassroom,
  onDeleteClassroom,
  onJoinClassroom,
  activeRole,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSubject, setCreateSubject] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isTeacher = activeRole === 'TEACHER';

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await onCreateClassroom(createName, createSubject, createDesc);
      setShowCreateModal(false);
      setCreateName('');
      setCreateSubject('');
      setCreateDesc('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create classroom');
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await onJoinClassroom(joinCode.trim().toUpperCase());
      setShowJoinModal(false);
      setJoinCode('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to join classroom');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete classroom "${name}"? All its discussion halls and resources will be deleted.`)) {
      await onDeleteClassroom(id);
    }
  };

  return (
    <>
      <aside
        aria-label="Classroom Switcher"
        className="w-[72px] bg-[#070b14] border-r border-white/[0.06] flex flex-col items-center py-4 gap-3 shrink-0 z-40 select-none"
      >
        {/* App Emblem */}
        <div
          className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF5B22] via-[#FF6D38] to-[#FFA07A] flex items-center justify-center text-white shadow-lg shadow-orange-500/30 ring-1 ring-white/20 transition-transform hover:scale-105 cursor-pointer"
          title="Brainware University AI Teaching Assistant"
        >
          <GraduationCap className="w-5 h-5 text-white" />
        </div>

        <div className="w-8 h-[1px] bg-white/[0.08] my-1" />

        {/* Classroom List Rail */}
        <div className="flex-1 w-full flex flex-col items-center gap-2.5 overflow-y-auto px-1.5 scrollbar-none">
          {classrooms.map((c) => {
            const isActive = c.id === activeClassroomId;
            const initials = c.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div key={c.id} className="relative group w-full flex items-center justify-center">
                {/* Active Indicator Bar on Left Edge */}
                {isActive && (
                  <span className="absolute left-0 w-1.5 h-7 rounded-r-full bg-[#FF5B22] shadow-[0_0_12px_#FF5B22]" />
                )}

                <button
                  type="button"
                  onClick={() => onSelectClassroom(c.id)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-gradient-to-br from-[#18233c] to-[#0e1628] text-[#FF5B22] border-2 border-[#FF5B22]/60 shadow-lg shadow-orange-500/15 scale-105'
                      : 'bg-[#101728] hover:bg-[#182238] text-slate-300 hover:text-white border border-white/[0.06] hover:scale-105'
                  }`}
                  title={`${c.name} (${c.subject})`}
                >
                  {initials}
                </button>

                {/* Delete Button (Teacher Only, on hover) */}
                {isTeacher && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, c.id, c.name)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer z-10"
                    title={`Delete classroom "${c.name}"`}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}

                {/* Tooltip on Hover */}
                <div className="absolute left-[78px] px-3 py-1.5 rounded-xl bg-[#0f172a] border border-white/[0.1] text-xs font-medium text-slate-200 whitespace-nowrap shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <div className="font-bold text-white text-xs">{c.name}</div>
                  <div className="text-[10px] text-slate-400">{c.subject} · Code: {c.joinCode}</div>
                </div>
              </div>
            );
          })}

          {/* Teacher: Create Classroom Button */}
          {isTeacher && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-11 h-11 rounded-2xl bg-[#101728] hover:bg-[#FF5B22]/15 text-slate-400 hover:text-[#FF5B22] border border-dashed border-white/[0.15] hover:border-[#FF5B22]/50 flex items-center justify-center transition-all cursor-pointer group shadow-xs mt-1"
              title="Create New Classroom (Teacher)"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          )}

          {/* Student / Teacher: Join Classroom with Code */}
          <button
            type="button"
            onClick={() => setShowJoinModal(true)}
            className="w-11 h-11 rounded-2xl bg-[#101728] hover:bg-sky-500/15 text-slate-400 hover:text-sky-400 border border-dashed border-white/[0.15] hover:border-sky-500/50 flex items-center justify-center transition-all cursor-pointer group shadow-xs"
            title="Join Classroom via Code"
          >
            <LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </aside>

      {/* Modal: Create Classroom (Teacher) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e1424] border border-white/[0.1] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl shadow-black/80">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-[#FF5B22]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Create New Classroom</h3>
                  <p className="text-xs text-slate-400">Set up a course with isolated vector storage</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Classroom Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems & Cloud Computing"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141c30] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#FF5B22] focus:ring-1 focus:ring-[#FF5B22] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Subject / Semester *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech CSE (Semester 7)"
                  value={createSubject}
                  onChange={(e) => setCreateSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141c30] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#FF5B22] focus:ring-1 focus:ring-[#FF5B22] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Course topics, exam syllabus, office hours..."
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141c30] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#FF5B22] focus:ring-1 focus:ring-[#FF5B22] transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5B22] to-[#FF7442] hover:from-[#EA4E17] hover:to-[#FF5B22] text-white text-xs font-bold shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                >
                  Create Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Join Classroom (Student / Teacher) */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0e1424] border border-white/[0.1] rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl shadow-black/80">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <LogIn className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Join Classroom</h3>
                  <p className="text-xs text-slate-400">Enter the 6-character code</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Classroom Join Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. CSE701"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-3 rounded-xl bg-[#141c30] border border-white/[0.08] text-white text-center font-mono text-lg font-bold tracking-widest placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
                >
                  Join Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
