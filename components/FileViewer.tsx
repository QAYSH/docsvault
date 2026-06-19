'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Clock,
  FileText,
  Tag,
  Calendar,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Heart
} from 'lucide-react';
import { StoredFile, formatBytes } from '@/lib/db';

interface FileViewerProps {
  file: StoredFile | null;
  onClose: () => void;
  onStarToggle?: (id: string, starred: boolean) => void;
}

export default function FileViewer({ file, onClose, onStarToggle }: FileViewerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Generate URL for file object and cleanup on component unmount or file change
  useEffect(() => {
    if (!file) {
      const timer = setTimeout(() => {
        setObjectUrl(null);
        setTextContent('');
      }, 0);
      return () => clearTimeout(timer);
    }

    const timerInit = setTimeout(() => {
      setIsLoading(true);
    }, 0);

    const url = URL.createObjectURL(file.data);
    
    const timerUrl = setTimeout(() => {
      setObjectUrl(url);
    }, 0);

    let active = true;

    // If text file, read text directly into state
    if (
      file.type.startsWith('text/') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.js') ||
      file.name.endsWith('.ts') ||
      file.name.endsWith('.css') ||
      file.name.endsWith('.csv')
    ) {
      file.data.text()
        .then((text) => {
          if (!active) return;
          // Limit length to prevent crash on huge files
          setTimeout(() => {
            setTextContent(text.slice(0, 100000));
            setIsLoading(false);
          }, 0);
        })
        .catch((err) => {
          if (!active) return;
          setTimeout(() => {
            setTextContent(`Failed to read content: ${err.message}`);
            setIsLoading(false);
          }, 0);
        });
    } else {
      // Just simulate a smooth transition loading
      const loadingTimer = setTimeout(() => {
        if (!active) return;
        setIsLoading(false);
      }, 500);

      return () => {
        active = false;
        clearTimeout(timerInit);
        clearTimeout(timerUrl);
        clearTimeout(loadingTimer);
        URL.revokeObjectURL(url);
      };
    }

    return () => {
      active = false;
      clearTimeout(timerInit);
      clearTimeout(timerUrl);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Handle Download from Inside Viewer
  const handleDownload = () => {
    if (!file || !objectUrl) return;
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!file) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
        id="preview-overlay-root2"
      >
        {/* Main interactive Lightbox Frame */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="relative flex flex-col w-full h-full max-w-6xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl"
          id="lightbox-card-frame"
        >
          {/* Header Action Bar */}
          <div className="flex items-center justify-between border-b border-slate-900 bg-slate-950/80 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-2 text-indigo-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 truncate max-w-xs md:max-w-md" title={file.name}>
                  {file.name}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                  <span>{formatBytes(file.size)}</span>
                  <span>•</span>
                  <span>{file.type || 'Binary Stream'}</span>
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Star toggle if callbacks exist */}
              {onStarToggle && (
                <button
                  onClick={() => onStarToggle(file.id, !file.starred)}
                  className={`rounded-xl p-2 border border-slate-900 hover:bg-slate-900 transition-all ${
                    file.starred ? 'text-amber-400 bg-slate-900' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={file.starred ? 'Starred' : 'Star file'}
                >
                  <Heart className={`h-4.5 w-4.5 ${file.starred ? 'fill-amber-400' : ''}`} />
                </button>
              )}

              {/* Zoom Controls for Image pre-views */}
              {file.category === 'image' && (
                <div className="flex items-center bg-slate-900/60 rounded-xl border border-slate-900 p-1 mr-2 gap-1">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                    className="p-1 px-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg text-xs"
                    title="Zoom out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[10px] font-mono font-bold text-slate-400 px-1 select-none">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                    className="p-1 px-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg text-xs"
                    title="Zoom in"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setRotation(prev => (prev + 90) % 360)}
                    className="p-1 px-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg text-xs border-l border-slate-805"
                    title="Rotate 90deg"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Download link */}
              <button
                onClick={handleDownload}
                className="bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/10 transition-all"
                title="Download this file locally"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-900 hover:border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-500 hover:text-white p-2.5 transition-all outline-none"
                title="Close frame"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Interactive Core Viewer Body */}
          <div className="flex-1 bg-slate-950/40 relative overflow-hidden flex items-center justify-center min-h-0">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-20">
                <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest font-mono">
                  Decrypting Secure Vault Data...
                </p>
              </div>
            )}

            {objectUrl ? (
              <>
                {/* 1. PDF VIEWER: Using high performance Object Embed tags */}
                {file.category === 'pdf' && (
                  <iframe
                    src={`${objectUrl}#toolbar=1&navpanes=0&statusbar=0`}
                    className="w-full h-full border-0 bg-slate-900"
                    title="PDF secure interactive renderer"
                    id="pdf-frame-element"
                  />
                )}

                {/* 2. IMAGE VIEWER: Scrolling, zooming, rotate */}
                {file.category === 'image' && (
                  <div className="w-full h-full flex items-center justify-center overflow-auto p-4 custom-scrollbar">
                    <motion.div
                      animate={{ scale: zoomLevel, rotate: rotation }}
                      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                      className="max-w-full max-h-full flex items-center justify-center"
                    >
                      <img
                        src={objectUrl}
                        alt={file.name}
                        referrerPolicy="no-referrer"
                        className="max-w-[90%] max-h-[80vh] rounded-lg shadow-2xl border border-white/5 object-contain"
                      />
                    </motion.div>
                  </div>
                )}

                {/* 3. TEXTS / CODES / MARKDOWN RENDERING */}
                {(file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.txt') || file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.css') || file.name.endsWith('.csv')) && (
                  <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto text-left custom-scrollbar select-text leading-relaxed font-mono text-xs text-slate-300">
                    <div className="max-w-4xl mx-auto border border-slate-900/60 bg-slate-900/10 rounded-2xl p-6 shadow-inner">
                      {file.name.endsWith('.md') ? (
                        <div className="prose prose-invert prose-xs">
                          {/* Fallback rich text reader */}
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide font-mono mb-4 pb-2 border-b border-slate-905">
                            🔒 Markdown Reader Mode
                          </p>
                          <pre className="whitespace-pre-wrap font-mono font-medium text-slate-200 bg-transparent p-0 border-0 leading-normal">
                            {textContent}
                          </pre>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-mono mb-3 flex items-center gap-1">
                            <Monitor className="h-3 w-3" /> Syntax Reader Mode
                          </p>
                          <pre className="whitespace-pre-wrap text-slate-300 bg-slate-950 border border-slate-900 rounded-xl p-4 overflow-x-auto max-h-[60vh] custom-scrollbar text-[11px] leading-relaxed">
                            {textContent}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. VIDEO RETRIBUTION */}
                {file.category === 'video' && (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <video
                      src={objectUrl}
                      controls
                      autoPlay
                      className="max-w-full max-h-full rounded-lg shadow-2xl"
                    />
                  </div>
                )}

                {/* 5. AUDIO VISUALIZER / PLAYER */}
                {file.category === 'audio' && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-950 to-slate-900">
                    {/* Spinning vinyl disk layout for audio visualizer */}
                    <div className="relative mb-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                        className="h-44 w-44 rounded-full border-4 border-slate-800 bg-slate-950 flex items-center justify-center relative shadow-2xl"
                      >
                        {/* Grooves */}
                        <div className="absolute inset-2 rounded-full border border-slate-800/40" />
                        <div className="absolute inset-6 rounded-full border border-slate-800/40" />
                        <div className="absolute inset-10 rounded-full border border-slate-800/40" />
                        <div className="absolute inset-14 rounded-full border border-slate-800/40" />
                        
                        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-[10px]">
                          AUDIO
                        </div>
                      </motion.div>
                      {/* Arm */}
                      <div className="absolute top-0 -right-6 h-20 w-1.5 bg-slate-600 rounded-full origin-top rotate-12" />
                    </div>

                    <p className="text-slate-200 text-sm font-bold tracking-tight mb-2 truncate max-w-sm">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 mb-6 font-mono font-semibold">
                      {formatBytes(file.size)}
                    </p>

                    <audio
                      src={objectUrl}
                      controls
                      autoPlay
                      className="w-full max-w-md accent-indigo-505"
                    />
                  </div>
                )}

                {/* 6. BINARY OR OTHER EXTENSIONS FALLBACK SCREEN */}
                {file.category === 'other' && !file.type.startsWith('text/') && (
                  <div className="max-w-lg mx-auto flex flex-col items-center justify-center text-center p-8 bg-slate-900/30 border border-slate-900 rounded-3xl backdrop-blur-md">
                    <div className="rounded-2xl bg-indigo-500/10 p-4 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
                      <Monitor className="h-10 w-10 text-cyan-400" />
                    </div>
                    <h3 className="text-slate-200 font-bold text-lg mb-2">No Embedded Preview Available</h3>
                    <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                      Files of type <span className="text-slate-300 font-mono font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900">{file.type || 'unknown'}</span> cannot be rendered inside the interactive site sandbox. You can download the file directly onto your machine to view.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold px-6 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/15 transition-all"
                    >
                      <Download className="h-4 w-4" />
                      Download Raw Binary Asset
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-500">Failed to generate virtual object resource path</p>
            )}
          </div>

          {/* Quick-Inspect metadata description list panel */}
          <div className="bg-slate-950 border-t border-slate-900 px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-600 font-mono tracking-wider">
                Overview & Comments
              </span>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-3xl">
                {file.description || (
                  <span className="italic text-slate-600">
                    No custom comments or description stored. Edit this file metadata in list view to supplement details.
                  </span>
                )}
              </p>
            </div>

            {/* Tags and timestamp info columns */}
            <div className="flex flex-wrap items-center gap-3">
              {file.tags && file.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {file.tags.map(t => (
                    <span key={t} className="rounded-full bg-slate-900 border border-slate-850 px-2.5 py-0.5 text-[10px] text-indigo-400 font-semibold font-mono">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div className="rounded-xl bg-slate-900 border border-slate-850 p-2 text-right">
                <p className="text-[9px] text-slate-500 flex items-center gap-1 font-mono uppercase font-bold justify-end">
                  <Calendar className="h-3 w-3 text-cyan-500" /> Upload Date
                </p>
                <p className="text-[11px] font-bold text-slate-300 font-mono mt-0.5">
                  {new Date(file.uploadedAt).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
