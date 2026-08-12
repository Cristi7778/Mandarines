// lib/char-recognition.ts
// Character recognition for Step 6 (Writing Practice).
// Tries ONNX model from /models/recognizer.onnx first;
// falls back to visual template matching using canvas font rendering.

type OrtSession = import('onnxruntime-web').InferenceSession;
type OrtModule = typeof import('onnxruntime-web');

let ort: OrtModule | null = null;
let session: OrtSession | null = null;
let classes: string[] | null = null;
let attempted = false;

export async function loadModel(): Promise<boolean> {
  if (attempted) return session !== null;
  attempted = true;
  try {
    const ortMod = await import('onnxruntime-web');
    // Point WASM loader at the matching CDN version so Next.js doesn't need to bundle the workers.
    ortMod.env.wasm.wasmPaths =
      `https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/`;
    session = await ortMod.InferenceSession.create('/models/recognizer.onnx');
    const resp = await fetch('/models/classes.json');
    if (!resp.ok) throw new Error('classes.json missing');
    classes = (await resp.json()) as string[];
    ort = ortMod;
    return true;
  } catch {
    session = null;
    return false;
  }
}

// Returns the bounding box of dark pixels (< 200 grey) in raw RGBA data.
function getBBox(data: Uint8ClampedArray, w: number, h: number) {
  let x0 = w, x1 = 0, y0 = h, y1 = 0, found = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if ((data[i]! + data[i + 1]! + data[i + 2]!) / 3 < 200) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
        found = true;
      }
    }
  }
  return found ? { x0, x1, y0, y1 } : null;
}

// Converts a canvas to a 64×64 Float32Array (1=dark, 0=light), cropped to content.
function toNorm(canvas: HTMLCanvasElement): Float32Array {
  const SIZE = 64;
  const ctx = canvas.getContext('2d')!;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bb = getBBox(data, canvas.width, canvas.height);

  const tmp = document.createElement('canvas');
  tmp.width = SIZE;
  tmp.height = SIZE;
  const tctx = tmp.getContext('2d')!;
  tctx.fillStyle = 'white';
  tctx.fillRect(0, 0, SIZE, SIZE);

  if (bb) {
    const pad = 4;
    const sx = Math.max(0, bb.x0 - pad);
    const sy = Math.max(0, bb.y0 - pad);
    const sw = Math.min(canvas.width, bb.x1 + pad + 1) - sx;
    const sh = Math.min(canvas.height, bb.y1 + pad + 1) - sy;
    tctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, SIZE, SIZE);
  } else {
    tctx.drawImage(canvas, 0, 0, SIZE, SIZE);
  }

  const px = tctx.getImageData(0, 0, SIZE, SIZE).data;
  const out = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    out[i] = 1 - (px[i * 4]! + px[i * 4 + 1]! + px[i * 4 + 2]!) / (3 * 255);
  }
  return out;
}

// Renders a Chinese character to a 64×64 binary image using font rendering.
function renderTemplate(char: string): Float32Array {
  const SIZE = 64;
  const tmp = document.createElement('canvas');
  tmp.width = SIZE;
  tmp.height = SIZE;
  const ctx = tmp.getContext('2d')!;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = 'black';
  ctx.font = `${Math.round(SIZE * 0.72)}px "Noto Sans SC","PingFang SC","Microsoft YaHei",SimSun,sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, SIZE / 2, SIZE / 2);
  return toNorm(tmp);
}

// Morphological dilation: expand each dark pixel by `radius` in all directions.
// This makes the comparison tolerant of stroke-width and small position differences.
function dilate(img: Float32Array, size = 64, radius = 3): Float32Array {
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (img[y * size + x]! > 0.35) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = y + dy, nx = x + dx;
            if (ny >= 0 && ny < size && nx >= 0 && nx < size) {
              out[ny * size + nx] = 1;
            }
          }
        }
      }
    }
  }
  return out;
}

// IoU after dilating both images so stroke-width / slight-offset differences don't penalise.
function iou(a: Float32Array, b: Float32Array): number {
  const da = dilate(a);
  const db = dilate(b);
  let inter = 0, union = 0;
  for (let i = 0; i < da.length; i++) {
    const av = da[i]! > 0.5;
    const bv = db[i]! > 0.5;
    if (av && bv) inter++;
    if (av || bv) union++;
  }
  return union === 0 ? 0 : inter / union;
}

async function onnxPredict(canvas: HTMLCanvasElement): Promise<string | null> {
  if (!session || !classes || !ort) return null;
  try {
    const { Tensor } = ort;
    const pixels = toNorm(canvas);
    const t = new Tensor('float32', pixels, [1, 1, 64, 64]);
    const res = await session.run({ [session.inputNames[0]!]: t });
    const out = res[session.outputNames[0]!]!.data as Float32Array;
    let best = 0;
    for (let i = 1; i < out.length; i++) {
      if (out[i]! > out[best]!) best = i;
    }
    return classes[best] ?? null;
  } catch {
    return null;
  }
}

export type RecognitionResult = {
  method: 'onnx' | 'template';
  predicted: string | null;
  score: number; // 0–1
  correct: boolean;
};

export async function recognizeChar(
  canvas: HTMLCanvasElement,
  expectedChar: string,
): Promise<RecognitionResult> {
  // ONNX path
  if (session) {
    const predicted = await onnxPredict(canvas);
    if (predicted !== null) {
      const correct = predicted === expectedChar;
      return { method: 'onnx', predicted, score: correct ? 1 : 0, correct };
    }
  }
  // Template-matching fallback
  const drawn = toNorm(canvas);
  // Reject blank canvas (fewer than 80 dark pixels in the 64×64 normalised image)
  const inkPixels = drawn.reduce((s, v) => s + (v > 0.35 ? 1 : 0), 0);
  if (inkPixels < 80) {
    return { method: 'template', predicted: null, score: 0, correct: false };
  }
  const template = renderTemplate(expectedChar);
  const score = iou(drawn, template);
  const correct = score > 0.18;
  return {
    method: 'template',
    predicted: correct ? expectedChar : null,
    score,
    correct,
  };
}
