'use client';

import React from 'react';
import { SourceCitation } from '../lib/types';
import { FileText, ExternalLink } from 'lucide-react';

interface SourceChipProps {
  source: SourceCitation;
  onClick: (source: SourceCitation) => void;
}

export const SourceChip: React.FC<SourceChipProps> = ({ source, onClick }) => {
  return (
    <button
      type="button"
      onClick={() => onClick(source)}
      aria-label={`Open source document ${source.fileName} on page ${source.pageNumber}`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer shadow-sm group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      title={`Open ${source.fileName} on page ${source.pageNumber}`}
    >
      <FileText className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300" aria-hidden="true" />
      <span className="truncate max-w-[140px]">{source.fileName}</span>
      <span className="text-slate-400" aria-hidden="true">·</span>
      <span className="font-semibold text-slate-200 tabular-nums">p.{source.pageNumber}</span>
      <ExternalLink className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:text-cyan-300 ml-0.5" aria-hidden="true" />
    </button>
  );
};
