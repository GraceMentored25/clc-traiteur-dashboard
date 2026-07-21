/**
 * Vérifie le bandeau PDF dans Chromium (même pipeline que le navigateur).
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const JSPDF_PATH = "/workspace/clc-traiteur-pos/node_modules/jspdf/dist/jspdf.umd.min.js";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(BASE, { waitUntil: "domcontentloaded" });

const fetchCheck = await page.evaluate(async () => {
  const res = await fetch("/sections/aperitif.png");
  const blob = await res.blob();
  return { ok: res.ok, status: res.status, type: blob.type, size: blob.size };
});

if (!fetchCheck.ok || !fetchCheck.type.includes("image")) {
  console.error("FAIL fetch /sections:", fetchCheck);
  process.exit(1);
}
console.log("OK fetch /sections:", fetchCheck);

await page.addScriptTag({ path: JSPDF_PATH });

const pdfBase64 = await page.evaluate(async () => {
  const AMBER = [232, 150, 12];
  const PX_PER_MM = 8;
  const base = window.location.origin;

  async function buildSectionBandDataUrl(photoPath, pageWidthMm, bandHeightMm, title, subtotalText) {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("photo load failed"));
      el.src = `${base}${photoPath}`;
    });
    const w = Math.round(pageWidthMm * PX_PER_MM);
    const h = Math.round(bandHeightMm * PX_PER_MM);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#101216";
    ctx.fillRect(0, 0, w, h);
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    ctx.fillStyle = "rgba(16, 18, 22, 0.42)";
    ctx.fillRect(0, 0, w, h);
    const stripeW = Math.round(3.5 * PX_PER_MM);
    ctx.fillStyle = `rgb(${AMBER[0]}, ${AMBER[1]}, ${AMBER[2]})`;
    ctx.fillRect(0, 0, stripeW, h);
    const textY = h / 2;
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.round(4.2 * PX_PER_MM)}px Helvetica, Arial, sans-serif`;
    ctx.fillText(title.toUpperCase(), stripeW + Math.round(2 * PX_PER_MM), textY);
    ctx.font = `${Math.round(3.2 * PX_PER_MM)}px Helvetica, Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText(subtotalText, w - Math.round(2 * PX_PER_MM), textY);
    return canvas.toDataURL("image/png");
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const bandH = 18;
  const y = 40;
  const bandUrl = await buildSectionBandDataUrl(
    "/sections/aperitif.png",
    W,
    bandH,
    "Vin d'honneur",
    "Sous-total HT : 72.00 €",
  );
  if (!bandUrl) throw new Error("bandUrl null");
  doc.addImage(bandUrl, "PNG", 0, y, W, bandH);
  return doc.output("datauristring").split(",")[1];
});

await browser.close();

writeFileSync("/tmp/verify-band.pdf", Buffer.from(pdfBase64, "base64"));
execSync("pdftoppm -png -r 200 -f 1 -l 1 /tmp/verify-band.pdf /tmp/verify-band");
execSync("ffmpeg -y -i /tmp/verify-band-1.png -f rawvideo -pix_fmt rgb24 /tmp/verify-band.raw", { stdio: "pipe" });

const [imgW, imgH] = execSync(
  "ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 /tmp/verify-band-1.png",
)
  .toString()
  .trim()
  .split(",")
  .map(Number);

const raw = readFileSync("/tmp/verify-band.raw");
const mm = (m) => Math.round((m / 25.4) * 200);
const y0 = mm(40);
const bh = mm(18);
const px = (x, y) => {
  const i = (y * imgW + x) * 3;
  return [raw[i], raw[i + 1], raw[i + 2]];
};

let whiteTop = 0;
let stripeOk = false;
let photoOk = false;
let stripeArtifact = false;

for (let dy = 0; dy < Math.min(4, bh); dy++) {
  const yy = y0 + dy;
  const left = px(0, yy);
  const mid = px(Math.floor(imgW / 2), yy);
  if (left[0] > 245 && left[1] > 245 && left[2] > 245 && mid[0] > 245) whiteTop++;
}

const yyMid = y0 + Math.floor(bh / 2);
if (px(0, yyMid)[0] > 200 && px(0, yyMid)[1] > 120 && px(0, yyMid)[2] < 80) stripeOk = true;
const mid = px(Math.floor(imgW / 2), yyMid);
if (mid[0] + mid[1] + mid[2] < 500 && mid[0] < 240) photoOk = true;

let flips = 0;
let prev = px(100, yyMid)[0];
for (let x = 101; x < imgW - 100; x += 2) {
  const v = px(x, yyMid)[0];
  if (Math.abs(v - prev) > 80) flips++;
  prev = v;
}
if (flips > imgW * 0.15) stripeArtifact = true;

console.log({ imgW, imgH, whiteTop, stripeOk, photoOk, stripeArtifact, flips });

if (whiteTop > 0) {
  console.error("FAIL: white gap at top of band");
  process.exit(1);
}
if (!stripeOk || !photoOk) {
  console.error("FAIL: missing amber stripe or photo");
  process.exit(1);
}
if (stripeArtifact) {
  console.error("FAIL: vertical stripe artifacts");
  process.exit(1);
}

execSync(
  "ffmpeg -y -i /tmp/verify-band-1.png -vf crop=iw:120:0:220 /opt/cursor/artifacts/screenshots/verify-band-browser.png",
  { stdio: "pipe" },
);
console.log("PASS: browser PDF band verified");
