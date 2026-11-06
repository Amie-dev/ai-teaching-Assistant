'use client';

import React from 'react';
import { RouteLabel } from '../lib/types';
import { BookOpen, HelpCircle, AlertCircle, Compass } from 'lucide-react';

interface ModeBadgeProps {
  route?: RouteLabel;
  isGuiding?: boolean;
}

export const ModeBadge: React.FC<ModeBadgeProps> = ({ route, isGuiding }) => {
  if (!route) return null;

  if (route === 'factual') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <BookOpen className="w-3.5 h-3.5" />
        Direct Answer Agent
      </span>
    );
  }

  if (route === 'conceptual') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
        <Compass className="w-3.5 h-3.5" />
        {isGuiding ? 'Socratic Guidance (Turn Active)' : 'Socratic Tutor Agent'}
      </span>
    );
  }

  if (route === 'unsupported') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <AlertCircle className="w-3.5 h-3.5" />
        Outside Course Material
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-300 border border-slate-500/20">
      <HelpCircle className="w-3.5 h-3.5" />
      General Assistant
    </span>
  );
};

