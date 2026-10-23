import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Smartphone,
  Download,
  QrCode,
  Laptop,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Play,
  FileArchive,
  Sparkles,
} from 'lucide-react';
import { generateAndroidStudioProjectZip } from '../utils/projectZipGenerator';
import { downloadFile } from '../utils/pdfGenerator';

interface PushToPhoneModalProps {
  onClose: () => void;
}

export const PushToPhoneModal: React.FC<PushToPhoneModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'instant' | 'android-studio'>('instant');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);

  // The live app URL that can be opened on any phone browser
  const phoneUrl = window.location.href;

  useEffect(() => {
    // Generate clean high-resolution QR code
    QRCode.toDataURL(
      phoneUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#0284c7', // Sky primary
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrCodeDataUrl(url);
        }
      }
    );
  }, [phoneUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(phoneUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsGeneratingZip(true);
      const zipBlob = await generateAndroidStudioProjectZip();
      const zipUrl = URL.createObjectURL(zipBlob);
      downloadFile(zipUrl, 'DocScan-AndroidStudio-Project.zip');
      URL.revokeObjectURL(zipUrl);
    } catch (err) {
      console.error('Failed to generate zip:', err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">How to Push & Use on Your Phone</h2>
              <p className="text-xs text-slate-400">Choose the method that works best for you</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('instant')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'instant'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Method 1: Instant Phone Access (QR Code)</span>
          </button>

          <button
            onClick={() => setActiveTab('android-studio')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'android-studio'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Method 2: Native Android App (Android Studio)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* TAB 1: INSTANT PHONE ACCESS */}
          {activeTab === 'instant' && (
            <div className="space-y-6">
              
              <div className="p-4 rounded-2xl bg-sky-950/50 border border-sky-800/60 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white block mb-0.5">Fastest & easiest way (No setup required!)</strong>
                  Point your phone's camera at the QR code below. It opens this exact document scanner directly on your phone with live camera access, multi-page scanning, shadow removal, and PDF export!
                </div>
              </div>

              {/* QR Code Card */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Scan to open on phone"
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                      Generating QR...
                    </div>
                  )}
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">
                      1. Scan with Phone Camera
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Open your phone’s default camera app or Google Lens, point it at the QR code, and tap the link banner that appears.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">
                      2. Add to Phone Home Screen
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      In Chrome on Android, tap the three dots <strong className="text-white">⋮ &gt; "Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong> to install it as an app icon on your phone!
                    </p>
                  </div>

                  {/* Copy Link Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleCopyLink}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-98"
                    >
                      {copiedUrl ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Link Copied! Send via Text/WhatsApp to your phone</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-sky-400" />
                          <span>Copy Direct Phone URL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: NATIVE ANDROID STUDIO */}
          {activeTab === 'android-studio' && (
            <div className="space-y-6">
              
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Download Pre-Configured Android Studio Project
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Includes all Gradle scripts, Jetpack Compose code, and ML Kit setup ready to build.
                  </p>
                </div>

                <button
                  onClick={handleDownloadZip}
                  disabled={isGeneratingZip}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <FileArchive className="w-4 h-4" />
                  <span>{isGeneratingZip ? 'Packaging Zip...' : 'Download Project (.zip)'}</span>
                </button>
              </div>

              {/* 3 Step Instruction Guide */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  How to push from Android Studio onto your phone in 3 steps:
                </h4>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-xs flex items-center justify-center">
                      1
                    </span>
                    <span>Unzip and Open in Android Studio</span>
                  </div>
                  <p className="text-xs text-slate-400 pl-7 leading-relaxed">
                    Unzip the downloaded file. In Android Studio, click <strong className="text-slate-200">File &gt; Open...</strong> and select the <code className="text-sky-300">DocScan</code> folder. Gradle will automatically sync.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-xs flex items-center justify-center">
                      2
                    </span>
                    <span>Enable USB Debugging on Your Phone</span>
                  </div>
                  <p className="text-xs text-slate-400 pl-7 leading-relaxed">
                    On your phone: <strong className="text-slate-200">Settings &gt; About Phone &gt; tap "Build number" 7 times</strong> to unlock Developer Options. Then enable <strong className="text-slate-200">USB Debugging</strong> and plug your phone into your computer.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-xs flex items-center justify-center">
                      3
                    </span>
                    <span>Click the Green "Run" (▶) Button</span>
                  </div>
                  <p className="text-xs text-slate-400 pl-7 leading-relaxed">
                    Select your phone from the device dropdown at the top toolbar in Android Studio and click <strong className="text-emerald-400">Run (▶)</strong>. Android Studio will compile and launch the app directly onto your physical phone!
                  </p>
                </div>
              </div>

              {/* Standalone APK Alternative */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="font-bold text-amber-400 block">
                  Don't want to use a USB cable? Build an APK!
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  In Android Studio, click <strong className="text-slate-200">Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>. Then send the resulting <code className="text-sky-300">app-debug.apk</code> to your phone via Google Drive or WhatsApp, and tap to install!
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Requires Android 5.0+ (API 21+) with Google Play Services</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
