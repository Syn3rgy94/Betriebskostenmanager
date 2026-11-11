import React, { useState } from 'react';
import { Download, Printer, X, CheckCircle, AlertCircle, FileText, Gauge, Sparkles, FolderUp, ExternalLink, RefreshCw } from 'lucide-react';
import { AppData, TenantSettlement } from '../types';
import { formatCurrency, formatDateGerman, formatNumber } from '../utils/calculator';
import { generateTenantSettlementPdf, getTenantSettlementPdfBase64 } from '../utils/pdfGenerator';
import { uploadSettlementToPaperless } from '../services/paperless';

interface Din5008ModalProps {
  appData: AppData;
  settlement: TenantSettlement | null;
  onClose: () => void;
}

export const Din5008Modal: React.FC<Din5008ModalProps> = ({
  appData,
  settlement,
  onClose,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message?: string;
    documentId?: number;
  } | null>(null);

  if (!settlement) return null;

  const handleDownloadPdf = () => {
    generateTenantSettlementPdf(appData, settlement);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUploadToPaperless = async () => {
    if (!appData.paperless || !settlement) return;
    setIsUploading(true);
    setUploadResult(null);

    try {
      const pdfBase64 = getTenantSettlementPdfBase64(appData, settlement);
      const title = `Betriebskostenabrechnung ${settlement.year} - ${settlement.unitNumber} - ${settlement.tenantName}`;
      const tags = [
        ...(appData.paperless.defaultTags || ['Betriebskosten']),
        `Abrechnung ${settlement.year}`,
        appData.property.name,
      ];
      const correspondent = `${settlement.salutation} ${settlement.tenantName}`;

      const res = await uploadSettlementToPaperless(
        appData.paperless,
        title,
        pdfBase64,
        tags,
        correspondent
      );
      setUploadResult(res);
    } catch (err: any) {
      setUploadResult({
        success: false,
        message: err.message || 'Fehler beim Hochladen nach Paperless-ngx',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const isRefund = settlement.balance < 0;
  const isZero = settlement.balance === 0;

  const salutationGreeting = settlement.salutation.includes('Familie')
    ? 'Sehr geehrte Familie Becker,'
    : settlement.salutation.includes('Frau')
    ? `Sehr geehrte ${settlement.salutation} ${settlement.tenantName.split(' ').slice(1).join(' ')},`
    : `Sehr geehrter ${settlement.salutation.replace('Herrn', 'Herr')} ${settlement.tenantName.split(' ').slice(1).join(' ')},`;

  const paperlessServerUrl = appData.paperless?.serverUrl || 'http://192.168.178.50:8000';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden my-auto">
        {/* Top Action Bar (no-print) */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 gap-3 no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              DIN-5008 Abrechnungsvorschau: {settlement.tenantName} ({settlement.year})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Paperless 1-Click Upload */}
            {appData.paperless?.enabled && (
              <button
                onClick={handleUploadToPaperless}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors shadow-2xs disabled:opacity-50"
                title="Abrechnung direkt als PDF in Ihr Paperless-ngx Belegarchiv übertragen"
              >
                {isUploading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FolderUp className="w-3.5 h-3.5" />
                )}
                <span>
                  {uploadResult?.success
                    ? 'In Paperless archiviert ✓'
                    : isUploading
                    ? 'Wird übertragen...'
                    : 'An Paperless senden'}
                </span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Drucken</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF herunterladen</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paperless Upload Result Banner */}
        {uploadResult && (
          <div
            className={`px-6 py-2.5 text-xs border-b flex items-center justify-between gap-3 no-print ${
              uploadResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {uploadResult.success ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>
                {uploadResult.success
                  ? `Erfolgreich an Paperless-ngx übertragen! Dokument-ID: #${uploadResult.documentId || 'neu'}`
                  : uploadResult.message}
              </span>
            </div>
            {uploadResult.success && uploadResult.documentId && (
              <a
                href={`${paperlessServerUrl}/documents/${uploadResult.documentId}/details`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold underline hover:no-underline"
              >
                <span>In Paperless öffnen</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* DIN 5008 Document Sheet Viewport */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-200/60 dark:bg-slate-950/80 flex justify-center">
          <div className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 shadow-md rounded-sm border border-slate-200 dark:border-slate-700 text-xs font-sans relative selection:bg-blue-100">
            {/* Visual Fold marks (DIN 5008 Faltmarken) */}
            <div className="absolute left-1 top-[87mm] w-2 h-[1px] bg-slate-300 no-print" title="Faltmarke 1" />
            <div className="absolute left-1 top-[105mm] w-3 h-[1px] bg-slate-300 no-print" title="Lochmarke" />
            <div className="absolute left-1 top-[192mm] w-2 h-[1px] bg-slate-300 no-print" title="Faltmarke 2" />

            {/* 1. DIN 5008 Absenderzeile (5mm, 7.5pt) */}
            <div className="text-[10px] text-slate-500 pb-1 border-b border-slate-300 mb-6">
              {appData.landlord.name} · {appData.landlord.street} · {appData.landlord.zip} {appData.landlord.city}
            </div>

            {/* 2. Anschriftenfeld & Infoblock nebeneinander */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
              {/* Anschrift des Mieters */}
              <div className="space-y-1">
                <div className="text-slate-600 text-[11px]">{settlement.salutation}</div>
                <div className="text-sm font-bold text-slate-900">{settlement.tenantName}</div>
                <div className="text-slate-800">
                  {appData.property.street} ({settlement.unitNumber}, {settlement.unitFloor})
                </div>
                <div className="text-slate-800">
                  {appData.property.zip} {appData.property.city}
                </div>
              </div>

              {/* Referenzblock rechts */}
              <div className="text-right space-y-1 text-[11px] text-slate-600 font-mono">
                <div>
                  <span className="text-slate-400">Datum: </span>
                  <span className="font-semibold text-slate-800">
                    {formatDateGerman(new Date().toISOString().split('T')[0])}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Objekt: </span>
                  <span className="text-slate-800">{appData.property.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Wohnfläche: </span>
                  <span className="text-slate-800">{formatNumber(settlement.unitArea, 1)} m²</span>
                </div>
                <div>
                  <span className="text-slate-400">Personen: </span>
                  <span className="text-slate-800">{settlement.unitPersons} Personen</span>
                </div>
                <div>
                  <span className="text-slate-400">Abrechnungszeitraum: </span>
                  <span className="text-slate-800">
                    {formatDateGerman(settlement.billingPeriodStart)} – {formatDateGerman(settlement.billingPeriodEnd)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Nutzungsdauer: </span>
                  <span className="text-slate-800">
                    {settlement.daysActive} von {settlement.daysInYear} Tagen
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Betreffzeile */}
            <div className="mb-4">
              <h2 className="text-base font-bold text-blue-900 tracking-tight">
                Betriebskostenabrechnung für das Abrechnungsjahr {settlement.year}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Wohnung {settlement.unitNumber} ({settlement.unitFloor}) in {appData.property.street}, {appData.property.zip} {appData.property.city}
              </p>
            </div>

            {/* 4. Anschreiben Fließtext */}
            <div className="space-y-2 mb-6 leading-relaxed text-slate-800 text-[11px]">
              <p>{salutationGreeting}</p>
              <p>
                anbei erhalten Sie die formelle Abrechnung der Betriebskosten für das Kalenderjahr {settlement.year} gemäß § 556 BGB sowie der Betriebskostenverordnung (BetrKV).
                Die Verteilung der Gesamtkosten erfolgte transparent anhand der nachfolgend aufgeführten gesetzlichen und vertraglichen Abrechnungsschlüssel sowie der abgelesenen Zählerstände.
              </p>
            </div>

            {/* 5. BetrKV Aufstellungstabelle */}
            <div className="border border-slate-300 rounded-sm overflow-hidden mb-6">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="py-2 px-3">Kostenart (§ 2 BetrKV)</th>
                    <th className="py-2 px-2">Beleg-Nr.</th>
                    <th className="py-2 px-2 text-right">Gesamtkosten</th>
                    <th className="py-2 px-2">Umlageschlüssel</th>
                    <th className="py-2 px-2">Ihr Anteil / Gesamt</th>
                    <th className="py-2 px-3 text-right">Ihr Betrag (€)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {settlement.positions.map((pos) => {
                    let shareStr = '';
                    if (pos.allocationKey === 'm2') {
                      shareStr = `${formatNumber(pos.tenantUnitsValue, 1)} / ${formatNumber(pos.totalUnitsValue, 0)} m²`;
                    } else if (pos.allocationKey === 'persons') {
                      shareStr = `${pos.tenantUnitsValue} / ${pos.totalUnitsValue} Pers.`;
                    } else if (pos.allocationKey === 'units') {
                      shareStr = `1 / ${pos.totalUnitsValue} WE`;
                    } else if (pos.allocationKey === 'mea') {
                      shareStr = `${pos.tenantUnitsValue} / ${pos.totalUnitsValue} MEA`;
                    } else if (pos.allocationKey === 'consumption') {
                      shareStr = `${formatNumber(pos.tenantUnitsValue, 1)} / ${formatNumber(pos.totalUnitsValue, 1)} m³`;
                    } else {
                      shareStr = 'Direkt';
                    }

                    return (
                      <tr key={pos.categoryNumber} className="hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-900">
                            Nr. {pos.categoryNumber} {pos.categoryName}
                          </span>
                          {pos.details && (
                            <div className="text-[10px] text-slate-500 truncate max-w-xs">
                              {pos.details}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 font-mono text-[10px] text-slate-500">
                          {pos.receiptNumber || '—'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-700">
                          {formatCurrency(pos.totalCost)}
                        </td>
                        <td className="py-2 px-2 text-slate-700">
                          {pos.keyLabel}
                        </td>
                        <td className="py-2 px-2 font-mono text-slate-700">
                          {shareStr}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatCurrency(pos.tenantCost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 6. Berechnungssaldo Box */}
            <div className="bg-slate-50 border border-slate-300 rounded-sm p-4 mb-6 space-y-2">
              <div className="flex justify-between text-xs text-slate-800">
                <span>Ihre anteiligen Gesamtkosten ({settlement.year}):</span>
                <span className="font-mono font-bold tabular-nums">
                  {formatCurrency(settlement.totalTenantCost)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-800">
                <span>Ihre geleisteten Vorauszahlungen:</span>
                <span className="font-mono tabular-nums text-slate-700">
                  - {formatCurrency(settlement.prepayments)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-300 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900">
                  {isRefund
                    ? 'Abrechnungssaldo (Guthaben):'
                    : isZero
                    ? 'Abrechnungssaldo:'
                    : 'Abrechnungssaldo (Nachzahlung):'}
                </span>
                <span
                  className={`text-base font-bold font-mono tabular-nums ${
                    isRefund
                      ? 'text-emerald-700'
                      : isZero
                      ? 'text-slate-900'
                      : 'text-rose-700'
                  }`}
                >
                  {isRefund
                    ? `- ${formatCurrency(Math.abs(settlement.balance))}`
                    : formatCurrency(settlement.balance)}
                </span>
              </div>
            </div>

            {/* 7. Zahlungsanweisung / Erstattungsvermerk */}
            <div className="text-[11px] text-slate-800 space-y-2 mb-6">
              {!isRefund && !isZero && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-sm">
                  <strong>Zahlungsaufforderung: </strong>
                  Bitte überweisen Sie den Nachzahlungsbetrag von{' '}
                  <strong className="font-mono">{formatCurrency(settlement.balance)}</strong> bis zum{' '}
                  <strong>{formatDateGerman(settlement.paymentDueDate)}</strong> auf das unten genannte
                  Konto des Vermieters unter Angabe des Verwendungszwecks:{' '}
                  <span className="font-mono">
                    "BK {settlement.year} - {settlement.tenantName}"
                  </span>
                  .
                </div>
              )}

              {isRefund && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm">
                  <strong>Erstattungsvermerk: </strong>
                  Das Guthaben zu Ihren Gunsten in Höhe von{' '}
                  <strong className="font-mono">{formatCurrency(Math.abs(settlement.balance))}</strong>{' '}
                  wird Ihnen zeitnah auf Ihr bekanntes Bankkonto überwiesen bzw. mit der übernächsten
                  Mietüberweisung verrechnet.
                </div>
              )}

              {isZero && (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-sm">
                  Die Abrechnung ist ausgeglichen. Es besteht kein Nachzahlungs- oder Erstattungsanspruch.
                </div>
              )}
            </div>

            {/* 8. Advance Payment Adjustment Clause (§ 560 Abs. 4 BGB) */}
            {settlement.includeAdjustmentClause && settlement.monthlyDifference !== 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-[11px] text-amber-900 mb-6">
                <strong>Anpassung der monatlichen Vorauszahlung gemäß § 560 Abs. 4 BGB: </strong>
                Aufgrund der tatsächlichen Kostenentwicklung wird die monatliche Vorauszahlung ab dem Folgemonat
                von bisher <span className="font-mono font-semibold">{formatCurrency(settlement.prepayments / 12)}</span> auf neu{' '}
                <strong className="font-mono">{formatCurrency(settlement.recommendedMonthlyPrepayment)}</strong> angepasst
                (+{formatCurrency(settlement.monthlyDifference)} / Monat), um künftige Nachforderungen zu vermeiden.
              </div>
            )}

            {/* 9. Meter Readings Section */}
            {settlement.meterConsumptions.length > 0 && (
              <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-sm text-[11px]">
                <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-blue-700" />
                  Zählerablesungen & Verbräuche für Ihre Wohnung:
                </div>
                <div className="space-y-1">
                  {settlement.meterConsumptions.map((mc, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700 font-mono">
                      <span>
                        · {mc.typeLabel} ({mc.meterNumber}{mc.location ? `, ${mc.location}` : ''}): Stand Alt: {formatNumber(mc.startReading, 1)} {mc.unit} → Stand Neu: {formatNumber(mc.endReading, 1)} {mc.unit}
                      </span>
                      <strong className="text-slate-900">
                        = {formatNumber(mc.consumption, 1)} {mc.unit}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10. Gesetzliche Belehrung (§ 556 Abs. 3 BGB) */}
            <div className="text-[10px] text-slate-500 italic mb-8 border-l-2 border-slate-300 pl-3">
              Gesetzlicher Hinweis: Gemäß § 556 Abs. 3 BGB können Einwendungen gegen diese Abrechnung nur
              innerhalb von 12 Monaten nach Zugang geltend gemacht werden. Originalbelege und
              Rechnungen können nach vorheriger Terminabsprache beim Vermieter eingesehen werden.
            </div>

            {/* 11. Grußformel & Unterschrift */}
            <div className="text-[11px] text-slate-800 space-y-8 mb-8">
              <div>Mit freundlichen Grüßen</div>
              <div className="font-bold">{appData.landlord.name}</div>
            </div>

            {/* 12. Fußbereich Bankdaten */}
            <div className="border-t border-slate-300 pt-3 text-[10px] text-slate-500 text-center font-mono">
              Bankverbindung: {appData.landlord.bankName} · IBAN: {appData.landlord.iban} · BIC:{' '}
              {appData.landlord.bic} · Kontakt: {appData.landlord.phone || appData.landlord.email}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
