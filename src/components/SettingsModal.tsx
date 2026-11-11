import React, { useState } from 'react';
import {
  X,
  Building2,
  User,
  Landmark,
  Save,
  Check,
  FolderOpen,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { AppData, LandlordProfile, PaperlessConfig, Property } from '../types';
import { testPaperlessConnection } from '../services/paperless';

interface SettingsModalProps {
  appData: AppData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    updatedLandlord: LandlordProfile,
    updatedProperty: Property,
    updatedPaperless?: PaperlessConfig
  ) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  appData,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [landlord, setLandlord] = useState<LandlordProfile>({ ...appData.landlord });
  const [property, setProperty] = useState<Property>({ ...appData.property });
  const [paperless, setPaperless] = useState<PaperlessConfig>({
    enabled: appData.paperless?.enabled ?? true,
    serverUrl: appData.paperless?.serverUrl || 'http://192.168.178.50:8000',
    apiToken: appData.paperless?.apiToken || '',
    defaultTags: appData.paperless?.defaultTags || [
      'Betriebskosten',
      `Liegenschaft ${appData.property.name.split(' ')[1] || 'Haus'}`,
    ],
  });

  const [tagsInput, setTagsInput] = useState(paperless.defaultTags.join(', '));
  const [activeTab, setActiveTab] = useState<'landlord' | 'property' | 'paperless'>('landlord');

  // Test connection state
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    isSimulated?: boolean;
  } | null>(null);

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    const res = await testPaperlessConnection(paperless.serverUrl, paperless.apiToken);
    setTestResult(res);
    setTestLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updatedPaperless: PaperlessConfig = {
      ...paperless,
      defaultTags: parsedTags,
    };

    onSave(landlord, property, updatedPaperless);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Stammdaten & Paperless-ngx
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vermieterprofil, Liegenschaftsdaten und Paperless-Archivanbindung
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Sub Tabs */}
        <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('landlord')}
            className={`flex items-center gap-1.5 pb-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'landlord'
                ? 'border-blue-700 dark:border-blue-400 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Vermieter & Bank
          </button>
          <button
            onClick={() => setActiveTab('property')}
            className={`flex items-center gap-1.5 pb-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'property'
                ? 'border-blue-700 dark:border-blue-400 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Liegenschaft
          </button>
          <button
            onClick={() => setActiveTab('paperless')}
            className={`flex items-center gap-1.5 pb-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'paperless'
                ? 'border-blue-700 dark:border-blue-400 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Paperless-ngx
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {activeTab === 'landlord' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vermieter Name / Ansprechpartner *
                  </label>
                  <input
                    type="text"
                    required
                    value={landlord.name}
                    onChange={(e) => setLandlord({ ...landlord, name: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Firma / Hausverwaltung (optional)
                  </label>
                  <input
                    type="text"
                    value={landlord.company || ''}
                    onChange={(e) => setLandlord({ ...landlord, company: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Straße & Hausnummer *
                </label>
                <input
                  type="text"
                  required
                  value={landlord.street}
                  onChange={(e) => setLandlord({ ...landlord, street: e.target.value })}
                  className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PLZ *
                  </label>
                  <input
                    type="text"
                    required
                    value={landlord.zip}
                    onChange={(e) => setLandlord({ ...landlord, zip: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ort *
                  </label>
                  <input
                    type="text"
                    required
                    value={landlord.city}
                    onChange={(e) => setLandlord({ ...landlord, city: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  Bankverbindung für Nachzahlungsüberweisungen
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kreditinstitut (Bankname) *
                    </label>
                    <input
                      type="text"
                      required
                      value={landlord.bankName}
                      onChange={(e) => setLandlord({ ...landlord, bankName: e.target.value })}
                      className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        IBAN *
                      </label>
                      <input
                        type="text"
                        required
                        value={landlord.iban}
                        onChange={(e) => setLandlord({ ...landlord, iban: e.target.value })}
                        className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        BIC *
                      </label>
                      <input
                        type="text"
                        required
                        value={landlord.bic}
                        onChange={(e) => setLandlord({ ...landlord, bic: e.target.value })}
                        className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'property' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bezeichnung der Liegenschaft *
                </label>
                <input
                  type="text"
                  required
                  value={property.name}
                  onChange={(e) => setProperty({ ...property, name: e.target.value })}
                  className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Straße & Hausnummer *
                </label>
                <input
                  type="text"
                  required
                  value={property.street}
                  onChange={(e) => setProperty({ ...property, street: e.target.value })}
                  className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PLZ *
                  </label>
                  <input
                    type="text"
                    required
                    value={property.zip}
                    onChange={(e) => setProperty({ ...property, zip: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stadt / Ort *
                  </label>
                  <input
                    type="text"
                    required
                    value={property.city}
                    onChange={(e) => setProperty({ ...property, city: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gesamtwohnfläche der Liegenschaft (m²) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={property.totalArea}
                    onChange={(e) =>
                      setProperty({ ...property, totalArea: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gesamt-MEA (Miteigentumsanteile)
                  </label>
                  <input
                    type="number"
                    value={property.totalMea || 1000}
                    onChange={(e) =>
                      setProperty({ ...property, totalMea: parseFloat(e.target.value) || 1000 })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'paperless' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Paperless-ngx Integration aktivieren
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Koppelt das Belegarchiv und ermöglicht 1-Klick-Uploads der Mieter-PDFs.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={paperless.enabled}
                  onChange={(e) => setPaperless({ ...paperless, enabled: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Paperless-ngx Server-URL (im lokalen Netzwerk) *
                </label>
                <input
                  type="text"
                  placeholder="z. B. http://192.168.178.50:8000 oder http://paperless:8000"
                  value={paperless.serverUrl}
                  onChange={(e) => setPaperless({ ...paperless, serverUrl: e.target.value })}
                  className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400">
                  Die lokale IP-Adresse oder der Hostname Ihres Paperless-Containers.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Paperless API-Token (REST-API Schlüssel)
                </label>
                <input
                  type="password"
                  placeholder="z. B. a1b2c3d4e5f6..."
                  value={paperless.apiToken}
                  onChange={(e) => setPaperless({ ...paperless, apiToken: e.target.value })}
                  className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400">
                  Zu finden in Paperless-ngx unter: Einstellungen → Benutzer & Gruppen → API-Token.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Standard-Schlagwörter (Tags für automatische Zuordnung)
                </label>
                <input
                  type="text"
                  placeholder="z. B. Betriebskosten, Liegenschaft Rosenweg 8, Rechnung"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400">
                  Kommagetrennte Liste der Tags zur automatischen Belegfilterung.
                </span>
              </div>

              {/* Connection Test Button & Status */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                >
                  {testLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FolderOpen className="w-3.5 h-3.5" />
                  )}
                  <span>Verbindung zu Paperless testen</span>
                </button>

                {testResult && (
                  <div
                    className={`mt-2 p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Stammdaten speichern</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
