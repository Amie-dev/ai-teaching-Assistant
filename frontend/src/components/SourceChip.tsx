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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#121829] hover:bg-[#18233c] text-slate-200 hover:text-white border border-white/[0.08] hover:border-[#FF5B22]/50 transition-all cursor-pointer shadow-xs group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5B22]"
      title={`Inspect page ${source.pageNumber} in ${source.fileName}`}
    >
      <FileText className="w-3.5 h-3.5 text-[#FF5B22] group-hover:scale-110 transition-transform" aria-hidden="true" />
      <span className="truncate max-w-[150px] font-medium">{source.fileName}</span>
      <span className="text-slate-600" aria-hidden="true">·</span>
      <span className="font-mono font-bold text-[#FF5B22] text-[11px] tabular-nums">p.{source.pageNumber}</span>
      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-white ml-0.5 transition-colors" aria-hidden="true" />
    </button>
  );
};
