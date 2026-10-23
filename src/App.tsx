import React, { useState, useEffect } from 'react';
import {
  FileText,
  Code,
  Smartphone,
  BookOpen,
  Terminal,
  Download,
  Sliders,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  ScannerOptions,
  ScannedDocument,
  ScannedPage,
  LogEvent,
} from './types';
import { generatePdfFromPages, downloadFile } from './utils/pdfGenerator';
import { SAMPLE_DOCUMENTS } from './data/sampleDocuments';
import { ANDROID_CODE_FILES } from './data/androidCodeSamples';

// Components
import { TopNav } from './components/TopNav';
import { AndroidFrame } from './components/AndroidFrame';
import { ComposeMainScreen } from './components/ComposeMainScreen';
import { ScannerOverlay } from './components/ScannerOverlay';
import { CodeInspector } from './components/CodeInspector';
import { GuideSection } from './components/GuideSection';
import { ScannerOptionsModal } from './components/ScannerOptionsModal';
import { PushToPhoneModal } from './components/PushToPhoneModal';

export default function App() {
  const [activeView, setActiveView] = useState<'simulator' | 'code' | 'guide'>('simulator');
  const [isScanningActive, setIsScanningActive] = useState<boolean>(false);
  const [showOptionsModal, setShowOptionsModal] = useState<boolean>(false);
  const [showPushModal, setShowPushModal] = useState<boolean>(false);

  // Scanner options matching GmsDocumentScannerOptions
  const [scannerOptions, setScannerOptions] = useState<ScannerOptions>({
    pageLimit: 20,
    scannerMode: 'FULL',
    allowGalleryImport: true,
    resultFormats: ['JPEG', 'PDF'],
  });

  // Scanned documents in the Jetpack Compose repository
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);

  // Real-time Android Activity Result event logger
  const [logs, setLogs] = useState<LogEvent[]>([]);

  const addLog = (tag: string, message: string, type: LogEvent['type'] = 'info') => {
    const timeStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
    setLogs((prev) => [
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: timeStr,
        tag,
        message,
        type,
      },
      ...prev.slice(0, 49),
    ]);
  };

  // Pre-seed with one initial scanned document so user immediately sees how it looks
  useEffect(() => {
    const initPreload = async () => {
      addLog('MainActivity', 'App launched with Jetpack Compose & ML Kit runtime.', 'intent');
      addLog(
        'GmsDocumentScanning',
        'Initialized GmsDocumentScannerOptions: SCANNER_MODE_FULL, pageLimit=20, formats=[JPEG, PDF].',
        'info'
      );

      // Create initial sample document with processed high-contrast filter
      const sample1 = SAMPLE_DOCUMENTS[0].createImage();
      const initialPage: ScannedPage = {
        id: 'initial-page-1',
        originalImage: sample1,
        processedImage: sample1,
        corners: {
          topLeft: { x: 0.1, y: 0.08 },
          topRight: { x: 0.88, y: 0.11 },
          bottomRight: { x: 0.85, y: 0.9 },
          bottomLeft: { x: 0.12, y: 0.88 },
        },
        filter: 'bw_shadow_removal',
        contrast: 15,
        brightness: 0,
        rotation: 0,
        timestamp: Date.now() - 3600000,
        width: 800,
        height: 1100,
      };

      const { blob, url } = await generatePdfFromPages([initialPage], 'Receipt_Scan');

      const initialDoc: ScannedDocument = {
        id: 'doc-initial-01',
        title: 'Receipt_Scan_01',
        pages: [initialPage],
        createdAt: Date.now() - 3600000,
        pdfBlob: blob,
        pdfUrl: url,
      };

      setDocuments([initialDoc]);
      addLog(
        'DocumentScannerViewModel',
        'Loaded pre-existing scanned document: 1 page, PDF exported.',
        'success'
      );
    };

    initPreload();
  }, []);

  // Launch ML Kit scanning flow
  const handleStartScan = () => {
    addLog(
      'MainActivity',
      'scanner.getStartScanIntent(activity) -> IntentSender acquired from Google Play Services',
      'intent'
    );
    addLog(
      'ActivityResultLauncher',
      'scannerLauncher.launch(IntentSenderRequest) -> ML Kit Document Scanner Activity launched',
      'intent'
    );
    setIsScanningActive(true);
  };

  // Handle scan complete from ScannerOverlay
  const handleScanComplete = async (pages: ScannedPage[]) => {
    setIsScanningActive(false);
    addLog(
      'MainActivity',
      `ActivityResult: RESULT_OK from Play Services with ${pages.length} page(s).`,
      'result'
    );

    const docIndex = documents.length + 1;
    const title = `Scanned_Doc_${String(docIndex).padStart(2, '0')}`;

    addLog('GmsDocumentScanningResult', `Synthesizing multi-page PDF output for "${title}"...`, 'info');
    const { blob, url } = await generatePdfFromPages(pages, title);

    const newDoc: ScannedDocument = {
      id: `doc-${Date.now()}`,
      title,
      pages,
      createdAt: Date.now(),
      pdfBlob: blob,
      pdfUrl: url,
    };

    setDocuments((prev) => [newDoc, ...prev]);
    addLog(
      'DocumentScannerViewModel',
      `Document state updated: "${title}" (${pages.length} pages) available at content://${newDoc.id}/export.pdf`,
      'success'
    );
  };

  const handleCancelScan = () => {
    setIsScanningActive(false);
    addLog('MainActivity', 'ActivityResult: RESULT_CANCELED by user.', 'info');
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    addLog('DocumentScannerViewModel', `Deleted document ${id}`, 'info');
  };

  const handleDownloadAllCode = () => {
    // Generate a unified markdown / text file containing all Android project sources
    let bundle = `# DocScan - Android ML Kit Document Scanner Project Bundle\n`;
    bundle += `Generated on: ${new Date().toISOString()}\n\n`;

    ANDROID_CODE_FILES.forEach((f) => {
      bundle += `================================================================================\n`;
      bundle += `FILE: ${f.path}\n`;
      bundle += `DESCRIPTION: ${f.description}\n`;
      bundle += `================================================================================\n\n`;
      bundle += f.code + `\n\n`;
    });

    const blob = new Blob([bundle], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, 'DocScan_Android_JetpackCompose_MLKit.txt');
    URL.revokeObjectURL(url);
    addLog('DocScan', 'Exported full Android project code bundle to download.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* 3-Zone Top Navigation Contract */}
      <TopNav
        activeView={activeView}
        onSelectView={setActiveView}
        onDownloadProject={handleDownloadAllCode}
        onPushToPhone={() => setShowPushModal(true)}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Fast Push to Phone Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border border-sky-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                Want to use this Document Scanner directly on your phone?
              </h3>
              <p className="text-[11px] text-slate-400">
                Scan the instant QR code with your phone camera, or push via Android Studio in 3 easy steps.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPushModal(true)}
            className="px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all whitespace-nowrap cursor-pointer shrink-0"
          >
            <Smartphone className="w-4 h-4 text-slate-950" />
            <span>Push to Phone (Instructions & QR)</span>
          </button>
        </div>

        {/* Workspace Mode Switcher & Overview Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Android 15 (API 35)</span>
              <span aria-hidden="true">·</span>
              <span>Google Play Services ML Kit</span>
              <span aria-hidden="true">·</span>
              <span>Jetpack Compose BOM 2024.10</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              {activeView === 'simulator' && 'Interactive Android Device Simulator'}
              {activeView === 'code' && 'Jetpack Compose Kotlin Source Files'}
              {activeView === 'guide' && 'ML Kit Architecture & Shadow-Removal Guide'}
            </h1>
          </div>

          {/* Segmented View Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveView('simulator')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === 'simulator'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Device Emulator</span>
            </button>

            <button
              onClick={() => setActiveView('code')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === 'code'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Compose Code</span>
            </button>

            <button
              onClick={() => setActiveView('guide')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === 'guide'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guide</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: SIMULATOR (SPLIT SCREEN ON DESKTOP) */}
        {activeView === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Android Device Chassis (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <AndroidFrame
                onResetApp={() => {
                  setDocuments([]);
                  setIsScanningActive(false);
                  addLog('App', 'Session reset.', 'info');
                }}
              >
                {isScanningActive ? (
                  <ScannerOverlay
                    options={scannerOptions}
                    onScanComplete={handleScanComplete}
                    onCancel={handleCancelScan}
                  />
                ) : (
                  <ComposeMainScreen
                    documents={documents}
                    onStartScan={handleStartScan}
                    onDeleteDocument={handleDeleteDocument}
                    onOpenOptions={() => setShowOptionsModal(true)}
                    onUpdateDocument={(updatedDoc) => {
                      setDocuments((prev) =>
                        prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
                      );
                      addLog(
                        'DocumentScannerViewModel',
                        `Document "${updatedDoc.title}" updated: page rotated, multi-page PDF regenerated.`,
                        'info'
                      );
                    }}
                  />
                )}
              </AndroidFrame>
            </div>

            {/* Right Column: Interactive ML Kit Event Stream & Quick Actions (7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              
              {/* Quick Actions & Live Highlights Card */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      ML Kit Document Scanner Workflow
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Test the exact native Android flow on the phone frame to your left
                    </p>
                  </div>

                  <button
                    onClick={() => setShowOptionsModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 transition-all cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-sky-400" />
                    <span>Configure Options</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <span className="font-bold text-sky-400 block mb-1">
                      1. Camera & Edge Detection
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Tap <strong className="text-slate-200">"Scan Document"</strong> in the phone. The scanner detects corners automatically with real-time feedback.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <span className="font-bold text-emerald-400 block mb-1">
                      2. Drag Corners with Loupe
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Drag any of the 4 corner pins. A 2x magnifying loupe appears above your touch point for sub-pixel boundary alignment.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <span className="font-bold text-amber-400 block mb-1">
                      3. High-Contrast B&W Filter
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Adaptive thresholding subtracts phone shadows, wrinkled paper darkness, and desk cast to yield pure white paper.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <span className="font-bold text-purple-400 block mb-1">
                      4. Export as Multi-Page PDF
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Add extra pages, reorder them, and click Export. Generates real downloadable PDFs with standard A4 margins.
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Supports Physical Camera, Uploads, and Wrinkled Presets</span>
                  </div>

                  <button
                    onClick={() => setActiveView('code')}
                    className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View MainActivity.kt</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Live Android Activity Logs Stream */}
              <div className="flex-1 flex flex-col rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
                <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Android Logcat / Event Bus
                    </span>
                  </div>
                  <button
                    onClick={() => setLogs([])}
                    className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Clear Logs
                  </button>
                </div>

                <div className="h-64 overflow-y-auto p-4 font-mono text-xs space-y-1.5 bg-slate-950 selection:bg-sky-500/30">
                  {logs.length === 0 ? (
                    <div className="text-slate-600 italic">No events logged yet. Tap "Scan Document" in the device emulator.</div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 text-[11px] leading-relaxed">
                        <span className="text-slate-600 shrink-0">{log.timestamp}</span>
                        <span
                          className={`font-semibold shrink-0 ${
                            log.type === 'intent'
                              ? 'text-purple-400'
                              : log.type === 'result'
                              ? 'text-sky-400'
                              : log.type === 'success'
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          [{log.tag}]
                        </span>
                        <span className="text-slate-300 break-all">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: JETPACK COMPOSE SOURCE CODE */}
        {activeView === 'code' && (
          <div className="w-full h-[760px]">
            <CodeInspector />
          </div>
        )}

        {/* VIEW 3: ML KIT GUIDE & SPECIFICATIONS */}
        {activeView === 'guide' && (
          <div className="w-full">
            <GuideSection />
          </div>
        )}

      </main>

      {/* Options Modal */}
      {showOptionsModal && (
        <ScannerOptionsModal
          options={scannerOptions}
          onOptionsChange={(newOpts) => {
            setScannerOptions(newOpts);
            addLog(
              'GmsDocumentScannerOptions',
              `Updated options: mode=${newOpts.scannerMode}, pageLimit=${newOpts.pageLimit}`,
              'info'
            );
          }}
          onClose={() => setShowOptionsModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-5 px-6 text-center text-xs text-slate-500">
        <p>
          Android Jetpack Compose & Google ML Kit Document Scanner Reference · API 21+ · Play Services 16.0.0-beta1
        </p>
      </footer>

    </div>
  );
}
