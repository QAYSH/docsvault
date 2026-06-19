'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileUp, Sparkles, X, Plus, Info, Tag } from 'lucide-react';
import { storeFile, detectCategory } from '@/lib/db';

interface UploadAreaProps {
  onUploadSuccess: () => void;
}

interface PendingFile {
  id: string;
  file: File;
  title: string;
  description: string;
  tagsString: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

export default function UploadArea({ onUploadSuccess }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = (filesList: FileList) => {
    const newPending: PendingFile[] = Array.from(filesList).map(f => {
      // Create a nice default title by removing extension
      const lastDot = f.name.lastIndexOf('.');
      const defaultTitle = lastDot !== -1 ? f.name.substring(0, lastDot) : f.name;
      
      return {
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        title: defaultTitle,
        description: '',
        tagsString: detectCategory(f.type, f.name) === 'pdf' ? 'pdf, document' : detectCategory(f.type, f.name),
        progress: 0,
        status: 'pending'
      };
    });

    setPendingFiles(prev => [...prev, ...newPending]);
    setIsEditingMetadata(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const selectFilesManually = () => {
    fileInputRef.current?.click();
  };

  const removePendingFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
    if (pendingFiles.length <= 1) {
      setIsEditingMetadata(false);
    }
  };

  const updatePendingMetadata = (id: string, updates: Partial<Pick<PendingFile, 'title' | 'description' | 'tagsString'>>) => {
    setPendingFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSubmitUploads = async () => {
    if (pendingFiles.length === 0) return;

    // Simulate progress bar and sequentially upload files to DB
    for (let i = 0; i < pendingFiles.length; i++) {
      const pending = pendingFiles[i];
      
      // Update status to uploading
      setPendingFiles(prev => prev.map(f => f.id === pending.id ? { ...f, status: 'uploading' } : f));

      // Simulate step-wise upload upload progress animation
      await new Promise<void>((resolveProg) => {
        let currentProg = 0;
        const interval = setInterval(() => {
          currentProg += 10;
          setPendingFiles(prev => prev.map(f => f.id === pending.id ? { ...f, progress: currentProg } : f));
          if (currentProg >= 100) {
            clearInterval(interval);
            resolveProg();
          }
        }, 80);
      });

      try {
        // Build the tags list
        const tags = pending.tagsString
          .split(',')
          .map(t => t.trim().toLowerCase())
          .filter(t => t.length > 0);

        // Upload to IndexedDB
        await storeFile({
          id: pending.id,
          name: pending.file.name,
          type: pending.file.type || 'application/octet-stream',
          size: pending.file.size,
          data: pending.file,
          category: detectCategory(pending.file.type, pending.file.name),
          tags,
          description: pending.description.trim() || undefined,
          starred: false
        });

        // Mark completed
        setPendingFiles(prev => prev.map(f => f.id === pending.id ? { ...f, status: 'completed' } : f));
      } catch (err) {
        console.error(err);
        setPendingFiles(prev => prev.map(f => f.id === pending.id ? { ...f, status: 'error' } : f));
      }
    }

    // Give a short delay to show success icon, then clear and trigger success updates
    setTimeout(() => {
      setPendingFiles([]);
      setIsEditingMetadata(false);
      onUploadSuccess();
    }, 600);
  };

  return (
    <div className="w-full mb-8" id="upload-control-root">
      {/* Drop area */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={selectFilesManually}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className={`relative overflow-hidden cursor-pointer rounded-2xl border-2 border-dashed transition-all p-8 text-center flex flex-col items-center justify-center min-h-[180px] group backdrop-blur-md bg-slate-900/20 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 shadow-2xl shadow-indigo-500/10'
            : 'border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/40'
        }`}
        id="drag-drop-container"
      >
        {/* Decorative dynamic ambient particles inside drop area */}
        <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-24 w-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          id="file-hidden-input"
        />

        <div className="relative z-10">
          <motion.div
            animate={isDragging ? { y: -5, scale: 1.1 } : { y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all ${
              isDragging
                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-400'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 group-hover:text-indigo-400'
            }`}
            id="upload-icon-box"
          >
            {isDragging ? <Upload className="h-6 w-6" /> : <FileUp className="h-6 w-6" />}
          </motion.div>

          <h3 className="text-base font-semibold text-slate-200">
            {isDragging ? 'Drop your files here to store them' : 'Drag & drop files, or click to browse'}
          </h3>
          <p className="mt-1.5 text-xs text-slate-400">
            Supports PDFs, images, docs, and standard media. Saved locally & securely.
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-950/60 border border-slate-800 px-3 py-1 text-[11px] font-medium text-slate-400 group-hover:border-slate-800 transition-all">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            Instant, high-fidelity browser vaults
          </div>
        </div>
      </motion.div>

      {/* Metadata editing drawer/modal when items are loaded */}
      <AnimatePresence>
        {isEditingMetadata && pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="overflow-hidden"
            id="metadata-panel-holder"
          >
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <h4 className="font-semibold text-sm text-slate-100 uppercase tracking-wider">
                    Configure Metadata ({pendingFiles.length} {pendingFiles.length === 1 ? 'file' : 'files'})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => { setPendingFiles([]); setIsEditingMetadata(false); }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
                  id="cancel-all-pending"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {pendingFiles.map((pf) => (
                  <div
                    key={pf.id}
                    className="relative rounded-xl border border-slate-900 bg-slate-900/30 p-4 transition-all"
                    id={`pending-file-${pf.id}`}
                  >
                    {/* Corner remove button */}
                    {pf.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => removePendingFile(pf.id)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-red-400 transition-all rounded-lg p-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      {/* Name / Category display */}
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                          <Info className="h-3 w-3 text-indigo-400" />
                          <span>Original File</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-200 truncate font-mono" title={pf.file.name}>
                          {pf.file.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {(pf.file.size / (1024 * 1024)).toFixed(2)} MB • {pf.file.type || 'Unknown'}
                        </p>

                        {/* Status indicators */}
                        {pf.status !== 'pending' && (
                          <div className="mt-3">
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                              <span>Status: {pf.status}</span>
                              <span>{pf.progress}%</span>
                            </div>
                            <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-100"
                                style={{ width: `${pf.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Title & description configuration */}
                      <div className="space-y-2 md:col-span-2">
                        <div>
                          <input
                            type="text"
                            value={pf.title}
                            disabled={pf.status !== 'pending'}
                            onChange={(e) => updatePendingMetadata(pf.id, { title: e.target.value })}
                            placeholder="Custom title/name..."
                            className="bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-indigo-500/60 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none w-full transition-all duration-200"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <div className="relative">
                              <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
                              <input
                                type="text"
                                value={pf.tagsString}
                                disabled={pf.status !== 'pending'}
                                onChange={(e) => updatePendingMetadata(pf.id, { tagsString: e.target.value })}
                                placeholder="tags (eg. pdf, receipt, design)..."
                                className="bg-slate-950 border border-slate-900 focus:border-indigo-500/60 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none w-full transition-all duration-200"
                              />
                            </div>
                          </div>
                          <div>
                            <input
                              type="text"
                              value={pf.description}
                              disabled={pf.status !== 'pending'}
                              onChange={(e) => updatePendingMetadata(pf.id, { description: e.target.value })}
                              placeholder="Add optional brief description..."
                              className="bg-slate-950 border border-slate-900 focus:border-indigo-500/60 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none w-full transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Trigger in form */}
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-900 pt-4">
                <button
                  type="button"
                  disabled={pendingFiles[0]?.status !== 'pending'}
                  onClick={() => { setPendingFiles([]); setIsEditingMetadata(false); }}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all duration-200 disabled:opacity-30"
                  id="cancel-uploads-btn"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  disabled={pendingFiles[0]?.status !== 'pending'}
                  onClick={handleSubmitUploads}
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95 text-white text-xs font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 transition-all duration-200 disabled:opacity-30"
                  id="save-uploads-btn"
                >
                  <Sparkles className="h-4 w-4" />
                  Store in Safe Vault
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
