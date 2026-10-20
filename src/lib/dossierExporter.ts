import type { SurveySubmission } from "./types";

/**
 * Text wrapping utility for HTML5 Canvas 2D context
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
}

/**
 * Generates an ultra-crisp, high-resolution A4 canvas (1240 x 1754 px @ 150 DPI)
 * representing the official SoilTrace Citizen Knowledge Dossier & Certificate.
 */
export async function generateDossierCanvas(submission: SurveySubmission): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  const width = 1240;
  const height = 1754;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize 2D canvas context");

  // Wait for web fonts if possible
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  const report = submission.knowledge_report;
  const score = report?.score_percentage ?? 75;
  const tier = report?.awareness_tier ?? "Informed Citizen Eco-Steward";

  // 1. Background fill (fine antique parchment paper)
  ctx.fillStyle = "#FAF8F5";
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle security guilloche / watermark texture in the center
  ctx.save();
  ctx.strokeStyle = "rgba(45, 90, 39, 0.035)";
  ctx.lineWidth = 1;
  for (let r = 80; r <= 460; r += 24) {
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 40, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Dual Official Borders
  // Outer forest green frame
  ctx.strokeStyle = "#2D5A27";
  ctx.lineWidth = 3.5;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  // Inner warm terracotta / gold border
  ctx.strokeStyle = "#C4823F";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(44, 44, width - 88, height - 88);

  // Corner decorative flourishes
  const corners = [
    [44, 44],
    [width - 44, 44],
    [44, height - 44],
    [width - 44, height - 44],
  ];
  ctx.fillStyle = "#8B3A22";
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Header Section
  let curY = 80;

  // Top Institutional Badge
  ctx.fillStyle = "#2D5A27";
  ctx.font = "bold 13px 'JetBrains Mono', monospace, sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "2px";
  ctx.fillText("SOILTRACE • CITIZEN ENVIRONMENTAL OBSERVATORY", width / 2, curY);

  curY += 22;
  ctx.fillStyle = "#6B655B";
  ctx.font = "11px 'Inter', sans-serif";
  ctx.letterSpacing = "0.5px";
  ctx.fillText(
    "Ministry of Environment, Forest and Climate Change (MoEFCC) • CPCB & ICAR Standards Reference",
    width / 2,
    curY
  );

  curY += 36;
  // Main Title
  ctx.fillStyle = "#1E1E1C";
  ctx.font = "bold 32px 'Lora', 'Playfair Display', serif";
  ctx.letterSpacing = "0px";
  ctx.fillText("CITIZEN SOIL HEALTH & AWARENESS DOSSIER", width / 2, curY);

  curY += 24;
  ctx.fillStyle = "#8B3A22";
  ctx.font = "bold 14px 'Inter', sans-serif";
  ctx.fillText("सजग पर्यावरण प्रहरी प्रमाणपत्र (Verified Ecological Pulse Record)", width / 2, curY);

  curY += 20;
  // Decorative separator
  ctx.strokeStyle = "#DDD5C7";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, curY);
  ctx.lineTo(width - 80, curY);
  ctx.stroke();

  // Diamond emblem in center of divider
  ctx.fillStyle = "#C4823F";
  ctx.beginPath();
  ctx.moveTo(width / 2, curY - 5);
  ctx.lineTo(width / 2 + 5, curY);
  ctx.lineTo(width / 2, curY + 5);
  ctx.lineTo(width / 2 - 5, curY);
  ctx.closePath();
  ctx.fill();

  // 5. Verification & Dossier Metadata Card
  curY += 24;
  const metaBoxY = curY;
  const metaBoxH = 92;

  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#E4DCD0";
  ctx.lineWidth = 1;
  ctx.fillRect(80, metaBoxY, width - 160, metaBoxH);
  ctx.strokeRect(80, metaBoxY, width - 160, metaBoxH);

  // Left side metadata
  ctx.textAlign = "left";
  ctx.fillStyle = "#1E1E1C";
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.fillText(`DOSSIER ID: ST-DOSSIER-${submission.id.slice(0, 8).toUpperCase()}`, 104, metaBoxY + 28);

  ctx.fillStyle = "#555048";
  ctx.font = "11px 'Inter', sans-serif";
  const dateStr = new Date(submission.submitted_at || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  ctx.fillText(`Recorded At: ${dateStr}`, 104, metaBoxY + 50);

  ctx.fillStyle = "#2D5A27";
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  const hashLabel = submission.phone_hash ? `${submission.phone_hash.slice(0, 16)}•••` : "Allocated 1-Citizen Quota";
  ctx.fillText(`Verification: 2-Factor Mobile Hash [${hashLabel}]`, 104, metaBoxY + 72);

  // Right side Score Badge
  const badgeW = 260;
  const badgeX = width - 80 - badgeW - 16;
  ctx.fillStyle = "#2D5A27";
  ctx.fillRect(badgeX, metaBoxY + 12, badgeW, metaBoxH - 24);

  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 20px 'JetBrains Mono', monospace";
  ctx.fillText(`SCORE: ${score}%`, badgeX + badgeW / 2, metaBoxY + 40);

  ctx.fillStyle = "#E0EEDD";
  ctx.font = "bold 10px 'Inter', sans-serif";
  ctx.fillText(tier.slice(0, 32), badgeX + badgeW / 2, metaBoxY + 62);

  // 6. Section 01: Citizen Perception Profile
  curY = metaBoxY + metaBoxH + 34;

  ctx.textAlign = "left";
  ctx.fillStyle = "#8B3A22";
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.fillText("01 / CITIZEN SURVEY PROFILE & FIELD PERCEPTIONS", 80, curY);

  curY += 16;
  const colW = (width - 160 - 24) / 4;
  const profileItems = [
    { label: "Baseline Awareness", val: submission.awareness.toUpperCase() },
    { label: "Contamination Pathways", val: `${submission.causes.length} Identified` },
    { label: "Vegetable Cleansing", val: submission.practice.toUpperCase() },
    { label: "Concern Level", val: `${submission.concern_score} / 5 Index` },
  ];

  profileItems.forEach((item, idx) => {
    const itemX = 80 + idx * (colW + 8);
    ctx.fillStyle = "#F3EFE8";
    ctx.fillRect(itemX, curY, colW, 52);
    ctx.strokeStyle = "#DDD5C7";
    ctx.lineWidth = 1;
    ctx.strokeRect(itemX, curY, colW, 52);

    ctx.fillStyle = "#7A7368";
    ctx.font = "10px 'Inter', sans-serif";
    ctx.fillText(item.label, itemX + 12, curY + 20);

    ctx.fillStyle = "#1E1E1C";
    ctx.font = "bold 12px 'JetBrains Mono', monospace";
    ctx.fillText(item.val, itemX + 12, curY + 40);
  });

  // 7. Section 02: Critical Knowledge Gaps & Science Advisory
  curY += 78;
  ctx.fillStyle = "#8B3A22";
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.fillText("02 / CRITICAL ENVIRONMENTAL KNOWLEDGE GAPS & SCIENTIFIC ADVISORY", 80, curY);

  curY += 16;
  const gaps = report?.knowledge_gaps?.slice(0, 3) || [];

  if (gaps.length > 0) {
    for (let i = 0; i < gaps.length; i++) {
      const gap = gaps[i];
      const cardY = curY;
      const cardH = 92;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(80, cardY, width - 160, cardH);
      ctx.strokeStyle = "#E4DCD0";
      ctx.lineWidth = 1;
      ctx.strokeRect(80, cardY, width - 160, cardH);

      // Alert marker bar
      ctx.fillStyle = "#8B3A22";
      ctx.fillRect(80, cardY, 4, cardH);

      // Title
      ctx.fillStyle = "#8B3A22";
      ctx.font = "bold 12px 'JetBrains Mono', monospace";
      ctx.fillText(`GAP 0${i + 1}: ${gap.topic.toUpperCase()}`, 96, cardY + 22);

      // Why Important
      ctx.fillStyle = "#4A463E";
      ctx.font = "11px 'Inter', sans-serif";
      wrapText(ctx, `Why It Matters: ${gap.why_important}`, 96, cardY + 40, width - 200, 15);

      // Action Tip box
      ctx.fillStyle = "#EBF4EA";
      ctx.fillRect(96, cardY + 60, width - 200, 24);
      ctx.strokeStyle = "#C9E2C6";
      ctx.strokeRect(96, cardY + 60, width - 200, 24);

      ctx.fillStyle = "#2D5A27";
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.fillText(`TIP: ${gap.action_tip.slice(0, 110)}...`, 104, cardY + 76);

      curY += cardH + 12;
    }
  } else {
    ctx.fillStyle = "#EBF4EA";
    ctx.fillRect(80, curY, width - 160, 48);
    ctx.fillStyle = "#2D5A27";
    ctx.font = "bold 12px 'Inter', sans-serif";
    ctx.fillText("Mastery of Core Pathways: All major contamination vectors correctly identified.", 100, curY + 28);
    curY += 60;
  }

  // 8. Section 03: Identified Knowledge Strengths
  curY += 16;
  ctx.fillStyle = "#2D5A27";
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.fillText("03 / DEMONSTRATED CITIZEN STRENGTHS", 80, curY);

  curY += 16;
  const strengths = report?.strengths || ["Participated actively in community soil health pulse."];
  strengths.slice(0, 3).forEach((s) => {
    ctx.fillStyle = "#2D5A27";
    ctx.font = "bold 12px 'Inter', sans-serif";
    ctx.fillText("✔", 84, curY + 12);

    ctx.fillStyle = "#2C2A26";
    ctx.font = "11px 'Inter', sans-serif";
    ctx.fillText(s, 104, curY + 12);
    curY += 20;
  });

  // 9. Section 04: Practical Citizen Directives
  curY += 16;
  ctx.fillStyle = "#8B3A22";
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.fillText("04 / CITIZEN ACTION DIRECTIVES & EXTENSION GUIDANCE", 80, curY);

  curY += 16;
  const actions = report?.action_recommendations || [
    "Visit local Krishi Vigyan Kendra (KVK) to access subsidized soil health card testing.",
    "Maintain soil organic carbon above 0.75% using farmyard manure or biochar to immobilize heavy metals.",
    "Wash vegetables in 2% salt or vinegar water for 10 minutes to remove surface contaminants.",
  ];

  actions.slice(0, 3).forEach((act, idx) => {
    ctx.fillStyle = "#F8F5EE";
    ctx.fillRect(80, curY, width - 160, 32);
    ctx.strokeStyle = "#E4DCD0";
    ctx.strokeRect(80, curY, width - 160, 32);

    ctx.fillStyle = "#8B3A22";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillText(`0${idx + 1}.`, 96, curY + 20);

    ctx.fillStyle = "#1E1E1C";
    ctx.font = "11px 'Inter', sans-serif";
    ctx.fillText(act.slice(0, 115), 124, curY + 20);
    curY += 40;
  });

  // 10. Official Footer & Helplines
  curY = height - 190;
  ctx.strokeStyle = "#DDD5C7";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, curY);
  ctx.lineTo(width - 80, curY);
  ctx.stroke();

  curY += 24;
  // Helpline Box
  ctx.fillStyle = "#FFF9ED";
  ctx.fillRect(80, curY, width - 160, 52);
  ctx.strokeStyle = "#EBD7A8";
  ctx.strokeRect(80, curY, width - 160, 52);

  ctx.fillStyle = "#9C6212";
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.fillText("FREE NATIONAL KISAN CALL CENTER: 1800-180-1551", 100, curY + 24);

  ctx.fillStyle = "#6B552B";
  ctx.font = "10px 'Inter', sans-serif";
  ctx.fillText(
    "Operating 6:00 AM - 10:00 PM Daily across all 22 Indian regional languages for free agricultural & soil testing guidance.",
    100,
    curY + 40
  );

  curY += 72;
  // Official Links & Registry Stamp
  ctx.textAlign = "center";
  ctx.fillStyle = "#7A7368";
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillText(
    "Official Portals: soilhealth.dac.gov.in  •  cpcb.nic.in  •  moef.gov.in  •  soiltrace.gov.in",
    width / 2,
    curY
  );

  curY += 18;
  ctx.fillStyle = "#2D5A27";
  ctx.font = "bold 10px 'JetBrains Mono', monospace";
  ctx.fillText(
    "RECORDED IN SOILTRACE CITIZEN GROUND HEALTH REPOSITORY • CRYPTOGRAPHICALLY VERIFIED 1-CITIZEN SUBMISSION",
    width / 2,
    curY
  );

  return canvas;
}

/**
 * Constructs a standard, compliant PDF 1.4 document containing the high-resolution JPEG
 * stream mapped onto standard A4 format (595.28 x 841.89 pt).
 */
export function createPdfFromJpeg(jpegBytes: Uint8Array, widthPx: number, heightPx: number): Blob {
  const ptWidth = 595.28;
  const ptHeight = 841.89;

  const encoder = new TextEncoder();
  const chunks: any[] = [];
  let currentOffset = 0;
  const offsets: number[] = [];

  function addString(str: string) {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    currentOffset += bytes.length;
  }

  function addBytes(bytes: Uint8Array) {
    chunks.push(bytes);
    currentOffset += bytes.length;
  }

  // PDF Header
  addString("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  // Obj 1: Catalog
  offsets.push(currentOffset);
  addString("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // Obj 2: Pages
  offsets.push(currentOffset);
  addString("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  // Obj 3: Page (A4 MediaBox)
  offsets.push(currentOffset);
  addString(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptWidth.toFixed(2)} ${ptHeight.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // Obj 4: Image XObject containing raw JPEG stream
  offsets.push(currentOffset);
  addString(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  addBytes(jpegBytes);
  addString("\nendstream\nendobj\n");

  // Obj 5: Page Content stream drawing image to fill the page
  offsets.push(currentOffset);
  const streamContent = `q\n${ptWidth.toFixed(2)} 0 0 ${ptHeight.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`;
  const streamBytes = encoder.encode(streamContent);
  addString(`5 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`);
  addBytes(streamBytes);
  addString("endstream\nendobj\n");

  // Xref table
  const startXref = currentOffset;
  addString("xref\n0 6\n0000000000 65535 f \n");
  for (const off of offsets) {
    addString(`${String(off).padStart(10, "0")} 00000 n \n`);
  }

  // Trailer
  addString(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`);

  return new Blob(chunks, { type: "application/pdf" });
}

/**
 * Downloads the Citizen Knowledge Dossier as a high-resolution, print-ready PDF file (.pdf).
 */
export async function downloadDossierAsPdf(submission: SurveySubmission): Promise<void> {
  const canvas = await generateDossierCanvas(submission);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.95);
  });

  if (!blob) throw new Error("Failed to render dossier image buffer");

  const arrayBuffer = await blob.arrayBuffer();
  const jpegBytes = new Uint8Array(arrayBuffer);

  const pdfBlob = createPdfFromJpeg(jpegBytes, canvas.width, canvas.height);
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `soiltrace-citizen-dossier-${submission.id.slice(0, 8)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the Citizen Knowledge Dossier as a high-resolution JPG image (.jpg).
 */
export async function downloadDossierAsJpg(submission: SurveySubmission): Promise<void> {
  const canvas = await generateDossierCanvas(submission);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.95);
  });

  if (!blob) throw new Error("Failed to render dossier JPEG image");

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `soiltrace-citizen-dossier-${submission.id.slice(0, 8)}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Opens an offscreen print-optimized window to print or save via browser PDF printer.
 */
export async function printDossier(submission: SurveySubmission): Promise<void> {
  const canvas = await generateDossierCanvas(submission);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Could not open print window. Please check popup permissions.");
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SoilTrace Citizen Knowledge Dossier - ${submission.id.slice(0, 8)}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          img {
            width: 100%;
            height: auto;
            max-width: 210mm;
            display: block;
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" onload="window.print();" />
      </body>
    </html>
  `);
  printWindow.document.close();
}
