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
  const pct = totalTTC < 2000 ? 30 : totalTTC < 5000 ? 40 : 50;
  const montant = totalTTC * (pct / 100);
  const event = new Date(eventDate);
  const now = new Date();
  const diffMonths = (event.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const monthsBefore = diffMonths < 4 ? 3 : 6;
  const deadline = new Date(event);
  deadline.setMonth(deadline.getMonth() - monthsBefore);
  return { pct, montant, deadlineStr: deadline.toLocaleDateString("fr-FR"), monthsBefore };
}

async function loadLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch("/logo.png");
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
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

  // Charger le logo
  const logoData = await loadLogoBase64();

  // ── EN-TÊTE ──────────────────────────────────────────────────────────────
  doc.setFillColor(...AMBER);
  doc.rect(0, 0, W, 34, "F");

  // Logo
  if (logoData) {
    doc.addImage(logoData, "PNG", L, 4, 22, 22);
  }

  // Nom société (décalé pour laisser place au logo)
  const textX = logoData ? L + 26 : L;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(CLC.nom, textX, 13);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(CLC.sousTitre, textX, 19);
  doc.text(`${CLC.adresse} · ${CLC.tel} · ${CLC.email}`, textX, 25);

  // Numéro de devis (droite)
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`DEVIS N° ${devis.id}`, R, 13, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Émis le ${now}`, R, 20, { align: "right" });
  doc.text(`Statut : ${devis.status}`, R, 26, { align: "right" });

  // ── CLIENT / ÉVÉNEMENT ───────────────────────────────────────────────────
  const infoY = 42;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY);
  doc.text("CLIENT", L, infoY);
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.4);
  doc.line(L, infoY + 1.5, L + 30, infoY + 1.5);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(devis.clientName, L, infoY + 7);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(devis.clientPhone, L, infoY + 13);

  const evX = W / 2;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY);
  doc.text("ÉVÉNEMENT", evX, infoY);
  doc.setDrawColor(...AMBER);
  doc.line(evX, infoY + 1.5, evX + 36, infoY + 1.5);

  const evRows: [string, string][] = [
    ["Type :", devis.eventType],
    ["Date :", formatDate(devis.eventDate)],
    ["Convives :", `${devis.guestCount} personnes`],
  ];
  evRows.forEach(([label, val], i) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(label, evX, infoY + 7 + i * 6);
    doc.setFont("helvetica", "normal");
    doc.text(val, evX + 22, infoY + 7 + i * 6);
  });

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(L, infoY + 27, R, infoY + 27);

  // ── TABLEAU PRESTATIONS ──────────────────────────────────────────────────
  const tableY = infoY + 33;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Détail des prestations", L, tableY - 3);

  autoTable(doc, {
    startY: tableY,
    head: [["Prestation", "Quantité", "Prix unit.", "Sous-total"]],
    body: devis.items.map(item => [
      item.dishName,
      String(item.quantity),
      `${item.unitPrice.toFixed(2)} €`,
      `${item.subtotal.toFixed(2)} €`,
    ]),
    headStyles: {
      fillColor: DARK,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "left",
    },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "left" },
      2: { halign: "left" },
      3: { halign: "left", fontStyle: "bold" },
    },
    styles: { fontSize: 9, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
    margin: { left: L, right: 14 },
  });

  const afterTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const lastTable = (doc as unknown as { lastAutoTable: { columns: Array<{ x: number; width: number }> } }).lastAutoTable;
  const colSousTotal = lastTable.columns[3];
  const totalsLeft = colSousTotal?.x ?? (W - 70);

  // ── TOTAUX ───────────────────────────────────────────────────────────────
  const tY = afterTable + 3;
  const rowH = 6.5;

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(totalsLeft, tY, R - totalsLeft, rowH * 3 + 4, 1.5, 1.5, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("Sous-total HT :", totalsLeft + 3, tY + rowH - 1);
  doc.setTextColor(...DARK);
  doc.text(`${devis.totalHT.toFixed(2)} €`, R - 3, tY + rowH - 1, { align: "right" });

  doc.setTextColor(...GRAY);
  doc.text("TVA (20%) :", totalsLeft + 3, tY + rowH * 2 - 1);
  doc.setTextColor(...DARK);
  doc.text(`${(devis.totalTTC - devis.totalHT).toFixed(2)} €`, R - 3, tY + rowH * 2 - 1, { align: "right" });

  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.4);
  doc.line(totalsLeft + 3, tY + rowH * 2 + 1, R - 3, tY + rowH * 2 + 1);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("TOTAL TTC :", totalsLeft + 3, tY + rowH * 3 + 1);
  doc.setTextColor(AMBER[0], AMBER[1], AMBER[2]);
  doc.text(`${devis.totalTTC.toFixed(2)} €`, R - 3, tY + rowH * 3 + 1, { align: "right" });

  // Notes
  let currentY = tY + rowH * 3 + 10;
  if (devis.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Notes :", L, currentY);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...GRAY);
    const noteLines = doc.splitTextToSize(devis.notes, R - L);
    doc.text(noteLines, L, currentY + 5);
    currentY += 5 + noteLines.length * 5 + 4;
  }

  // ── ACOMPTE ──────────────────────────────────────────────────────────────
  const aY = currentY + 4;
  doc.setFillColor(255, 248, 230);
  doc.roundedRect(L, aY, R - L, 24, 2, 2, "F");
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.4);
  doc.roundedRect(L, aY, R - L, 24, 2, 2, "D");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(`Acompte de ${pct}% requis à la validation — ${montant.toFixed(2)} €`, L + 4, aY + 7);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(`Date limite de versement : ${deadlineStr} (${monthsBefore} mois avant l'événement)`, L + 4, aY + 13);
  doc.text("En cas de rétractation après versement de l'acompte, celui-ci ne sera pas remboursé.", L + 4, aY + 19);

  // ── CONDITIONS GÉNÉRALES ─────────────────────────────────────────────────
  const cgY = aY + 30;
  doc.setFontSize(8);
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
    "• Pénalité de retard : 3× le taux légal en vigueur sur toute somme impayée à l'échéance.",
  ];
  cg.forEach((line, i) => doc.text(line, L, cgY + 5 + i * 4.5, { maxWidth: R - L }));

  // ── SIGNATURES ÉLECTRONIQUES ─────────────────────────────────────────────
  const sigY = cgY + 42;
  const needNewPage = sigY + 55 > 280;
  if (needNewPage) doc.addPage();
  const sY = needNewPage ? 24 : sigY;

  const sigW = (R - L - 8) / 2;
  const sigH = 40;

  // Cadre signature client
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(L, sY, sigW, sigH, 2, 2, "F");
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(L, sY, sigW, sigH, 2, 2, "D");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Signature du client", L + 3, sY + 6);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...GRAY);
  doc.text("Précédée de « Bon pour accord »", L + 3, sY + 11);

  // Zone de signature client (rectangle amber)
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.4);
  doc.roundedRect(L + 3, sY + 14, sigW - 6, 18, 1, 1, "D");

  doc.setFontSize(7);
  doc.setTextColor(200, 200, 200);
  doc.text("Signer ici", L + 3 + (sigW - 6) / 2, sY + 24, { align: "center" });

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(devis.clientName, L + 3, sY + 36);

  // Cadre signature CLC
  const sig2X = L + sigW + 8;
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(sig2X, sY, sigW, sigH, 2, 2, "F");
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(sig2X, sY, sigW, sigH, 2, 2, "D");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Signature C.LC. Traiteur", sig2X + 3, sY + 6);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...GRAY);
  doc.text("Représentant(e) autorisé(e)", sig2X + 3, sY + 11);

  // Zone de signature CLC
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.4);
  doc.roundedRect(sig2X + 3, sY + 14, sigW - 6, 18, 1, 1, "D");

  doc.setFontSize(7);
  doc.setTextColor(200, 200, 200);
  doc.text("Signer ici", sig2X + 3 + (sigW - 6) / 2, sY + 24, { align: "center" });

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("Chez La Camerounaise", sig2X + 3, sY + 36);

  // ── PIED DE PAGE ─────────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const fY = doc.internal.pageSize.getHeight() - 7;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(`${CLC.nom} — SIRET : ${CLC.siret} — TVA : ${CLC.tva} — ${CLC.adresse}`, L, fY);
    doc.text(`Devis ${devis.id} · Page ${i}/${pages}`, R, fY, { align: "right" });
  }

  doc.save(`${devis.id} - ${devis.clientName}.pdf`);
}
