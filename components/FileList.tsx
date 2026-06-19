'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Grid,
  List,
  Trash2,
  Download,
  Eye,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File,
  Star,
  Tag,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpDown,
  AlertOctagon,
  Lock
} from 'lucide-react';
import { StoredFile, formatBytes } from '@/lib/db';

interface FileListProps {
  files: StoredFile[];
  onDeleteFile: (id: string) => void;
  onStarToggle: (id: string, starred: boolean) => void;
  onSelectFileToPreview: (file: StoredFile) => void;
}

type CategoryFilter = 'all' | 'pdf' | 'image' | 'document' | 'other';
type SortField = 'uploadedAt' | 'name' | 'size';
type SortOrder = 'asc' | 'desc';

export default function FileList({
  files,
  onDeleteFile,
  onStarToggle,
  onSelectFileToPreview
}: FileListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<SortField>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Extract all unique tags
  const uniqueTags = Array.from(
    new Set(files.flatMap(f => f.tags || []))
  ).filter(t => t.length > 0);

  // Handle Sort Toggle
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter & Sort
  const filteredFiles = files
    .filter(file => {
      // Category filter
      if (selectedCategory !== 'all' && file.category !== selectedCategory) {
        return false;
      }
      // Tag filter
      if (selectedTag && !file.tags.includes(selectedTag)) {
        return false;
      }
      // Search text
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = file.name.toLowerCase().includes(query);
        const matchesDesc = file.description?.toLowerCase().includes(query) || false;
        const matchesTags = file.tags.some(t => t.toLowerCase().includes(query));
        return matchesTitle || matchesDesc || matchesTags;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'uploadedAt') {
        comparison = a.uploadedAt - b.uploadedAt;
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'size') {
        comparison = a.size - b.size;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const getCategoryIcon = (category: StoredFile['category']) => {
    switch (category) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-400" />;
      case 'image':
        return <FileImage className="h-6 w-6 text-emerald-400" />;
      case 'video':
        return <FileVideo className="h-6 w-6 text-indigo-400" />;
      case 'audio':
        return <FileAudio className="h-6 w-6 text-cyan-400" />;
      case 'document':
        return <FileText className="h-6 w-6 text-amber-400" />;
      default:
        return <File className="h-6 w-6 text-slate-400" />;
    }
  };

  const downloadFile = (file: StoredFile) => {
    const url = URL.createObjectURL(file.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Cleanup the object URL shortly after completion to save memory
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <div className="w-full" id="filevault-explorer">
      {/* Search and configuration filters section */}
      <div className="mb-6 flex flex-col gap-4 border border-slate-900 bg-slate-950/40 backdrop-blur-xl p-5 rounded-2xl" id="search-filter-controls">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search storage vault by name, tags, description..."
              className="bg-slate-950/80 border border-slate-900 focus:border-indigo-500/60 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none w-full transition-all duration-300 shadow-inner"
              id="global-search-query"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs py-0.5 px-1.5 rounded-lg hover:bg-slate-900 transition-all font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Sorting controls */}
            <div className="flex items-center rounded-xl bg-slate-950 border border-slate-900 p-1" id="sorting-toggles">
              <button
                onClick={() => toggleSort('uploadedAt')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  sortField === 'uploadedAt'
                    ? 'bg-slate-900 text-slate-200'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Sort by upload date"
              >
                Date
                {sortField === 'uploadedAt' && <ArrowUpDown className="h-3 w-3" />}
              </button>
              <button
                onClick={() => toggleSort('name')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  sortField === 'name'
                    ? 'bg-slate-900 text-slate-200'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Sort alphabetically"
              >
                A-Z
                {sortField === 'name' && <ArrowUpDown className="h-3 w-3" />}
              </button>
              <button
                onClick={() => toggleSort('size')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  sortField === 'size'
                    ? 'bg-slate-900 text-slate-200'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Sort by file size"
              >
                Size
                {sortField === 'size' && <ArrowUpDown className="h-3 w-3" />}
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-xl bg-slate-950 border border-slate-900 p-1" id="viewmode-toggles">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-slate-900 text-indigo-400 shadow-md'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Grid view"
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-slate-900 text-indigo-400 shadow-md'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs & Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-900/60 pt-4" id="filters-catalogue">
          {/* Main Categories */}
          <div className="flex flex-wrap gap-1.5 mr-4 border-r border-slate-900/40 pr-4">
            {(['all', 'pdf', 'image', 'document', 'other'] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedTag(null); // Clear active tag when category changes
                }}
                className={`rounded-lg px-3 py-1 text-xs capitalize transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40 border border-transparent'
                }`}
                id={`category-tab-${cat}`}
              >
                {cat === 'all' ? 'All Files' : cat === 'pdf' ? 'PDFs Only' : cat + 's'}
              </button>
            ))}
          </div>

          {/* Tags cloud filtering */}
          {uniqueTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto select-none no-scrollbar max-w-full">
              <span className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1 pr-1.5 font-mono">
                <Tag className="h-3 w-3" /> Filter Tag:
              </span>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="rounded-full bg-indigo-500/30 border border-indigo-400/40 text-[10px] text-indigo-300 px-2 py-0.5 font-semibold flex items-center gap-1 active:scale-95"
                >
                  Clear Tag [x]
                </button>
              )}
              {uniqueTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`rounded-full text-[10px] px-2.5 py-0.5 transition-all font-medium ${
                    selectedTag === tag
                      ? 'bg-indigo-500 text-white font-bold scale-102'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Files Display Panel */}
      <AnimatePresence mode="popLayout">
        {filteredFiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col items-center justify-center border border-slate-900 bg-slate-950/20 backdrop-blur-md rounded-2xl py-16 px-4 text-center text-slate-500 min-h-[300px]"
            id="empty-results-box"
          >
            <div className="rounded-2xl bg-slate-900/40 p-4 border border-slate-800 mb-4 text-slate-400">
              <Layers className="h-8 w-8 text-indigo-400" />
            </div>
            <h4 className="text-slate-200 font-semibold mb-1">No Vault Items Found</h4>
            <p className="text-xs text-slate-500 max-w-sm">
              {files.length === 0
                ? "Your security storage is currently empty. Drag some documents to the upload area to secure them."
                : "No files match your current filters or sorting options. Try clearing criteria."}
            </p>
            {(searchQuery || selectedCategory !== 'all' || selectedTag) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedTag(null);
                }}
                className="mt-4 text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                Reset All Filters
              </button>
            )}
          </motion.div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW: Responsive grids */
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            id="files-grid"
          >
            {filteredFiles.map((file) => (
              <motion.div
                layout
                key={file.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-md p-5 flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-indigo-500/5 hover:border-indigo-500/35 transition-all duration-300"
                id={`file-grid-card-${file.id}`}
              >
                {/* Decorative glowing gradient backdrop */}
                <div className="absolute top-0 right-0 h-28 w-28 bg-radial from-indigo-500/5 to-transparent rounded-full blur-2xl group-hover:from-indigo-500/10 pointer-events-none" />

                {/* Top Headers */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 flex items-center justify-center shadow-inner">
                      {getCategoryIcon(file.category)}
                    </div>

                    <div className="flex items-center gap-1 relative z-10">
                      {/* Star Button */}
                      <button
                        onClick={() => onStarToggle(file.id, !file.starred)}
                        className={`rounded-lg p-1.5 border border-transparent hover:bg-slate-900 transition-all ${
                          file.starred ? 'text-amber-400' : 'text-slate-600 hover:text-slate-300'
                        }`}
                        title={file.starred ? 'Starred' : 'Star file'}
                      >
                        <Star className={`h-4 w-4 ${file.starred ? 'fill-amber-400' : ''}`} />
                      </button>

                      <div className="rounded-md bg-slate-900 border border-slate-800 text-[9px] px-1.5 py-0.5 uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                        <Lock className="h-2 w-2 text-cyan-400" /> Secure
                      </div>
                    </div>
                  </div>

                  {/* Title & info text */}
                  <div className="mt-4">
                    <h4
                      className="text-sm font-semibold text-slate-200 line-clamp-1 group-hover:text-indigo-300 transition-colors pointer-events-none"
                      title={file.name}
                    >
                      {file.name}
                    </h4>
                    {file.description ? (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 max-h-[34px] min-h-[34px]">
                        {file.description}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-600 italic line-clamp-2 max-h-[34px] min-h-[34px]">
                        No description provided for this catalogued asset.
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Stats & Trigger button rows */}
                <div className="mt-4 pt-4 border-t border-slate-900/65">
                  {/* Tags */}
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {file.tags.map(t => (
                        <span key={t} className="rounded bg-slate-900 border border-slate-850 px-1.5 py-0.5 text-[9px] text-slate-400 font-medium">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200 font-mono">{formatBytes(file.size)}</span>
                      <span className="text-[9px] text-slate-600 flex items-center gap-1 mt-0.5 font-sans">
                        <Calendar className="h-3 w-3" />
                        {new Date(file.uploadedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 relative z-10">
                      {/* Preview Triggers */}
                      {(file.category === 'pdf' || file.category === 'image' || file.category === 'video' || file.category === 'audio' || file.type.startsWith('text/') || file.name.endsWith('.md')) ? (
                        <button
                          onClick={() => onSelectFileToPreview(file)}
                          className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all p-2 flex items-center gap-1 font-bold text-xs"
                          title="Open PDF Reader or File Previewer"
                          id={`preview-file-${file.id}`}
                        >
                          <Eye className="h-4 w-4" />
                          <span>Preview</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-600 italic bg-slate-900 border border-slate-900 px-2 py-1 rounded-md">
                          No preview
                        </span>
                      )}

                      {/* Download */}
                      <button
                        onClick={() => downloadFile(file)}
                        className="rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white transition-all p-2 border border-slate-850"
                        title="Download raw file"
                        id={`download-file-${file.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      {/* Delete */}
                      {confirmDeleteId === file.id ? (
                        <div className="flex gap-1 animate-fadeIn">
                          <button
                            onClick={() => {
                              onDeleteFile(file.id);
                              setConfirmDeleteId(null);
                            }}
                            className="rounded-lg bg-red-600 text-white hover:bg-red-700 font-bold transition-all px-2 py-1 text-[10px]"
                            title="Confirm delete"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg bg-slate-900 text-slate-400 border border-slate-850 px-2 py-1 text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(file.id)}
                          className="rounded-lg bg-slate-900 hover:bg-slate-850 hover:text-red-400 text-slate-500 transition-all p-2 border border-slate-850"
                          title="Delete file permanently"
                          id={`delete-file-${file.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          /* COMPACT LIST VIEW: Table or simple row layout */
          <motion.div
            layout
            className="border border-slate-850 bg-slate-950/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl"
            id="files-list-container"
          >
            <div className="min-w-full divide-y divide-slate-900">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-slate-900/30 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                <div className="col-span-5 md:col-span-6">Resource Name</div>
                <div className="col-span-2 hidden md:block">Category</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-5 md:col-span-4 text-right">Actions</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-900/60" id="list-elements-table">
                {filteredFiles.map((file) => (
                  <motion.div
                    layout
                    key={file.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-900/20 transition-all group duration-200"
                    id={`file-list-row-${file.id}`}
                  >
                    {/* Name */}
                    <div className="col-span-5 md:col-span-6 flex items-center gap-3">
                      <div className="rounded-lg bg-slate-900 p-1.5 border border-slate-850">
                        {getCategoryIcon(file.category)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-indigo-400 transition-all">
                          {file.name}
                        </span>
                        {file.description && (
                          <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 max-w-md hidden sm:block">
                            {file.description}
                          </span>
                        )}
                        {file.tags && file.tags.length > 0 && (
                          <div className="flex gap-1.5 mt-1">
                            {file.tags.map(t => (
                              <span key={t} className="text-[8px] bg-slate-900 text-slate-500 border border-slate-850 px-1 rounded">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <div className="col-span-2 hidden md:block text-xs font-medium text-slate-400 capitalize">
                      {file.category}
                    </div>

                    {/* Size & Timestamp */}
                    <div className="col-span-2">
                      <div className="text-xs font-semibold text-slate-300 font-mono">
                        {formatBytes(file.size)}
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5">
                        {new Date(file.uploadedAt).toLocaleDateString([], { month: '2-digit', day: '2-digit' })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-5 md:col-span-4 text-right flex items-center justify-end gap-1.5">
                      {/* Star icon */}
                      <button
                        onClick={() => onStarToggle(file.id, !file.starred)}
                        className={`p-1.5 rounded-lg border border-transparent hover:bg-slate-900 hover:text-amber-400 ${
                          file.starred ? 'text-amber-400' : 'text-slate-600'
                        }`}
                      >
                        <Star className={`h-3.5 w-3.5 ${file.starred ? 'fill-amber-400' : ''}`} />
                      </button>

                      {/* Preview Button */}
                      {(file.category === 'pdf' || file.category === 'image' || file.category === 'video' || file.category === 'audio' || file.type.startsWith('text/') || file.name.endsWith('.md')) && (
                        <button
                          onClick={() => onSelectFileToPreview(file)}
                          className="rounded-lg bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 text-indigo-400 p-1.5 transition-all text-[11px] font-bold flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </button>
                      )}

                      {/* Download */}
                      <button
                        onClick={() => downloadFile(file)}
                        className="rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-white p-1.5 transition-all"
                        title="Download file"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete */}
                      {confirmDeleteId === file.id ? (
                        <div className="flex gap-1 animate-fadeIn bg-slate-950 p-1 rounded-lg border border-slate-900">
                          <button
                            onClick={() => {
                              onDeleteFile(file.id);
                              setConfirmDeleteId(null);
                            }}
                            className="bg-red-600 text-white rounded px-2 py-0.5 text-[9px] font-bold"
                          >
                            Del
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-slate-500 rounded px-1.5 py-0.5 text-[9px]"
                          >
                            Esc
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(file.id)}
                          className="rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:text-red-400 text-slate-500 p-1.5 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
