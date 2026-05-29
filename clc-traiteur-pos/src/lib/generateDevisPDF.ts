import { Devis } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const AMBER: [number, number, number] = [232, 150, 12];
const DARK: [number, number, number] = [26, 30, 36];
const GRAY: [number, number, number] = [87, 96, 106];
const LIGHT_BG: [number, number, number] = [246, 248, 250];

// Infos société — à remplacer par les vraies coordonnées CLC
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

export async function generateDevisPDF(devis: Devis) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const L = 14; // marge gauche
  const R = W - 14; // marge droite
  const now = new Date().toLocaleDateString("fr-FR");
  const { pct, montant, deadlineStr, monthsBefore } = getAcompteInfo(devis.totalTTC, devis.eventDate);

  // ── EN-TÊTE ──────────────────────────────────────────────────────────────
  // Bande amber haute
  doc.setFillColor(...AMBER);
  doc.rect(0, 0, W, 32, "F");

  // Logo (cercle placeholder amber foncé + initiales)
  doc.setFillColor(180, 110, 0);
  doc.circle(L + 9, 16, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CLC", L + 9, 17.5, { align: "center" });

  // Nom société
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(CLC.nom, L + 22, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(CLC.sousTitre, L + 22, 18);
  doc.text(`${CLC.adresse} · ${CLC.tel} · ${CLC.email}`, L + 22, 23);

  // Numéro de devis (droite)
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`DEVIS N° ${devis.id}`, R, 13, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Émis le ${now}`, R, 20, { align: "right" });
  doc.text(`Statut : ${devis.status}`, R, 26, { align: "right" });

  // ── BLOC CLIENT / ÉVÉNEMENT ──────────────────────────────────────────────
  const infoY = 40;

  // Colonne client
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

  // Colonne événement
  const evX = W / 2;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY);
  doc.text("ÉVÉNEMENT", evX, infoY);
  doc.setDrawColor(...AMBER);
  doc.line(evX, infoY + 1.5, evX + 36, infoY + 1.5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  const evRows = [
    [`Type :`, devis.eventType],
    [`Date :`, formatDate(devis.eventDate)],
    [`Convives :`, `${devis.guestCount} personnes`],
  ];
  evRows.forEach(([label, val], i) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, evX, infoY + 7 + i * 6);
    doc.setFont("helvetica", "normal");
    doc.text(val, evX + 20, infoY + 7 + i * 6);
  });

  // Séparateur
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(L, infoY + 26, R, infoY + 26);

  // ── TABLEAU PRESTATIONS ──────────────────────────────────────────────────
  const tableStartY = infoY + 32;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Détail des prestations", L, tableStartY - 3);

  autoTable(doc, {
    startY: tableStartY,
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

  // ── TOTAUX (alignés sur la colonne Sous-total) ───────────────────────────
  // On récupère la position X de la colonne Sous-total depuis autoTable
  const lastTable = (doc as unknown as { lastAutoTable: { columns: Array<{ x: number; width: number }> } }).lastAutoTable;
  const colSousTotal = lastTable.columns[3];
  const totalsLeft = colSousTotal?.x ?? (W - 80);
  const totalsRight = R;

  const tY = afterTable + 3;
  const rowH = 6.5;

  // Fond léger
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(totalsLeft, tY, totalsRight - totalsLeft, rowH * 3 + 4, 1.5, 1.5, "F");

  // Sous-total HT
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("Sous-total HT :", totalsLeft + 3, tY + rowH - 1);
  doc.setTextColor(...DARK);
  doc.text(`${devis.totalHT.toFixed(2)} €`, totalsRight - 3, tY + rowH - 1, { align: "right" });

  // TVA
  doc.setTextColor(...GRAY);
  doc.text("TVA (20%) :", totalsLeft + 3, tY + rowH * 2 - 1);
  doc.setTextColor(...DARK);
  doc.text(`${(devis.totalTTC - devis.totalHT).toFixed(2)} €`, totalsRight - 3, tY + rowH * 2 - 1, { align: "right" });

  // Séparateur
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.4);
  doc.line(totalsLeft + 3, tY + rowH * 2 + 1, totalsRight - 3, tY + rowH * 2 + 1);

  // Total TTC
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("TOTAL TTC :", totalsLeft + 3, tY + rowH * 3 + 1);
  doc.setTextColor(AMBER[0], AMBER[1], AMBER[2]);
  doc.text(`${devis.totalTTC.toFixed(2)} €`, totalsRight - 3, tY + rowH * 3 + 1, { align: "right" });

  // Notes
  let currentY = afterTable + rowH * 3 + 12;
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
  doc.text(
    `Date limite de versement : ${deadlineStr} (${monthsBefore} mois avant l'événement)`,
    L + 4, aY + 13
  );
  doc.text(
    "En cas de rétractation après versement de l'acompte, celui-ci ne sera pas remboursé.",
    L + 4, aY + 19
  );

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

  // ── SIGNATURES ───────────────────────────────────────────────────────────
  const sigY = cgY + 42;
  const needNewPage = sigY + 40 > 280;
  if (needNewPage) doc.addPage();
  const sY = needNewPage ? 24 : sigY;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);

  // Client
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Signature du client", L, sY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...GRAY);
  doc.text("Précédée de la mention « Bon pour accord »", L, sY + 5);
  doc.line(L, sY + 22, L + 72, sY + 22);
  doc.setFont("helvetica", "normal");
  doc.text(devis.clientName, L, sY + 27);
  doc.text("Date : _____ / _____ / _______", L, sY + 33);

  // CLC
  const sigR = W / 2 + 12;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Signature C.LC. Traiteur", sigR, sY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...GRAY);
  doc.text("Représentant(e) autorisé(e)", sigR, sY + 5);
  doc.line(sigR, sY + 22, R, sY + 22);
  doc.setFont("helvetica", "normal");
  doc.text("Chez La Camerounaise", sigR, sY + 27);
  doc.text("Date : _____ / _____ / _______", sigR, sY + 33);

  // ── PIED DE PAGE ─────────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const fY = doc.internal.pageSize.getHeight() - 7;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(
      `${CLC.nom} — SIRET : ${CLC.siret} — TVA : ${CLC.tva} — ${CLC.adresse}`,
      L, fY
    );
    doc.text(`Devis ${devis.id} · Page ${i}/${pages}`, R, fY, { align: "right" });
  }

  doc.save(`${devis.id} - ${devis.clientName}.pdf`);
}
