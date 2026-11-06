'use client';

import React, { useState } from 'react';
import { User } from '../lib/types';
import { loginUser, signupUser, setAuthToken } from '../lib/api';
import { X, Shield, GraduationCap, Mail, Lock, User as UserIcon, LogOut } from 'lucide-react';

interface AuthModalProps {
  currentUser: User | null;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  onClose,
  onAuthSuccess,
  onLogout,
}) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await loginUser(demoEmail, demoPass);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isSignup) {
        const res = await signupUser(name, email, password);
        onAuthSuccess(res.user);
      } else {
        const res = await loginUser(email, password);
        onAuthSuccess(res.user);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121829] border border-[#232e48] rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#182035]"
        >
          <X className="w-4 h-4" />
        </button>

        {currentUser ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-xl">
                {currentUser.avatar || '👤'}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{currentUser.name}</h3>
                <p className="text-xs text-slate-400">{currentUser.email}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0a0e1a] border border-[#232e48] text-xs text-slate-300 space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Account Type:</span>
                <span className="font-semibold text-emerald-400">Authenticated Member</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Multi-Classroom Access:</span>
                <span className="font-semibold text-white">Active</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#182035] hover:bg-[#232e48] text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-base font-bold text-white mb-1">
              {isSignup ? 'Create Account' : 'Sign In to AI Teaching Assistant'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Connect to your course classrooms, discussion halls, and isolated AI tutor.
            </p>

            {/* Quick Demo Switcher Buttons */}
            <div className="mb-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Quick Demo Switcher
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('teacher@brainware.edu', 'teacher123')}
                  className="p-3 rounded-xl bg-[#182035] hover:bg-[#232e48] border border-[#232e48] text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-orange-400 mb-0.5">
                    <Shield className="w-3.5 h-3.5 text-[#FF5B22]" /> Teacher
                  </div>
                  <div className="text-[11px] text-slate-300">Prof. Ria Pyne</div>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('student@brainware.edu', 'student123')}
                  className="p-3 rounded-xl bg-[#182035] hover:bg-[#232e48] border border-[#232e48] text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-sky-400 mb-0.5">
                    <GraduationCap className="w-3.5 h-3.5 text-sky-400" /> Student
                  </div>
                  <div className="text-[11px] text-slate-300">Aminul Islam</div>
                </button>
              </div>
            </div>

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1f293d]" />
              </div>
              <span className="relative bg-[#121829] px-2 text-[10px] text-slate-500 uppercase tracking-widest">
                or with credentials
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignup && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0a0e1a] border border-[#232e48] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5B22]"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    placeholder="student@brainware.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0a0e1a] border border-[#232e48] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5B22]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0a0e1a] border border-[#232e48] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5B22]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 rounded-xl bg-[#FF5B22] hover:bg-[#EA4E17] text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all cursor-pointer"
              >
                {loading ? 'Authenticating…' : isSignup ? 'Create Account' : 'Sign In'}
              </button>

              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
