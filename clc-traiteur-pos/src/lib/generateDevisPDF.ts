import { Devis } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const AMBER: [number, number, number] = [232, 150, 12];
const DARK: [number, number, number] = [26, 30, 36];
const GRAY: [number, number, number] = [87, 96, 106];
const LIGHT_BG: [number, number, number] = [246, 248, 250];

// Calcule le pourcentage d'acompte et la date limite en fonction du total TTC
function getAcompteInfo(totalTTC: number, eventDate: string) {
  // Pourcentage : 30% si < 2000€, 40% si 2000-5000€, 50% si > 5000€
  const pct = totalTTC < 2000 ? 30 : totalTTC < 5000 ? 40 : 50;
  const montant = totalTTC * (pct / 100);

  // Date limite : 3 mois avant si événement < 4 mois, sinon 6 mois avant
  const event = new Date(eventDate);
  const now = new Date();
  const diffMonths = (event.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const monthsBefore = diffMonths < 4 ? 3 : 6;
  const deadline = new Date(event);
  deadline.setMonth(deadline.getMonth() - monthsBefore);
  const deadlineStr = deadline.toLocaleDateString("fr-FR");

  return { pct, montant, deadlineStr, monthsBefore };
}

export async function generateDevisPDF(devis: Devis) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleDateString("fr-FR");
  const devisNum = devis.id;
  const { pct, montant, deadlineStr, monthsBefore } = getAcompteInfo(devis.totalTTC, devis.eventDate);

  // ── EN-TÊTE ──────────────────────────────────────────────────────────────
  // Fond amber
  doc.setFillColor(...AMBER);
  doc.rect(0, 0, W, 28, "F");

  // Nom société
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("C.LC. Traiteur", 14, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Chez La Camerounaise — Traiteur événementiel", 14, 18);
  doc.text("contact@clctraiteur.fr · +33 6 XX XX XX XX · Paris, France", 14, 23);

  // Numéro de devis à droite
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`DEVIS N° ${devisNum}`, W - 14, 14, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Émis le ${now}`, W - 14, 20, { align: "right" });

  // ── INFORMATIONS CLIENT ──────────────────────────────────────────────────
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Client", 14, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(devis.clientName, 14, 44);
  doc.text(devis.clientPhone, 14, 49);

  // Infos événement
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Événement", W / 2, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Type : ${devis.eventType}`, W / 2, 44);
  doc.text(`Date : ${formatDate(devis.eventDate)}`, W / 2, 49);
  doc.text(`Convives : ${devis.guestCount} personnes`, W / 2, 54);

  // Ligne séparatrice
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.5);
  doc.line(14, 60, W - 14, 60);

  // ── TABLEAU DES PRESTATIONS ──────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Détail des prestations", 14, 68);

  autoTable(doc, {
    startY: 72,
    head: [["Prestation", "Quantité", "Prix unit.", "Sous-total"]],
    body: devis.items.map(item => [
      item.dishName,
      String(item.quantity),
      `${item.unitPrice.toFixed(2)} €`,
      `${item.subtotal.toFixed(2)} €`,
    ]),
    headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right", fontStyle: "bold" },
    },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  const afterTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // ── TOTAUX ───────────────────────────────────────────────────────────────
  const totalsX = W - 80;
  const totalsW = 66;

  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(totalsX, afterTable, totalsW, 28, 2, 2, "F");

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  doc.text("Sous-total HT :", totalsX + 4, afterTable + 7);
  doc.text("TVA (20%) :", totalsX + 4, afterTable + 13);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("TOTAL TTC :", totalsX + 4, afterTable + 21);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  doc.text(`${devis.totalHT.toFixed(2)} €`, W - 14, afterTable + 7, { align: "right" });
  doc.text(`${(devis.totalTTC - devis.totalHT).toFixed(2)} €`, W - 14, afterTable + 13, { align: "right" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(AMBER[0], AMBER[1], AMBER[2]);
  doc.text(`${devis.totalTTC.toFixed(2)} €`, W - 14, afterTable + 21, { align: "right" });

  // Notes
  if (devis.notes) {
    const notesY = afterTable + 35;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Notes :", 14, notesY);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...GRAY);
    doc.text(devis.notes, 14, notesY + 5, { maxWidth: W - 28 });
  }

  // ── ACOMPTE ──────────────────────────────────────────────────────────────
  const acompteY = afterTable + (devis.notes ? 55 : 38);

  doc.setFillColor(AMBER[0], AMBER[1], AMBER[2]);
  doc.setFillColor(255, 248, 230);
  doc.roundedRect(14, acompteY, W - 28, 22, 2, 2, "F");
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, acompteY, W - 28, 22, 2, 2, "D");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(`Acompte de ${pct}% requis à la validation`, 18, acompteY + 7);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(
    `Montant de l'acompte : ${montant.toFixed(2)} € · Date limite de versement : ${deadlineStr} (${monthsBefore} mois avant l'événement)`,
    18, acompteY + 13
  );
  doc.text(
    "En cas de rétractation après versement, l'acompte ne sera pas remboursé.",
    18, acompteY + 18
  );

  // ── CONDITIONS GÉNÉRALES ─────────────────────────────────────────────────
  const cgY = acompteY + 28;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Conditions générales", 14, cgY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  const cg = [
    "• Le présent devis est valable 30 jours à compter de sa date d'émission.",
    `• Un acompte de ${pct}% du montant TTC est exigé à la signature pour confirmer la réservation.`,
    "• L'acompte versé est définitivement acquis en cas d'annulation par le client.",
    "• En cas d'annulation moins de 30 jours avant l'événement, la totalité du devis reste due.",
    "• Le solde est exigible au plus tard 7 jours avant la date de la prestation.",
    "• En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute procédure judiciaire.",
    "• Conformément à la loi, toute facture impayée à l'échéance sera majorée d'une pénalité de 3× le taux légal.",
  ];
  cg.forEach((line, i) => {
    doc.text(line, 14, cgY + 5 + i * 4.5, { maxWidth: W - 28 });
  });

  // ── SIGNATURES ───────────────────────────────────────────────────────────
  const sigY = cgY + 42;

  // Vérifier qu'on a assez de place, sinon nouvelle page
  if (sigY > 240) {
    doc.addPage();
  }

  const finalSigY = sigY > 240 ? 30 : sigY;

  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.3);

  // Signature client
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Signature du client", 14, finalSigY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.setFontSize(8);
  doc.text("Précédée de la mention « Bon pour accord »", 14, finalSigY + 5);
  doc.line(14, finalSigY + 22, 80, finalSigY + 22);
  doc.setFontSize(8);
  doc.text(`${devis.clientName}`, 14, finalSigY + 27);
  doc.text(`Date : _____ / _____ / _________`, 14, finalSigY + 32);

  // Signature CLC
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Signature C.LC. Traiteur", W / 2 + 10, finalSigY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.setFontSize(8);
  doc.text("Représentant(e) autorisé(e)", W / 2 + 10, finalSigY + 5);
  doc.line(W / 2 + 10, finalSigY + 22, W - 14, finalSigY + 22);
  doc.text("Chez La Camerounaise", W / 2 + 10, finalSigY + 27);
  doc.text(`Date : _____ / _____ / _________`, W / 2 + 10, finalSigY + 32);

  // ── PIED DE PAGE ─────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = doc.internal.pageSize.getHeight() - 8;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text("C.LC. Traiteur — SIRET : XX XXX XXX XXXXX — TVA intracommunautaire : FR XX XXXXXXXXX", 14, footerY);
    doc.text(`Devis ${devisNum} · Page ${i}/${pageCount}`, W - 14, footerY, { align: "right" });
  }

  doc.save(`devis-${devisNum}-${devis.clientName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
