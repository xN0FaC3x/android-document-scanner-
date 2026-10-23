import React from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { ScannerOptions, ScannerMode } from '../types';

interface ScannerOptionsModalProps {
  options: ScannerOptions;
  onOptionsChange: (newOptions: ScannerOptions) => void;
  onClose: () => void;
}

export const ScannerOptionsModal: React.FC<ScannerOptionsModalProps> = ({
  options,
  onOptionsChange,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">GmsDocumentScannerOptions</h3>
              <p className="text-[11px] text-slate-400">Configure ML Kit Scanner Behavior</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options Body */}
        <div className="py-4 space-y-5 text-xs">
          
          {/* Scanner Mode */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Scanner Mode (setScannerMode)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(
                [
                  {
                    id: 'FULL',
                    title: 'SCANNER_MODE_FULL (Recommended)',
                    desc: 'Camera viewfinder, edge quad detection, crop adjust, and shadow filters.',
                  },
                  {
                    id: 'BASE_WITH_FILTER',
                    title: 'SCANNER_MODE_BASE_WITH_FILTER',
                    desc: 'Camera and shadow-removal filter screens, skips manual border adjustment.',
                  },
                  {
                    id: 'BASE',
                    title: 'SCANNER_MODE_BASE',
                    desc: 'Clean capture only, directly outputs image without filter screen.',
                  },
                ] as const
              ).map((mode) => (
                <div
                  key={mode.id}
                  onClick={() =>
                    onOptionsChange({ ...options, scannerMode: mode.id as ScannerMode })
                  }
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    options.scannerMode === mode.id
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{mode.title}</span>
                    {options.scannerMode === mode.id && (
                      <Check className="w-4 h-4 text-sky-400" />
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">{mode.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Page Limit */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-slate-300 font-semibold">
                Page Limit (setPageLimit)
              </label>
              <span className="font-mono text-sky-400 font-bold">{options.pageLimit} pages</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              value={options.pageLimit}
              onChange={(e) =>
                onOptionsChange({ ...options, pageLimit: Number(e.target.value) })
              }
              className="w-full accent-sky-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              Limits maximum pages scanned before finishing.
            </span>
          </div>

          {/* Gallery Import Allowed */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            <div>
              <span className="font-semibold text-white block">Gallery Import Allowed</span>
              <span className="text-slate-400 text-[11px]">setGalleryImportAllowed(true)</span>
            </div>
            <input
              type="checkbox"
              checked={options.allowGalleryImport}
              onChange={(e) =>
                onOptionsChange({ ...options, allowGalleryImport: e.target.checked })
              }
              className="w-4 h-4 accent-sky-400 cursor-pointer"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
          >
            Apply Options
          </button>
        </div>

      </div>
    </div>
  );
};
