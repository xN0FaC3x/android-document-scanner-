import React, { useState } from 'react';
import {
  Copy,
  Check,
  FileCode,
  ShieldCheck,
  Zap,
  Download,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { ANDROID_CODE_FILES, CodeFile } from '../data/androidCodeSamples';

export const CodeInspector: React.FC = () => {
  const [activeFileId, setActiveFileId] = useState<string>(ANDROID_CODE_FILES[0].id);
  const [copied, setCopied] = useState<boolean>(false);

  const activeFile = ANDROID_CODE_FILES.find((f) => f.id === activeFileId) || ANDROID_CODE_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadActiveFile = () => {
    const blob = new Blob([activeFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden font-sans">
      
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Android Source Code
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Jetpack Compose + ML Kit</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
            Document Scanner Architecture
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadActiveFile}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all border border-slate-700/50"
            title="Download this file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {activeFile.filename}</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-slate-950" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* File Navigation Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/80 border-b border-slate-800 overflow-x-auto text-xs">
        {ANDROID_CODE_FILES.map((file) => {
          const isActive = file.id === activeFileId;
          return (
            <button
              key={file.id}
              onClick={() => setActiveFileId(file.id)}
              className={`px-3 py-2 rounded-lg font-mono flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-800 text-sky-400 font-semibold border border-slate-700/60 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 shrink-0" />
              <span>{file.filename}</span>
            </button>
          );
        })}
      </div>

      {/* File Description Header */}
      <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800/60 text-xs text-slate-300 flex items-start gap-3">
        <div className="mt-0.5 text-sky-400">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <span className="font-mono text-slate-400 text-[11px] block">{activeFile.path}</span>
          <p className="mt-0.5 leading-relaxed text-slate-300">{activeFile.description}</p>
        </div>
      </div>

      {/* Code Viewer with Line Numbers */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed selection:bg-sky-500/30">
        <pre className="overflow-x-auto">
          <code>
            {activeFile.code.split('\n').map((line, idx) => (
              <div key={idx} className="table-row hover:bg-slate-900/40">
                <span className="table-cell select-none pr-4 text-right text-slate-600 text-[11px] w-10">
                  {idx + 1}
                </span>
                <span className="table-cell whitespace-pre">{line}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* Architectural Highlights Bottom Strip */}
      <div className="p-4 bg-slate-950/90 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-white text-[11px]">Zero Camera Permission</h5>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Google Play Services runs the camera and model in its sandboxed Activity. Your app requires no permissions.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-white text-[11px]">High-Contrast Shadow Removal</h5>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Adaptive thresholding strips ambient light falloff, wrinkles, and shadows to produce crisp paper documents.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-white text-[11px]">PDF & JPEG Result</h5>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Returns both content URIs directly via <code className="text-sky-300">GmsDocumentScanningResult</code>.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
