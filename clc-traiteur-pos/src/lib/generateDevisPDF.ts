import { Devis } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const AMBER: [number, number, number] = [232, 150, 12];
const DARK: [number, number, number] = [26, 30, 36];
const GRAY: [number, number, number] = [87, 96, 106];
const LIGHT_BG: [number, number, number] = [246, 248, 250];

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

  // ── EN-TÊTE ──────────────────────────────────────────────────────────────
  doc.setFillColor(...AMBER);
  doc.rect(0, 0, W, 38, "F");

  let logoW = 0;
  if (logo) {
    const logoH = 28;
    logoW = (logo.w / logo.h) * logoH;
    doc.addImage(logo.data, "PNG", L, 5, logoW, logoH);
  }

  const textX = logoW > 0 ? L + logoW + 5 : L;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text(CLC.nom, textX, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(CLC.sousTitre, textX, 21);
  doc.text(`${CLC.adresse} · ${CLC.tel} · ${CLC.email}`, textX, 28);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`DEVIS N° ${devis.id}`, R, 14, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Émis le ${now}`, R, 22, { align: "right" });
  doc.text(`Statut : ${devis.status}`, R, 30, { align: "right" });

  // ── CLIENT / ÉVÉNEMENT ───────────────────────────────────────────────────
  const infoY = 46;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY);
  doc.text("CLIENT", L, infoY);
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.4);
  doc.line(L, infoY + 2, L + 32, infoY + 2);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(devis.clientName, L, infoY + 9);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(devis.clientPhone, L, infoY + 16);

  const evX = W / 2;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY);
  doc.text("ÉVÉNEMENT", evX, infoY);
  doc.setDrawColor(...AMBER);
  doc.line(evX, infoY + 2, evX + 40, infoY + 2);

  const evRows: [string, string][] = [
    ["Type :", devis.eventType],
    ["Date :", formatDate(devis.eventDate)],
    ["Convives :", `${devis.guestCount} personnes`],
  ];
  evRows.forEach(([label, val], i) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(label, evX, infoY + 9 + i * 7);
    doc.setFont("helvetica", "normal");
    doc.text(val, evX + 24, infoY + 9 + i * 7);
  });

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(L, infoY + 32, R, infoY + 32);

  // ── TABLEAU PRESTATIONS ──────────────────────────────────────────────────
  const tableY = infoY + 39;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Détail des prestations", L, tableY - 4);

  autoTable(doc, {
    startY: tableY,
    head: [["Prestation", "Quantité", "Prix unit.", "Sous-total"]],
    body: devis.items.map(item => [
      item.dishName,
      String(item.quantity),
      `${item.unitPrice.toFixed(2)} €`,
      `${item.subtotal.toFixed(2)} €`,
    ]),
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: {
      0: { halign: "left", cellWidth: "auto" },
      1: { halign: "right", cellWidth: 28 },
      2: { halign: "right", cellWidth: 32 },
      3: { halign: "right", cellWidth: 34, fontStyle: "bold" },
    },
    styles: { fontSize: 11, cellPadding: { top: 4, bottom: 4, left: 5, right: 5 } },
    margin: { left: L, right: 14 },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      if (data.section === "head") {
        data.cell.styles.fillColor = [...DARK];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 11;
        data.cell.styles.halign = data.column.index === 0 ? "left" : "right";
      }
    },
  });

  const afterTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const lastTable = (doc as unknown as { lastAutoTable: { columns: Array<{ x: number; width: number }> } }).lastAutoTable;
  const colSousTotal = lastTable.columns[3];
  const totalsLeft = colSousTotal?.x ?? (W - 80);

  // ── TOTAUX ───────────────────────────────────────────────────────────────
  const tY = afterTable + 4;
  const rowH = 8;

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(totalsLeft, tY, R - totalsLeft, rowH * 3 + 5, 2, 2, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("Sous-total HT :", totalsLeft + 4, tY + rowH - 1);
  doc.setTextColor(...DARK);
  doc.text(`${devis.totalHT.toFixed(2)} €`, R - 4, tY + rowH - 1, { align: "right" });

  doc.setTextColor(...GRAY);
  doc.text("TVA (20%) :", totalsLeft + 4, tY + rowH * 2 - 1);
  doc.setTextColor(...DARK);
  doc.text(`${(devis.totalTTC - devis.totalHT).toFixed(2)} €`, R - 4, tY + rowH * 2 - 1, { align: "right" });

  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.4);
  doc.line(totalsLeft + 4, tY + rowH * 2 + 2, R - 4, tY + rowH * 2 + 2);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("TOTAL TTC :", totalsLeft + 4, tY + rowH * 3 + 2);
  doc.setTextColor(AMBER[0], AMBER[1], AMBER[2]);
  doc.text(`${devis.totalTTC.toFixed(2)} €`, R - 4, tY + rowH * 3 + 2, { align: "right" });

  // Notes
  let currentY = tY + rowH * 3 + 13;
  if (devis.notes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Notes :", L, currentY);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...GRAY);
    const noteLines = doc.splitTextToSize(devis.notes, R - L);
    doc.text(noteLines, L, currentY + 6);
    currentY += 6 + noteLines.length * 6 + 4;
  }

  // Acompte reste page 1
  const aY = currentY + 5;
  doc.setFillColor(255, 248, 230);
  doc.roundedRect(L, aY, R - L, 28, 2, 2, "F");
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.4);
  doc.roundedRect(L, aY, R - L, 28, 2, 2, "D");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(`Acompte de ${pct}% requis à la validation — ${montant.toFixed(2)} €`, L + 5, aY + 8);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(`Date limite de versement : ${deadlineStr} (${monthsBefore} mois avant l'événement)`, L + 5, aY + 16);
  doc.text("En cas de rétractation après versement, l'acompte ne sera pas remboursé.", L + 5, aY + 23);

  // ── CONDITIONS GÉNÉRALES + SIGNATURES → toujours page 2 ─────────────────
  doc.addPage();
  const cgY = 14;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Conditions générales de vente", L, cgY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  const cg = [
    `• Devis valable 30 jours à compter du ${now}.`,
    `• Acompte de ${pct}% du TTC exigé à la signature pour confirmer la réservation.`,
    "• L'acompte est définitivement acquis en cas d'annulation par le client.",
    "• Annulation < 30 jours avant l'événement : la totalité du devis reste due.",
    "• Solde exigible au plus tard 7 jours avant la date de la prestation.",
    "• Tout litige fera l'objet d'une tentative de résolution amiable préalable.",
  ];
  cg.forEach((line, i) => doc.text(line, L, cgY + 7 + i * 6, { maxWidth: R - L }));

  // ── SIGNATURES ───────────────────────────────────────────────────────────
  const sigY = cgY + 52;
  const sigBlockH = 55;
  const needNewPage = sigY + sigBlockH > pageH - footerReserve;
  if (needNewPage) doc.addPage();
  const sY = needNewPage ? 24 : sigY;

  const sigW = (R - L - 8) / 2;
  const sigH = 44;

  // Cadre client
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(L, sY, sigW, sigH, 2, 2, "F");
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(L, sY, sigW, sigH, 2, 2, "D");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Signature du client", L + 4, sY + 7);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...GRAY);
  doc.text("Précédée de « Bon pour accord »", L + 4, sY + 13);

  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.4);
  doc.roundedRect(L + 4, sY + 16, sigW - 8, 20, 1, 1, "D");
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text("Signer ici", L + 4 + (sigW - 8) / 2, sY + 27, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(devis.clientName, L + 4, sY + 40);

  // Cadre CLC
  const sig2X = L + sigW + 8;
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(sig2X, sY, sigW, sigH, 2, 2, "F");
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(sig2X, sY, sigW, sigH, 2, 2, "D");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Signature C.LC. Traiteur", sig2X + 4, sY + 7);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...GRAY);
  doc.text("Représentant(e) autorisé(e)", sig2X + 4, sY + 13);

  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.4);
  doc.roundedRect(sig2X + 4, sY + 16, sigW - 8, 20, 1, 1, "D");
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text("Signer ici", sig2X + 4 + (sigW - 8) / 2, sY + 27, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("Chez La Camerounaise", sig2X + 4, sY + 40);

  // ── PIED DE PAGE ─────────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const fY = doc.internal.pageSize.getHeight() - 7;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(`${CLC.nom} — SIRET : ${CLC.siret} — TVA : ${CLC.tva} — ${CLC.adresse}`, L, fY);
    doc.text(`Devis ${devis.id} · Page ${i}/${pages}`, R, fY, { align: "right" });
  }

  doc.save(`${devis.id} - ${devis.clientName}.pdf`);
}
