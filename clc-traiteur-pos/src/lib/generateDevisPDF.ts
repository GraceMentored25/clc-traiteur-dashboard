import { Devis, DevisItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { DISHES } from "@/lib/data/dishes";
import { ALL_KNOWN_CATEGORIES, SUBSECTION_MAP } from "@/lib/data/subsections";

/** Palette Ébène & Cuivre */
const COPPER: [number, number, number] = [196, 120, 58];
const COPPER_LIGHT: [number, number, number] = [224, 160, 102];
const EBONY: [number, number, number] = [26, 20, 16];
const COCOA: [number, number, number] = [44, 33, 24];
const IVORY: [number, number, number] = [248, 244, 238];
const PARCHMENT: [number, number, number] = [239, 232, 220];
const INK: [number, number, number] = [31, 26, 22];
const MUTED: [number, number, number] = [107, 94, 82];
const LINE: [number, number, number] = [217, 206, 191];
const LEAF: [number, number, number] = [61, 92, 69];
const WHITE: [number, number, number] = [255, 255, 255];

const KNOWN_CATS = new Set(ALL_KNOWN_CATEGORIES);
const DISH_CATEGORY = new Map<number, string>(DISHES.map((d) => [d.id, d.category]));
const itemCategory = (item: DevisItem) => DISH_CATEGORY.get(item.dishId) ?? "";

/** Sous-titres à ne pas afficher dans le PDF (ex: plats principaux) */
function shouldHideSubTitle(label: string): boolean {
  return /plats principaux/i.test(label);
}

type BodyCell = string | { content: string; colSpan: number; styles: Record<string, unknown> };

function pushItems(body: BodyCell[][], items: DevisItem[]) {
  for (const it of items) {
    // Lignes : Prestation + Nb. convives uniquement (pas de sous-total ligne)
    body.push([it.dishName, String(it.quantity)]);
  }
}

function pushSubTabTitle(body: BodyCell[][], label: string) {
  body.push([{
    content: label.toUpperCase(),
    colSpan: 2,
    styles: {
      fillColor: PARCHMENT,
      textColor: LEAF,
      fontStyle: "bold",
      halign: "left",
      fontSize: 9,
      cellPadding: { top: 4, bottom: 3, left: 4, right: 4 },
    },
  }]);
}

function pushSubTitle(body: BodyCell[][], label: string) {
  body.push([{
    content: label.toUpperCase(),
    colSpan: 2,
    styles: {
      fillColor: IVORY,
      textColor: MUTED,
      fontStyle: "bold",
      halign: "left",
      fontSize: 8,
      cellPadding: { top: 3, bottom: 2, left: 4, right: 4 },
    },
  }]);
}

/**
 * Corps du tableau : sous-onglet → sous-titre (sauf plats principaux) → lignes.
 */
function buildCategorizedBody(items: DevisItem[]): BodyCell[][] {
  const body: BodyCell[][] = [];
  let anyGroup = false;

  for (const sub of SUBSECTION_MAP) {
    const subItems = items.filter((i) => sub.categories.includes(itemCategory(i)));
    if (!subItems.length) continue;
    anyGroup = true;
    pushSubTabTitle(body, sub.label);

    if (sub.subGroups) {
      for (const sg of sub.subGroups) {
        const sgItems = subItems.filter((i) => sg.categories.includes(itemCategory(i)));
        if (!sgItems.length) continue;
        if (!shouldHideSubTitle(sg.label)) pushSubTitle(body, sg.label);
        pushItems(body, sgItems);
      }
    } else {
      pushItems(body, subItems);
    }
  }

  const others = items.filter((i) => !KNOWN_CATS.has(itemCategory(i)));
  if (others.length) {
    if (anyGroup) pushSubTabTitle(body, "Autres");
    pushItems(body, others);
  }

  if (!body.length) pushItems(body, items);
  return body;
}

function sectionImageKey(label: string): string {
  const s = label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/(vin d.?honneur|aperitif|apero|cocktail|after)/.test(s)) return "aperitif";
  if (/(dessert|gateau|gouter|douceur)/.test(s)) return "dessert";
  if (/(cafe|pause|viennoiserie|petit.?dejeuner)/.test(s)) return "cafe";
  if (/(buffet|brunch|dejeuner)/.test(s)) return "buffet";
  if (/(diner|dinner|soiree|gala|repas|reception|rencontre)/.test(s)) return "diner";
  return "generique";
}

async function loadImageElement(path: string): Promise<HTMLImageElement> {
  const url = path.startsWith("http") ? path : `${window.location.origin}${path}`;
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`image load failed: ${path}`));
    el.src = url;
  });
}

/**
 * Bandeau section rasterisé (photo cover + voile ébène + liseré cuivre + textes).
 */
async function buildSectionBandDataUrl(
  photoPath: string,
  pageWidthMm: number,
  bandHeightMm: number,
  title: string,
  subtotalText: string,
): Promise<string | null> {
  const PX_PER_MM = 8;
  try {
    const img = await loadImageElement(photoPath);
    const w = Math.round(pageWidthMm * PX_PER_MM);
    const h = Math.round(bandHeightMm * PX_PER_MM);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#1a1410";
    ctx.fillRect(0, 0, w, h);

    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);

    ctx.fillStyle = "rgba(26, 20, 16, 0.72)";
    ctx.fillRect(0, 0, w, h);

    const stripeW = Math.round(3.5 * PX_PER_MM);
    ctx.fillStyle = `rgb(${COPPER[0]}, ${COPPER[1]}, ${COPPER[2]})`;
    ctx.fillRect(0, 0, stripeW, h);

    const textY = h / 2;
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = `600 ${Math.round(5 * PX_PER_MM)}px Georgia, "Times New Roman", serif`;
    ctx.fillText(title, stripeW + Math.round(3 * PX_PER_MM), textY);
    ctx.font = `500 ${Math.round(3 * PX_PER_MM)}px Helvetica, Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fillText(subtotalText, w - Math.round(3 * PX_PER_MM), textY);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/** En-tête hero full-bleed (logo + marque + n° devis) */
async function buildHeroDataUrl(
  pageWidthMm: number,
  heroHeightMm: number,
  devisId: string,
  now: string,
  status: string,
  logo: { data: string; w: number; h: number } | null,
): Promise<string | null> {
  const PX_PER_MM = 8;
  try {
    const img = await loadImageElement("/sections/diner.png");
    const w = Math.round(pageWidthMm * PX_PER_MM);
    const h = Math.round(heroHeightMm * PX_PER_MM);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#1a1410";
    ctx.fillRect(0, 0, w, h);
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "rgba(26,20,16,0.94)");
    grad.addColorStop(0.48, "rgba(26,20,16,0.72)");
    grad.addColorStop(1, "rgba(44,33,24,0.55)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const pad = Math.round(10 * PX_PER_MM);
    let textX = pad;

    if (logo) {
      const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("logo"));
        el.src = logo.data;
      });
      const logoH = Math.round(18 * PX_PER_MM);
      const logoW = (logo.w / logo.h) * logoH;
      const logoY = (h - logoH) / 2;
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      roundRect(ctx, pad - 4, logoY - 4, logoW + 8, logoH + 8, 8);
      ctx.fill();
      ctx.drawImage(logoImg, pad, logoY, logoW, logoH);
      textX = pad + logoW + Math.round(5 * PX_PER_MM);
    }

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.round(6.2 * PX_PER_MM)}px Georgia, "Times New Roman", serif`;
    ctx.fillText(CLC.nom, textX, h * 0.38);
    ctx.font = `300 ${Math.round(2.8 * PX_PER_MM)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillText(CLC.sousTitre, textX, h * 0.58);

    ctx.textAlign = "right";
    const rightX = w - pad;
    ctx.fillStyle = `rgb(${COPPER_LIGHT[0]}, ${COPPER_LIGHT[1]}, ${COPPER_LIGHT[2]})`;
    ctx.font = `600 ${Math.round(2.4 * PX_PER_MM)}px Helvetica, Arial, sans-serif`;
    ctx.fillText("DEVIS", rightX, h * 0.28);
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 ${Math.round(5.5 * PX_PER_MM)}px Georgia, "Times New Roman", serif`;
    ctx.fillText(devisId, rightX, h * 0.48);
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = `400 ${Math.round(2.6 * PX_PER_MM)}px Helvetica, Arial, sans-serif`;
    ctx.fillText(`Émis le ${now} · ${status}`, rightX, h * 0.68);

    // liseré cuivre bas
    ctx.fillStyle = `rgb(${COPPER[0]}, ${COPPER[1]}, ${COPPER[2]})`;
    ctx.fillRect(0, h - Math.round(1.2 * PX_PER_MM), w, Math.round(1.2 * PX_PER_MM));

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const CLC = {
  nom: "C.LC. Traiteur",
  sousTitre: "Chez La Camerounaise — Traiteur événementiel",
  adresse: "12 Rue des Saveurs, 75010 Paris",
  tel: "+33 6 12 34 56 78",
  email: "contact@clctraiteur.fr",
  siret: "123 456 789 00012",
  tva: "FR 12 123456789",
};

function getAcompteInfo(totalTTC: number, eventDate: string) {
  const pct = totalTTC < 2000 ? 15 : 20;
  const montant = totalTTC * (pct / 100);
  const event = new Date(eventDate);
  const now = new Date();
  const diffMonths = (event.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const monthsBefore = diffMonths < 4 ? 3 : 6;
  const deadline = new Date(event);
  deadline.setMonth(deadline.getMonth() - monthsBefore);
  return { pct, montant, deadlineStr: deadline.toLocaleDateString("fr-FR"), monthsBefore };
}

async function loadLogo(): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch("/logo.png");
    const blob = await res.blob();
    const data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    const { w, h } = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = data;
    });
    return { data, w, h };
  } catch {
    return null;
  }
}

function drawIvoryPageBg(doc: InstanceType<typeof import("jspdf").jsPDF>, W: number, pageH: number) {
  doc.setFillColor(...IVORY);
  doc.rect(0, 0, W, pageH, "F");
}

function drawTotalsBox(
  doc: InstanceType<typeof import("jspdf").jsPDF>,
  devis: Devis,
  totalsLeft: number,
  tY: number,
  R: number,
) {
  const rowH = 8;
  const totalsW = R - totalsLeft;
  doc.setFillColor(...COCOA);
  doc.roundedRect(totalsLeft, tY, totalsW, rowH * 3 + 8, 1.5, 1.5, "F");
  doc.setFillColor(...COPPER);
  doc.rect(totalsLeft, tY, totalsW, 1.2, "F");

  const tLabelX = totalsLeft + 5;
  const tValueX = R - 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(220, 210, 200);
  doc.text("Sous-total HT", tLabelX, tY + rowH + 1);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text(`${devis.totalHT.toFixed(2)} €`, tValueX, tY + rowH + 1, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(220, 210, 200);
  doc.text("TVA (20%)", tLabelX, tY + rowH * 2 + 1);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text(`${(devis.totalTTC - devis.totalHT).toFixed(2)} €`, tValueX, tY + rowH * 2 + 1, { align: "right" });

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  // soft divider
  doc.setDrawColor(120, 100, 80);
  doc.line(tLabelX, tY + rowH * 2 + 4, tValueX, tY + rowH * 2 + 4);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("TOTAL TTC", tLabelX, tY + rowH * 3 + 5);
  doc.setTextColor(...COPPER_LIGHT);
  doc.text(`${devis.totalTTC.toFixed(2)} €`, tValueX, tY + rowH * 3 + 5, { align: "right" });

  return tY + rowH * 3 + 10;
}

export async function generateDevisPDF(devis: Devis) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const L = 14;
  const R = W - 14;
  const now = new Date().toLocaleDateString("fr-FR");
  const { pct, montant, deadlineStr, monthsBefore } = getAcompteInfo(devis.totalTTC, devis.eventDate);

  const logo = await loadLogo();
  const pageH = doc.internal.pageSize.getHeight();
  const footerReserve = 14;

  drawIvoryPageBg(doc, W, pageH);

  // ── EN-TÊTE HERO ─────────────────────────────────────────────────────────
  const heroH = 42;
  const heroUrl = await buildHeroDataUrl(W, heroH, devis.id, now, devis.status, logo);
  if (heroUrl) {
    doc.addImage(heroUrl, "PNG", 0, 0, W, heroH);
  } else {
    doc.setFillColor(...EBONY);
    doc.rect(0, 0, W, heroH, "F");
    doc.setFillColor(...COPPER);
    doc.rect(0, heroH - 1.2, W, 1.2, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(17);
    doc.setFont("helvetica", "bold");
    doc.text(CLC.nom, L, 18);
    doc.setFontSize(14);
    doc.text(`DEVIS ${devis.id}`, R, 18, { align: "right" });
  }

  // ── CLIENT / ÉVÉNEMENT ───────────────────────────────────────────────────
  const infoY = heroH + 10;
  const boxH = 32;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.35);
  doc.setFillColor(255, 255, 255);
  doc.rect(L, infoY, R - L, boxH, "FD");
  doc.line(W / 2, infoY, W / 2, infoY + boxH);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COPPER);
  doc.text("CLIENT", L + 5, infoY + 7);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...EBONY);
  doc.text(devis.clientName, L + 5, infoY + 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(devis.clientPhone, L + 5, infoY + 23);

  const evX = W / 2 + 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COPPER);
  doc.text("ÉVÉNEMENT", evX, infoY + 7);

  const evRows: [string, string][] = [
    ["Type", devis.eventType],
    ["Date", formatDate(devis.eventDate)],
    ["Convives", `${devis.guestCount} personnes`],
  ];
  evRows.forEach(([label, val], i) => {
    const y = infoY + 14 + i * 5.5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(label, evX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(val, evX + 22, y);
  });

  // ── TABLEAU PRESTATIONS ──────────────────────────────────────────────────
  const tableY = infoY + boxH + 12;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...EBONY);
  doc.text("Détail des prestations", L, tableY - 4);

  const TW = R - L;
  // 2 colonnes : Prestation + Nb. convives (sous-total uniquement sur le bandeau de section)
  const QTY_W = 36;
  const PRE_W = TW - QTY_W;

  const colStyles = {
    0: { halign: "left" as const, cellWidth: PRE_W },
    1: { halign: "center" as const, cellWidth: QTY_W, valign: "middle" as const },
  };

  const tableCommon = {
    alternateRowStyles: { fillColor: PARCHMENT },
    columnStyles: colStyles,
    headStyles: {
      fillColor: COCOA,
      textColor: WHITE,
      fontStyle: "bold" as const,
      fontSize: 8,
      halign: "left" as const,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
    },
    didParseCell: (data: { column: { index: number }; cell: { styles: { halign?: string } } }) => {
      if (data.column.index === 1) data.cell.styles.halign = "center";
    },
    styles: {
      fontSize: 10,
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0.15,
      cellPadding: { top: 3.2, bottom: 3.2, left: 4, right: 4 },
    },
    margin: { left: L, right: L },
  };

  const hasSections = devis.items.some((i) => i.section);

  if (hasSections) {
    const sectionMap = new Map<string, typeof devis.items>();
    for (const item of devis.items) {
      const key = item.section ?? "Autres";
      if (!sectionMap.has(key)) sectionMap.set(key, []);
      sectionMap.get(key)!.push(item);
    }
    const sectionList = Array.from(sectionMap.entries()).map(([label, items]) => ({
      label,
      items,
      subtotal: items.reduce((s, i) => s + i.subtotal, 0),
    }));

    let currentY = tableY;
    const bandH = 18;
    const ensureSpace = (h: number) => {
      if (currentY + h > pageH - footerReserve) {
        doc.addPage();
        drawIvoryPageBg(doc, W, pageH);
        currentY = 14;
      }
    };

    for (const sec of sectionList) {
      ensureSpace(bandH + 28);
      const y = currentY;
      const key = sectionImageKey(sec.label);
      const bandUrl = await buildSectionBandDataUrl(
        `/sections/${key}.png`,
        W,
        bandH,
        sec.label,
        `Sous-total HT · ${sec.subtotal.toFixed(2)} €`,
      );
      if (bandUrl) {
        doc.addImage(bandUrl, "PNG", 0, y, W, bandH);
      } else {
        doc.setFillColor(...COCOA);
        doc.rect(0, y, W, bandH, "F");
        doc.setFillColor(...COPPER);
        doc.rect(0, y, 3.5, bandH, "F");
        doc.setTextColor(...WHITE);
        doc.setFontSize(13);
        doc.setFont("times", "bold");
        doc.text(sec.label, L + 2, y + 11);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Sous-total HT · ${sec.subtotal.toFixed(2)} €`, R, y + 11, { align: "right" });
      }
      currentY = y + bandH + 3;

      autoTable(doc, {
        startY: currentY,
        head: [["Prestation", "Nb. convives"]],
        body: buildCategorizedBody(sec.items) as never,
        ...(tableCommon as object),
      });

      currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    }

    // Totaux
    ensureSpace(40);
    const endY = drawTotalsBox(doc, devis, R - 78, currentY, R);
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY = endY;
  } else {
    autoTable(doc, {
      startY: tableY,
      head: [["Prestation", "Nb. convives"]],
      body: buildCategorizedBody(devis.items) as never,
      ...(tableCommon as object),
    });
  }

  const afterTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  if (!hasSections) {
    const endY = drawTotalsBox(doc, devis, R - 78, afterTable + 4, R);
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY = endY;
  }

  // ── NOTES + ACOMPTE ───────────────────────────────────────────────────────
  let currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  if (devis.notes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...EBONY);
    doc.text("Notes", L, currentY);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...MUTED);
    const noteLines = doc.splitTextToSize(devis.notes, R - L);
    doc.text(noteLines, L, currentY + 6);
    currentY += 6 + noteLines.length * 6 + 4;
  }

  const aY = currentY + 3;
  doc.setFillColor(...PARCHMENT);
  doc.roundedRect(L, aY, R - L, 28, 1.5, 1.5, "F");
  doc.setDrawColor(...COPPER);
  doc.setLineWidth(0.45);
  doc.roundedRect(L, aY, R - L, 28, 1.5, 1.5, "D");

  // Pastille %
  doc.setFillColor(...COPPER);
  doc.circle(L + 10, aY + 14, 5, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("%", L + 10, aY + 15.5, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...EBONY);
  doc.text(`Acompte de ${pct}% à la validation — ${montant.toFixed(2)} €`, L + 20, aY + 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(`Date limite : ${deadlineStr} (${monthsBefore} mois avant l'événement)`, L + 20, aY + 17);
  doc.text("En cas de rétractation après versement, l'acompte ne sera pas remboursé.", L + 20, aY + 23);

  // ── CGV + SIGNATURES → page 2 ────────────────────────────────────────────
  doc.addPage();
  drawIvoryPageBg(doc, W, pageH);
  const cgY = 18;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...EBONY);
  doc.text("Conditions générales de vente", L, cgY);
  doc.setFillColor(...COPPER);
  doc.rect(L, cgY + 2, 28, 0.8, "F");
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.setFontSize(9.5);
  const cg = [
    `• Devis valable 30 jours à compter du ${now}.`,
    `• Acompte de ${pct}% du TTC exigé à la signature pour confirmer la réservation.`,
    "• L'acompte est définitivement acquis en cas d'annulation par le client.",
    "• Annulation < 30 jours avant l'événement : la totalité du devis reste due.",
    "• Solde exigible au plus tard 7 jours avant la date de la prestation.",
    "• Tout litige fera l'objet d'une tentative de résolution amiable préalable.",
  ];
  cg.forEach((line, i) => doc.text(line, L, cgY + 12 + i * 7, { maxWidth: R - L }));

  const sigY = cgY + 62;
  const needNewPage = sigY + 55 > pageH - footerReserve;
  if (needNewPage) {
    doc.addPage();
    drawIvoryPageBg(doc, W, pageH);
  }
  const sY = needNewPage ? 24 : sigY;
  const sigW = (R - L - 8) / 2;
  const sigH = 44;

  const drawSigBox = (x: number, title: string, subtitle: string, bottom: string) => {
    doc.setFillColor(...PARCHMENT);
    doc.roundedRect(x, sY, sigW, sigH, 1.5, 1.5, "F");
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, sY, sigW, sigH, 1.5, 1.5, "D");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...EBONY);
    doc.text(title, x + 4, sY + 7);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...MUTED);
    doc.text(subtitle, x + 4, sY + 13);
    doc.setDrawColor(...COPPER);
    doc.setLineWidth(0.4);
    doc.roundedRect(x + 4, sY + 16, sigW - 8, 20, 1, 1, "D");
    doc.setFontSize(9);
    doc.setTextColor(180, 170, 160);
    doc.text("Signer ici", x + 4 + (sigW - 8) / 2, sY + 27, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(bottom, x + 4, sY + 40);
  };

  drawSigBox(L, "Signature du client", "Précédée de « Bon pour accord »", devis.clientName);
  drawSigBox(L + sigW + 8, "Signature C.LC. Traiteur", "Représentant(e) autorisé(e)", "Chez La Camerounaise");

  // ── PIED DE PAGE ─────────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const fY = doc.internal.pageSize.getHeight() - 7;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(L, fY - 4, R, fY - 4);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(`${CLC.nom} — SIRET : ${CLC.siret} — TVA : ${CLC.tva} — ${CLC.adresse}`, L, fY);
    doc.text(`Devis ${devis.id} · Page ${i}/${pages}`, R, fY, { align: "right" });
  }

  doc.save(`${devis.id} - ${devis.clientName}.pdf`);
}
