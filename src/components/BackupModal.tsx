import React, { useRef, useState } from 'react';
import { Download, Upload, RefreshCw, X, CheckCircle, AlertTriangle, ShieldCheck, HardDrive } from 'lucide-react';
import { AppData } from '../types';
import { exportBackupJson, parseAndValidateBackup } from '../services/api';
import { INITIAL_APP_DATA } from '../constants/initialData';

interface BackupModalProps {
  appData: AppData;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (data: AppData) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  appData,
  isOpen,
  onClose,
  onRestore,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDownload = () => {
    exportBackupJson(appData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const validatedData = parseAndValidateBackup(content);
        onRestore(validatedData);
        setImportStatus('Backup erfolgreich wiederhergestellt!');
        setErrorMessage(null);
        setTimeout(() => {
          setImportStatus(null);
          onClose();
        }, 1500);
      } catch (err: any) {
        setErrorMessage(err.message || 'Die ausgewählte Datei konnte nicht als Backup gelesen werden.');
        setImportStatus(null);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetToDemo = () => {
    if (
      confirm(
        'Möchten Sie alle aktuellen Daten auf den vorkonfigurierten Musterdatenstand (4 Einheiten, 2022-2025) zurücksetzen?'
      )
    ) {
      onRestore(INITIAL_APP_DATA);
      setImportStatus('Musterdaten erfolgreich geladen!');
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Lokales Daten-Backup & Export
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              <strong>100% Lokale Datensouveränität:</strong> Ihre Daten werden direkt auf Ihrem Heimserver
              unter <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded font-mono">./data/betriebskosten_db.json</code> sowie
              im lokalen Speicher Ihres Browsers gesichert. Es werden keine Daten an externe Cloud-Server übertragen.
            </div>
          </div>

          {importStatus && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action 1: Export JSON */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Vollständiges Backup herunterladen
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sichert alle Liegenschaften, Einheiten, Mieter und Kostenverläufe als JSON-Datei.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportieren</span>
            </button>
          </div>

          {/* Action 2: Import Backup */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Backup-Datei wiederherstellen
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Stellt einen gesicherten Datenbestand aus einer vorherigen JSON-Sicherung wieder her.
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importieren</span>
            </button>
          </div>

          {/* Action 3: Reset to sample data */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Musterdaten laden
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Setzt die Datenbank auf das realistische 4-Parteien-Musterbeispiel zurück.
              </p>
            </div>
            <button
              onClick={handleResetToDemo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Zurücksetzen</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
