import { Point, QuadCorners, ScannerFilter } from '../types';

/**
 * Creates default corner points for an image with an inset border
 */
export function getDefaultCorners(width: number, height: number): QuadCorners {
  const padX = width * 0.08;
  const padY = height * 0.08;
  return {
    topLeft: { x: padX, y: padY },
    topRight: { x: width - padX, y: padY * 1.2 },
    bottomRight: { x: width - padX * 0.9, y: height - padY },
    bottomLeft: { x: padX * 1.1, y: height - padY * 1.1 },
  };
}

/**
 * Loads an HTMLImageElement from a URL/DataURI
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Bilinear perspective warp for quadrilateral document crop
 */
export function warpQuadrilateral(
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  corners: QuadCorners,
  outputWidth: number = 800,
  outputHeight: number = 1100
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  // Source canvas to read pixel data from
  let srcCanvas: HTMLCanvasElement;
  let srcCtx: CanvasRenderingContext2D | null;

  if (sourceImage instanceof HTMLCanvasElement) {
    srcCanvas = sourceImage;
    srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  } else {
    srcCanvas = document.createElement('canvas');
    srcCanvas.width = sourceImage.naturalWidth || sourceImage.width;
    srcCanvas.height = sourceImage.naturalHeight || sourceImage.height;
    srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
    if (srcCtx) {
      srcCtx.drawImage(sourceImage, 0, 0);
    }
  }

  if (!srcCtx) return canvas;

  const srcImgData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
  const srcData = srcImgData.data;
  const sw = srcCanvas.width;
  const sh = srcCanvas.height;

  const outImgData = ctx.createImageData(outputWidth, outputHeight);
  const outData = outImgData.data;

  const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = corners;

  // Bilinear interpolation mapping from output (u,v) to input (x,y)
  for (let y = 0; y < outputHeight; y++) {
    const v = y / (outputHeight - 1);
    for (let x = 0; x < outputWidth; x++) {
      const u = x / (outputWidth - 1);

      // Coordinates in source image
      const srcX = (1 - u) * (1 - v) * tl.x +
                   u * (1 - v) * tr.x +
                   u * v * br.x +
                   (1 - u) * v * bl.x;

      const srcY = (1 - u) * (1 - v) * tl.y +
                   u * (1 - v) * tr.y +
                   u * v * br.y +
                   (1 - u) * v * bl.y;

      const ix = Math.floor(srcX);
      const iy = Math.floor(srcY);

      const outIdx = (y * outputWidth + x) * 4;

      if (ix >= 0 && ix < sw - 1 && iy >= 0 && iy < sh - 1) {
        const fx = srcX - ix;
        const fy = srcY - iy;

        const idx00 = (iy * sw + ix) * 4;
        const idx10 = (iy * sw + (ix + 1)) * 4;
        const idx01 = ((iy + 1) * sw + ix) * 4;
        const idx11 = ((iy + 1) * sw + (ix + 1)) * 4;

        for (let c = 0; c < 3; c++) {
          const c00 = srcData[idx00 + c];
          const c10 = srcData[idx10 + c];
          const c01 = srcData[idx01 + c];
          const c11 = srcData[idx11 + c];

          const val = (1 - fx) * (1 - fy) * c00 +
                      fx * (1 - fy) * c10 +
                      (1 - fx) * fy * c01 +
                      fx * fy * c11;

          outData[outIdx + c] = Math.min(255, Math.max(0, val));
        }
        outData[outIdx + 3] = 255;
      } else {
        outData[outIdx] = 255;
        outData[outIdx + 1] = 255;
        outData[outIdx + 2] = 255;
        outData[outIdx + 3] = 255;
      }
    }
  }

  ctx.putImageData(outImgData, 0, 0);
  return canvas;
}

/**
 * High-contrast B&W shadow-removal filter (Adaptive Threshold / Background Illumination Normalization)
 * This removes room shadows, desk vignette, and paper creases, delivering crisp black text on pure white paper.
 */
export function applyDocumentFilter(
  sourceCanvas: HTMLCanvasElement,
  filter: ScannerFilter,
  contrast: number = 0,
  brightness: number = 0,
  rotation: number = 0
): string {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  // Create working canvas for rotation and filtering
  const workCanvas = document.createElement('canvas');
  if (rotation % 180 === 0) {
    workCanvas.width = width;
    workCanvas.height = height;
  } else {
    workCanvas.width = height;
    workCanvas.height = width;
  }

  const ctx = workCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas.toDataURL('image/jpeg', 0.92);

  ctx.save();
  ctx.translate(workCanvas.width / 2, workCanvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(sourceCanvas, -width / 2, -height / 2);
  ctx.restore();

  if (filter === 'none' && contrast === 0 && brightness === 0) {
    return workCanvas.toDataURL('image/jpeg', 0.92);
  }

  const w = workCanvas.width;
  const h = workCanvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Factor calculations for contrast & brightness
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const brightnessOffset = brightness * 1.5;

  if (filter === 'grayscale') {
    for (let i = 0; i < data.length; i += 4) {
      let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      gray = contrastFactor * (gray - 128) + 128 + brightnessOffset;
      const finalVal = Math.min(255, Math.max(0, gray));
      data[i] = finalVal;
      data[i + 1] = finalVal;
      data[i + 2] = finalVal;
    }
  } else if (filter === 'bw_shadow_removal') {
    // 1. Compute grayscale array
    const gray = new Float32Array(w * h);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // 2. Integral image for fast 2D moving average (local background illumination estimation)
    // Box radius proportional to image dimension
    const radius = Math.max(8, Math.round(w / 32));
    const integral = new Float64Array((w + 1) * (h + 1));

    for (let y = 0; y < h; y++) {
      let rowSum = 0;
      for (let x = 0; x < w; x++) {
        rowSum += gray[y * w + x];
        integral[(y + 1) * (w + 1) + (x + 1)] = integral[y * (w + 1) + (x + 1)] + rowSum;
      }
    }

    // Sensitivity parameter (85% of local mean ensures dark ink is preserved while grey shadows become white)
    const thresholdFactor = 0.88 + (contrast / 500);

    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - radius);
      const y1 = Math.min(h, y + radius + 1);

      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - radius);
        const x1 = Math.min(w, x + radius + 1);

        const count = (x1 - x0) * (y1 - y0);
        const sum =
          integral[y1 * (w + 1) + x1] -
          integral[y0 * (w + 1) + x1] -
          integral[y1 * (w + 1) + x0] +
          integral[y0 * (w + 1) + x0];

        const localMean = sum / count;
        const currentPixel = gray[y * w + x];
        const outIdx = (y * w + x) * 4;

        // Adaptive thresholding: if pixel is darker than local ambient, it's ink
        if (currentPixel < localMean * thresholdFactor - (brightnessOffset / 3)) {
          // Sharp black ink with slight anti-aliasing
          const inkDepth = Math.max(0, Math.min(30, (currentPixel / localMean) * 40));
          data[outIdx] = inkDepth;
          data[outIdx + 1] = inkDepth;
          data[outIdx + 2] = inkDepth;
        } else {
          // Pure clean bleached document paper
          data[outIdx] = 255;
          data[outIdx + 1] = 255;
          data[outIdx + 2] = 255;
        }
      }
    }
  } else if (filter === 'clean') {
    // "Clean" filter: Boost whites, sharpen ink contrast, retain color
    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let val = data[i + c];
        // S-curve expansion
        val = contrastFactor * (val - 128) + 128 + brightnessOffset + 10;
        if (val > 195) {
          val = 255; // bleach subtle paper shadows
        }
        data[i + c] = Math.min(255, Math.max(0, val));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return workCanvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Rotates an image by deltaAngle (e.g. +90 for clockwise, -90 for counter-clockwise)
 * and returns the new base64 data URL and dimensions.
 */
export async function rotateImageDataUrl(
  srcDataUrl: string,
  deltaAngle: 90 | -90 | 180 | 270
): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = await loadImage(srcDataUrl);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  // Normalized rotation angle in 0..360
  const normalized = ((deltaAngle % 360) + 360) % 360;
  const isPerpendicular = normalized === 90 || normalized === 270;

  const canvas = document.createElement('canvas');
  canvas.width = isPerpendicular ? srcH : srcW;
  canvas.height = isPerpendicular ? srcW : srcH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: srcDataUrl, width: srcW, height: srcH };
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((normalized * Math.PI) / 180);
  ctx.drawImage(img, -srcW / 2, -srcH / 2);
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  return {
    dataUrl,
    width: canvas.width,
    height: canvas.height,
  };
}

