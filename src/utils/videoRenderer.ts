export interface VideoSceneSpec {
  durationSec?: number;
  sceneType?: string;
  skyTop?: string;
  skyBottom?: string;
  groundColor?: string;
  accentColor?: string;
  weather?: string;
  cameraMove?: string;
  caption?: string;
}

export interface TextVideoScript {
  summary?: string;
  scenes?: VideoSceneSpec[];
}

export interface PhotoChoreography {
  summary?: string;
  zoomStart?: number;
  zoomEnd?: number;
  panX?: number;
  panY?: number;
  atmosphere?: string;
  caption?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

function createParticles(count: number, w: number, h: number): Particle[] {
  const arr: Particle[] = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 0.4 + Math.random() * 1.4,
      size: 1.5 + Math.random() * 3.5,
      alpha: 0.25 + Math.random() * 0.65,
    });
  }
  return arr;
}

function drawWeather(
  ctx: CanvasRenderingContext2D,
  weather: string,
  particles: Particle[],
  w: number,
  h: number,
  timeSec: number,
  accentColor: string
) {
  if (weather === "stars") {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(timeSec * 2 + i));
      ctx.fillStyle = `rgba(255,255,255,${p.alpha * twinkle})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y * 0.6, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (weather === "rain") {
    ctx.strokeStyle = "rgba(210, 230, 255, 0.45)";
    ctx.lineWidth = 1.5;
    for (const p of particles) {
      p.y = (p.y + p.vy * 14) % h;
      p.x = (p.x - 2 + w) % w;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 6, p.y + 18);
      ctx.stroke();
    }
  } else if (weather === "petals" || weather === "dust-motes") {
    for (const p of particles) {
      p.y = (p.y + p.vy * 1.2) % h;
      p.x = (p.x + Math.sin(timeSec + p.y * 0.02) * 0.8 + w) % w;
      ctx.fillStyle =
        weather === "petals"
          ? `rgba(255, 196, 214, ${p.alpha})`
          : `rgba(255, 244, 214, ${p.alpha * 0.65})`;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * 1.4, p.size * 0.8, timeSec, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (weather === "sunbeams" || weather === "warm-glow") {
    const beamGrad = ctx.createRadialGradient(
      w * 0.78,
      h * 0.18,
      20,
      w * 0.78,
      h * 0.18,
      w * 0.75
    );
    beamGrad.addColorStop(0, `${accentColor}44`);
    beamGrad.addColorStop(1, "transparent");
    ctx.fillStyle = beamGrad;
    ctx.fillRect(0, 0, w, h);
  } else if (weather === "steam") {
    for (const p of particles) {
      p.y = (p.y - p.vy * 1.4 + h) % h;
      p.x = (p.x + Math.sin(timeSec * 1.6 + p.y * 0.03) * 1.2 + w) % w;
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.25})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSceneElements(
  ctx: CanvasRenderingContext2D,
  scene: VideoSceneSpec,
  w: number,
  h: number,
  progress: number,
  timeSec: number
) {
  const skyTop = scene.skyTop || "#0F172A";
  const skyBottom = scene.skyBottom || "#3B82F6";
  const ground = scene.groundColor || "#1E293B";
  const accent = scene.accentColor || "#F59E0B";
  const sceneType = (scene.sceneType || "mountains").toLowerCase();

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(1, skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Sun / Moon orb
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(
    w * (0.25 + progress * 0.12),
    h * 0.28,
    Math.min(w, h) * 0.08,
    0,
    Math.PI * 2
  );
  ctx.fill();

  const shiftX =
    scene.cameraMove === "pan-left"
      ? -progress * 50
      : scene.cameraMove === "pan-right"
        ? progress * 50
        : 0;

  if (sceneType === "city") {
    ctx.fillStyle = ground;
    const buildingCount = 14;
    const bw = w / buildingCount + 8;
    for (let i = -1; i <= buildingCount; i++) {
      const bh = h * (0.28 + ((i * 37) % 5) * 0.08);
      const bx = i * (w / buildingCount) + shiftX * 0.5;
      ctx.fillRect(bx, h - bh, bw, bh);
      ctx.fillStyle = `${accent}AA`;
      for (let wy = h - bh + 20; wy < h - 40; wy += 28) {
        for (let wx = bx + 10; wx < bx + bw - 14; wx += 18) {
          if ((wx + wy) % 3 !== 0) {
            ctx.fillRect(wx, wy, 8, 12);
          }
        }
      }
      ctx.fillStyle = ground;
    }
  } else if (sceneType === "ocean") {
    ctx.fillStyle = ground;
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.strokeStyle = `${accent}77`;
    ctx.lineWidth = 3;
    for (let r = 0; r < 6; r++) {
      const y = h * 0.67 + r * 34;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 24) {
        const waveY = y + Math.sin(x * 0.015 + timeSec * 2.5 + r) * 7;
        if (x === 0) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }
  } else if (sceneType === "coffee") {
    ctx.fillStyle = ground;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(w * 0.42, h * 0.48, w * 0.16, h * 0.24, 24);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(w * 0.58, h * 0.59, 26, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  } else if (sceneType === "forest") {
    ctx.fillStyle = `${ground}AA`;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    const treeCount = 16;
    for (let i = -1; i <= treeCount; i++) {
      const tx = i * (w / treeCount) + shiftX * 0.6;
      const th = h * (0.24 + ((i * 19) % 4) * 0.05);
      ctx.fillStyle = i % 2 === 0 ? ground : `${ground}CC`;
      ctx.beginPath();
      ctx.moveTo(tx, h * 0.75 - th);
      ctx.lineTo(tx - 46, h * 0.75);
      ctx.lineTo(tx + 46, h * 0.75);
      ctx.closePath();
      ctx.fill();
    }
  } else if (sceneType === "desert") {
    // Smooth rolling sand dunes
    ctx.fillStyle = `${ground}AA`;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 40; x += 24) {
      const y = h * 0.62 + Math.sin((x + shiftX * 0.5) * 0.008) * (h * 0.08);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = ground;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 40; x += 24) {
      const y = h * 0.76 + Math.cos((x + shiftX) * 0.01) * (h * 0.07);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  } else if (sceneType === "abstract") {
    for (let i = 0; i < 5; i++) {
      const cx = w * (0.2 + i * 0.16) + Math.sin(timeSec + i) * 30;
      const cy = h * (0.5 + Math.cos(timeSec * 0.8 + i) * 0.12);
      ctx.fillStyle = i % 2 === 0 ? `${accent}44` : `${ground}66`;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(w, h) * (0.14 + (i % 3) * 0.05), 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Layered mountains
    ctx.fillStyle = `${ground}AA`;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 40; x += 40) {
      const peak =
        h * 0.55 -
        Math.abs(Math.sin((x + shiftX * 0.4) * 0.0045)) * (h * 0.22);
      ctx.lineTo(x, peak);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = ground;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 40; x += 40) {
      const peak =
        h * 0.72 -
        Math.abs(Math.cos((x + shiftX) * 0.006)) * (h * 0.18);
      ctx.lineTo(x, peak);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCaptionOverlay(
  ctx: CanvasRenderingContext2D,
  caption: string,
  w: number,
  h: number
) {
  if (!caption.trim()) return;
  const scrim = ctx.createLinearGradient(0, h * 0.72, 0, h);
  scrim.addColorStop(0, "transparent");
  scrim.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  ctx.fillStyle = "#FFFFFF";
  ctx.font =
    "600 30px 'Plus Jakarta Sans', 'Noto Sans Ethiopic', 'Noto Sans Arabic', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(caption, w / 2, h - 38, w - 96);
  ctx.textAlign = "start";
}

function getSupportedMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const m of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(m)
    ) {
      return m;
    }
  }
  return "video/webm";
}

export async function renderTextVideoToBlobUrl(
  script: TextVideoScript,
  aspectRatio: "16:9" | "9:16"
): Promise<string> {
  const width = aspectRatio === "9:16" ? 540 : 960;
  const height = aspectRatio === "9:16" ? 960 : 540;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable.");

  const scenes =
    script.scenes && script.scenes.length > 0
      ? script.scenes
      : [
          {
            durationSec: 6,
            sceneType: "mountains",
            skyTop: "#0F172A",
            skyBottom: "#EA580C",
            groundColor: "#1E293B",
            accentColor: "#FBBF24",
            weather: "sunbeams",
            cameraMove: "zoom-in",
            caption: script.summary || "",
          },
        ];

  const particles = createParticles(55, width, height);
  const fps = 30;
  const stream = canvas.captureStream(fps);
  const mimeType = getSupportedMimeType();
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 2500000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const totalSec = scenes.reduce((acc, s) => acc + (s.durationSec ?? 2), 0);

  return new Promise<string>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("Video recording failed."));
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(URL.createObjectURL(blob));
    };

    recorder.start(100);
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      if (elapsed >= totalSec) {
        recorder.stop();
        return;
      }

      let accum = 0;
      let activeScene = scenes[scenes.length - 1];
      let sceneProgress = 1;
      for (const s of scenes) {
        const d = s.durationSec ?? 2;
        if (elapsed <= accum + d) {
          activeScene = s;
          sceneProgress = (elapsed - accum) / d;
          break;
        }
        accum += d;
      }

      ctx.save();
      const zoom =
        activeScene.cameraMove === "zoom-out"
          ? 1.12 - sceneProgress * 0.1
          : 1.0 + sceneProgress * 0.1;
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      drawSceneElements(ctx, activeScene, width, height, sceneProgress, elapsed);
      ctx.restore();

      drawWeather(
        ctx,
        activeScene.weather || "none",
        particles,
        width,
        height,
        elapsed,
        activeScene.accentColor || "#F59E0B"
      );
      drawCaptionOverlay(ctx, activeScene.caption || "", width, height);

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  });
}

export async function renderPhotoVideoToBlobUrl(
  photoDataUrl: string,
  choreography: PhotoChoreography,
  aspectRatio: "16:9" | "9:16",
  durationStr: string
): Promise<string> {
  const width = aspectRatio === "9:16" ? 540 : 960;
  const height = aspectRatio === "9:16" ? 960 : 540;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable.");

  const img = new Image();
  img.src = photoDataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not load photo."));
  });

  const totalSec = Math.max(4, Math.min(10, parseInt(durationStr, 10) || 6));
  const particles = createParticles(50, width, height);
  const fps = 30;
  const stream = canvas.captureStream(fps);
  const mimeType = getSupportedMimeType();
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 2800000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const zStart = choreography.zoomStart ?? 1.02;
  const zEnd = choreography.zoomEnd ?? 1.18;
  const panX = choreography.panX ?? 0.03;
  const panY = choreography.panY ?? -0.02;

  const imgRatio = img.width / img.height;
  const canvasRatio = width / height;
  const baseW = imgRatio > canvasRatio ? height * imgRatio : width;
  const baseH = imgRatio > canvasRatio ? height : width / imgRatio;

  return new Promise<string>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("Video recording failed."));
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(URL.createObjectURL(blob));
    };

    recorder.start(100);
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      if (elapsed >= totalSec) {
        recorder.stop();
        return;
      }
      const p = elapsed / totalSec;
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

      const scale = zStart + (zEnd - zStart) * ease;
      const offsetX = panX * width * (ease - 0.5);
      const offsetY = panY * height * (ease - 0.5);

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
      ctx.restore();

      drawWeather(
        ctx,
        choreography.atmosphere || "sunbeams",
        particles,
        width,
        height,
        elapsed,
        "#FBBF24"
      );

      if (choreography.caption) {
        drawCaptionOverlay(ctx, choreography.caption, width, height);
      }

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  });
}
