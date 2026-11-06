'use client';

import React, { useState } from 'react';
import { Classroom } from '../lib/types';
import { UserRole } from '../lib/api';
import { Plus, LogIn, GraduationCap, Trash2 } from 'lucide-react';

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
        className="w-16 bg-[#070a13] border-r border-[#192132] flex flex-col items-center py-3 gap-3 shrink-0 z-30"
      >
        {/* App Emblem */}
        <div
          className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5B22] to-[#FF844B] flex items-center justify-center text-white shadow-lg shadow-orange-500/25 ring-1 ring-white/10"
          title="AI Teaching Assistant"
        >
          <GraduationCap className="w-5 h-5 text-white" />
        </div>

        <div className="w-8 h-[1px] bg-[#1f293d] my-1" />

        {/* Classroom List Icons */}
        <div className="flex-1 w-full flex flex-col items-center gap-2 overflow-y-auto px-1">
          {classrooms.map((c) => {
            const isActive = c.id === activeClassroomId;
            const initials = c.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div key={c.id} className="relative group w-10 h-10">
                <button
                  type="button"
                  onClick={() => onSelectClassroom(c.id)}
                  title={`${c.name} (${c.subject})`}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-[#FF5B22] text-white shadow-md shadow-orange-500/25 scale-105'
                      : 'bg-[#121829] text-slate-300 hover:bg-[#182035] hover:text-white border border-[#232e48]'
                  }`}
                >
                  {initials || 'CR'}
                  {isActive && (
                    <span className="absolute -left-1 top-2 bottom-2 w-1 bg-[#FF5B22] rounded-r-full" />
                  )}
                </button>

                {/* Teacher Delete Classroom button */}
                {isTeacher && classrooms.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, c.id, c.name)}
                    className="opacity-0 group-hover:opacity-100 absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md transition-opacity cursor-pointer z-10"
                    title={`Delete classroom "${c.name}"`}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-[#1f293d] w-full">
          {/* Join with Code (Student or Teacher) */}
          <button
            type="button"
            onClick={() => setShowJoinModal(true)}
            className="w-10 h-10 rounded-2xl bg-[#121829] hover:bg-[#182035] border border-[#232e48] text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Join classroom with 6-char code"
          >
            <LogIn className="w-4 h-4 text-sky-400" />
          </button>

          {/* Create Classroom (Teacher privilege) */}
          {isTeacher ? (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-10 h-10 rounded-2xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-[#FF5B22] flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="Create new classroom (Teacher)"
            >
              <Plus className="w-5 h-5" />
            </button>
          ) : (
            <div
              className="w-10 h-10 rounded-2xl bg-[#121829]/50 border border-[#232e48]/50 text-slate-600 flex items-center justify-center"
              title="Only teachers can create classrooms. Switch to Teacher in the top-right."
            >
              <Plus className="w-4 h-4" />
            </div>
          )}
        </div>
      </aside>

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121829] border border-[#232e48] rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white mb-1">Create New Classroom (Teacher)</h3>
            <p className="text-xs text-slate-400 mb-4">
              Set up a course workspace with discussion halls and an isolated AI tutor.
            </p>

            {errorMsg && (
              <div className="p-3 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Course / Classroom Name</label>
                <input
                  type="text"
                  placeholder="e.g. Artificial Intelligence & Agentic Systems"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0e1a] border border-[#232e48] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5B22]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject / Programme</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech CSE (Semester 7)"
                  value={createSubject}
                  onChange={(e) => setCreateSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0e1a] border border-[#232e48] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5B22]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  placeholder="Course outline and syllabus details..."
                  rows={2}
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0e1a] border border-[#232e48] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5B22]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF5B22] hover:bg-[#EA4E17] text-white text-xs font-semibold shadow-md shadow-orange-500/25"
                >
                  Create Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Classroom Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121829] border border-[#232e48] rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white mb-1">Join a Classroom</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter the 6-character join code (e.g. <span className="font-mono text-[#FF5B22]">CSE701</span>).
            </p>

            {errorMsg && (
              <div className="p-3 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">6-Character Join Code</label>
                <input
                  type="text"
                  placeholder="e.g. CSE701"
                  maxLength={8}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-3 rounded-xl bg-[#0a0e1a] border border-[#232e48] text-center font-mono font-bold tracking-widest text-lg text-[#FF5B22] placeholder:text-slate-600 focus:outline-none focus:border-[#FF5B22]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF5B22] hover:bg-[#EA4E17] text-white text-xs font-semibold shadow-md shadow-orange-500/25"
                >
                  Join Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
