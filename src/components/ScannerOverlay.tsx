import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Check,
  RotateCw,
  RotateCcw,
  Crop,
  Sliders,
  Sparkles,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import {
  Point,
  QuadCorners,
  ScannerFilter,
  ScannerOptions,
  ScannedPage,
} from '../types';
import {
  warpQuadrilateral,
  applyDocumentFilter,
  rotateImageDataUrl,
  getDefaultCorners,
  loadImage,
} from '../utils/imageProcessing';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';

interface ScannerOverlayProps {
  options: ScannerOptions;
  onScanComplete: (pages: ScannedPage[]) => void;
  onCancel: () => void;
}

type Step = 'CAPTURE' | 'CROP' | 'FILTER' | 'REVIEW';

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  options,
  onScanComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<Step>('CAPTURE');
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Active capturing state
  const [useCamera, setUseCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Current working image for capture & crop
  const [activeRawImage, setActiveRawImage] = useState<string>('');
  const [rawDimensions, setRawDimensions] = useState<{ width: number; height: number }>({
    width: 900,
    height: 1200,
  });

  // Corner adjustment state (normalized 0..1 coordinates for responsive canvas)
  const [corners, setCorners] = useState<QuadCorners>({
    topLeft: { x: 0.1, y: 0.08 },
    topRight: { x: 0.88, y: 0.11 },
    bottomRight: { x: 0.85, y: 0.91 },
    bottomLeft: { x: 0.12, y: 0.88 },
  });

  const [activeCornerKey, setActiveCornerKey] = useState<keyof QuadCorners | null>(null);
  const [activeCornerTouchPos, setActiveCornerTouchPos] = useState<Point | null>(null);
  const cropCanvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Filter settings for current page being processed
  const [selectedFilter, setSelectedFilter] = useState<ScannerFilter>('bw_shadow_removal');
  const [contrastVal, setContrastVal] = useState<number>(10);
  const [brightnessVal, setBrightnessVal] = useState<number>(0);
  const [rotationVal, setRotationVal] = useState<number>(0);

  // Preview results for current page
  const [warpedPreview, setWarpedPreview] = useState<string>('');
  const [filteredPreview, setFilteredPreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Status prompt banner
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Initialize with the first sample document
  useEffect(() => {
    loadSampleDoc(SAMPLE_DOCUMENTS[0].createImage());
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      stopCameraStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setUseCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        'Camera not available or permission denied. You can still scan using preset documents or upload an image.'
      );
      setUseCamera(false);
    }
  };

  const loadSampleDoc = (dataUrl: string) => {
    stopCameraStream();
    setUseCamera(false);
    setActiveRawImage(dataUrl);

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      setRawDimensions({ width: img.naturalWidth || 900, height: img.naturalHeight || 1200 });
      setCorners({
        topLeft: { x: 0.12, y: 0.08 },
        topRight: { x: 0.88, y: 0.11 },
        bottomRight: { x: 0.85, y: 0.9 },
        bottomLeft: { x: 0.14, y: 0.87 },
      });
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          loadSampleDoc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Shutter capture action
  const handleCapture = () => {
    if (useCamera && videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setActiveRawImage(dataUrl);
        setRawDimensions({ width: canvas.width, height: canvas.height });
      }
      stopCameraStream();
      setUseCamera(false);
    }

    if (options.scannerMode === 'BASE') {
      processAndSavePageDirect();
    } else if (options.scannerMode === 'BASE_WITH_FILTER') {
      executePerspectiveWarp();
      setStep('FILTER');
    } else {
      setStep('CROP');
    }
  };

  // Perspective warp
  const executePerspectiveWarp = async () => {
    if (!activeRawImage) return;
    setIsProcessing(true);
    try {
      const img = await loadImage(activeRawImage);
      const pixelCorners: QuadCorners = {
        topLeft: {
          x: corners.topLeft.x * rawDimensions.width,
          y: corners.topLeft.y * rawDimensions.height,
        },
        topRight: {
          x: corners.topRight.x * rawDimensions.width,
          y: corners.topRight.y * rawDimensions.height,
        },
        bottomRight: {
          x: corners.bottomRight.x * rawDimensions.width,
          y: corners.bottomRight.y * rawDimensions.height,
        },
        bottomLeft: {
          x: corners.bottomLeft.x * rawDimensions.width,
          y: corners.bottomLeft.y * rawDimensions.height,
        },
      };

      const warpedCanvas = warpQuadrilateral(img, pixelCorners, 800, 1100);
      const warpedUrl = warpedCanvas.toDataURL('image/jpeg', 0.92);
      setWarpedPreview(warpedUrl);

      // Reset rotation for new page
      setRotationVal(0);

      // Apply initial shadow-removal filter
      const filteredUrl = applyDocumentFilter(
        warpedCanvas,
        selectedFilter,
        contrastVal,
        brightnessVal,
        0
      );
      setFilteredPreview(filteredUrl);
    } catch (err) {
      console.error('Warp error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-run filter when parameters change in FILTER step
  useEffect(() => {
    if (!warpedPreview || step !== 'FILTER') return;

    let isSubscribed = true;
    const runFilter = async () => {
      const warpedImg = await loadImage(warpedPreview);
      const canvas = document.createElement('canvas');
      canvas.width = warpedImg.width;
      canvas.height = warpedImg.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(warpedImg, 0, 0);
        const filteredUrl = applyDocumentFilter(
          canvas,
          selectedFilter,
          contrastVal,
          brightnessVal,
          rotationVal
        );
        if (isSubscribed) {
          setFilteredPreview(filteredUrl);
        }
      }
    };
    runFilter();

    return () => {
      isSubscribed = false;
    };
  }, [selectedFilter, contrastVal, brightnessVal, rotationVal, warpedPreview, step]);

  // Corner dragging logic
  const handlePointerDown = (key: keyof QuadCorners, e: React.PointerEvent) => {
    e.preventDefault();
    setActiveCornerKey(key);
    updateCornerPosition(key, e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeCornerKey) return;
    e.preventDefault();
    updateCornerPosition(activeCornerKey, e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setActiveCornerKey(null);
    setActiveCornerTouchPos(null);
  };

  const updateCornerPosition = (key: keyof QuadCorners, clientX: number, clientY: number) => {
    if (!cropCanvasContainerRef.current) return;
    const rect = cropCanvasContainerRef.current.getBoundingClientRect();
    const nx = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const ny = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));

    setCorners((prev) => ({
      ...prev,
      [key]: { x: nx, y: ny },
    }));

    setActiveCornerTouchPos({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  };

  // Save current page to document stack and show preview & multi-page options
  const saveCurrentPageToStack = () => {
    const newPage: ScannedPage = {
      id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      originalImage: activeRawImage,
      processedImage: filteredPreview || warpedPreview || activeRawImage,
      corners: { ...corners },
      filter: selectedFilter,
      contrast: contrastVal,
      brightness: brightnessVal,
      rotation: rotationVal,
      timestamp: Date.now(),
      width: 800,
      height: 1100,
    };

    const updated = [...pages, newPage];
    setPages(updated);
    setCurrentPageIndex(updated.length - 1);
    setStep('REVIEW');
    showNotification(`Page ${updated.length} added! Scan another page or export PDF.`);
  };

  const processAndSavePageDirect = async () => {
    const newPage: ScannedPage = {
      id: `page-${Date.now()}`,
      originalImage: activeRawImage,
      processedImage: activeRawImage,
      corners: { ...corners },
      filter: 'none',
      contrast: 0,
      brightness: 0,
      rotation: 0,
      timestamp: Date.now(),
      width: rawDimensions.width,
      height: rawDimensions.height,
    };
    onScanComplete([newPage]);
  };

  // Rotate a page 90 degrees clockwise (+90) or counter-clockwise (-90)
  const handleRotateCurrentPage = async (deltaAngle: 90 | -90) => {
    if (step === 'FILTER') {
      // In filter step, update rotationVal
      setRotationVal((prev) => ((prev + deltaAngle) % 360 + 360) % 360);
      return;
    }

    if (step === 'REVIEW' && pages[currentPageIndex]) {
      const activePage = pages[currentPageIndex];
      try {
        const { dataUrl, width, height } = await rotateImageDataUrl(
          activePage.processedImage,
          deltaAngle
        );
        const newRotation = ((activePage.rotation + deltaAngle) % 360 + 360) % 360;

        const updatedPages = [...pages];
        updatedPages[currentPageIndex] = {
          ...activePage,
          processedImage: dataUrl,
          rotation: newRotation,
          width,
          height,
        };
        setPages(updatedPages);
        showNotification(`Page rotated ${deltaAngle > 0 ? '90° clockwise' : '90° counter-clockwise'}`);
      } catch (err) {
        console.error('Rotation error:', err);
      }
    }
  };

  // Reorder pages in multi-page document
  const handleMovePage = (direction: 'left' | 'right') => {
    if (pages.length <= 1) return;
    const targetIndex = direction === 'left' ? currentPageIndex - 1 : currentPageIndex + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const updated = [...pages];
    const [moved] = updated.splice(currentPageIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setPages(updated);
    setCurrentPageIndex(targetIndex);
    showNotification(`Moved page to position ${targetIndex + 1}`);
  };

  // Add another page
  const handleAddNewPage = () => {
    if (pages.length >= options.pageLimit) {
      alert(`Page limit of ${options.pageLimit} reached for this scan session.`);
      return;
    }
    // Load next realistic sample document or reset for live capture
    const nextSample = SAMPLE_DOCUMENTS[pages.length % SAMPLE_DOCUMENTS.length];
    loadSampleDoc(nextSample.createImage());
    setStep('CAPTURE');
  };

  // Finish scan and export combined multi-page PDF
  const handleFinishScan = () => {
    if (pages.length === 0) {
      onCancel();
      return;
    }
    onScanComplete(pages);
  };

  return (
    <div className="relative w-full h-full bg-black text-white flex flex-col select-none overflow-hidden font-sans">
      
      {/* ML Kit Header Bar */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-slate-950/90 backdrop-blur-md z-30 shrink-0">
        <button
          onClick={() => {
            if (step === 'REVIEW') {
              if (pages.length > 0) {
                // If reviewing, confirm cancel or go back to main screen
                onCancel();
              } else {
                setStep('CAPTURE');
              }
            } else if (step === 'FILTER') {
              setStep('CROP');
            } else if (step === 'CROP') {
              setStep('CAPTURE');
            } else {
              onCancel();
            }
          }}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white/90"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-sky-400">
            ML Kit Document Scanner
          </span>
          <span className="text-sm font-bold text-white">
            {step === 'CAPTURE' && (pages.length > 0 ? `Scan Page ${pages.length + 1}` : 'Target Document')}
            {step === 'CROP' && 'Adjust Edges'}
            {step === 'FILTER' && 'Shadow Removal & Filter'}
            {step === 'REVIEW' && `Document Preview (${pages.length} Pages)`}
          </span>
        </div>

        {/* Top Action in Header */}
        {step === 'REVIEW' && pages.length > 0 ? (
          <button
            onClick={handleFinishScan}
            className="text-xs font-bold text-sky-400 hover:text-sky-300 py-1 px-2 rounded-lg bg-sky-500/10 border border-sky-500/30 active:scale-95 transition-all"
          >
            Save PDF
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-sky-500 text-slate-950 text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          {notification}
        </div>
      )}

      {/* Main Content Area based on Step */}
      <div className="relative flex-1 w-full overflow-hidden flex flex-col items-center justify-center p-3">
        
        {/* STEP 1: CAPTURE / VIEWFINDER */}
        {step === 'CAPTURE' && (
          <div className="relative w-full h-full flex flex-col items-center justify-between">
            {/* Viewfinder Frame */}
            <div className="relative w-full flex-1 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
              {useCamera ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={activeRawImage}
                  alt="Document Preview"
                  className="w-full h-full object-contain bg-slate-950"
                />
              )}

              {/* Real-time ML Kit document contour detection overlay */}
              <div className="absolute inset-6 border-2 border-dashed border-emerald-400/70 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between items-center text-[10px] font-mono font-medium text-emerald-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs w-fit">
                  <span>ML Kit Edge Quad: Locked</span>
                </div>
                <div className="self-center bg-black/70 text-white/90 text-xs px-3 py-1 rounded-full backdrop-blur-md font-medium">
                  {pages.length > 0 ? `Target Page ${pages.length + 1}` : 'Hold steady · Auto-straightening'}
                </div>
              </div>

              {cameraError && (
                <div className="absolute top-3 inset-x-3 bg-amber-500/90 text-slate-950 text-xs p-2.5 rounded-lg shadow-lg">
                  {cameraError}
                </div>
              )}
            </div>

            {/* Presets & Camera Toggle Controls */}
            <div className="w-full pt-3 pb-1 flex flex-col gap-2">
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                {SAMPLE_DOCUMENTS.map((doc, idx) => (
                  <button
                    key={doc.id}
                    onClick={() => loadSampleDoc(doc.createImage())}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all whitespace-nowrap border border-white/5 font-medium text-slate-300"
                  >
                    Preset {idx + 1}: {doc.category}
                  </button>
                ))}

                <label className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all whitespace-nowrap border border-white/5 font-medium text-slate-300 flex items-center gap-1 cursor-pointer">
                  <Upload className="w-3 h-3" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={useCamera ? stopCameraStream : startCamera}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap border font-medium flex items-center gap-1 ${
                    useCamera
                      ? 'bg-emerald-600/80 border-emerald-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 border-white/5 text-slate-300'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  <span>{useCamera ? 'Camera Active' : 'Live Camera'}</span>
                </button>
              </div>

              {/* Shutter Capture Button */}
              <div className="flex items-center justify-between px-6 pt-2">
                {pages.length > 0 ? (
                  <button
                    onClick={() => setStep('REVIEW')}
                    className="text-xs text-sky-400 font-semibold hover:underline"
                  >
                    Cancel ({pages.length} pages ready)
                  </button>
                ) : (
                  <div className="w-16" />
                )}

                <button
                  onClick={handleCapture}
                  className="w-16 h-16 rounded-full bg-white ring-4 ring-white/30 active:scale-90 transition-all flex items-center justify-center shadow-xl cursor-pointer"
                  title="Capture page"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-white" />
                </button>

                <div className="w-16" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CROP / EDGE ADJUSTMENT */}
        {step === 'CROP' && (
          <div className="relative w-full h-full flex flex-col items-center justify-between">
            {/* Interactive Crop Canvas with Draggable Corner Pins */}
            <div
              ref={cropCanvasContainerRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="relative w-full flex-1 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center touch-none select-none border border-white/10"
            >
              {/* Document Image */}
              <img
                src={activeRawImage}
                alt="Crop Document"
                className="w-full h-full object-contain pointer-events-none select-none"
              />

              {/* SVG Polygon Overlay showing quad crop boundaries */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <polygon
                  points={`
                    ${corners.topLeft.x * 100}%,${corners.topLeft.y * 100}%
                    ${corners.topRight.x * 100}%,${corners.topRight.y * 100}%
                    ${corners.bottomRight.x * 100}%,${corners.bottomRight.y * 100}%
                    ${corners.bottomLeft.x * 100}%,${corners.bottomLeft.y * 100}%
                  `}
                  fill="rgba(56, 189, 248, 0.2)"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />
              </svg>

              {/* 4 Interactive Corner Pins */}
              {(
                [
                  { key: 'topLeft', label: 'TL', point: corners.topLeft },
                  { key: 'topRight', label: 'TR', point: corners.topRight },
                  { key: 'bottomRight', label: 'BR', point: corners.bottomRight },
                  { key: 'bottomLeft', label: 'BL', point: corners.bottomLeft },
                ] as const
              ).map(({ key, label, point }) => {
                const isActive = activeCornerKey === key;
                return (
                  <div
                    key={key}
                    onPointerDown={(e) => handlePointerDown(key, e)}
                    style={{
                      left: `${point.x * 100}%`,
                      top: `${point.y * 100}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center cursor-grab active:cursor-grabbing z-20 touch-none`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-transform ${
                        isActive
                          ? 'scale-125 bg-sky-400 ring-4 ring-sky-400/40'
                          : 'bg-sky-500 hover:scale-110'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  </div>
                );
              })}

              {/* Magnifying Loupe on active drag */}
              {activeCornerKey && activeCornerTouchPos && (
                <div
                  style={{
                    left: Math.max(70, Math.min(270, activeCornerTouchPos.x)),
                    top: Math.max(70, activeCornerTouchPos.y - 85),
                  }}
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-2 border-white shadow-2xl overflow-hidden bg-slate-900 z-40 ring-4 ring-sky-500/50 flex items-center justify-center"
                >
                  <img
                    src={activeRawImage}
                    alt="Magnifier Zoom"
                    style={{
                      width: '320%',
                      height: '320%',
                      maxWidth: 'none',
                      maxHeight: 'none',
                      transform: `translate(${
                        -(corners[activeCornerKey].x * 100 - 50) * 2.2
                      }%, ${-(corners[activeCornerKey].y * 100 - 50) * 2.2}%)`,
                    }}
                    className="object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-0.5 bg-red-500" />
                    <div className="h-4 w-0.5 bg-red-500 -ml-2" />
                  </div>
                </div>
              )}
            </div>

            {/* Crop Action Bar */}
            <div className="w-full pt-3 pb-1 flex items-center justify-between">
              <button
                onClick={() => {
                  setCorners({
                    topLeft: { x: 0.05, y: 0.05 },
                    topRight: { x: 0.95, y: 0.05 },
                    bottomRight: { x: 0.95, y: 0.95 },
                    bottomLeft: { x: 0.05, y: 0.95 },
                  });
                }}
                className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg bg-white/5"
              >
                Reset to Full
              </button>

              <button
                onClick={async () => {
                  await executePerspectiveWarp();
                  setStep('FILTER');
                }}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                {isProcessing ? 'Warping...' : 'Confirm Crop'}
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FILTER / SHADOW REMOVAL */}
        {step === 'FILTER' && (
          <div className="relative w-full h-full flex flex-col items-center justify-between">
            {/* Filtered Warped Preview with Rotate Controls */}
            <div className="relative w-full flex-1 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-white/10 shadow-lg">
              {filteredPreview ? (
                <img
                  src={filteredPreview}
                  alt="Filtered Preview"
                  className="w-full h-full object-contain transition-all"
                />
              ) : (
                <div className="text-xs text-slate-500">Processing filter...</div>
              )}

              {/* Filter badge */}
              <div className="absolute top-2 right-2 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-md text-[11px] font-mono text-white/90 border border-white/10">
                {selectedFilter === 'bw_shadow_removal' && 'ML Kit: Shadow Removal B&W'}
                {selectedFilter === 'grayscale' && 'Grayscale'}
                {selectedFilter === 'clean' && 'Clean Color'}
                {selectedFilter === 'none' && 'Original'}
              </div>

              {/* Floating Rotate Buttons overlaying preview */}
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-3">
                <button
                  onClick={() => handleRotateCurrentPage(-90)}
                  className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-white/20 shadow-lg active:scale-95 transition-all backdrop-blur-md"
                  title="Rotate 90° Counter-Clockwise"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                  <span>-90°</span>
                </button>

                <div className="px-2.5 py-1 rounded-full bg-black/70 text-[11px] font-mono text-slate-300 backdrop-blur-md border border-white/10">
                  {rotationVal}°
                </div>

                <button
                  onClick={() => handleRotateCurrentPage(90)}
                  className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-white/20 shadow-lg active:scale-95 transition-all backdrop-blur-md"
                  title="Rotate 90° Clockwise"
                >
                  <span>+90°</span>
                  <RotateCw className="w-3.5 h-3.5 text-sky-400" />
                </button>
              </div>
            </div>

            {/* Filter Selection Tabs */}
            <div className="w-full pt-2.5 pb-1 flex flex-col gap-2">
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-900 rounded-xl border border-white/10">
                {(
                  [
                    { id: 'bw_shadow_removal', label: 'B&W Clean' },
                    { id: 'grayscale', label: 'Grayscale' },
                    { id: 'clean', label: 'Clean Color' },
                    { id: 'none', label: 'Original' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedFilter(tab.id)}
                    className={`py-2 text-[11px] font-semibold rounded-lg transition-all truncate text-center ${
                      selectedFilter === tab.id
                        ? 'bg-sky-500 text-slate-950 shadow-md font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Slider for contrast */}
              <div className="flex items-center gap-2 px-2 text-xs text-slate-300">
                <span className="text-[11px] text-slate-400 whitespace-nowrap">Shadow Removal</span>
                <input
                  type="range"
                  min="-40"
                  max="60"
                  value={contrastVal}
                  onChange={(e) => setContrastVal(Number(e.target.value))}
                  className="w-full accent-sky-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setStep('CROP')}
                  className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg"
                >
                  Back to Crop
                </button>

                <button
                  onClick={saveCurrentPageToStack}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                >
                  <span>Accept Page</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & MULTI-PAGE PREVIEW */}
        {step === 'REVIEW' && (
          <div className="relative w-full h-full flex flex-col items-center justify-between">
            
            {/* Top Prompt Banner for Multi-Page Scanning */}
            <div className="w-full mb-2 p-2.5 rounded-xl bg-sky-950/80 border border-sky-800/80 flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 text-xs">
                <FileCheck className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-slate-200">
                  <strong className="text-white">{pages.length} page(s)</strong> ready for PDF
                </span>
              </div>

              {pages.length < options.pageLimit && (
                <button
                  onClick={handleAddNewPage}
                  className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 text-[11px] font-bold flex items-center gap-1 transition-all whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Scan Next Page</span>
                </button>
              )}
            </div>

            {/* Document Preview of Active Page */}
            <div className="relative w-full flex-1 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-white/10 shadow-lg">
              {pages[currentPageIndex] && (
                <img
                  src={pages[currentPageIndex].processedImage}
                  alt={`Page ${currentPageIndex + 1}`}
                  className="w-full h-full object-contain transition-all"
                />
              )}

              {/* Page Number & Orientation Badge */}
              <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-md text-xs font-semibold text-white/90 border border-white/10 flex items-center gap-2">
                <span>Page {currentPageIndex + 1} of {pages.length}</span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-[10px] text-sky-400">
                  {pages[currentPageIndex]?.rotation || 0}°
                </span>
              </div>

              {/* ROTATE 90° CLOCKWISE & COUNTER-CLOCKWISE CONTROLS */}
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-3">
                <button
                  onClick={() => handleRotateCurrentPage(-90)}
                  className="px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-white/20 shadow-xl active:scale-95 transition-all backdrop-blur-md cursor-pointer"
                  title="Rotate 90° Counter-Clockwise"
                >
                  <RotateCcw className="w-4 h-4 text-sky-400" />
                  <span>Rotate -90°</span>
                </button>

                <button
                  onClick={() => handleRotateCurrentPage(90)}
                  className="px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-white/20 shadow-xl active:scale-95 transition-all backdrop-blur-md cursor-pointer"
                  title="Rotate 90° Clockwise"
                >
                  <span>Rotate +90°</span>
                  <RotateCw className="w-4 h-4 text-sky-400" />
                </button>
              </div>
            </div>

            {/* Thumbnail Strip & Multi-Page Reordering */}
            <div className="w-full pt-2.5 pb-1 flex flex-col gap-2">
              
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span className="font-medium">All Pages in Document</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMovePage('left')}
                    disabled={currentPageIndex === 0}
                    className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move page left"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span>Page {currentPageIndex + 1}</span>
                  <button
                    onClick={() => handleMovePage('right')}
                    disabled={currentPageIndex === pages.length - 1}
                    className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move page right"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto py-1 px-1">
                {pages.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => setCurrentPageIndex(idx)}
                    className={`relative w-14 h-18 rounded-lg overflow-hidden border-2 cursor-pointer shrink-0 transition-all ${
                      currentPageIndex === idx
                        ? 'border-sky-400 scale-105 shadow-md shadow-sky-500/20 ring-2 ring-sky-400/40'
                        : 'border-white/20 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={p.processedImage}
                      alt={`Thumb ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] text-center text-white py-0.5 font-bold">
                      p.{idx + 1}
                    </div>
                  </div>
                ))}

                {/* "+ Add Page" button in thumbnail strip */}
                {pages.length < options.pageLimit && (
                  <button
                    onClick={handleAddNewPage}
                    className="w-14 h-18 rounded-lg border-2 border-dashed border-sky-400/50 hover:border-sky-400 bg-sky-950/30 flex flex-col items-center justify-center text-sky-300 hover:text-white shrink-0 text-[10px] gap-1 transition-all active:scale-95 cursor-pointer font-bold"
                    title="Scan another page"
                  >
                    <Plus className="w-5 h-5 text-sky-400" />
                    <span>Add Page</span>
                  </button>
                )}
              </div>

              {/* Primary Action Buttons */}
              <div className="flex items-center justify-between pt-1 gap-2">
                <button
                  onClick={() => {
                    const remaining = pages.filter((_, i) => i !== currentPageIndex);
                    if (remaining.length === 0) {
                      setPages([]);
                      setStep('CAPTURE');
                    } else {
                      setPages(remaining);
                      setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
                    }
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2.5 py-2 rounded-xl hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* Scan Another Page button */}
                  {pages.length < options.pageLimit && (
                    <button
                      onClick={handleAddNewPage}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-sky-400" />
                      <span>Scan Another</span>
                    </button>
                  )}

                  {/* Combine into Single Multi-Page PDF button */}
                  <button
                    onClick={handleFinishScan}
                    className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-sky-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Export {pages.length} Page{pages.length > 1 ? 's' : ''} to PDF</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
