'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderLock,
  Search,
  Plus,
  ArrowUpDown,
  RefreshCw,
  Sparkles,
  Lock,
  Cpu,
  Shield,
  FileCode2,
  AlertCircle
} from 'lucide-react';
import { getAllFiles, deleteFileFromDB, storeFile, StoredFile } from '@/lib/db';
import StatsPanel from '@/components/StatsPanel';
import UploadArea from '@/components/UploadArea';
import FileList from '@/components/FileList';
import FileViewer from '@/components/FileViewer';

export default function Home() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Load files from IndexedDB on startup
  const loadStoredFiles = async () => {
    try {
      setIsLoading(true);
      const allFiles = await getAllFiles();
      setFiles(allFiles);
      setErrorText(null);
    } catch (err) {
      console.error(err);
      setErrorText('Could not access secure browser vault database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStoredFiles();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Delete a file and refresh
  const handleDeleteFile = async (id: string) => {
    try {
      // If currently previewing the deleted file, close it
      if (selectedFile?.id === id) {
        setSelectedFile(null);
      }
      await deleteFileFromDB(id);
      await loadStoredFiles();
    } catch (err) {
      console.error(err);
      setErrorText('Error deleting file.');
    }
  };

  // Toggle Favorite/Starred and update
  const handleStarToggle = async (id: string, starred: boolean) => {
    try {
      const fileToUpdate = files.find(f => f.id === id);
      if (fileToUpdate) {
        const updated = { ...fileToUpdate, starred };
        // Save back
        await storeFile(updated);
        // Instant visual update without reloading entire DB
        setFiles(prev => prev.map(f => f.id === id ? updated : f));
        // If the updated file is currently viewed, update its modal reference too
        if (selectedFile?.id === id) {
          setSelectedFile(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main
      className="relative min-h-screen w-full bg-slate-950 text-slate-100 overflow-x-hidden p-4 md:p-8 selection:bg-indigo-500/30 selection:text-white"
      id="root-vault-app"
    >
      {/* 1. SCIFI GLOWING ORBIT BACKGROUNDS AND BACKGROUND DECORATIONS */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" id="decorative-starfield">
        {/* Animated Orbits */}
        <div className="absolute top-[-10%] left-[-15%] h-[600px] w-[600px] rounded-full border border-indigo-505/5 scale-120 animate-pulse duration-10000" />
        <div className="absolute top-[20%] right-[-10%] h-[500px] w-[500px] rounded-full border border-purple-500/5 rotate-45" />
        <div className="absolute bottom-[-10%] left-[10%] h-[700px] w-[700px] rounded-full border border-cyan-500/5" />

        {/* Ambient Glowing Orbs */}
        <div className="absolute top-[5%] right-[15%] h-[300px] w-[300px] rounded-full bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-transparent blur-3xl opacity-70" />
        <div className="absolute bottom-[10%] left-[5%] h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-cyan-600/10 via-blue-600/5 to-transparent blur-3xl opacity-80" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col gap-6" id="dashboard-main-frame">
        {/* 2. THE PREMIUM NAVIGATION / HEADER */}
        <header
          className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-900 bg-slate-950/60 backdrop-blur-xl rounded-2xl p-6 shadow-2xl"
          id="vault-header-bar"
        >
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/15">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950 text-indigo-400">
                <FolderLock className="h-6 w-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white uppercase sm:text-xl">
                  Vault<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Stream</span>
                </h1>
                <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[9px] font-bold text-indigo-300 px-2 py-0.5 tracking-wider uppercase">
                  v3.5 Build
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Professional file custody, instant web visualization & secure storage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={loadStoredFiles}
              className="rounded-xl border border-slate-900 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white px-3 py-2.5 text-xs transition-all flex items-center gap-1.5 focus:outline-none"
              title="Sync storage vault"
              id="sync-reload-btn"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Refresh Sync</span>
            </button>

            <button
              onClick={() => setShowUploadPanel(p => !p)}
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/15 active:scale-95 transition-all focus:outline-none"
              id="toggle-upload-btn"
            >
              <Plus className={`h-4.5 w-4.5 transition-transform duration-300 ${showUploadPanel ? 'rotate-45' : ''}`} />
              <span>{showUploadPanel ? 'Close Uploader' : 'Add Files'}</span>
            </button>
          </div>
        </header>

        {/* Eror Alert banner if any */}
        {errorText && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-400 flex items-center gap-2.5"
            id="error-alert-banner"
          >
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{errorText}</span>
          </motion.div>
        )}

        {/* 3. STORAGE & USAGE STATISTICS CARDS */}
        <StatsPanel files={files} />

        {/* 4. DRAG & DROP MULTI-FILE UPLOADER TRIGGER PANEL */}
        <AnimatePresence>
          {showUploadPanel && (
            <motion.div
              initial={{ opacity: 0, y: -15, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -15, height: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              className="overflow-hidden"
              id="upload-panel-container"
            >
              <UploadArea
                onUploadSuccess={() => {
                  loadStoredFiles();
                  // Hide panel shortly after upload finishes for seamless clean layout
                  setTimeout(() => setShowUploadPanel(false), 300);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. PRIMARY FILES MANAGER AND VAULT EXPLORER */}
        <section
          className="w-full flex flex-col gap-4 border border-slate-900 bg-slate-950/20 backdrop-blur-xl p-6 rounded-3xl shadow-xl"
          id="explorer-section"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-900/60">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-500" />
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                Vault Directory Explorer
              </h2>
            </div>
            
            <div className="flex items-center gap-3.5 text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-emerald-500" /> Sandbox Locked
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-cyan-400" /> AES End-to-End
              </span>
            </div>
          </div>

          {isLoading && files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest font-mono">
                Accessing Browser Vault IndexedDB...
              </p>
            </div>
          ) : (
            <FileList
              files={files}
              onDeleteFile={handleDeleteFile}
              onStarToggle={handleStarToggle}
              onSelectFileToPreview={(file) => setSelectedFile(file)}
            />
          )}
        </section>

        {/* Footer */}
        <footer className="text-center text-slate-600 text-[10px] py-10 tracking-widest uppercase font-mono selection:bg-transparent flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
          <p>© 2026 VAULTSTREAM DIRECTS • SECURE CLIENT SANDBOX</p>
          <div className="flex gap-4 items-center">
            <span className="flex items-center gap-1 text-[9px] text-slate-600">
              <Cpu className="h-3 w-3" /> IndexedDB persistent
            </span>
            <span>|</span>
            <span className="text-indigo-500/60 font-medium">Premium Visual Design</span>
          </div>
        </footer>

        {/* 6. IMMERSIVE PDF / FILE PREVIEW LIGHTBOX */}
        <FileViewer
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onStarToggle={handleStarToggle}
        />
      </div>
    </main>
  );
}
