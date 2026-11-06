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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#121829] hover:bg-[#182035] text-slate-300 hover:text-white border border-[#232e48] hover:border-[#FF5B22]/50 transition-all cursor-pointer shadow-xs group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5B22]"
      title={`Open ${source.fileName} on page ${source.pageNumber}`}
    >
      <FileText className="w-3.5 h-3.5 text-orange-400 group-hover:text-[#FF5B22] transition-colors" aria-hidden="true" />
      <span className="truncate max-w-[140px] font-medium">{source.fileName}</span>
      <span className="text-slate-500" aria-hidden="true">·</span>
      <span className="font-semibold text-orange-400 tabular-nums">p.{source.pageNumber}</span>
      <ExternalLink className="w-3 h-3 text-slate-500 opacity-70 group-hover:opacity-100 group-hover:text-[#FF5B22] ml-0.5 transition-colors" aria-hidden="true" />
    </button>
  );
};
