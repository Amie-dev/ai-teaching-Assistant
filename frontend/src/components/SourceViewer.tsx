'use client';

import React, { useState, useEffect } from 'react';
import { PageDetails, SourceCitation } from '../lib/types';
import { fetchDocumentPage } from '../lib/api';
import { X, ChevronLeft, ChevronRight, FileText, Loader2, AlertCircle, Sparkles } from 'lucide-react';

interface SourceViewerProps {
  source: SourceCitation | null;
  documentId?: string;
  onClose: () => void;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({
  source,
  documentId,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(source?.pageNumber || 1);
  const [pageData, setPageData] = useState<PageDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (source) {
      setCurrentPage(source.pageNumber);
    }
  }, [source]);

  useEffect(() => {
    if (!source || !documentId) return;

    let isMounted = true;
    const loadPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDocumentPage(documentId, currentPage);
        if (isMounted) setPageData(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load page text');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPage();
    return () => {
      isMounted = false;
    };
  }, [source, documentId, currentPage]);

  if (!source) return null;

  return (
    <aside
      aria-label="Course Source Page Viewer"
      className="w-96 border-l border-white/[0.08] bg-[#090e1b]/95 backdrop-blur-xl flex flex-col h-[calc(100vh-4rem)] shadow-2xl shadow-black/80 z-40 overscroll-contain animate-in slide-in-from-right duration-250 select-none"
    >
      {/* Viewer Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0e1424]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-[#FF5B22]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white truncate" title={source.fileName}>
              {source.fileName}
            </h3>
            <p className="text-[11px] text-[#FF5B22] font-semibold tabular-nums">Page {currentPage}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close source viewer"
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Page Navigation Toolbar */}
      <div className="px-4 py-2.5 bg-[#121829] border-b border-white/[0.06] flex items-center justify-between text-xs text-slate-300">
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1 || loading}
          aria-label="Previous page"
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#18233c] hover:bg-[#202e4e] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-200 border border-white/[0.06] cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" /> Prev
        </button>

        <span className="font-mono font-bold text-slate-200 text-xs tabular-nums">
          Page {currentPage}
        </span>

        <button
          type="button"
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={loading}
          aria-label="Next page"
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#18233c] hover:bg-[#202e4e] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-200 border border-white/[0.06] cursor-pointer"
        >
          Next <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Grounded Snippet Banner */}
      <div className="p-3 m-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-200">
        <div className="flex items-center gap-1.5 font-bold text-[#FF5B22] mb-1">
          <Sparkles className="w-3.5 h-3.5" /> Grounded Context Passage
        </div>
        <p className="text-[11px] leading-relaxed italic text-slate-300 line-clamp-3">
          &ldquo;{source.snippet}&rdquo;
        </p>
      </div>

      {/* Page Content Body */}
      <div className="flex-1 overflow-y-auto p-4 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap select-text">
        {loading && (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-[#FF5B22]" />
            <span className="text-xs">Loading page text…</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && pageData && (
          <div className="bg-[#121829]/70 p-4 rounded-2xl border border-white/[0.06] text-slate-200">
            {pageData.text || '(Page contains no extractable text)'}
          </div>
        )}

        {!loading && !error && !pageData && (
          <div className="bg-[#121829]/70 p-4 rounded-2xl border border-white/[0.06] text-slate-200">
            {source.snippet}
          </div>
        )}
      </div>
    </aside>
  );
};
