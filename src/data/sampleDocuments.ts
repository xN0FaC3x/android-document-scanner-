/**
 * Procedurally generates realistic sample documents for scanning demonstration.
 * These simulate real-world conditions like desk backgrounds, skewed perspective,
 * wrinkled paper, and harsh phone shadows so users can experience ML Kit's edge
 * detection and shadow-removal filters immediately.
 */

export interface SampleDoc {
  id: string;
  name: string;
  description: string;
  category: string;
  createImage: () => string;
}

export function createReceiptWithShadow(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Dark textured wood desk background
  ctx.fillStyle = '#2a2421';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Wood grain lines
  ctx.strokeStyle = '#342d2a';
  ctx.lineWidth = 3;
  for (let i = 0; i < canvas.height; i += 28) {
    ctx.beginPath();
    ctx.moveTo(0, i + Math.sin(i / 20) * 10);
    ctx.bezierCurveTo(300, i + 15, 600, i - 15, canvas.width, i + 5);
    ctx.stroke();
  }

  // 2. Skewed paper receipt
  ctx.save();
  ctx.translate(130, 90);
  ctx.rotate(0.04); // slight 2.3 deg skew

  // Receipt paper drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetX = 12;
  ctx.shadowOffsetY = 16;

  // Paper body
  ctx.fillStyle = '#faf8f2';
  ctx.fillRect(0, 0, 620, 980);

  ctx.shadowColor = 'transparent';

  // Receipt perforated bottom zigzag
  ctx.fillStyle = '#faf8f2';
  ctx.beginPath();
  ctx.moveTo(0, 980);
  for (let x = 0; x <= 620; x += 15) {
    ctx.lineTo(x + 7.5, 995);
    ctx.lineTo(x + 15, 980);
  }
  ctx.fill();

  // 3. Receipt content
  ctx.fillStyle = '#1c1b1a';
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px "Courier New", monospace';
  ctx.fillText('BLUE BOTTLE COFFEE', 310, 80);

  ctx.font = '16px "Courier New", monospace';
  ctx.fillStyle = '#555';
  ctx.fillText('315 Linden St, San Francisco, CA', 310, 115);
  ctx.fillText('Tel: (415) 555-0199 · Store #042', 310, 140);
  ctx.fillText('------------------------------------------------', 310, 170);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#222';
  ctx.font = '16px "Courier New", monospace';
  ctx.fillText('Date: 2026-10-22   14:23:09', 50, 205);
  ctx.fillText('Cashier: Alex M.       Register: 02', 50, 230);
  ctx.fillText('================================================', 50, 260);

  const items = [
    { name: '1x Bella Donovan Blend', price: '$18.50' },
    { name: '2x Oat Milk Cappuccino', price: '$13.00' },
    { name: '1x Almond Croissant', price: '$5.75' },
    { name: '1x Avocado Toast w/ Egg', price: '$12.50' },
    { name: '1x Cascara Cold Brew', price: '$6.25' },
  ];

  let y = 300;
  items.forEach((item) => {
    ctx.fillText(item.name, 50, y);
    ctx.textAlign = 'right';
    ctx.fillText(item.price, 570, y);
    ctx.textAlign = 'left';
    y += 40;
  });

  ctx.fillText('------------------------------------------------', 50, y + 10);
  y += 45;

  ctx.fillText('SUBTOTAL:', 50, y);
  ctx.textAlign = 'right';
  ctx.fillText('$56.00', 570, y);
  ctx.textAlign = 'left';
  y += 35;

  ctx.fillText('SF SALES TAX (8.625%):', 50, y);
  ctx.textAlign = 'right';
  ctx.fillText('$4.83', 570, y);
  ctx.textAlign = 'left';
  y += 45;

  ctx.font = 'bold 22px "Courier New", monospace';
  ctx.fillText('TOTAL DUE:', 50, y);
  ctx.textAlign = 'right';
  ctx.fillText('$60.83', 570, y);
  ctx.textAlign = 'left';
  y += 50;

  ctx.font = '16px "Courier New", monospace';
  ctx.fillText('VISA ENDING IN *8831 (CHIP)', 50, y);
  y += 30;
  ctx.fillText('AUTH CODE: 981244  APPROVED', 50, y);

  // Barcode
  y += 60;
  ctx.fillStyle = '#111';
  for (let b = 120; b < 500; b += 5) {
    const barW = (b % 3 === 0) ? 3 : (b % 2 === 0 ? 1.5 : 2);
    ctx.fillRect(b, y, barW, 65);
  }
  ctx.textAlign = 'center';
  ctx.fillText('|| | |||| | ||| || |||||| | ||', 310, y + 85);

  ctx.restore();

  // 4. HARSH CAST PHONE / HAND SHADOW (Crucial for demonstrating shadow removal filter!)
  const shadowGrad = ctx.createLinearGradient(0, 0, 700, 900);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  shadowGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.50)');
  shadowGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.save();
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.moveTo(0, 150);
  ctx.lineTo(650, 0);
  ctx.lineTo(850, 800);
  ctx.lineTo(100, 1100);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

export function createContractDocument(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Clean slate table surface
  ctx.fillStyle = '#1e242b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Contract sheet
  ctx.save();
  ctx.translate(110, 80);
  ctx.rotate(-0.025);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 10;
  ctx.shadowOffsetY = 15;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 680, 1020);
  ctx.shadowColor = 'transparent';

  // Letterhead
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(50, 60, 48, 48);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('N', 63, 95);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('NEXUS SYSTEMS INC.', 115, 82);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Enterprise Cloud Agreement · Document #SA-2026-89', 115, 102);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, 130);
  ctx.lineTo(630, 130);
  ctx.stroke();

  // Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px serif';
  ctx.fillText('MASTER SERVICES AND DATA PROCESSING ADDENDUM', 50, 175);

  // Body text blocks
  ctx.fillStyle = '#334155';
  ctx.font = '12px serif';
  const textLines = [
    'This Agreement is entered into as of October 2026 by and between Nexus Systems Inc.',
    '("Provider") and the Client identified below ("Customer").',
    '',
    '1. SCOPE OF SERVICES: Provider agrees to deliver enterprise document scanning, optical',
    'character recognition (OCR), and secure cloud ingestion services as described in Exhibit A.',
    '',
    '2. CONFIDENTIALITY & PRIVACY: Both parties agree to protect proprietary data using standard',
    'industry safeguards. ML Kit processing on device ensures zero unauthorized telemetry.',
    '',
    '3. COMPLIANCE: The services comply with SOC2 Type II, GDPR, and HIPAA standards where applicable.',
    'All exported PDF artifacts remain strictly on-premise or within designated cloud boundaries.',
    '',
    '4. TERM AND TERMINATION: This Agreement remains in effect for twelve (12) consecutive months,',
    'renewing automatically unless written notice of intent not to renew is delivered 30 days prior.',
  ];

  let ty = 215;
  for (const line of textLines) {
    ctx.fillText(line, 50, ty);
    ty += 22;
  }

  // Signature section
  ty += 60;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, ty);
  ctx.lineTo(300, ty);
  ctx.moveTo(380, ty);
  ctx.lineTo(630, ty);
  ctx.stroke();

  ctx.font = 'italic 13px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Authorized Signature: Johnathan Vance', 50, ty + 24);
  ctx.fillText('Countersigned: Dr. Elena Rostova', 380, ty + 24);

  // Handwritten cursive signature
  ctx.strokeStyle = '#1d4ed8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(70, ty - 25);
  ctx.bezierCurveTo(90, ty - 45, 120, ty - 10, 150, ty - 25);
  ctx.bezierCurveTo(180, ty - 40, 210, ty + 5, 240, ty - 20);
  ctx.stroke();

  ctx.restore();

  // Desk shadow over corner
  const shadowGrad = ctx.createRadialGradient(200, 200, 50, 200, 200, 600);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(0, 0, 600, 600);

  return canvas.toDataURL('image/jpeg', 0.92);
}

export function createHandwrittenNotes(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Warm studio table
  ctx.fillStyle = '#3f352e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Lined notepad sheet
  ctx.save();
  ctx.translate(120, 100);
  ctx.rotate(0.03);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 14;

  ctx.fillStyle = '#fffdf0'; // yellowish notepad paper
  ctx.fillRect(0, 0, 650, 980);
  ctx.shadowColor = 'transparent';

  // Red left margin line
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(80, 0);
  ctx.lineTo(80, 980);
  ctx.stroke();

  // Horizontal blue lines
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 1;
  for (let y = 80; y < 960; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(650, y);
    ctx.stroke();
  }

  // Handwritten notes
  ctx.fillStyle = '#1e3a8a';
  ctx.font = '24px "Comic Sans MS", cursive, sans-serif';
  ctx.fillText('Physics 201: Optical Edge Detection & Warping', 100, 72);

  ctx.font = '18px "Comic Sans MS", cursive, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('1. Homography transformation: H is 3x3 matrix', 100, 136);
  ctx.fillText('2. x_prime = (h11*x + h12*y + h13) / (h31*x + h32*y + h33)', 100, 168);
  ctx.fillText('3. ML Kit uses mobile neural net for corner regression', 100, 200);
  ctx.fillText('4. Adaptive Thresholding removes background illumination cast:', 100, 232);
  ctx.fillText('     T(x,y) = Mean_local(x,y) * (1 - C)', 140, 264);

  // Diagram sketch
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.strokeRect(120, 320, 200, 140);
  ctx.strokeRect(380, 310, 160, 160);

  ctx.beginPath();
  ctx.moveTo(320, 390);
  ctx.lineTo(370, 390);
  ctx.lineTo(360, 380);
  ctx.moveTo(370, 390);
  ctx.lineTo(360, 400);
  ctx.stroke();

  ctx.font = '14px "Comic Sans MS", cursive, sans-serif';
  ctx.fillText('Perspective Quad', 140, 485);
  ctx.fillText('Warped Rect Page', 390, 495);

  ctx.restore();

  // Harsh diagonal hand shadow
  const grad = ctx.createLinearGradient(0, 400, 600, 1000);
  grad.addColorStop(0, 'rgba(15, 10, 5, 0.6)');
  grad.addColorStop(0.5, 'rgba(15, 10, 5, 0.4)');
  grad.addColorStop(1, 'rgba(15, 10, 5, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 200, 750, 900);

  return canvas.toDataURL('image/jpeg', 0.92);
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: 'sample-receipt',
    name: 'Coffee Receipt (Harsh Shadow)',
    description: 'Folded receipt with dark wood desk background and diagonal mobile shadow.',
    category: 'Receipt',
    createImage: createReceiptWithShadow,
  },
  {
    id: 'sample-contract',
    name: 'Enterprise Contract (Signature)',
    description: 'Formal business agreement with signature block and corporate header.',
    category: 'Legal',
    createImage: createContractDocument,
  },
  {
    id: 'sample-notes',
    name: 'Lecture Notes (Formulas & Sketch)',
    description: 'Yellow lined notepad with formulas, hand-drawn diagram, and margin notes.',
    category: 'Handwriting',
    createImage: createHandwrittenNotes,
  },
];
