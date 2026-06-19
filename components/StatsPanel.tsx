'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Database, FileText, File, HardDrive, BarChart3, PieChart } from 'lucide-react';
import { StoredFile, formatBytes } from '@/lib/db';

interface StatsPanelProps {
  files: StoredFile[];
}

export default function StatsPanel({ files }: StatsPanelProps) {
  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const pdfFiles = files.filter(f => f.category === 'pdf');
  const imgFiles = files.filter(f => f.category === 'image');
  const docFiles = files.filter(f => f.category === 'document');
  const otherFiles = files.filter(f => f.category !== 'pdf' && f.category !== 'image' && f.category !== 'document');

  // IndexedDB typical recommended limit in spark is 1GB indicator for visuals
  const STORAGE_LIMIT = 500 * 1024 * 1024; // 500MB visual limit
  const storagePercentage = Math.min((totalSize / STORAGE_LIMIT) * 100, 100);

  const stats = [
    {
      label: 'Vault Storage',
      value: formatBytes(totalSize),
      subtext: `${storagePercentage.toFixed(1)}% of 500MB`,
      icon: HardDrive,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30'
    },
    {
      label: 'Stored Files',
      value: files.length,
      subtext: `${pdfFiles.length} PDFs • ${imgFiles.length} Images`,
      icon: Database,
      color: 'from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/30'
    },
    {
      label: 'Documents & Drafts',
      value: docFiles.length + otherFiles.length,
      subtext: `${docFiles.length} standard docs`,
      icon: FileText,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
    }
  ];

  const categoryBreakdown = [
    { name: 'PDFs', count: pdfFiles.length, size: pdfFiles.reduce((a, b) => a + b.size, 0), color: 'bg-red-500' },
    { name: 'Images', count: imgFiles.length, size: imgFiles.reduce((a, b) => a + b.size, 0), color: 'bg-emerald-500' },
    { name: 'Docs', count: docFiles.length, size: docFiles.reduce((a, b) => a + b.size, 0), color: 'bg-sky-500' },
    { name: 'Other', count: otherFiles.length, size: otherFiles.reduce((a, b) => a + b.size, 0), color: 'bg-slate-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" id="stats-dashboard-grid">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${stat.color} p-6 backdrop-blur-xl shadow-xl`}
            id={`stat-card-${idx}`}
          >
            {/* Ambient background glow inside cards */}
            <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-white/5 blur-3xl pointer-events-none" />
            
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">{stat.value}</h3>
                <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                  {stat.subtext}
                </p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <Icon className="h-6 w-6" />
              </div>
            </div>

            {/* If it is storage, render a progress bar */}
            {stat.label === 'Vault Storage' && (
              <div className="mt-4" id="storage-progress-container">
                <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${storagePercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  />
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
