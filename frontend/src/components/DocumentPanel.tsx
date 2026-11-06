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
  Sparkles,
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
        setErrorMsg('Only PDF documents (.pdf) are supported.');
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
      className="w-80 border-r border-white/[0.06] bg-[#0b101d] flex flex-col h-[calc(100vh-4rem)] select-none shrink-0"
    >
      {/* Upload Header */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Files className="w-4 h-4 text-[#FF5B22]" aria-hidden="true" />
            Course Resources
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#141c30] text-[#FF5B22] border border-white/[0.08]">
            {documents.length} files
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {isTeacher
            ? 'Upload syllabus PDFs, slides, or notes to ground AI responses.'
            : 'Course materials uploaded by your instructor for AI grounding.'}
        </p>

        {/* Teacher Upload Dropzone */}
        {isTeacher ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            disabled={isLoading}
            className={`w-full mt-3 p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
              isDragging
                ? 'border-[#FF5B22] bg-[#FF5B22]/10 scale-[1.02]'
                : 'border-white/[0.12] hover:border-[#FF5B22]/50 bg-[#101728] hover:bg-[#151e34]'
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-xs`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,application/pdf"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-[#FF5B22]">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-white block">
                {isLoading ? 'Processing & Embedding…' : 'Upload Course PDF'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Click or drag &amp; drop (Max 25 MB)
              </span>
            </div>
          </button>
        ) : (
          <div className="mt-3 p-3 rounded-2xl bg-[#101728] border border-white/[0.06] flex items-center gap-2 text-slate-400 text-xs">
            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-[11px]">Instructor uploads only (Read access active)</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="text-[11px]">{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {documents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <FileText className="w-10 h-10 mb-2 opacity-30 text-[#FF5B22]" />
            <p className="text-xs font-semibold text-slate-400">No course materials yet</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
              {isTeacher
                ? 'Upload your first syllabus PDF to ground AI answers'
                : 'Your instructor will upload syllabus PDFs soon'}
            </p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.documentId}
              className="p-3 rounded-2xl bg-[#101728] hover:bg-[#151e34] border border-white/[0.06] transition-all group shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-[#FF5B22]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white truncate" title={doc.fileName}>
                      {doc.fileName}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{doc.pageCount} pages</span>
                      <span>·</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </div>
                  </div>
                </div>

                {isTeacher && (
                  <button
                    type="button"
                    onClick={() => onDelete(doc.documentId)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                    title="Delete document and purge vector embeddings"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status pill */}
              <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
                {doc.status === 'ready' && (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    Indexed &amp; Ready
                  </span>
                )}
                {doc.status === 'indexing' && (
                  <span className="flex items-center gap-1.5 text-orange-400 font-bold">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating Chunks…
                  </span>
                )}
                {doc.status === 'failed' && (
                  <span className="flex items-center gap-1 text-rose-400 font-bold">
                    <AlertTriangle className="w-3 h-3" /> Failed
                  </span>
                )}
                <span className="text-slate-500">Vector Scoped</span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
