import React, { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Calendar,
  Building,
  User,
  ArrowRight,
  Printer,
  Sparkles,
  TrendingUp,
  Percent,
  Check,
  Gauge,
  FolderUp,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { AppData, Tenant, TenantSettlement } from '../types';
import {
  calculateTenantSettlement,
  formatCurrency,
  formatDateGerman,
  formatNumber,
} from '../utils/calculator';
import { generateTenantSettlementPdf, getTenantSettlementPdfBase64 } from '../utils/pdfGenerator';
import { uploadSettlementToPaperless } from '../services/paperless';
import { Din5008Modal } from './Din5008Modal';

interface SettlementViewProps {
  appData: AppData;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  onUpdateTenantPrepayment?: (tenantId: string, newPrepayment: number) => void;
}

export const SettlementView: React.FC<SettlementViewProps> = ({
  appData,
  selectedYear,
  setSelectedYear,
  availableYears,
  onUpdateTenantPrepayment,
}) => {
  const [activePreviewSettlement, setActivePreviewSettlement] =
    useState<TenantSettlement | null>(null);

  // Safety buffer state (0%, 5%, 10%)
  const [bufferPercent, setBufferPercent] = useState<number>(5);
  const [updatedSuccessIds, setUpdatedSuccessIds] = useState<string[]>([]);

  // Paperless upload state
  const [uploadingTenantIds, setUploadingTenantIds] = useState<string[]>([]);
  const [isBatchUploading, setIsBatchUploading] = useState<boolean>(false);
  const [uploadedDocMap, setUploadedDocMap] = useState<Record<string, number>>({});
  const [paperlessStatusMsg, setPaperlessStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Compute all tenant settlements for the year
  const activeTenants = appData.tenants.filter((t) =>
    t.activeYears ? t.activeYears.includes(selectedYear) : true
  );

  const settlements: TenantSettlement[] = activeTenants
    .map((tenant) => calculateTenantSettlement(appData, tenant, selectedYear, bufferPercent))
    .filter((s): s is TenantSettlement => s !== null);

  // Totals
  const totalTenantCosts = settlements.reduce((sum, s) => sum + s.totalTenantCost, 0);
  const totalPrepayments = settlements.reduce((sum, s) => sum + s.prepayments, 0);
  const overallBalance = Math.round((totalTenantCosts - totalPrepayments) * 100) / 100;

  const handleDownloadAll = () => {
    settlements.forEach((s, idx) => {
      setTimeout(() => {
        generateTenantSettlementPdf(appData, s);
      }, idx * 250);
    });
  };

  const handleApplyPrepayment = (tenantId: string, newAmount: number) => {
    if (onUpdateTenantPrepayment) {
      onUpdateTenantPrepayment(tenantId, newAmount);
      setUpdatedSuccessIds((prev) => [...prev, tenantId]);
      setTimeout(() => {
        setUpdatedSuccessIds((prev) => prev.filter((id) => id !== tenantId));
      }, 2500);
    }
  };

  const handleUploadSingleToPaperless = async (settlement: TenantSettlement) => {
    if (!appData.paperless) return;
    setUploadingTenantIds((prev) => [...prev, settlement.tenantId]);
    setPaperlessStatusMsg(null);

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

      if (res.success && res.documentId) {
        setUploadedDocMap((prev) => ({ ...prev, [settlement.tenantId]: res.documentId! }));
        setPaperlessStatusMsg({
          type: 'success',
          text: `Abrechnung für ${settlement.tenantName} erfolgreich an Paperless-ngx übertragen (Dokument #${res.documentId}).`,
        });
      } else {
        setPaperlessStatusMsg({
          type: 'error',
          text: res.message || 'Upload nach Paperless-ngx fehlgeschlagen.',
        });
      }
    } catch (err: any) {
      setPaperlessStatusMsg({
        type: 'error',
        text: err.message || 'Fehler beim Upload nach Paperless-ngx.',
      });
    } finally {
      setUploadingTenantIds((prev) => prev.filter((id) => id !== settlement.tenantId));
    }
  };

  const handleUploadAllToPaperless = async () => {
    if (!appData.paperless || settlements.length === 0) return;
    setIsBatchUploading(true);
    setPaperlessStatusMsg(null);
    let successCount = 0;

    for (const s of settlements) {
      try {
        const pdfBase64 = getTenantSettlementPdfBase64(appData, s);
        const title = `Betriebskostenabrechnung ${s.year} - ${s.unitNumber} - ${s.tenantName}`;
        const tags = [
          ...(appData.paperless.defaultTags || ['Betriebskosten']),
          `Abrechnung ${s.year}`,
          appData.property.name,
        ];
        const correspondent = `${s.salutation} ${s.tenantName}`;

        const res = await uploadSettlementToPaperless(
          appData.paperless,
          title,
          pdfBase64,
          tags,
          correspondent
        );

        if (res.success && res.documentId) {
          successCount++;
          setUploadedDocMap((prev) => ({ ...prev, [s.tenantId]: res.documentId! }));
        }
      } catch (err) {
        console.error('Batch upload error for', s.tenantName, err);
      }
    }

    setIsBatchUploading(false);
    setPaperlessStatusMsg({
      type: 'success',
      text: `${successCount} von ${settlements.length} Abrechnungs-PDFs wurden erfolgreich an Ihr Paperless-ngx Belegarchiv übertragen.`,
    });
  };

  const paperlessServerUrl = appData.paperless?.serverUrl || 'http://192.168.178.50:8000';

  return (
    <div className="space-y-6">
      {/* Header and Summary Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Rechtssichere Mieterabrechnung</span>
              <span aria-hidden="true">·</span>
              <span>DIN 5008 Standard</span>
              <span aria-hidden="true">·</span>
              <span>Paperless-ngx Archiv</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
              Betriebskostenabrechnungen für das Jahr {selectedYear}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automatische Berechnung von {settlements.length} Mietparteien mit Zählerablesung, Belegverzeichnis und Paperless-Archivierung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Buffer Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400 px-1.5">Puffer § 560:</span>
              {[0, 5, 10].map((b) => (
                <button
                  key={b}
                  onClick={() => setBufferPercent(b)}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    bufferPercent === b
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  +{b}%
                </button>
              ))}
            </div>

            {/* Paperless Batch Upload Button */}
            {appData.paperless?.enabled && (
              <button
                onClick={handleUploadAllToPaperless}
                disabled={settlements.length === 0 || isBatchUploading}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-2xs whitespace-nowrap"
                title="Alle erzeugten Abrechnungs-PDFs gebündelt an Paperless-ngx übertragen"
              >
                {isBatchUploading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FolderUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <span>
                  {isBatchUploading
                    ? 'Übertrage an Paperless...'
                    : `Alle ${settlements.length} an Paperless senden`}
                </span>
              </button>
            )}

            <button
              onClick={handleDownloadAll}
              disabled={settlements.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Alle {settlements.length} PDFs herunterladen</span>
            </button>
          </div>
        </div>

        {/* Paperless Global Status Alert */}
        {paperlessStatusMsg && (
          <div
            className={`mt-4 p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
              paperlessStatusMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {paperlessStatusMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{paperlessStatusMsg.text}</span>
            </div>
            <button
              onClick={() => setPaperlessStatusMsg(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-medium"
            >
              Ausblenden
            </button>
          </div>
        )}

        {/* Aggregate Financial Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Anteilige Kosten aller Mieter
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {formatCurrency(totalTenantCosts)}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Geleistete Vorauszahlungen (Gesamt)
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {formatCurrency(totalPrepayments)}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Gesamtsaldo der Liegenschaft
            </div>
            <div
              className={`text-xl font-bold font-mono tabular-nums mt-1 ${
                overallBalance > 0
                  ? 'text-rose-700 dark:text-rose-400'
                  : overallBalance < 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {overallBalance > 0
                ? `+ ${formatCurrency(overallBalance)} (Nachzahlung)`
                : overallBalance < 0
                ? `- ${formatCurrency(Math.abs(overallBalance))} (Guthaben)`
                : '0,00 € (Ausgeglichen)'}
            </div>
          </div>
        </div>
      </div>

      {/* Tenant Settlements List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {settlements.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Keine aktiven Mietparteien für {selectedYear}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Für das ausgewählte Jahr konnten keine Mietverhältnisse oder erfassten Kosten gefunden werden.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {settlements.map((settlement) => {
              const isRefund = settlement.balance < 0;
              const isZero = settlement.balance === 0;
              const isUpdated = updatedSuccessIds.includes(settlement.tenantId);

              return (
                <div
                  key={settlement.tenantId}
                  className="p-5 sm:p-6 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors flex flex-col xl:flex-row xl:items-center justify-between gap-6"
                >
                  {/* Left Column: Tenant and Unit details */}
                  <div className="space-y-1.5 min-w-[240px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {settlement.salutation} {settlement.tenantName}
                      </span>
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono font-medium">
                        {settlement.unitNumber}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{settlement.unitFloor}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatNumber(settlement.unitArea, 1)} m²
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {settlement.unitPersons} {settlement.unitPersons === 1 ? 'Person' : 'Personen'}
                      </span>
                    </div>

                    {/* Meter pills if any */}
                    {settlement.meterConsumptions.length > 0 && (
                      <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <Gauge className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>
                          {settlement.meterConsumptions.map((mc) => `${mc.typeLabel}: ${formatNumber(mc.consumption, 1)} ${mc.unit}`).join(' · ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Middle Column: Financial Breakdown */}
                  <div className="flex items-center gap-6 sm:gap-8 text-xs">
                    <div>
                      <div className="text-slate-400 text-[11px]">Kostenanteil</div>
                      <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums text-sm">
                        {formatCurrency(settlement.totalTenantCost)}
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 text-[11px]">Vorauszahlung</div>
                      <div className="font-mono text-slate-700 dark:text-slate-300 tabular-nums text-sm">
                        {formatCurrency(settlement.prepayments)}
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 text-[11px]">Abrechnungssaldo</div>
                      <div
                        className={`font-mono font-bold tabular-nums text-sm ${
                          isRefund
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : isZero
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {isRefund
                          ? `- ${formatCurrency(Math.abs(settlement.balance))}`
                          : `+ ${formatCurrency(settlement.balance)}`}
                      </div>
                      <div
                        className={`text-[10px] font-medium ${
                          isRefund
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isZero
                            ? 'text-slate-500'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isRefund ? 'Guthaben' : isZero ? 'Ausgeglichen' : 'Nachzahlung'}
                      </div>
                    </div>
                  </div>

                  {/* Advance payment adjustment (§ 560 BGB) Assistant */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-[280px]">
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        Vorauszahlung (§ 560 BGB)
                      </div>
                      <div className="text-xs text-slate-800 dark:text-slate-200 mt-0.5">
                        Aktuell:{' '}
                        <span className="font-mono font-medium">
                          {formatCurrency(settlement.prepayments / 12)}
                        </span>
                        {' → '}
                        Empfohlen:{' '}
                        <strong className="font-mono text-blue-700 dark:text-blue-400">
                          {formatCurrency(settlement.recommendedMonthlyPrepayment)}
                        </strong>
                      </div>
                    </div>

                    {onUpdateTenantPrepayment && (
                      <button
                        onClick={() =>
                          handleApplyPrepayment(
                            settlement.tenantId,
                            settlement.recommendedMonthlyPrepayment
                          )
                        }
                        disabled={isUpdated}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                          isUpdated
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900'
                        }`}
                        title="Übernimmt die empfohlene Vorauszahlung in die Mieterakte für künftige Abrechnungen"
                      >
                        {isUpdated ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Übernommen</span>
                          </>
                        ) : (
                          <span>Übernehmen</span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Paperless Status or Upload button */}
                    {appData.paperless?.enabled && (
                      <>
                        {uploadedDocMap[settlement.tenantId] ? (
                          <a
                            href={`${paperlessServerUrl}/documents/${uploadedDocMap[settlement.tenantId]}/details`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:underline transition-colors shadow-2xs"
                            title="In Paperless-ngx öffnen"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>In Paperless (#{uploadedDocMap[settlement.tenantId]})</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </a>
                        ) : (
                          <button
                            onClick={() => handleUploadSingleToPaperless(settlement)}
                            disabled={uploadingTenantIds.includes(settlement.tenantId)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors shadow-2xs disabled:opacity-50"
                            title="Abrechnungs-PDF direkt nach Paperless-ngx übertragen"
                          >
                            {uploadingTenantIds.includes(settlement.tenantId) ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FolderUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            )}
                            <span>Paperless</span>
                          </button>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => setActivePreviewSettlement(settlement)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                      title="Vorschau nach DIN 5008 anzeigen"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Vorschau</span>
                    </button>

                    <button
                      onClick={() => generateTenantSettlementPdf(appData, settlement)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-2xs"
                      title="PDF sofort herunterladen"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DIN 5008 Modal Preview */}
      {activePreviewSettlement && (
        <Din5008Modal
          appData={appData}
          settlement={activePreviewSettlement}
          onClose={() => setActivePreviewSettlement(null)}
        />
      )}
    </div>
  );
};
