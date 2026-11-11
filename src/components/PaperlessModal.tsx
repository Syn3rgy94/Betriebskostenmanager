import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  ExternalLink,
  Check,
  X,
  RefreshCw,
  Tag,
  Calendar,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { PaperlessConfig, PaperlessDocument } from '../types';
import { searchPaperlessDocuments } from '../services/paperless';
import { formatDateGerman } from '../utils/calculator';

interface PaperlessModalProps {
  paperlessConfig?: PaperlessConfig;
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument: (doc: PaperlessDocument) => void;
  defaultSearchQuery?: string;
}

export const PaperlessModal: React.FC<PaperlessModalProps> = ({
  paperlessConfig,
  isOpen,
  onClose,
  onSelectDocument,
  defaultSearchQuery = '',
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState(defaultSearchQuery);
  const [documents, setDocuments] = useState<PaperlessDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSimulated, setIsSimulated] = useState(false);

  const fetchDocs = async (searchQ?: string) => {
    if (!paperlessConfig) return;
    setLoading(true);
    const res = await searchPaperlessDocuments(paperlessConfig, searchQ);
    if (res.success) {
      setDocuments(res.results || []);
      setIsSimulated(!!res.isSimulated);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs(defaultSearchQuery);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocs(query);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Beleg aus Paperless-ngx auswählen
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Server: <span className="font-mono">{paperlessConfig?.serverUrl || 'lokal'}</span>
                {isSimulated && ' (Heimnetzwerk-Modus)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Dokumentensuche in Paperless-ngx (Titel, Schlagwort, Rechnungssteller)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shrink-0"
            >
              Suchen
            </button>
          </form>
        </div>

        {/* Document List Viewport */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span>Verbinde mit Paperless-ngx...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-1">
              <div>Keine passenden Dokumente in Paperless-ngx gefunden.</div>
              <div className="text-[11px] text-slate-400">
                Prüfen Sie den Suchbegriff oder die Tags in Paperless.
              </div>
            </div>
          ) : (
            documents.map((doc) => {
              const paperlessDocUrl = `${paperlessConfig?.serverUrl?.replace(/\/+$/, '')}/documents/${doc.id}/details`;

              return (
                <div
                  key={doc.id}
                  className="py-3 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {doc.title}
                      </span>
                      <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded shrink-0">
                        ID #{doc.id}
                      </span>
                      {doc.asn && (
                        <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded shrink-0">
                          ASN #{doc.asn}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                      <span>Erstellt: {formatDateGerman(doc.created?.split('T')[0])}</span>
                      {doc.originalFileName && (
                        <span className="truncate max-w-[200px]">
                          Datei: {doc.originalFileName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={paperlessDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                      title="In Paperless-ngx öffnen"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => onSelectDocument(doc)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-md transition-colors shadow-2xs"
                    >
                      <Check className="w-3 h-3" />
                      <span>Verknüpfen</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
