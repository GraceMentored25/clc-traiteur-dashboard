export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type { Devis, DevisItem } from "@/lib/types";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, HeadingLevel,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  convertInchesToTwip, VerticalAlign,
} from "docx";

const MOIS = ["","janvier","février","mars","avril","mai","juin",
              "juillet","août","septembre","octobre","novembre","décembre"];
function fmtDate(iso: string): string {
  try { const [y,m,d]=iso.split("-"); return `${parseInt(d)} ${MOIS[parseInt(m)]} ${y}`; }
  catch { return iso; }
}
function fmtMoney(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

// ── Couleurs ─────────────────────────────────────────────────────────────────
const C_DARK    = "062B20";
const C_GREEN   = "0A3D2D";
const C_GOLD    = "C99A43";
const C_IVORY   = "F8F4EC";
const C_MUTED   = "6C6A62";
const C_INK     = "15271F";
const C_TAN     = "E9D8B6";
const C_WHITE   = "FFFFFF";
const C_PARCH   = "EFE8DC";

// ── Helpers ───────────────────────────────────────────────────────────────────
interface Section { label: string; items: DevisItem[]; subtotal: number; }

function groupSections(items: DevisItem[]): Section[] {
  const map = new Map<string, DevisItem[]>();
  for (const item of items) {
    const key = item.section ?? "Prestation";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([label, its]) => ({
    label, items: its, subtotal: its.reduce((s,i) => s + i.quantity * i.unitPrice, 0),
  }));
}

function isService(dishName: string): boolean {
  const services = ["serveur","marmite","service de table","tente","chapiteau","chaise","déco","décoration","transport","livraison","sono","animation","photographe"];
  const n = dishName.toLowerCase();
  return services.some(s => n.includes(s));
}

// Paragraphe vide espaceur
function spacer(size = 6): Paragraph {
  return new Paragraph({ spacing: { before: size * 20, after: 0 }, children: [] });
}

// Trait de séparation doré
function hrGold(): Paragraph {
  return new Paragraph({
    border: { bottom: { color: C_GOLD, space: 1, style: BorderStyle.SINGLE, size: 12 } },
    spacing: { after: 0 },
    children: [],
  });
}

// ── Bandeau de section (fond vert sombre) ─────────────────────────────────────
function sectionBanner(label: string, subtitle?: string): Paragraph[] {
  const runs: TextRun[] = [
    new TextRun({ text: label.toUpperCase(), bold: true, color: C_WHITE, size: 26, font: "Georgia" }),
  ];
  if (subtitle) {
    runs.push(new TextRun({ text: `  —  ${subtitle}`, color: C_TAN, size: 20, font: "Calibri" }));
  }
  return [
    new Paragraph({
      shading: { type: ShadingType.SOLID, fill: C_DARK, color: C_DARK },
      border: { left: { color: C_GOLD, style: BorderStyle.SINGLE, size: 20, space: 0 } },
      spacing: { before: 120, after: 60 },
      indent: { left: convertInchesToTwip(0.15) },
      children: runs,
    }),
  ];
}

// ── Tableau de plats ──────────────────────────────────────────────────────────
function dishTable(items: DevisItem[], subtotal?: number): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        shading: { type: ShadingType.SOLID, fill: C_GREEN, color: C_GREEN },
        width: { size: 75, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          children: [new TextRun({ text: "Prestation", bold: true, color: C_WHITE, size: 18, font: "Calibri" })],
          spacing: { before: 60, after: 60 },
          indent: { left: 120 },
        })],
      }),
      new TableCell({
        shading: { type: ShadingType.SOLID, fill: C_GREEN, color: C_GREEN },
        width: { size: 25, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Nb. convives", bold: true, color: C_WHITE, size: 18, font: "Calibri" })],
          spacing: { before: 60, after: 60 },
        })],
      }),
    ],
  });

  const dataRows = items.map((item, idx) => new TableRow({
    children: [
      new TableCell({
        shading: { type: ShadingType.SOLID, fill: idx % 2 === 0 ? C_WHITE : C_PARCH, color: idx % 2 === 0 ? C_WHITE : C_PARCH },
        width: { size: 75, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          children: [new TextRun({ text: item.dishName, color: C_INK, size: 20, font: "Calibri" })],
          spacing: { before: 50, after: 50 },
          indent: { left: 120 },
        })],
      }),
      new TableCell({
        shading: { type: ShadingType.SOLID, fill: idx % 2 === 0 ? C_WHITE : C_PARCH, color: idx % 2 === 0 ? C_WHITE : C_PARCH },
        width: { size: 25, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: String(item.quantity), color: C_INK, size: 20, font: "Calibri" })],
          spacing: { before: 50, after: 50 },
        })],
      }),
    ],
  }));

  const rows: TableRow[] = [headerRow, ...dataRows];

  if (subtotal !== undefined) {
    rows.push(new TableRow({
      children: [
        new TableCell({
          shading: { type: ShadingType.SOLID, fill: C_PARCH, color: C_PARCH },
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Sous-total HT", color: C_MUTED, size: 18, font: "Calibri", italics: true })],
            spacing: { before: 50, after: 50 },
            indent: { right: 80 },
          })],
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, fill: C_PARCH, color: C_PARCH },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: fmtMoney(subtotal), bold: true, color: C_GREEN, size: 20, font: "Calibri" })],
            spacing: { before: 50, after: 50 },
          })],
        }),
      ],
    }));
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      left: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      right: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: C_TAN },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: C_TAN },
    },
  });
}

// ── Bloc totaux ───────────────────────────────────────────────────────────────
function totalsBlock(totalHT: number, totalTTC: number): Table {
  const rows = [
    { label: "Sous-total HT", value: fmtMoney(totalHT), bold: false },
    { label: "TVA (20%)", value: fmtMoney(totalTTC - totalHT), bold: false },
    { label: "TOTAL TTC", value: fmtMoney(totalTTC), bold: true },
  ];

  return new Table({
    width: { size: 50, type: WidthType.PERCENTAGE },
    columnWidths: [convertInchesToTwip(2.5), convertInchesToTwip(1.5)],
    rows: rows.map(r => new TableRow({
      children: [
        new TableCell({
          shading: { type: ShadingType.SOLID, fill: r.bold ? C_DARK : "2C2118", color: r.bold ? C_DARK : "2C2118" },
          children: [new Paragraph({
            children: [new TextRun({ text: r.label, color: r.bold ? C_WHITE : "DCD2C8", bold: r.bold, size: r.bold ? 22 : 18, font: "Calibri" })],
            spacing: { before: 60, after: 60 },
            indent: { left: 120 },
          })],
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, fill: r.bold ? C_DARK : "2C2118", color: r.bold ? C_DARK : "2C2118" },
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: r.value, color: r.bold ? C_GOLD : C_WHITE, bold: r.bold, size: r.bold ? 24 : 18, font: "Calibri" })],
            spacing: { before: 60, after: 60 },
            indent: { right: 120 },
          })],
        }),
      ],
    })),
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "4A3020" },
      insideVertical: { style: BorderStyle.NONE },
    },
  });
}

// ── Tableau récapitulatif sections ────────────────────────────────────────────
function recapSectionsTable(sections: Section[]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        shading: { type: ShadingType.SOLID, fill: C_DARK, color: C_DARK },
        children: [new Paragraph({ children: [new TextRun({ text: "N°", bold: true, color: C_WHITE, size: 18, font: "Calibri" })], spacing: { before: 60, after: 60 }, indent: { left: 80 } })],
      }),
      new TableCell({
        shading: { type: ShadingType.SOLID, fill: C_DARK, color: C_DARK },
        children: [new Paragraph({ children: [new TextRun({ text: "Prestation", bold: true, color: C_WHITE, size: 18, font: "Calibri" })], spacing: { before: 60, after: 60 }, indent: { left: 80 } })],
      }),
      new TableCell({
        shading: { type: ShadingType.SOLID, fill: C_DARK, color: C_DARK },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Sous-total HT", bold: true, color: C_WHITE, size: 18, font: "Calibri" })], spacing: { before: 60, after: 60 }, indent: { right: 80 } })],
      }),
    ],
  });

  const dataRows = sections.map((sec, i) => new TableRow({
    children: [
      new TableCell({
        shading: { type: ShadingType.SOLID, fill: i % 2 === 0 ? C_WHITE : C_PARCH },
        children: [new Paragraph({ children: [new TextRun({ text: String(i + 1), bold: true, color: C_GREEN, size: 18, font: "Calibri" })], spacing: { before: 50, after: 50 }, indent: { left: 80 } })],
      }),
      new TableCell({
        shading: { type: ShadingType.SOLID, fill: i % 2 === 0 ? C_WHITE : C_PARCH },
        children: [new Paragraph({ children: [new TextRun({ text: sec.label, color: C_INK, size: 20, font: "Calibri" })], spacing: { before: 50, after: 50 }, indent: { left: 80 } })],
      }),
      new TableCell({
        shading: { type: ShadingType.SOLID, fill: i % 2 === 0 ? C_WHITE : C_PARCH },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmtMoney(sec.subtotal), bold: true, color: C_GREEN, size: 20, font: "Calibri" })], spacing: { before: 50, after: 50 }, indent: { right: 80 } })],
      }),
    ],
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      left: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      right: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: C_TAN },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: C_TAN },
    },
  });
}

// ── Tableau prestations additionnelles ────────────────────────────────────────
function prestationsTable(serviceItems: DevisItem[]): Paragraph[] {
  const cats = [
    { keywords: ["serveur","personnel"], label: "Service & personnel" },
    { keywords: ["matériel","couvert","table","chaise","marmite"], label: "Location de matériel" },
    { keywords: ["livraison","transport"], label: "Livraison" },
    { keywords: ["décoration","déco","floral"], label: "Décoration" },
    { keywords: ["tente","chapiteau"], label: "Location de tente" },
    { keywords: ["animation","sono","musique","dj"], label: "Animation musicale" },
    { keywords: ["gâteau","photographe","photo"], label: "Gâteau & photo" },
  ];

  if (!serviceItems.length) {
    return [new Paragraph({
      children: [new TextRun({ text: "Aucune prestation additionnelle n'a été sélectionnée.", italics: true, color: C_MUTED, size: 20, font: "Calibri" })],
      spacing: { before: 80, after: 80 },
    })];
  }

  const rows: Paragraph[] = [];
  for (const cat of cats) {
    const matched = serviceItems.filter(i => cat.keywords.some(k => i.dishName.toLowerCase().includes(k)));
    if (!matched.length) continue;
    const total = matched.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const desc  = matched.map(i => `${i.quantity} × ${i.dishName}`).join(", ");
    rows.push(new Paragraph({
      shading: { type: ShadingType.SOLID, fill: C_IVORY, color: C_IVORY },
      spacing: { before: 40, after: 40 },
      indent: { left: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: C_TAN } },
      children: [
        new TextRun({ text: "✓ ", color: C_GREEN, bold: true, size: 18, font: "Calibri" }),
        new TextRun({ text: cat.label, bold: true, color: C_INK, size: 20, font: "Calibri" }),
        new TextRun({ text: `  —  ${desc}`, color: C_MUTED, size: 18, font: "Calibri" }),
        new TextRun({ text: `  ${fmtMoney(total)}`, bold: true, color: C_GREEN, size: 20, font: "Calibri" }),
      ],
    }));
  }

  // Services non catégorisés
  const others = serviceItems.filter(i => !cats.some(c => c.keywords.some(k => i.dishName.toLowerCase().includes(k))));
  for (const item of others) {
    rows.push(new Paragraph({
      shading: { type: ShadingType.SOLID, fill: C_IVORY, color: C_IVORY },
      spacing: { before: 40, after: 40 },
      indent: { left: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: C_TAN } },
      children: [
        new TextRun({ text: "✓ ", color: C_GREEN, bold: true, size: 18, font: "Calibri" }),
        new TextRun({ text: item.dishName, bold: true, color: C_INK, size: 20, font: "Calibri" }),
        new TextRun({ text: `  —  ${item.quantity} unité${item.quantity > 1 ? "s" : ""}`, color: C_MUTED, size: 18, font: "Calibri" }),
        new TextRun({ text: `  ${fmtMoney(item.quantity * item.unitPrice)}`, bold: true, color: C_GREEN, size: 20, font: "Calibri" }),
      ],
    }));
  }

  return rows;
}

// ── Signature box ─────────────────────────────────────────────────────────────
function signatureTable(clientName: string): Table {
  const sigCell = (title: string, name: string) => new TableCell({
    shading: { type: ShadingType.SOLID, fill: C_IVORY, color: C_IVORY },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      left: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      right: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
    },
    children: [
      new Paragraph({ children: [new TextRun({ text: title, bold: true, color: C_DARK, size: 20, font: "Calibri" })], spacing: { before: 80, after: 20 }, indent: { left: 80 } }),
      new Paragraph({ children: [new TextRun({ text: "Précédée de « Bon pour accord »", italics: true, color: C_MUTED, size: 16, font: "Calibri" })], spacing: { after: 80 }, indent: { left: 80 } }),
      new Paragraph({ border: { top: { style: BorderStyle.DASHED, size: 6, color: C_GOLD } }, children: [], spacing: { before: 800, after: 80 } }),
      new Paragraph({ children: [new TextRun({ text: name, color: C_MUTED, size: 18, font: "Calibri" })], spacing: { after: 80 }, indent: { left: 80 } }),
    ],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [
        sigCell("Signature du client", clientName),
        new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
        sigCell("Signature C.LC. Traiteur", "Chez La Camerounaise"),
      ],
    })],
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
  });
}

// ── Info box client/événement ─────────────────────────────────────────────────
function infoBox(devis: Devis & { lieu?: string }): Table {
  const cellStyle = (fill: string) => ({
    shading: { type: ShadingType.SOLID, fill, color: fill },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      left: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      right: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
    },
  });

  const field = (label: string, value: string) => [
    new Paragraph({ children: [new TextRun({ text: label.toUpperCase(), color: C_GOLD, bold: true, size: 16, font: "Calibri" })], spacing: { before: 60, after: 20 }, indent: { left: 80 } }),
    new Paragraph({ children: [new TextRun({ text: value, color: C_INK, bold: true, size: 22, font: "Calibri" })], spacing: { after: 60 }, indent: { left: 80 } }),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [
        new TableCell({
          ...cellStyle(C_WHITE),
          width: { size: 50, type: WidthType.PERCENTAGE },
          children: [
            ...field("Client", devis.clientName),
            new Paragraph({ children: [new TextRun({ text: devis.clientPhone ?? "", color: C_MUTED, size: 18, font: "Calibri" })], spacing: { before: 0, after: 60 }, indent: { left: 80 } }),
          ],
        }),
        new TableCell({
          ...cellStyle(C_IVORY),
          width: { size: 50, type: WidthType.PERCENTAGE },
          children: [
            ...field("Type d'événement", devis.eventType),
            ...field("Date", fmtDate(devis.eventDate)),
            ...field("Convives", `${devis.guestCount} personnes`),
            ...(devis.lieu ? field("Lieu", devis.lieu) : []),
          ],
        }),
      ],
    })],
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
  });
}

// ── Tableau acompte ────────────────────────────────────────────────────────────
function scheduleTable(ttc: number): Table {
  const a30 = Math.round(ttc * 0.30);
  const a40 = Math.round(ttc * 0.40);
  const steps = [
    { label: "Acompte à la signature", pct: "30%", amount: a30 },
    { label: "Versement intermédiaire", pct: "40%", amount: a40 },
    { label: "Solde avant événement", pct: "30%", amount: a30 },
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    children: ["Étape", "%", "Montant"].map(h => new TableCell({
      shading: { type: ShadingType.SOLID, fill: C_DARK, color: C_DARK },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: C_WHITE, size: 18, font: "Calibri" })], spacing: { before: 60, after: 60 }, indent: { left: 80 } })],
    })),
  });

  const dataRows = steps.map((s, i) => new TableRow({
    children: [
      new TableCell({ shading: { type: ShadingType.SOLID, fill: i % 2 === 0 ? C_WHITE : C_PARCH }, children: [new Paragraph({ children: [new TextRun({ text: s.label, color: C_INK, size: 20, font: "Calibri" })], spacing: { before: 60, after: 60 }, indent: { left: 80 } })] }),
      new TableCell({ shading: { type: ShadingType.SOLID, fill: i % 2 === 0 ? C_WHITE : C_PARCH }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s.pct, color: C_GREEN, bold: true, size: 20, font: "Calibri" })], spacing: { before: 60, after: 60 } })] }),
      new TableCell({ shading: { type: ShadingType.SOLID, fill: i % 2 === 0 ? C_WHITE : C_PARCH }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmtMoney(s.amount), bold: true, color: C_GREEN, size: 20, font: "Calibri" })], spacing: { before: 60, after: 60 }, indent: { right: 80 } })] }),
    ],
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      left: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      right: { style: BorderStyle.SINGLE, size: 4, color: C_TAN },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: C_TAN },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: C_TAN },
    },
  });
}

// ── API Route ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const devis = await req.json() as Devis & { lieu?: string; brandNom?: string; brandSousTitre?: string; brandVille?: string };

    const serviceItems = devis.items.filter(i => isService(i.dishName));
    const dishItems    = devis.items.filter(i => !isService(i.dishName));
    const sections     = groupSections(dishItems);
    const hasServices  = serviceItems.length > 0;
    const totalServices = serviceItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

    const now = new Date().toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });

    const CLC = {
      nom: devis.brandNom ?? "C.LC. Traiteur",
      sousTitre: devis.brandSousTitre ?? "Traiteur événementiel",
      adresse: "Rouen, France",
      tel: "+33 6 12 34 56 78",
      email: "contact@clctraiteur.fr",
      siret: "123 456 789 00012",
      tva: "FR 12 123456789",
    };

    // ── Header / Footer ──────────────────────────────────────────────────────
    const pageHeader = new Header({
      children: [
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C_GOLD } },
          shading: { type: ShadingType.SOLID, fill: C_DARK, color: C_DARK },
          spacing: { before: 0, after: 0 },
          children: [
            new TextRun({ text: `${CLC.nom}  —  `, bold: true, color: C_WHITE, size: 22, font: "Georgia" }),
            new TextRun({ text: CLC.sousTitre, color: C_TAN, size: 18, font: "Calibri" }),
            new TextRun({ text: `     Devis ${devis.id}`, bold: true, color: C_GOLD, size: 20, font: "Calibri" }),
          ],
        }),
      ],
    });

    const pageFooter = new Footer({
      children: [
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: C_TAN } },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: `${CLC.nom} — SIRET : ${CLC.siret} — ${CLC.email} — ${CLC.adresse}     Page `, color: C_MUTED, size: 15, font: "Calibri" }),
            new TextRun({ children: [PageNumber.CURRENT], color: C_MUTED, size: 15, font: "Calibri" }),
            new TextRun({ text: "/", color: C_MUTED, size: 15, font: "Calibri" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], color: C_MUTED, size: 15, font: "Calibri" }),
          ],
        }),
      ],
    });

    // ── Page 1 : Page de garde ───────────────────────────────────────────────
    const coverChildren: (Paragraph | Table)[] = [
      spacer(24),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: CLC.nom, bold: true, color: C_DARK, size: 64, font: "Georgia" })],
        spacing: { after: 80 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: CLC.sousTitre, color: C_MUTED, size: 24, font: "Calibri" })],
        spacing: { after: 300 },
      }),
      hrGold(),
      spacer(12),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "DEVIS", bold: true, color: C_GOLD, size: 28, font: "Calibri", characterSpacing: 300 })],
        spacing: { before: 200, after: 60 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: devis.id, bold: true, color: C_DARK, size: 48, font: "Georgia" })],
        spacing: { after: 200 },
      }),
      hrGold(),
      spacer(24),
      infoBox(devis),
      spacer(12),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Émis le ", color: C_MUTED, size: 18, font: "Calibri" }),
          new TextRun({ text: now, bold: true, color: C_INK, size: 18, font: "Calibri" }),
          new TextRun({ text: "  ·  Statut : ", color: C_MUTED, size: 18, font: "Calibri" }),
          new TextRun({ text: devis.status, bold: true, color: C_GREEN, size: 18, font: "Calibri" }),
        ],
      }),
    ];

    // ── Page 2+ : Détail des prestations ────────────────────────────────────
    const prestationsChildren: (Paragraph | Table)[] = [
      new Paragraph({ children: [new PageBreak()] }),
      ...sectionBanner("Détail des prestations", devis.eventType),
      spacer(6),
    ];

    if (sections.length === 0) {
      prestationsChildren.push(new Paragraph({
        children: [new TextRun({ text: "Aucun plat sélectionné.", italics: true, color: C_MUTED, size: 20, font: "Calibri" })],
      }));
    } else {
      for (const sec of sections) {
        prestationsChildren.push(
          ...sectionBanner(sec.label, `Sous-total HT : ${fmtMoney(sec.subtotal)}`),
          spacer(4),
          dishTable(sec.items),
          spacer(10),
        );
      }
    }

    prestationsChildren.push(
      spacer(10),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "Récapitulatif financier", bold: true, color: C_DARK, size: 22, font: "Georgia" })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [],
        spacing: { after: 40 },
      }),
    );
    // Totaux (aligné à droite)
    const totals = totalsBlock(devis.totalHT, devis.totalTTC);
    // Pour aligner à droite, on l'emballe dans un tableau 2 cols (espacement + contenu)
    const totalsWrapper = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({
        children: [
          new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [new Paragraph({ children: [] })] }),
          new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [totals] }),
        ],
      })],
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
    });
    prestationsChildren.push(totalsWrapper);

    // ── Page : Prestations additionnelles ────────────────────────────────────
    const prestadChildren: (Paragraph | Table)[] = [
      new Paragraph({ children: [new PageBreak()] }),
      ...sectionBanner("Prestations additionnelles"),
      spacer(6),
      ...prestationsTable(serviceItems),
    ];

    if (hasServices) {
      const subSvc = totalServices;
      prestadChildren.push(
        spacer(6),
        new Paragraph({
          shading: { type: ShadingType.SOLID, fill: C_PARCH, color: C_PARCH },
          spacing: { before: 80, after: 80 },
          indent: { left: 120, right: 120 },
          children: [
            new TextRun({ text: "Sous-total prestations additionnelles : ", color: C_MUTED, size: 18, font: "Calibri" }),
            new TextRun({ text: fmtMoney(subSvc), bold: true, color: C_GREEN, size: 20, font: "Calibri" }),
          ],
        }),
      );
    }

    // ── Page : Récapitulatif ──────────────────────────────────────────────────
    const recapChildren: (Paragraph | Table)[] = [
      new Paragraph({ children: [new PageBreak()] }),
      ...sectionBanner("Récapitulatif de l'événement"),
      spacer(8),
      new Paragraph({
        children: [
          new TextRun({ text: `${devis.guestCount} convives  ·  `, color: C_MUTED, size: 20, font: "Calibri" }),
          new TextRun({ text: fmtDate(devis.eventDate), bold: true, color: C_INK, size: 20, font: "Calibri" }),
          new TextRun({ text: `  ·  ${devis.eventType}`, color: C_MUTED, size: 20, font: "Calibri" }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({ children: [new TextRun({ text: "PRESTATION TRAITEUR", bold: true, color: C_MUTED, size: 17, font: "Calibri", characterSpacing: 200 })], spacing: { before: 80, after: 60 } }),
      recapSectionsTable(sections),
      spacer(8),
    ];

    const serviceRows2 = hasServices
      ? groupServicesCats(serviceItems)
      : null;

    recapChildren.push(
      new Paragraph({ children: [new TextRun({ text: "PRESTATIONS ADDITIONNELLES RETENUES", bold: true, color: C_MUTED, size: 17, font: "Calibri", characterSpacing: 200 })], spacing: { before: 80, after: 60 } }),
    );

    if (!hasServices || !serviceRows2?.length) {
      recapChildren.push(new Paragraph({ children: [new TextRun({ text: "Aucune prestation additionnelle n'a été sélectionnée.", italics: true, color: C_MUTED, size: 20, font: "Calibri" })], spacing: { before: 60, after: 60 } }));
    } else {
      for (const row of serviceRows2) {
        recapChildren.push(new Paragraph({
          shading: { type: ShadingType.SOLID, fill: C_IVORY, color: C_IVORY },
          spacing: { before: 40, after: 40 },
          indent: { left: 120 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: C_TAN } },
          children: [
            new TextRun({ text: row.label, bold: true, color: C_INK, size: 20, font: "Calibri" }),
            new TextRun({ text: `  ${row.desc}`, color: C_MUTED, size: 18, font: "Calibri" }),
            new TextRun({ text: `  ${fmtMoney(row.total)}`, bold: true, color: C_GREEN, size: 20, font: "Calibri" }),
          ],
        }));
      }
    }

    recapChildren.push(
      spacer(10),
      new Paragraph({
        shading: { type: ShadingType.SOLID, fill: C_DARK, color: C_DARK },
        spacing: { before: 100, after: 60 },
        indent: { left: 120, right: 120 },
        children: [
          new TextRun({ text: "TOTAL TTC  ", bold: true, color: C_WHITE, size: 22, font: "Calibri" }),
          new TextRun({ text: hasServices ? "Événement + prestations additionnelles" : "Prestation traiteur uniquement", color: "AAAAAA", size: 16, font: "Calibri" }),
          new TextRun({ text: `     ${fmtMoney(devis.totalTTC)}`, bold: true, color: C_GOLD, size: 28, font: "Georgia" }),
        ],
      }),
    );

    // ── Page : Échéancier de paiement ─────────────────────────────────────────
    const acompteChildren: (Paragraph | Table)[] = [
      new Paragraph({ children: [new PageBreak()] }),
      ...sectionBanner("Échéancier de paiement"),
      spacer(8),
      new Paragraph({
        shading: { type: ShadingType.SOLID, fill: C_IVORY, color: C_IVORY },
        spacing: { before: 80, after: 80 },
        indent: { left: 120 },
        children: [
          new TextRun({ text: "TOTAL TTC DE L'ÉVÉNEMENT  ", color: C_MUTED, bold: true, size: 18, font: "Calibri", characterSpacing: 100 }),
          new TextRun({ text: fmtMoney(devis.totalTTC), bold: true, color: C_GREEN, size: 24, font: "Georgia" }),
        ],
      }),
      spacer(6),
      scheduleTable(devis.totalTTC),
      spacer(8),
      new Paragraph({
        shading: { type: ShadingType.SOLID, fill: C_IVORY, color: C_IVORY },
        spacing: { before: 80, after: 80 },
        indent: { left: 120 },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: C_GOLD } },
        children: [
          new TextRun({ text: "Échéancier calculé sur le total TTC, prestations additionnelles incluses.", bold: true, color: C_INK, size: 18, font: "Calibri" }),
          new TextRun({ break: 1 }),
          new TextRun({ text: "Paiement par virement bancaire ou espèces uniquement.", color: C_MUTED, size: 16, font: "Calibri" }),
        ],
      }),
    ];

    // ── Page : Conditions générales + Signature ───────────────────────────────
    const cgvChildren: (Paragraph | Table)[] = [
      new Paragraph({ children: [new PageBreak()] }),
      ...sectionBanner("Bon pour accord — Conditions générales"),
      spacer(10),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Conditions générales de vente", color: C_DARK, bold: true, size: 24, font: "Georgia" })], spacing: { before: 60, after: 80 } }),
      ...[
        `• Devis valable 30 jours à compter du ${now}.`,
        `• Acompte de 30 % du TTC exigé à la signature pour confirmer la réservation.`,
        "• L'acompte est définitivement acquis en cas d'annulation par le client.",
        "• Annulation < 30 jours avant l'événement : la totalité du devis reste due.",
        "• Solde exigible au plus tard 7 jours avant la date de la prestation.",
        "• Tout litige fera l'objet d'une tentative de résolution amiable préalable.",
      ].map(line => new Paragraph({
        children: [new TextRun({ text: line, color: C_MUTED, size: 19, font: "Calibri" })],
        spacing: { before: 40, after: 40 },
        indent: { left: 120 },
      })),
      spacer(16),
      signatureTable(devis.clientName),
      spacer(10),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `Fait à Rouen, le ${now}`, italics: true, color: C_MUTED, size: 18, font: "Calibri" }),
        ],
      }),
    ];

    // ── Assemblage du document ────────────────────────────────────────────────
    const doc = new Document({
      numbering: { config: [] },
      title: `Devis ${devis.id} — ${devis.clientName}`,
      description: `Devis CLC Traiteur pour ${devis.clientName}`,
      creator: "C.LC. Traiteur",
      styles: {
        default: {
          document: {
            run: { font: "Calibri", size: 22, color: C_INK },
            paragraph: { spacing: { line: 276, lineRule: "auto" } },
          },
        },
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.7),
              bottom: convertInchesToTwip(0.7),
              left: convertInchesToTwip(0.85),
              right: convertInchesToTwip(0.85),
            },
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        headers: { default: pageHeader },
        footers: { default: pageFooter },
        children: [
          ...coverChildren,
          ...prestationsChildren,
          ...prestadChildren,
          ...recapChildren,
          ...acompteChildren,
          ...cgvChildren,
        ],
      }],
    });

    const buf = await Packer.toBuffer(doc);
    const ref = devis.id.replace(/[^a-zA-Z0-9_-]/g, "_");

    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${ref} - ${devis.clientName}.docx"`,
        "Content-Length": String(buf.length),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-docx]", msg);
    return NextResponse.json({ error: "Erreur serveur", detail: msg }, { status: 500 });
  }
}

function groupServicesCats(items: DevisItem[]): { label: string; desc: string; total: number }[] {
  const cats = [
    { keywords: ["serveur","personnel"], label: "Service & personnel" },
    { keywords: ["matériel","couvert","table","chaise","marmite"], label: "Location de matériel" },
    { keywords: ["livraison","transport"], label: "Livraison" },
    { keywords: ["décoration","déco","floral"], label: "Décoration" },
    { keywords: ["tente","chapiteau"], label: "Location de tente" },
    { keywords: ["animation","sono","musique","dj"], label: "Animation musicale" },
    { keywords: ["gâteau","photographe","photo"], label: "Gâteau & photo" },
  ];
  const result: { label: string; desc: string; total: number }[] = [];
  for (const cat of cats) {
    const matched = items.filter(i => cat.keywords.some(k => i.dishName.toLowerCase().includes(k)));
    if (!matched.length) continue;
    result.push({ label: cat.label, desc: matched.map(i => `${i.quantity} × ${i.dishName}`).join(", "), total: matched.reduce((s, i) => s + i.quantity * i.unitPrice, 0) });
  }
  const others = items.filter(i => !cats.some(c => c.keywords.some(k => i.dishName.toLowerCase().includes(k))));
  if (others.length) result.push({ label: "Autres prestations", desc: others.map(i => `${i.quantity} × ${i.dishName}`).join(", "), total: others.reduce((s, i) => s + i.quantity * i.unitPrice, 0) });
  return result;
}


