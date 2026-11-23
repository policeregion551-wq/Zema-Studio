import type { AdContent } from "../types";

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function renderAdPosterPng(ad: AdContent): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const bgHex =
    ad.bgHex && /^#[0-9A-Fa-f]{6}$/.test(ad.bgHex) ? ad.bgHex : "#0F172A";
  const accentHex =
    ad.accentHex && /^#[0-9A-Fa-f]{6}$/.test(ad.accentHex)
      ? ad.accentHex
      : "#2563EB";
  const textHex =
    ad.textHex && /^#[0-9A-Fa-f]{6}$/.test(ad.textHex) ? ad.textHex : "#F8FAFC";

  // Clean layered studio backdrop
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle geometric accent sweep
  const grad = ctx.createRadialGradient(1060, 140, 40, 1060, 140, 560);
  grad.addColorStop(0, `${accentHex}55`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle hairline frame
  ctx.strokeStyle = `${textHex}22`;
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

  // Accent bar
  ctx.fillStyle = accentHex;
  ctx.fillRect(96, 110, 72, 6);

  // Headline
  ctx.fillStyle = textHex;
  ctx.font =
    "700 54px 'Plus Jakarta Sans', 'Noto Sans Ethiopic', 'Noto Sans Arabic', sans-serif";
  ctx.textBaseline = "top";
  const headlineLines = wrapCanvasText(
    ctx,
    ad.headline || "",
    canvas.width - 220
  ).slice(0, 3);

  let y = 148;
  for (const line of headlineLines) {
    ctx.fillText(line, 96, y);
    y += 72;
  }

  // Subheadline
  if (ad.subheadline) {
    y += 18;
    ctx.fillStyle = `${textHex}CC`;
    ctx.font =
      "400 28px 'Plus Jakarta Sans', 'Noto Sans Ethiopic', 'Noto Sans Arabic', sans-serif";
    const subLines = wrapCanvasText(
      ctx,
      ad.subheadline,
      canvas.width - 240
    ).slice(0, 3);
    for (const line of subLines) {
      ctx.fillText(line, 96, y);
      y += 42;
    }
  }

  // Call to Action block at bottom
  if (ad.callToAction) {
    ctx.font =
      "600 24px 'Plus Jakarta Sans', 'Noto Sans Ethiopic', 'Noto Sans Arabic', sans-serif";
    const ctaText = ad.callToAction;
    const textWidth = ctx.measureText(ctaText).width;
    const btnW = Math.min(canvas.width - 192, textWidth + 64);
    const btnH = 60;
    const btnX = 96;
    const btnY = canvas.height - 156;

    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 12);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.textBaseline = "middle";
    ctx.fillText(ctaText, btnX + 32, btnY + btnH / 2);
  }

  return canvas.toDataURL("image/png");
}
