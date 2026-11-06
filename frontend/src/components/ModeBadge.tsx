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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-xs">
        <BookOpen className="w-3 h-3" aria-hidden="true" />
        Direct Answer Agent
      </span>
    );
  }

  if (route === 'conceptual') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-purple-500/15 to-orange-500/15 text-purple-300 border border-purple-500/30 shadow-xs">
        <Sparkles className="w-3 h-3 text-[#FF5B22]" aria-hidden="true" />
        {isGuiding ? 'Socratic Guidance (Turn Active)' : 'Socratic Tutor Agent'}
      </span>
    );
  }

  if (route === 'unsupported') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-xs">
        <AlertCircle className="w-3 h-3" aria-hidden="true" />
        Outside Course Material
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#141c30] text-slate-300 border border-white/[0.08]">
      <HelpCircle className="w-3 h-3" aria-hidden="true" />
      General Assistant
    </span>
  );
};
