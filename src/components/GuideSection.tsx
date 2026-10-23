import React from 'react';
import {
  ShieldAlert,
  Zap,
  Cpu,
  Layers,
  CheckCircle,
  FileText,
  FileCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const GuideSection: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 text-slate-300 font-sans pb-12">
      
      {/* Intro Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2">
          <span>Official Architecture Reference</span>
          <span className="text-slate-600">·</span>
          <span>Google Play Services</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          ML Kit Document Scanner API on Android
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
          The ML Kit Document Scanner API delivers Google’s state-of-the-art document digitizing pipeline as a high-level UI flow managed by Google Play Services. It provides automatic edge detection, perspective warping, shadow-removal filtering, and multi-page PDF generation with zero boilerplate.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Zero Camera Permission</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Google Play Services hosts the camera activity in its own process, returning secure URIs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">On-Device Edge ML</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time quadrilateral corner regression runs fully on-device without cloud latency.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Direct PDF Output</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Returns standard multi-page PDF files ready for Android storage or Intent sharing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Step Integration Guide */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">3-Step Jetpack Compose Implementation</h3>
        
        {/* Step 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h4 className="text-sm font-bold text-white">
              Add the Play Services Document Scanner Dependency
            </h4>
          </div>
          <p className="text-xs text-slate-400 pl-9">
            Add the official ML Kit Document Scanner library to your <code className="text-sky-300">app/build.gradle.kts</code> file:
          </p>
          <div className="ml-9 p-3 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800">
            <code>implementation("com.google.android.gms:play-services-mlkit-document-scanner:16.0.0-beta1")</code>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h4 className="text-sm font-bold text-white">
              Configure Multi-Page Scanning Options & PDF Output
            </h4>
          </div>
          <p className="text-xs text-slate-400 pl-9">
            Set scanner mode to <code className="text-sky-300">SCANNER_MODE_FULL</code> and provide a <code className="text-sky-300">setPageLimit(50)</code>. Play Services will allow the user to scan multiple pages sequentially, preview/rotate each page, and package everything into a single combined PDF:
          </p>
          <div className="ml-9 p-3 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800">
            <pre>
{`val options = GmsDocumentScannerOptions.Builder()
    .setGalleryImportAllowed(true)
    .setPageLimit(50) // Enables multi-page sequential scanning
    .setResultFormats(
        GmsDocumentScannerOptions.RESULT_FORMAT_JPEG,
        GmsDocumentScannerOptions.RESULT_FORMAT_PDF // Single multi-page PDF output
    )
    .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
    .build()`}
            </pre>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h4 className="text-sm font-bold text-white">
              Launch via Compose rememberLauncherForActivityResult
            </h4>
          </div>
          <p className="text-xs text-slate-400 pl-9">
            Request an IntentSender from <code className="text-sky-300">GmsDocumentScanning.getClient(options)</code> and launch it using Compose’s standard Activity Result contract:
          </p>
          <div className="ml-9 p-3 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800">
            <pre>
{`val scannerLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.StartIntentSenderForResult()
) { activityResult ->
    if (activityResult.resultCode == Activity.RESULT_OK) {
        val result = GmsDocumentScanningResult.fromActivityResultIntent(activityResult.data)
        val pdfUri = result?.pdf?.uri
        val pageUris = result?.pages?.map { it.imageUri }
    }
}

// In Button or FAB onClick:
scanner.getStartScanIntent(activity).addOnSuccessListener { intentSender ->
    scannerLauncher.launch(IntentSenderRequest.Builder(intentSender).build())
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* How the Shadow Removal Filter Works */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">
          How the High-Contrast B&W Shadow-Removal Filter Works
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Standard global binarization (like Otsu or fixed 128 threshold) fails on real documents because desk lighting is never uniform: phone shadows and light angles create dark gradients that turn half the document completely black.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/20">
            <h5 className="text-xs font-bold text-rose-400 mb-1">Naive Global Threshold</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Compares every pixel to a single fixed threshold. Dark corners and phone shadows become giant black ink blotches, rendering text unreadable.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/20">
            <h5 className="text-xs font-bold text-emerald-400 mb-1">
              ML Kit Adaptive Thresholding
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Computes a local moving background illumination map. Pixels significantly darker than their local neighborhood are kept as ink; ambient light cast is flattened into pure white paper.
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Page & Rotation Architecture */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">
          Multi-Page Scanning & 90° Rotation Pipeline
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Google ML Kit seamlessly orchestrates multi-page intake. When configured with a page limit &gt; 1, the scanner automatically invites the user to scan additional pages after each capture, providing an interactive carousel for reordering, deleting, and rotating pages before writing the final combined PDF document.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950 border border-sky-500/20">
            <h5 className="text-xs font-bold text-sky-400 mb-1">90° Clockwise / CCW Rotation</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Users can correct document orientation. Jetpack Compose applies GPU-accelerated rotations via <code className="text-sky-300">graphicsLayer &#123; rotationZ = angle &#125;</code> and writes rotated bitmaps with <code className="text-sky-300">Matrix().postRotate(±90f)</code>.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/20">
            <h5 className="text-xs font-bold text-purple-400 mb-1">Combined Multi-Page PDF</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Play Services compiles all scanned and rotated pages into a single cohesive PDF at <code className="text-purple-300">result.pdf.uri</code>, returning the total page count and individual page image URIs.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
