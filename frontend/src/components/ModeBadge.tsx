'use client';

import React from 'react';
import { RouteLabel } from '../lib/types';
import { BookOpen, HelpCircle, AlertCircle, Sparkles } from 'lucide-react';

interface ModeBadgeProps {
  route?: RouteLabel;
  isGuiding?: boolean;
}

export const ModeBadge: React.FC<ModeBadgeProps> = ({ route, isGuiding }) => {
  if (!route) return null;

  if (route === 'factual') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/25 shadow-xs">
        <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
        Direct Answer Agent
      </span>
    );
  }

  if (route === 'conceptual') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-[#FF5B22] border border-orange-500/25 shadow-xs">
        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
        {isGuiding ? 'Socratic Guidance (Turn Active)' : 'Socratic Tutor Agent'}
      </span>
    );
  }

  if (route === 'unsupported') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-xs">
        <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
        Outside Course Material
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#182035] text-slate-300 border border-[#232e48]">
      <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
      General Assistant
    </span>
  );
};
