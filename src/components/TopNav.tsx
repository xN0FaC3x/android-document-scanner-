import React from 'react';
import { Download } from 'lucide-react';

interface TopNavProps {
  activeView: 'simulator' | 'code' | 'guide';
  onSelectView: (view: 'simulator' | 'code' | 'guide') => void;
  onDownloadProject: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeView,
  onSelectView,
  onDownloadProject,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950 sticky top-0 z-40 select-none">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onSelectView('simulator');
        }}
        className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-sky-400 transition-colors font-sans"
      >
        DocScan
      </a>

      {/* Zone 2: 4-5 concise single-line nav links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectView('simulator')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'simulator' ? 'text-sky-400 font-semibold' : ''
          }`}
        >
          Android Scanner
        </button>
        <button
          onClick={() => onSelectView('code')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'code' ? 'text-sky-400 font-semibold' : ''
          }`}
        >
          Jetpack Compose Code
        </button>
        <button
          onClick={() => onSelectView('guide')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'guide' ? 'text-sky-400 font-semibold' : ''
          }`}
        >
          ML Kit Documentation
        </button>
        <a
          href="https://developers.google.com/ml-kit/vision/doc-scanner/android"
          target="_blank"
          rel="noreferrer"
          className="hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          Google Docs
        </a>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onDownloadProject}
          className="px-4 py-2 text-xs font-bold text-slate-950 bg-sky-400 rounded-xl hover:bg-sky-300 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Get Android Files</span>
        </button>
      </div>
    </header>
  );
};
