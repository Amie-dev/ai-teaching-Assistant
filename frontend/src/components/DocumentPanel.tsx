'use client';

import React, { useRef, useState } from 'react';
import { DocumentRecord } from '../lib/types';
import {
  Upload,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Files,
} from 'lucide-react';

interface DocumentPanelProps {
  documents: DocumentRecord[];
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const DocumentPanel: React.FC<DocumentPanelProps> = ({
  documents,
  onUpload,
  onDelete,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);

    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        validFiles.push(file);
      } else {
        setErrorMsg('Only PDF documents are supported.');
        return;
      }
    }

    try {
      await onUpload(validFiles);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload document');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await handleFiles(e.dataTransfer.files);
  };

  return (
    <aside
      aria-label="Course Documents"
      className="w-80 border-r border-slate-800 bg-slate-900/40 flex flex-col h-[calc(100vh-4rem)]"
    >
      {/* Upload Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Files className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          Course Documents
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Upload course PDFs, lecture slides, or textbook notes to ground the assistant.
        </p>

        {/* Dropzone Button */}
        <button
          type="button"
          aria-label="Upload PDF course documents"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full mt-3 p-4 rounded-xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-800/40 hover:bg-slate-800/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            aria-label="Select PDF files to upload"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 py-2" aria-live="polite">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" aria-hidden="true" />
              <span className="text-xs text-slate-300 font-medium">Extracting &amp; indexing pages…</span>
            </div>
          ) : (
            <>
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center mb-2 text-cyan-400">
                <Upload className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="text-xs font-medium text-slate-200">
                Click or drag &amp; drop PDF files
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Up to 25&nbsp;MB · Text selectable
              </p>
            </>
          )}
        </button>

        {errorMsg && (
          <div
            role="alert"
            className="mt-2 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-1.5"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {documents.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-500 text-xs">
            No course materials uploaded yet. Add a PDF above to start learning!
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.documentId}
              className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 transition-colors flex flex-col gap-2 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate" title={doc.fileName}>
                      {doc.fileName}
                    </p>
                    <p className="text-[11px] text-slate-400 tabular-nums">
                      {doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'} · {(doc.fileSize / 1024).toFixed(0)}&nbsp;KB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDelete(doc.documentId)}
                  aria-label={`Delete ${doc.fileName} and its embeddings`}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  title="Delete document and vectors"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* Status and warnings */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-700/40">
                <div className="flex items-center gap-1">
                  {doc.status === 'ready' && (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Indexed &amp; Ready
                    </span>
                  )}
                  {doc.status === 'indexing' && (
                    <span className="flex items-center gap-1 text-cyan-400 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> Indexing…
                    </span>
                  )}
                  {doc.status === 'failed' && (
                    <span className="flex items-center gap-1 text-rose-400 font-medium">
                      <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Failed
                    </span>
                  )}
                </div>

                {doc.emptyPageCount > 0 && (
                  <span
                    className="flex items-center gap-1 text-amber-400 text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
                    title={`${doc.emptyPageCount} pages seem to be image-only/scanned.`}
                  >
                    <AlertTriangle className="w-3 h-3" aria-hidden="true" /> {doc.emptyPageCount}&nbsp;img-only
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 bg-slate-950/40">
        <span>{documents.length} document{documents.length === 1 ? '' : 's'} indexed</span>
        <span className="float-right text-slate-400">Strict Grounding</span>
      </div>
    </aside>
  );
};
