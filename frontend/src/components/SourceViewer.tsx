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
    <div className="w-96 border-l border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col h-[calc(100vh-4rem)] shadow-2xl z-10 animate-in slide-in-from-right duration-200">
      {/* Viewer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-slate-200 truncate" title={source.fileName}>
              {source.fileName}
            </h3>
            <p className="text-[11px] text-slate-400">Page {currentPage}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Page Navigation Toolbar */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1 || loading}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-200"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>

        <span className="font-medium text-slate-400">Page {currentPage}</span>

        <button
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-200"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Page Text Content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span>Loading page content...</span>
          </div>
        ) : error ? (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : pageData?.isEmpty ? (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>This page contains no extractable selectable text (it may be a diagram or image).</span>
          </div>
        ) : (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 shadow-inner">
            {pageData?.text || 'No text extracted for this page.'}
          </div>
        )}
      </div>

      {/* Viewer Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Source Verified (RAG Grounded)</span>
        <span className="text-cyan-400/80">Page Citation</span>
      </div>
    </div>
  );
};

