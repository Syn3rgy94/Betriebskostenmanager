import { jsPDF } from 'jspdf';
import { AppData, TenantSettlement } from '../types';
import { formatCurrency, formatDateGerman, formatNumber } from './calculator';

export function buildTenantSettlementPdfDoc(
  appData: AppData,
  settlement: TenantSettlement
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2; // 170mm

  // Colors
  const primaryColor = [30, 58, 138]; // Slate blue #1e3a8a
  const darkTextColor = [30, 41, 59]; // Slate 800
  const mutedTextColor = [100, 116, 139]; // Slate 500
  const lineColor = [226, 232, 240]; // Slate 200

  let currentY = 18;

  // 1. DIN 5008 Sender Line (Absenderzeile über dem Adressfeld)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  const senderLine = `${appData.landlord.name} · ${appData.landlord.street} · ${appData.landlord.zip} ${appData.landlord.city}`;
  doc.text(senderLine, marginX, currentY);
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.line(marginX, currentY + 1.5, marginX + contentWidth, currentY + 1.5);

  currentY += 10;

  // 2. DIN 5008 Address Field (Empfängeranschrift)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

  doc.text(settlement.salutation, marginX, currentY);
  currentY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.text(settlement.tenantName, marginX, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 4.5;
  doc.text(
    `${appData.property.street} (${settlement.unitNumber}, ${settlement.unitFloor})`,
    marginX,
    currentY
  );
  currentY += 4.5;
  doc.text(`${appData.property.zip} ${appData.property.city}`, marginX, currentY);

  // 3. Information block right-aligned (Datum, Liegenschaft, Abrechnungszeitraum)
  const infoX = pageWidth - marginX - 62;
  let infoY = 28;
  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);

  const todayFormatted = formatDateGerman(new Date().toISOString().split('T')[0]);
  doc.text(`Datum: ${todayFormatted}`, infoX, infoY);
  infoY += 4;
  doc.text(`Objekt: ${appData.property.name}`, infoX, infoY);
  infoY += 4;
  doc.text(`Wohnfläche: ${formatNumber(settlement.unitArea, 1)} m²`, infoX, infoY);
  infoY += 4;
  doc.text(`Personen: ${settlement.unitPersons} Pers.`, infoX, infoY);
  infoY += 4;
  doc.text(
    `Zeitraum: ${formatDateGerman(settlement.billingPeriodStart)} - ${formatDateGerman(settlement.billingPeriodEnd)}`,
    infoX,
    infoY
  );

  currentY = 58;

  // 4. Headline / Subject (Betreff)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Betriebskostenabrechnung ${settlement.year}`, marginX, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(
    `Abrechnung für Mietobjekt ${appData.property.street}, ${settlement.unitNumber} (${settlement.unitFloor})`,
    marginX,
    currentY
  );
  currentY += 7;

  // 5. Letter Salutation & Intro Text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

  const salutationText = settlement.salutation.includes('Familie')
    ? 'Sehr geehrte Familie Becker,'
    : settlement.salutation.includes('Frau')
    ? `Sehr geehrte ${settlement.salutation} ${settlement.tenantName.split(' ').slice(1).join(' ')},`
    : `Sehr geehrter ${settlement.salutation.replace('Herrn', 'Herr')} ${settlement.tenantName.split(' ').slice(1).join(' ')},`;

  doc.text(salutationText, marginX, currentY);
  currentY += 4.5;

  const introText =
    `anbei erhalten Sie die formelle Abrechnung der Betriebskosten für das Abrechnungsjahr ${settlement.year} ` +
    `gemäß § 556 BGB und der Betriebskostenverordnung (BetrKV). Die Gesamtkosten der Liegenschaft wurden nach den ` +
    `vertraglich vereinbarten Abrechnungsschlüsseln und Verbräuchen transparent aufgeteilt.`;

  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, marginX, currentY);
  currentY += splitIntro.length * 4 + 3;

  // 6. Cost Table Header
  const colX = {
    cat: marginX,
    beleg: marginX + 50,
    total: marginX + 80,
    key: marginX + 104,
    share: marginX + 134,
    tenantCost: marginX + contentWidth,
  };

  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, currentY, contentWidth, 6.5, 'F');
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.line(marginX, currentY + 6.5, marginX + contentWidth, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Kostenart (§ 2 BetrKV)', colX.cat + 2, currentY + 4.5);
  doc.text('Beleg-Nr.', colX.beleg, currentY + 4.5);
  doc.text('Gesamtkosten', colX.total, currentY + 4.5, { align: 'right' });
  doc.text('Schlüssel', colX.key + 2, currentY + 4.5);
  doc.text('Anteil / Gesamt', colX.share, currentY + 4.5);
  doc.text('Ihr Betrag', colX.tenantCost - 2, currentY + 4.5, { align: 'right' });

  currentY += 7.5;

  // 7. Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  for (let i = 0; i < settlement.positions.length; i++) {
    const pos = settlement.positions[i];

    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = 20;
    }

    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, currentY - 0.5, contentWidth, 5, 'F');
    }

    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    const catLabel = `Nr. ${pos.categoryNumber} ${pos.categoryName}`;
    const truncatedCat = doc.splitTextToSize(catLabel, 47)[0];
    doc.text(truncatedCat, colX.cat + 2, currentY + 3.2);

    // Belegnummer
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(pos.receiptNumber || '—', colX.beleg, currentY + 3.2);

    // Total cost
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(formatCurrency(pos.totalCost), colX.total, currentY + 3.2, { align: 'right' });

    // Key
    doc.text(pos.keyLabel, colX.key + 2, currentY + 3.2);

    // Share / Denominator
    let shareText = '';
    if (pos.allocationKey === 'm2') {
      shareText = `${formatNumber(pos.tenantUnitsValue, 1)} / ${formatNumber(pos.totalUnitsValue, 0)} m²`;
    } else if (pos.allocationKey === 'persons') {
      shareText = `${pos.tenantUnitsValue} / ${pos.totalUnitsValue} P.`;
    } else if (pos.allocationKey === 'units') {
      shareText = `1 / ${pos.totalUnitsValue} WE`;
    } else if (pos.allocationKey === 'mea') {
      shareText = `${pos.tenantUnitsValue} / ${pos.totalUnitsValue} MEA`;
    } else if (pos.allocationKey === 'consumption') {
      shareText = `${formatNumber(pos.tenantUnitsValue, 1)} / ${formatNumber(pos.totalUnitsValue, 1)} m³`;
    } else {
      shareText = 'Direkt';
    }
    doc.text(shareText, colX.share, currentY + 3.2);

    // Tenant share
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(pos.tenantCost), colX.tenantCost - 2, currentY + 3.2, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    currentY += 5;
  }

  // Line after table
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.3);
  doc.line(marginX, currentY, marginX + contentWidth, currentY);
  currentY += 3.5;

  // 8. Calculation Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.rect(marginX, currentY, contentWidth, 24, 'FD');

  const summaryLeftX = marginX + 5;
  const summaryRightX = marginX + contentWidth - 5;
  let boxY = currentY + 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Ihre anteiligen Gesamtkosten:', summaryLeftX, boxY);
  doc.text(formatCurrency(settlement.totalTenantCost), summaryRightX, boxY, { align: 'right' });

  boxY += 5;
  doc.text(`Ihre geleisteten Vorauszahlungen (${settlement.year}):`, summaryLeftX, boxY);
  doc.text(`- ${formatCurrency(settlement.prepayments)}`, summaryRightX, boxY, { align: 'right' });

  boxY += 1.5;
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.line(summaryLeftX, boxY, summaryRightX, boxY);
  boxY += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);

  const isRefund = settlement.balance < 0;
  if (isRefund) {
    doc.setTextColor(21, 128, 61);
    doc.text('Ihr Guthaben (Erstattung):', summaryLeftX, boxY);
    doc.text(formatCurrency(Math.abs(settlement.balance)), summaryRightX, boxY, { align: 'right' });
  } else if (settlement.balance > 0) {
    doc.setTextColor(185, 28, 28);
    doc.text('Ihre Nachzahlung:', summaryLeftX, boxY);
    doc.text(formatCurrency(settlement.balance), summaryRightX, boxY, { align: 'right' });
  } else {
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text('Abrechnungssaldo:', summaryLeftX, boxY);
    doc.text(formatCurrency(0), summaryRightX, boxY, { align: 'right' });
  }

  currentY += 28;

  // 9. Payment instructions
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

  let paymentText = '';
  if (settlement.balance > 0) {
    paymentText =
      `Bitte überweisen Sie den Nachzahlungsbetrag in Höhe von ${formatCurrency(settlement.balance)} bis zum ` +
      `${formatDateGerman(settlement.paymentDueDate)} auf das unten angegebene Vermieterkonto unter Angabe des Verwendungszwecks: ` +
      `"BK ${settlement.year} - ${settlement.tenantName}".`;
  } else if (settlement.balance < 0) {
    paymentText =
      `Das Guthaben zu Ihren Gunsten in Höhe von ${formatCurrency(Math.abs(settlement.balance))} wird Ihnen binnen ` +
      `30 Tagen auf Ihr bekanntes Bankkonto erstattet oder mit der übernächsten Miete verrechnet.`;
  } else {
    paymentText = `Die Abrechnung ist ausgeglichen. Es ergibt sich weder ein Nachforderungs- noch ein Erstattungsanspruch.`;
  }

  const splitPayment = doc.splitTextToSize(paymentText, contentWidth);
  doc.text(splitPayment, marginX, currentY);
  currentY += splitPayment.length * 3.8 + 2.5;

  // 10. Advance Payment Adjustment Clause (§ 560 Abs. 4 BGB)
  if (settlement.includeAdjustmentClause && settlement.monthlyDifference !== 0) {
    doc.setFillColor(254, 243, 199);
    doc.rect(marginX, currentY, contentWidth, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14);
    doc.text('Anpassung der monatlichen Vorauszahlung gemäß § 560 Abs. 4 BGB:', marginX + 3, currentY + 4);

    doc.setFont('helvetica', 'normal');
    const adjustText =
      `Aufgrund der tatsächlichen Kostenentwicklung wird die monatliche Vorauszahlung ab dem Folgemonat von bisher ` +
      `${formatCurrency(settlement.prepayments / 12)} auf neu ${formatCurrency(settlement.recommendedMonthlyPrepayment)} ` +
      `angepasst (+${formatCurrency(settlement.monthlyDifference)} / Monat), um künftige hohe Nachzahlungen zu vermeiden.`;
    const splitAdjust = doc.splitTextToSize(adjustText, contentWidth - 6);
    doc.text(splitAdjust, marginX + 3, currentY + 7.5);
    currentY += 14;
  }

  // 11. Meter Readings Table (if any)
  if (settlement.meterConsumptions && settlement.meterConsumptions.length > 0) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Zählerablesung & Verbrauchswerte für Ihre Wohneinheit:', marginX, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

    settlement.meterConsumptions.forEach((mc) => {
      const line = `· ${mc.typeLabel} (Zähler-Nr. ${mc.meterNumber}${mc.location ? `, ${mc.location}` : ''}): Stand Alt: ${formatNumber(mc.startReading, 1)} ${mc.unit} → Stand Neu: ${formatNumber(mc.endReading, 1)} ${mc.unit} = Verbrauch: ${formatNumber(mc.consumption, 1)} ${mc.unit}`;
      doc.text(line, marginX + 2, currentY);
      currentY += 3.8;
    });
    currentY += 2;
  }

  // 12. Legal Notice (§ 556 Abs. 3 BGB)
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  const legalNote =
    `Gesetzlicher Hinweis: Gemäß § 556 Abs. 3 BGB können Einwendungen gegen diese Abrechnung nur innerhalb von ` +
    `12 Monaten nach Erhalt geltend gemacht werden. Die zugehörigen Belege (siehe Beleg-Nummern oben) können ` +
    `nach vorheriger Terminabsprache beim Vermieter eingesehen werden.`;
  const splitLegal = doc.splitTextToSize(legalNote, contentWidth);
  doc.text(splitLegal, marginX, currentY);
  currentY += splitLegal.length * 3.2 + 3.5;

  // 13. Signature
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(`Mit freundlichen Grüßen`, marginX, currentY);
  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(appData.landlord.name, marginX, currentY);

  // 14. Bottom Bank Footer
  const footerY = pageHeight - 10;
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.line(marginX, footerY - 2.5, marginX + contentWidth, footerY - 2.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);

  const bankLine = `Bankverbindung: ${appData.landlord.bankName} · IBAN: ${appData.landlord.iban} · BIC: ${appData.landlord.bic} · Kontakt: ${appData.landlord.phone || appData.landlord.email || ''}`;
  doc.text(bankLine, pageWidth / 2, footerY, { align: 'center' });

  return doc;
}

export function generateTenantSettlementPdf(
  appData: AppData,
  settlement: TenantSettlement
): void {
  const doc = buildTenantSettlementPdfDoc(appData, settlement);
  const filename = `Betriebskostenabrechnung_${settlement.year}_${settlement.unitNumber.replace(/\s+/g, '_')}_${settlement.tenantName.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

export function getTenantSettlementPdfBase64(
  appData: AppData,
  settlement: TenantSettlement
): string {
  const doc = buildTenantSettlementPdfDoc(appData, settlement);
  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1] || '';
}
