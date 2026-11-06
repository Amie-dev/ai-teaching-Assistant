'use client';

import React, { useState, useEffect } from 'react';
import { PageDetails, SourceCitation } from '../lib/types';
import { fetchDocumentPage } from '../lib/api';
import { X, ChevronLeft, ChevronRight, FileText, Loader2, AlertCircle } from 'lucide-react';

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
      className="w-96 border-l border-[#1f293d] bg-[#0c1120] flex flex-col h-[calc(100vh-4rem)] shadow-2xl z-10 overscroll-contain animate-in slide-in-from-right duration-200"
    >
      {/* Viewer Header */}
      <div className="p-4 border-b border-[#1f293d] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-[#FF5B22]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-slate-100 truncate" title={source.fileName}>
              {source.fileName}
            </h3>
            <p className="text-[11px] text-orange-400 tabular-nums font-medium">Page {currentPage}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close source viewer"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#182035] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5B22] cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Page Navigation Toolbar */}
      <div className="px-4 py-2 bg-[#121829] border-b border-[#232e48] flex items-center justify-between text-xs text-slate-300">
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1 || loading}
          aria-label="Previous page"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#182035] hover:bg-[#232e48] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-200 border border-[#232e48] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5B22] cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" /> Prev
        </button>

        <span className="font-semibold text-slate-300 tabular-nums">Page {currentPage}</span>

        <button
          type="button"
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={loading}
          aria-label="Next page"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#182035] hover:bg-[#232e48] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-200 border border-[#232e48] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5B22] cursor-pointer"
        >
          Next <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Source Citation Info Banner */}
      <div className="p-3 bg-orange-500/10 border-b border-orange-500/20 text-xs text-orange-200">
        <span className="font-semibold text-[#FF5B22]">Course Citation Grounding:</span> Page{' '}
        <span className="font-bold tabular-nums">{source.pageNumber}</span> referenced in answer
      </div>

      {/* Page Content Body */}
      <div className="flex-1 overflow-y-auto p-4 text-xs font-mono leading-relaxed text-slate-200 whitespace-pre-wrap selection:bg-[#FF5B22]/30 selection:text-white">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#FF5B22]" aria-hidden="true" />
            <span>Loading page {currentPage}…</span>
          </div>
        ) : error ? (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : pageData ? (
          <div className="bg-[#121829] p-3.5 rounded-xl border border-[#232e48]">
            {pageData.text || (
              <span className="italic text-slate-400">
                (No extracted text found on this page. May contain scanned diagram or image.)
              </span>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
};
