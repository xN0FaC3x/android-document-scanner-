export interface Point {
  x: number;
  y: number;
}

export interface QuadCorners {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

export type ScannerFilter = 'none' | 'grayscale' | 'bw_shadow_removal' | 'clean';

export type ScannerMode = 'FULL' | 'BASE' | 'BASE_WITH_FILTER';

export interface ScannerOptions {
  pageLimit: number;
  scannerMode: ScannerMode;
  allowGalleryImport: boolean;
  resultFormats: ('JPEG' | 'PDF')[];
}

export interface ScannedPage {
  id: string;
  originalImage: string; // Data URL or Image Source
  processedImage: string; // Cropped & filtered data URL
  corners: QuadCorners;
  filter: ScannerFilter;
  contrast: number; // -50 to 50
  brightness: number; // -50 to 50
  rotation: number; // 0, 90, 180, 270
  timestamp: number;
  width: number;
  height: number;
}

export interface ScannedDocument {
  id: string;
  title: string;
  pages: ScannedPage[];
  createdAt: number;
  pdfBlob?: Blob;
  pdfUrl?: string;
}

export interface LogEvent {
  id: string;
  timestamp: string;
  tag: string;
  message: string;
  type: 'info' | 'success' | 'intent' | 'result';
}
