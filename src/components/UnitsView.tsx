import React, { useState } from 'react';
import {
  Building2,
  Users,
  Plus,
  Trash2,
  Edit2,
  X,
  Home,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { AppData, Tenant, Unit } from '../types';
import { formatCurrency, formatDateGerman, formatNumber } from '../utils/calculator';

interface UnitsViewProps {
  appData: AppData;
  onSaveUnit: (unit: Unit) => void;
  onDeleteUnit: (unitId: string) => void;
  onSaveTenant: (tenant: Tenant) => void;
  onDeleteTenant: (tenantId: string) => void;
}

export const UnitsView: React.FC<UnitsViewProps> = ({
  appData,
  onSaveUnit,
  onDeleteUnit,
  onSaveTenant,
  onDeleteTenant,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'units' | 'tenants'>('units');

  // Unit modal state
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitFormData, setUnitFormData] = useState<{
    id?: string;
    number: string;
    floor: string;
    area: string;
    persons: string;
    mea: string;
    description: string;
  }>({
    number: '',
    floor: '',
    area: '',
    persons: '1',
    mea: '250',
    description: '',
  });

  // Tenant modal state
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantFormData, setTenantFormData] = useState<{
    id?: string;
    unitId: string;
    salutation: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    leaseStart: string;
    leaseEnd: string;
    monthlyPrepayment: string;
  }>({
    unitId: '',
    salutation: 'Herrn',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    leaseStart: new Date().toISOString().split('T')[0],
    leaseEnd: '',
    monthlyPrepayment: '180',
  });

  // Totals
  const totalUnitArea = appData.units.reduce((sum, u) => sum + u.area, 0);
  const totalPersons = appData.units.reduce((sum, u) => sum + (u.persons || 1), 0);
  const totalMea = appData.units.reduce((sum, u) => sum + (u.mea || 0), 0);

  // Unit Handlers
  const handleOpenAddUnit = () => {
    setEditingUnit(null);
    setUnitFormData({
      number: `WE 0${appData.units.length + 1}`,
      floor: 'Erdgeschoss',
      area: '75',
      persons: '2',
      mea: '250',
      description: '',
    });
    setIsUnitModalOpen(true);
  };

  const handleOpenEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitFormData({
      id: unit.id,
      number: unit.number,
      floor: unit.floor,
      area: unit.area.toString(),
      persons: unit.persons.toString(),
      mea: unit.mea.toString(),
      description: unit.description || '',
    });
    setIsUnitModalOpen(true);
  };

  const handleUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const area = parseFloat(unitFormData.area.replace(',', '.'));
    const persons = parseInt(unitFormData.persons, 10);
    const mea = parseFloat(unitFormData.mea.replace(',', '.'));

    if (isNaN(area) || area <= 0) {
      alert('Bitte geben Sie eine gültige Wohnfläche größer 0 ein.');
      return;
    }

    const unit: Unit = {
      id: unitFormData.id || `unit-${Date.now()}`,
      propertyId: appData.property.id,
      number: unitFormData.number.trim(),
      floor: unitFormData.floor.trim(),
      area,
      persons: isNaN(persons) || persons < 1 ? 1 : persons,
      mea: isNaN(mea) ? 0 : mea,
      description: unitFormData.description.trim() || undefined,
    };

    onSaveUnit(unit);
    setIsUnitModalOpen(false);
  };

  // Tenant Handlers
  const handleOpenAddTenant = () => {
    setEditingTenant(null);
    setTenantFormData({
      unitId: appData.units[0]?.id || '',
      salutation: 'Herrn',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      leaseStart: `${new Date().getFullYear()}-01-01`,
      leaseEnd: '',
      monthlyPrepayment: '190',
    });
    setIsTenantModalOpen(true);
  };

  const handleOpenEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setTenantFormData({
      id: tenant.id,
      unitId: tenant.unitId,
      salutation: tenant.salutation,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      email: tenant.email || '',
      phone: tenant.phone || '',
      leaseStart: tenant.leaseStart,
      leaseEnd: tenant.leaseEnd || '',
      monthlyPrepayment: tenant.monthlyPrepayment.toString(),
    });
    setIsTenantModalOpen(true);
  };

  const handleTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prepayment = parseFloat(tenantFormData.monthlyPrepayment.replace(',', '.'));
    if (!tenantFormData.unitId) {
      alert('Bitte weisen Sie dem Mieter eine Wohneinheit zu.');
      return;
    }

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

    const tenant: Tenant = {
      id: tenantFormData.id || `tenant-${Date.now()}`,
      unitId: tenantFormData.unitId,
      salutation: tenantFormData.salutation,
      firstName: tenantFormData.firstName.trim(),
      lastName: tenantFormData.lastName.trim(),
      email: tenantFormData.email.trim() || undefined,
      phone: tenantFormData.phone.trim() || undefined,
      leaseStart: tenantFormData.leaseStart,
      leaseEnd: tenantFormData.leaseEnd.trim() || undefined,
      monthlyPrepayment: isNaN(prepayment) ? 0 : prepayment,
      activeYears: editingTenant?.activeYears || years,
      customPrepayments: editingTenant?.customPrepayments,
    };

    onSaveTenant(tenant);
    setIsTenantModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Segmented Sub-Tab Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Liegenschaftsverwaltung</span>
              <span aria-hidden="true">·</span>
              <span>Umlagebasis für Kostenberechnung</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
              Wohneinheiten & Mieter
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gesamtfläche erfasst: <strong className="text-slate-900 dark:text-slate-100 font-mono tabular-nums">{formatNumber(totalUnitArea, 1)} m²</strong> · {appData.units.length} Einheiten · {appData.tenants.length} Mieter
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Sub-tab segmented control */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveSubTab('units')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeSubTab === 'units'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                Wohneinheiten ({appData.units.length})
              </button>
              <button
                onClick={() => setActiveSubTab('tenants')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeSubTab === 'tenants'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Mieter ({appData.tenants.length})
              </button>
            </div>

            {activeSubTab === 'units' ? (
              <button
                onClick={handleOpenAddUnit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Einheit anlegen
              </button>
            ) : (
              <button
                onClick={handleOpenAddTenant}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Mieter erfassen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Tab 1: Wohneinheiten */}
      {activeSubTab === 'units' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 font-semibold">Einheit-Nr.</th>
                  <th className="py-3 px-4 font-semibold">Etage / Lage</th>
                  <th className="py-3 px-4 font-semibold text-right">Wohnfläche (m²)</th>
                  <th className="py-3 px-4 font-semibold text-right">Personen</th>
                  <th className="py-3 px-4 font-semibold text-right">MEA (Tausendstel)</th>
                  <th className="py-3 px-4 font-semibold">Aktueller Mieter</th>
                  <th className="py-3 px-4 font-semibold text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {appData.units.map((unit) => {
                  const currentTenant = appData.tenants.find(
                    (t) => t.unitId === unit.id && !t.leaseEnd
                  );

                  return (
                    <tr
                      key={unit.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-mono font-semibold text-xs">
                          {unit.number.replace(/\D/g, '') || 'W'}
                        </div>
                        <div>
                          <div>{unit.number}</div>
                          {unit.description && (
                            <div className="text-[10px] text-slate-400 font-normal truncate max-w-[150px]">
                              {unit.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {unit.floor}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatNumber(unit.area, 1)} m²
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                        {unit.persons} Pers.
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                        {unit.mea} / 1.000
                      </td>
                      <td className="py-3.5 px-4">
                        {currentTenant ? (
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                            <span className="font-medium">
                              {currentTenant.salutation} {currentTenant.firstName} {currentTenant.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Leerstehend / Kein Mieter</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditUnit(unit)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Einheit bearbeiten"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Möchten Sie die Einheit "${unit.number}" wirklich löschen?`)) {
                                onDeleteUnit(unit.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            title="Einheit löschen"
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
                <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                  <td colSpan={2} className="py-3 px-4">
                    Gesamtwerte der Liegenschaft
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    {formatNumber(totalUnitArea, 1)} m²
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    {totalPersons} Pers.
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    {totalMea} MEA
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Mieterverwaltung */}
      {activeSubTab === 'tenants' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 font-semibold">Mieter / Anrede</th>
                  <th className="py-3 px-4 font-semibold">Zugeordnete Einheit</th>
                  <th className="py-3 px-4 font-semibold">Mietbeginn</th>
                  <th className="py-3 px-4 font-semibold">Mietende</th>
                  <th className="py-3 px-4 font-semibold text-right">Mtl. Vorauszahlung</th>
                  <th className="py-3 px-4 font-semibold">Kontaktdaten</th>
                  <th className="py-3 px-4 font-semibold text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {appData.tenants.map((tenant) => {
                  const unit = appData.units.find((u) => u.id === tenant.unitId);
                  return (
                    <tr
                      key={tenant.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        <div>
                          {tenant.salutation} {tenant.firstName} {tenant.lastName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {unit ? (
                          <span className="font-semibold text-blue-700 dark:text-blue-400 font-mono">
                            {unit.number} ({unit.floor}, {unit.area} m²)
                          </span>
                        ) : (
                          <span className="text-rose-500">Keine Einheit zugewiesen</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {formatDateGerman(tenant.leaseStart)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {tenant.leaseEnd ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            {formatDateGerman(tenant.leaseEnd)}
                          </span>
                        ) : (
                          <span className="text-slate-400">unbefristet</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatCurrency(tenant.monthlyPrepayment)} / Monat
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-[11px]">
                        {tenant.email && <div>{tenant.email}</div>}
                        {tenant.phone && <div>{tenant.phone}</div>}
                        {!tenant.email && !tenant.phone && <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditTenant(tenant)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Mieter bearbeiten"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Möchten Sie den Mieter "${tenant.firstName} ${tenant.lastName}" wirklich löschen?`)) {
                                onDeleteTenant(tenant.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            title="Mieter löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unit Modal */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingUnit ? 'Wohneinheit bearbeiten' : 'Neue Wohneinheit anlegen'}
              </h3>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUnitSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Einheiten-Nummer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z. B. WE 01"
                    value={unitFormData.number}
                    onChange={(e) => setUnitFormData({ ...unitFormData, number: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Etage / Lage *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z. B. 1. OG links"
                    value={unitFormData.floor}
                    onChange={(e) => setUnitFormData({ ...unitFormData, floor: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Wohnfläche (m²) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="85"
                    value={unitFormData.area}
                    onChange={(e) => setUnitFormData({ ...unitFormData, area: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Personen *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={unitFormData.persons}
                    onChange={(e) => setUnitFormData({ ...unitFormData, persons: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    MEA (Anteile)
                  </label>
                  <input
                    type="text"
                    placeholder="250"
                    value={unitFormData.mea}
                    onChange={(e) => setUnitFormData({ ...unitFormData, mea: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Beschreibung / Zimmer
                </label>
                <input
                  type="text"
                  placeholder="z. B. 3-Zimmer-Wohnung mit Südbalkon"
                  value={unitFormData.description}
                  onChange={(e) =>
                    setUnitFormData({ ...unitFormData, description: e.target.value })
                  }
                  className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
                >
                  {editingUnit ? 'Speichern' : 'Anlegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tenant Modal */}
      {isTenantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingTenant ? 'Mieterdaten anpassen' : 'Neuen Mieter anlegen'}
              </h3>
              <button
                onClick={() => setIsTenantModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTenantSubmit} className="p-6 space-y-4">
              {/* Unit selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Zugeordnete Wohneinheit *
                </label>
                <select
                  required
                  value={tenantFormData.unitId}
                  onChange={(e) => setTenantFormData({ ...tenantFormData, unitId: e.target.value })}
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

              {/* Salutation, First & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Anrede
                  </label>
                  <select
                    value={tenantFormData.salutation}
                    onChange={(e) =>
                      setTenantFormData({ ...tenantFormData, salutation: e.target.value })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Herrn">Herrn</option>
                    <option value="Frau">Frau</option>
                    <option value="Familie">Familie</option>
                    <option value="Herrn Dr.">Herrn Dr.</option>
                    <option value="Frau Dr.">Frau Dr.</option>
                    <option value="Firma">Firma</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vorname *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Markus"
                    value={tenantFormData.firstName}
                    onChange={(e) =>
                      setTenantFormData({ ...tenantFormData, firstName: e.target.value })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nachname *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Schneider"
                    value={tenantFormData.lastName}
                    onChange={(e) =>
                      setTenantFormData({ ...tenantFormData, lastName: e.target.value })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Lease Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mietbeginn (Vertragsstart) *
                  </label>
                  <input
                    type="date"
                    required
                    value={tenantFormData.leaseStart}
                    onChange={(e) =>
                      setTenantFormData({ ...tenantFormData, leaseStart: e.target.value })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mietende (falls befristet / beendet)
                  </label>
                  <input
                    type="date"
                    value={tenantFormData.leaseEnd}
                    onChange={(e) =>
                      setTenantFormData({ ...tenantFormData, leaseEnd: e.target.value })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Monthly Prepayment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monatliche Nebenkostenvorauszahlung (€) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="z. B. 195,00"
                  value={tenantFormData.monthlyPrepayment}
                  onChange={(e) =>
                    setTenantFormData({ ...tenantFormData, monthlyPrepayment: e.target.value })
                  }
                  className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Wird in der Abrechnung automatisch mit der Mietdauer des Jahres multipliziert.
                </p>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-Mail (optional)
                  </label>
                  <input
                    type="email"
                    placeholder="mieter@beispiel.de"
                    value={tenantFormData.email}
                    onChange={(e) =>
                      setTenantFormData({ ...tenantFormData, email: e.target.value })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefon (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="0171 / 1234567"
                    value={tenantFormData.phone}
                    onChange={(e) =>
                      setTenantFormData({ ...tenantFormData, phone: e.target.value })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTenantModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
                >
                  {editingTenant ? 'Speichern' : 'Mieter anlegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
