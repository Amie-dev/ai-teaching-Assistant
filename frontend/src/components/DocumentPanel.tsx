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
  Lock,
} from 'lucide-react';

interface DocumentPanelProps {
  documents: DocumentRecord[];
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
  isTeacher?: boolean;
}

export const DocumentPanel: React.FC<DocumentPanelProps> = ({
  documents,
  onUpload,
  onDelete,
  isLoading,
  isTeacher = true,
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
    if (!isTeacher) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (!isTeacher) return;
    e.preventDefault();
    setIsDragging(false);
    await handleFiles(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <aside
      aria-label="Course Documents"
      className="w-80 border-r border-[#1f293d] bg-[#0c1120] flex flex-col h-[calc(100vh-4rem)]"
    >
      {/* Upload Header */}
      <div className="p-4 border-b border-[#1f293d]">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Files className="w-4 h-4 text-[#FF5B22]" aria-hidden="true" />
          Course Resources
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          {isTeacher
            ? 'Upload syllabus PDFs, slides, or notes to ground assistant responses.'
            : 'Course materials uploaded by your instructor for AI grounding.'}
        </p>

        {/* Teacher Upload Dropzone */}
        {isTeacher ? (
          <button
            type="button"
            aria-label="Upload PDF course documents"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full mt-3 p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5B22] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1120] group ${
              isDragging
                ? 'border-[#FF5B22] bg-[#FF5B22]/10 scale-[1.01]'
                : 'border-[#232e48] hover:border-[#FF5B22]/60 bg-[#121829]/60 hover:bg-[#121829]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#FF5B22] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" aria-hidden="true" />
            </div>

            <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
              Click to upload or drag &amp; drop
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              PDF files only (syllabus, notes, books)
            </span>
          </button>
        ) : (
          <div className="mt-3 p-3 rounded-xl bg-[#121829] border border-[#232e48] text-xs text-slate-400 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Teacher managed. Students can read and query all course resources.</span>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="mt-2.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Sources ({documents.length})
          </span>
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-orange-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span>Indexing…</span>
            </div>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#121829] border border-[#232e48] flex items-center justify-center mx-auto text-slate-500 mb-3">
              <FileText className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-xs font-medium text-slate-300">No documents indexed yet</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {isTeacher
                ? 'Upload course PDFs to enable page citations and Socratic explanations.'
                : 'Your instructor has not uploaded any PDFs to this classroom yet.'}
            </p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.documentId}
              className="p-3 rounded-xl bg-[#121829] border border-[#232e48] hover:border-[#2f3d5f] transition-all flex items-start justify-between gap-3 group/item shadow-xs"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 mt-0.5 border border-orange-500/20">
                  <FileText className="w-4 h-4 text-[#FF5B22]" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-slate-200 truncate group-hover/item:text-white" title={doc.fileName}>
                    {doc.fileName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="tabular-nums">{doc.pageCount} pages</span>
                    <span>·</span>
                    <span className="tabular-nums">{formatFileSize(doc.fileSize)}</span>
                  </div>

                  {/* Document Ingestion Warnings */}
                  {doc.warnings && doc.warnings.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-400">
                      <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span className="truncate" title={doc.warnings[0]}>
                        {doc.warnings[0]}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>Vector Indexed</span>
                  </div>
                </div>
              </div>

              {/* Accessible Delete button (Teacher only) */}
              {isTeacher && (
                <button
                  type="button"
                  onClick={() => onDelete(doc.documentId)}
                  aria-label={`Remove document ${doc.fileName}`}
                  className="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                  title={`Remove ${doc.fileName}`}
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#1f293d] bg-[#090d16] text-[11px] text-slate-400 flex items-center justify-between">
        <span>Persistent Vector Store</span>
        <span className="font-semibold text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> ChromaDB
        </span>
      </div>
    </aside>
  );
};
