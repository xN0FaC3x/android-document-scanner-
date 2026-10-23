import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Share2,
  Download,
  Trash2,
  ExternalLink,
  CheckCircle,
  Eye,
  Sliders,
  Sparkles,
  Camera,
  RotateCw,
  RotateCcw,
} from 'lucide-react';
import { ScannedDocument } from '../types';
import { downloadFile, generatePdfFromPages } from '../utils/pdfGenerator';
import { rotateImageDataUrl } from '../utils/imageProcessing';


interface ComposeMainScreenProps {
  documents: ScannedDocument[];
  onStartScan: () => void;
  onDeleteDocument: (id: string) => void;
  onOpenOptions: () => void;
  onUpdateDocument?: (doc: ScannedDocument) => void;
}

export const ComposeMainScreen: React.FC<ComposeMainScreenProps> = ({
  documents,
  onStartScan,
  onDeleteDocument,
  onOpenOptions,
  onUpdateDocument,
}) => {
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<ScannedDocument | null>(null);
  const [activePreviewPageIndex, setActivePreviewPageIndex] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleShare = (doc: ScannedDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    if (doc.pdfUrl) {
      if (navigator.share) {
        navigator.share({
          title: doc.title,
          text: `Scanned document (${doc.pages.length} pages) exported via ML Kit`,
          url: doc.pdfUrl,
        }).catch(() => {
          downloadFile(doc.pdfUrl!, `${doc.title}.pdf`);
          showToast('PDF downloaded to device');
        });
      } else {
        downloadFile(doc.pdfUrl, `${doc.title}.pdf`);
        showToast('PDF downloaded to device');
      }
    }
  };

  const handleDownload = (doc: ScannedDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    if (doc.pdfUrl) {
      downloadFile(doc.pdfUrl, `${doc.title}.pdf`);
      showToast('Downloaded PDF file');
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-50 dark:bg-slate-900 flex flex-col font-sans select-none overflow-hidden">
      
      {/* Jetpack Compose Material 3 TopAppBar */}
      <div className="h-14 px-5 flex items-center justify-between bg-white dark:bg-slate-800/95 border-b border-slate-200/80 dark:border-slate-700/60 shadow-xs shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 dark:bg-sky-400/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              DocScan
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              ML Kit Document Scanner
            </p>
          </div>
        </div>

        <button
          onClick={onOpenOptions}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 active:scale-95 transition-all"
          title="Scanner Options"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Document Feed (LazyColumn equivalent) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {documents.length === 0 ? (
          <div className="h-full min-h-[460px] flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-3xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4 shadow-inner">
              <Camera className="w-9 h-9" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
              No Scanned Documents
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[260px] mb-6 leading-relaxed">
              Scan paper documents using Google Play Services ML Kit. Automatically detects edges, crops skew, removes shadows with high-contrast B&W, and exports to PDF.
            </p>

            <button
              onClick={onStartScan}
              className="px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Start Document Scan</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-1 pt-1">
              <span>Scanned Documents ({documents.length})</span>
              <span>Sorted by Latest</span>
            </div>

            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  setSelectedDocForPreview(doc);
                  setActivePreviewPageIndex(0);
                }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/70 dark:border-slate-700/60 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3">
                  {/* First page thumbnail */}
                  <div className="relative w-14 h-18 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs">
                    {doc.pages[0]?.processedImage && (
                      <img
                        src={doc.pages[0].processedImage}
                        alt="Document Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[9px] text-white text-center py-0.5 font-medium">
                      {doc.pages.length} {doc.pages.length === 1 ? 'pg' : 'pgs'}
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {doc.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {new Date(doc.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle className="w-3 h-3" />
                      <span>PDF Export Ready</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDownload(doc, e)}
                      className="p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-700/50 active:scale-95 transition-all"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleShare(doc, e)}
                      className="p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-700/50 active:scale-95 transition-all"
                      title="Share PDF"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDocument(doc.id);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700/50 active:scale-95 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="absolute bottom-6 right-5 z-20">
        <button
          onClick={onStartScan}
          className="h-14 px-5 rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-sm flex items-center gap-2.5 shadow-xl shadow-sky-500/25 transition-all cursor-pointer"
        >
          <Camera className="w-5 h-5 text-slate-950" />
          <span>Scan Document</span>
        </button>
      </div>

      {/* Android Toast notification */}
      {toastMessage && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-xs px-4 py-2 rounded-full shadow-lg backdrop-blur-md z-40 transition-opacity">
          {toastMessage}
        </div>
      )}

      {/* Full-screen Document / PDF Preview Modal */}
      {selectedDocForPreview && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col text-white animate-in fade-in duration-150">
          {/* Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-slate-900/60 backdrop-blur-md">
            <div>
              <h3 className="text-sm font-bold truncate max-w-[200px]">
                {selectedDocForPreview.title}
              </h3>
              <p className="text-[10px] text-slate-400">
                Page {activePreviewPageIndex + 1} of {selectedDocForPreview.pages.length} · A4 PDF
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleDownload(selectedDocForPreview, e)}
                className="p-2 rounded-lg bg-sky-500 text-slate-950 font-bold hover:bg-sky-400 active:scale-95 transition-all"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedDocForPreview(null)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>

          {/* Document View with Live Rotate Controls */}
          <div className="relative flex-1 overflow-auto p-4 flex flex-col items-center justify-center">
            {selectedDocForPreview.pages[activePreviewPageIndex] && (
              <div className="relative max-w-full max-h-[460px] shadow-2xl rounded-lg overflow-hidden border border-white/20 bg-white">
                <img
                  src={selectedDocForPreview.pages[activePreviewPageIndex].processedImage}
                  alt={`Page ${activePreviewPageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Quick Rotate Float Controls */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={async () => {
                  if (!selectedDocForPreview) return;
                  const page = selectedDocForPreview.pages[activePreviewPageIndex];
                  const { dataUrl, width, height } = await rotateImageDataUrl(page.processedImage, -90);
                  const updatedPages = [...selectedDocForPreview.pages];
                  updatedPages[activePreviewPageIndex] = {
                    ...page,
                    processedImage: dataUrl,
                    rotation: ((page.rotation - 90) % 360 + 360) % 360,
                    width,
                    height,
                  };
                  const { blob, url } = await generatePdfFromPages(updatedPages, selectedDocForPreview.title);
                  const updatedDoc = {
                    ...selectedDocForPreview,
                    pages: updatedPages,
                    pdfBlob: blob,
                    pdfUrl: url,
                  };
                  setSelectedDocForPreview(updatedDoc);
                  if (onUpdateDocument) onUpdateDocument(updatedDoc);
                  showToast('Rotated -90° (Counter-Clockwise)');
                }}
                className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-white/20 shadow-md active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                <span>Rotate -90°</span>
              </button>

              <button
                onClick={async () => {
                  if (!selectedDocForPreview) return;
                  const page = selectedDocForPreview.pages[activePreviewPageIndex];
                  const { dataUrl, width, height } = await rotateImageDataUrl(page.processedImage, 90);
                  const updatedPages = [...selectedDocForPreview.pages];
                  updatedPages[activePreviewPageIndex] = {
                    ...page,
                    processedImage: dataUrl,
                    rotation: ((page.rotation + 90) % 360 + 360) % 360,
                    width,
                    height,
                  };
                  const { blob, url } = await generatePdfFromPages(updatedPages, selectedDocForPreview.title);
                  const updatedDoc = {
                    ...selectedDocForPreview,
                    pages: updatedPages,
                    pdfBlob: blob,
                    pdfUrl: url,
                  };
                  setSelectedDocForPreview(updatedDoc);
                  if (onUpdateDocument) onUpdateDocument(updatedDoc);
                  showToast('Rotated +90° (Clockwise)');
                }}
                className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-white/20 shadow-md active:scale-95 transition-all"
              >
                <span>Rotate +90°</span>
                <RotateCw className="w-3.5 h-3.5 text-sky-400" />
              </button>
            </div>
          </div>

          {/* Multi-page footer navigation if multiple pages */}
          {selectedDocForPreview.pages.length > 1 && (
            <div className="h-14 border-t border-white/10 flex items-center justify-center gap-2 px-4 bg-slate-900/60">
              {selectedDocForPreview.pages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePreviewPageIndex(idx)}
                  className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                    activePreviewPageIndex === idx
                      ? 'bg-sky-400 text-slate-950 scale-110 font-bold'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
