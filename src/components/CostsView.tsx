import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  X,
  Check,
  Building,
  Info,
  CheckCircle,
  FileText,
  Sparkles,
  FolderOpen,
  ExternalLink,
} from 'lucide-react';
import { AllocationKey, AppData, CostEntry, PaperlessDocument } from '../types';
import {
  BETRKV_CATEGORIES,
  ALLOCATION_KEYS,
  getCategoryByNumber,
  getAllocationKeyLabel,
} from '../constants/betrkv';
import { formatCurrency, formatDateGerman, formatNumber } from '../utils/calculator';
import { PaperlessModal } from './PaperlessModal';

interface CostsViewProps {
  appData: AppData;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  onSaveCost: (cost: CostEntry) => void;
  onDeleteCost: (costId: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const CostsView: React.FC<CostsViewProps> = ({
  appData,
  selectedYear,
  setSelectedYear,
  availableYears,
  onSaveCost,
  onDeleteCost,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | 'all'>('all');
  const [editingCost, setEditingCost] = useState<CostEntry | null>(null);
  const [isPaperlessModalOpen, setIsPaperlessModalOpen] = useState(false);

  const costsForYear = appData.costs.filter(
    (c) => c.year === selectedYear && c.propertyId === appData.property.id
  );

  const generateNextReceiptNumber = () => {
    const existingNums = costsForYear
      .map((c) => {
        const match = c.receiptNumber?.match(/BEL-\d+-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : costsForYear.length + 1;
    return `BEL-${selectedYear}-${String(nextNum).padStart(3, '0')}`;
  };

  // Form state for Modal
  const [formData, setFormData] = useState<{
    id?: string;
    categoryNumber: number;
    customTitle: string;
    amount: string;
    key: AllocationKey;
    invoiceDate: string;
    invoiceNumber: string;
    serviceProvider: string;
    directUnitId: string;
    receiptNumber: string;
    verified: boolean;
    documentFolder: string;
    paperlessDocId?: number;
    paperlessAsn?: number;
    paperlessTitle?: string;
    notes: string;
  }>({
    categoryNumber: 1,
    customTitle: '',
    amount: '',
    key: 'm2',
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    serviceProvider: '',
    directUnitId: '',
    receiptNumber: '',
    verified: true,
    documentFolder: `Ordner Finanzen ${selectedYear}`,
    notes: '',
  });

  const filteredCosts = costsForYear.filter((c) => {
    const cat = getCategoryByNumber(c.categoryNumber);
    const matchesSearch =
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.customTitle && c.customTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.serviceProvider && c.serviceProvider.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.invoiceNumber && c.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.receiptNumber && c.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.paperlessTitle && c.paperlessTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat =
      selectedCategoryFilter === 'all' || c.categoryNumber === selectedCategoryFilter;

    return matchesSearch && matchesCat;
  });

  const totalYearCost = costsForYear.reduce((sum, c) => sum + c.amount, 0);
  const filteredTotal = filteredCosts.reduce((sum, c) => sum + c.amount, 0);
  const verifiedCount = costsForYear.filter((c) => c.verified).length;

  const handleOpenAdd = () => {
    setEditingCost(null);
    setFormData({
      categoryNumber: 1,
      customTitle: '',
      amount: '',
      key: 'm2',
      invoiceDate: `${selectedYear}-01-15`,
      invoiceNumber: '',
      serviceProvider: '',
      directUnitId: '',
      receiptNumber: generateNextReceiptNumber(),
      verified: true,
      documentFolder: `Ordner Finanzen ${selectedYear}`,
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cost: CostEntry) => {
    setEditingCost(cost);
    setFormData({
      id: cost.id,
      categoryNumber: cost.categoryNumber,
      customTitle: cost.customTitle || '',
      amount: cost.amount.toString(),
      key: cost.key,
      invoiceDate: cost.invoiceDate || `${selectedYear}-01-15`,
      invoiceNumber: cost.invoiceNumber || '',
      serviceProvider: cost.serviceProvider || '',
      directUnitId: cost.directUnitId || '',
      receiptNumber: cost.receiptNumber || generateNextReceiptNumber(),
      verified: cost.verified ?? true,
      documentFolder: cost.documentFolder || `Ordner Finanzen ${selectedYear}`,
      paperlessDocId: cost.paperlessDocId,
      paperlessAsn: cost.paperlessAsn,
      paperlessTitle: cost.paperlessTitle,
      notes: cost.notes || '',
    });
    setIsAddModalOpen(true);
  };

  const handleCategoryChange = (catNum: number) => {
    const def = getCategoryByNumber(catNum);
    setFormData((prev) => ({
      ...prev,
      categoryNumber: catNum,
      key: def.defaultKey,
    }));
  };

  const handlePaperlessDocSelected = (doc: PaperlessDocument) => {
    setFormData((prev) => ({
      ...prev,
      paperlessDocId: doc.id,
      paperlessAsn: doc.asn,
      paperlessTitle: doc.title,
      receiptNumber: prev.receiptNumber || (doc.asn ? `ASN-${doc.asn}` : `DOC-${doc.id}`),
      invoiceDate: doc.created ? doc.created.split('T')[0] : prev.invoiceDate,
      verified: true,
      documentFolder: `Paperless-ngx (Dokument #${doc.id})`,
    }));
    setIsPaperlessModalOpen(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formData.amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Bitte geben Sie einen gültigen Rechnungsbetrag größer 0 ein.');
      return;
    }

    const newEntry: CostEntry = {
      id: formData.id || `cost-${Date.now()}`,
      propertyId: appData.property.id,
      year: selectedYear,
      categoryNumber: formData.categoryNumber,
      customTitle: formData.customTitle.trim() || undefined,
      amount: Math.round(parsedAmount * 100) / 100,
      key: formData.key,
      invoiceDate: formData.invoiceDate || undefined,
      invoiceNumber: formData.invoiceNumber.trim() || undefined,
      serviceProvider: formData.serviceProvider.trim() || undefined,
      directUnitId: formData.key === 'direct' ? formData.directUnitId : undefined,
      receiptNumber: formData.receiptNumber.trim() || undefined,
      verified: formData.verified,
      documentFolder: formData.documentFolder.trim() || undefined,
      paperlessDocId: formData.paperlessDocId,
      paperlessAsn: formData.paperlessAsn,
      paperlessTitle: formData.paperlessTitle,
      notes: formData.notes.trim() || undefined,
    };

    onSaveCost(newEntry);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Metric Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Betriebskostenverordnung (BetrKV)</span>
              <span aria-hidden="true">·</span>
              <span>Paperless-ngx Archiv</span>
              <span aria-hidden="true">·</span>
              <span>{verifiedCount} von {costsForYear.length} Belegen geprüft</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
              Betriebskosten & Belegarchiv ({selectedYear})
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gesamtsumme aller Belege: <strong className="text-slate-900 dark:text-slate-100 font-mono tabular-nums">{formatCurrency(totalYearCost)}</strong> ({costsForYear.length} Belege erfasst)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Kostenposition erfassen
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Suche nach Kostenart, Beleg-Nr., Paperless..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) =>
                setSelectedCategoryFilter(
                  e.target.value === 'all' ? 'all' : Number(e.target.value)
                )
              }
              className="w-full sm:w-64 py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Alle 17 BetrKV-Kategorien anzeigen</option>
              {BETRKV_CATEGORIES.map((cat) => (
                <option key={cat.number} value={cat.number}>
                  § 2 Nr. {cat.number} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cost Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredCosts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Layers className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Keine Betriebskosten gefunden
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Für das Jahr {selectedYear} sind {searchTerm ? 'zu Ihrer Suche' : ''} keine Kosten eingetragen.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Erste Kostenposition erfassen
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 font-semibold">Beleg-Nr.</th>
                  <th className="py-3 px-4 font-semibold">§ 2 BetrKV</th>
                  <th className="py-3 px-4 font-semibold">Kostenart & Bezeichnung</th>
                  <th className="py-3 px-4 font-semibold">Dienstleister / Rechn.-Nr.</th>
                  <th className="py-3 px-4 font-semibold">Datum</th>
                  <th className="py-3 px-4 font-semibold">Umlageschlüssel</th>
                  <th className="py-3 px-4 font-semibold text-right">Rechnungsbetrag</th>
                  <th className="py-3 px-4 font-semibold text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCosts.map((cost) => {
                  const cat = getCategoryByNumber(cost.categoryNumber);
                  const paperlessLink = cost.paperlessDocId && appData.paperless?.serverUrl
                    ? `${appData.paperless.serverUrl.replace(/\/+$/, '')}/documents/${cost.paperlessDocId}/details`
                    : null;

                  return (
                    <tr
                      key={cost.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {cost.verified ? (
                            <span title="Beleg geprüft">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            </span>
                          ) : (
                            <span title="Noch nicht geprüft" className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                          )}
                          <span>{cost.receiptNumber || '—'}</span>
                        </div>
                        {paperlessLink && (
                          <div className="mt-0.5">
                            <a
                              href={paperlessLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-mono"
                              title="In Paperless-ngx öffnen"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>Paperless #{cost.paperlessDocId}</span>
                            </a>
                          </div>
                        )}
                        {!paperlessLink && cost.documentFolder && (
                          <div className="text-[10px] text-slate-400 font-sans truncate max-w-[120px]">
                            {cost.documentFolder}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700 dark:text-blue-400 shrink-0">
                        Nr. {cost.categoryNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {cat.name}
                        </div>
                        {cost.customTitle && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {cost.customTitle}
                          </div>
                        )}
                        {cost.notes && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-0.5">
                            {cost.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div>{cost.serviceProvider || '—'}</div>
                        {cost.invoiceNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Rechn.-Nr: {cost.invoiceNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono">
                        {cost.invoiceDate ? formatDateGerman(cost.invoiceDate) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {getAllocationKeyLabel(cost.key)}
                        </span>
                        {cost.key === 'direct' && cost.directUnitId && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                            {appData.units.find((u) => u.id === cost.directUnitId)?.number || 'Einheit'}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatCurrency(cost.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(cost)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Bearbeiten"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Möchten Sie die Position "${cat.name}" (${formatCurrency(cost.amount)}) wirklich löschen?`)) {
                                onDeleteCost(cost.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            title="Löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold border-t border-slate-200 dark:border-slate-800">
                  <td colSpan={6} className="py-3 px-4 text-slate-900 dark:text-slate-100">
                    Summe {selectedCategoryFilter !== 'all' ? 'gefilterte Positionen' : `Gesamtjahr ${selectedYear}`}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-slate-100 tabular-nums text-sm">
                    {formatCurrency(filteredTotal)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Cost Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingCost ? 'Kostenposition bearbeiten' : 'Neue Betriebskosten erfassen'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Paperless integration button */}
              {appData.paperless?.enabled && (
                <div className="p-3 bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-lg flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                      <span>Paperless-ngx Verknüpfung</span>
                    </div>
                    <div className="text-[11px] text-blue-700/80 dark:text-blue-300/80 truncate">
                      {formData.paperlessDocId
                        ? `Verknüpft: Dokument #${formData.paperlessDocId} (${formData.paperlessTitle || 'Beleg'})`
                        : 'Wählen Sie den Originalbeleg direkt aus Ihrem Paperless-Server.'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPaperlessModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-md transition-colors shadow-2xs whitespace-nowrap shrink-0"
                  >
                    {formData.paperlessDocId ? 'Ändern' : 'Beleg wählen'}
                  </button>
                </div>
              )}

              {/* Receipt Number & Verification Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Beleg-Nummer *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, receiptNumber: generateNextReceiptNumber() })
                      }
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      Auto-Nummer
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="z. B. BEL-2024-001"
                    value={formData.receiptNumber}
                    onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                    className="w-full py-1.5 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col justify-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={formData.verified}
                      onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Beleg geprüft (§ 556 BGB)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Sachlich & rechnerisch geprüft
                  </span>
                </div>
              </div>

              {/* Category picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Betriebskostenart (§ 2 BetrKV) *
                </label>
                <select
                  value={formData.categoryNumber}
                  onChange={(e) => handleCategoryChange(Number(e.target.value))}
                  className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {BETRKV_CATEGORIES.map((cat) => (
                    <option key={cat.number} value={cat.number}>
                      § 2 Nr. {cat.number}: {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {getCategoryByNumber(formData.categoryNumber).description}
                </p>
              </div>

              {/* Custom Title (mandatory for Nr. 17 or detail) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {formData.categoryNumber === 17
                    ? 'Konkrete Bezeichnung (§ 2 Nr. 17 erfordert genaue Benennung) *'
                    : 'Optionale Detailbezeichnung'}
                </label>
                <input
                  type="text"
                  placeholder={
                    formData.categoryNumber === 17
                      ? 'z. B. Wartung Rauchwarnmelder nach DIN 14676'
                      : 'z. B. Winterdienst oder Kesselwartung'
                  }
                  value={formData.customTitle}
                  onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
                  required={formData.categoryNumber === 17}
                  className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Amount and Key */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rechnungsbetrag (€) *
                  </label>
                  <input
                    type="text"
                    placeholder="z. B. 1250,50"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Umlageschlüssel *
                  </label>
                  <select
                    value={formData.key}
                    onChange={(e) =>
                      setFormData({ ...formData, key: e.target.value as AllocationKey })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {ALLOCATION_KEYS.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* If direct allocation */}
              {formData.key === 'direct' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Direkt zugeordnete Wohneinheit *
                  </label>
                  <select
                    value={formData.directUnitId}
                    onChange={(e) => setFormData({ ...formData, directUnitId: e.target.value })}
                    required
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Bitte Einheit auswählen...</option>
                    {appData.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.number} - {u.floor} ({u.area} m²)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Provider & Invoice details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dienstleister / Versorger
                  </label>
                  <input
                    type="text"
                    placeholder="z. B. Stadtwerke oder AWB"
                    value={formData.serviceProvider}
                    onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rechnungsnummer
                  </label>
                  <input
                    type="text"
                    placeholder="z. B. RE-2024-884"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Invoice Date & Document Folder */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rechnungsdatum / Belegdatum
                  </label>
                  <input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ablageort / Belegordner
                  </label>
                  <input
                    type="text"
                    placeholder="z. B. Ordner Finanzen 2024, Fach 3"
                    value={formData.documentFolder}
                    onChange={(e) => setFormData({ ...formData, documentFolder: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Interne Notizen / Erläuterung
                </label>
                <textarea
                  rows={2}
                  placeholder="z. B. Rechnungsbeleg abgelegt"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
                >
                  {editingCost ? 'Änderungen speichern' : 'Kosten erfassen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Paperless Document Selection Modal */}
      {isPaperlessModalOpen && (
        <PaperlessModal
          paperlessConfig={appData.paperless}
          isOpen={isPaperlessModalOpen}
          onClose={() => setIsPaperlessModalOpen(false)}
          onSelectDocument={handlePaperlessDocSelected}
          defaultSearchQuery={formData.serviceProvider || String(selectedYear)}
        />
      )}
    </div>
  );
};
