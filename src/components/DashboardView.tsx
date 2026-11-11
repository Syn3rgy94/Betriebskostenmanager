import React from 'react';
import {
  TrendingUp,
  Building,
  Users,
  CreditCard,
  Plus,
  ArrowRight,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { AppData } from '../types';
import {
  calculateTenantSettlement,
  formatCurrency,
  formatNumber,
  getMultiYearCostSummary,
} from '../utils/calculator';
import { getCategoryByNumber } from '../constants/betrkv';

interface DashboardViewProps {
  appData: AppData;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  onNavigate: (tab: string) => void;
  onAddCost: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  appData,
  selectedYear,
  setSelectedYear,
  onNavigate,
  onAddCost,
}) => {
  // Current year calculations
  const yearCosts = appData.costs.filter(
    (c) => c.year === selectedYear && c.propertyId === appData.property.id
  );
  const totalYearAmount = yearCosts.reduce((sum, c) => sum + c.amount, 0);
  const totalArea = appData.property.totalArea || 1;
  const costPerM2 = totalYearAmount / totalArea;
  const costPerM2Month = costPerM2 / 12;

  // Active tenants settlement in this year
  const activeTenants = appData.tenants.filter((t) =>
    t.activeYears ? t.activeYears.includes(selectedYear) : true
  );
  const settlements = activeTenants
    .map((t) => calculateTenantSettlement(appData, t, selectedYear))
    .filter(Boolean);

  const totalPrepayments = settlements.reduce((sum, s) => sum + (s?.prepayments || 0), 0);
  const totalTenantCosts = settlements.reduce((sum, s) => sum + (s?.totalTenantCost || 0), 0);
  const totalBalance = Math.round((totalTenantCosts - totalPrepayments) * 100) / 100;

  // Multi-year summary
  const multiYearSummary = getMultiYearCostSummary(appData);
  const maxYearAmount = Math.max(...multiYearSummary.map((s) => s.totalAmount), 1);

  // Category breakdown for current year
  const categoryTotals: Record<number, number> = {};
  yearCosts.forEach((c) => {
    categoryTotals[c.categoryNumber] = (categoryTotals[c.categoryNumber] || 0) + c.amount;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .map(([catNumStr, amount]) => {
      const catNum = Number(catNumStr);
      const def = getCategoryByNumber(catNum);
      const percentage = totalYearAmount > 0 ? (amount / totalYearAmount) * 100 : 0;
      return {
        number: catNum,
        name: def.name,
        amount,
        percentage,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-8">
      {/* Property Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Liegenschaft</span>
              <span aria-hidden="true">·</span>
              <span>Lokal im Heimnetzwerk</span>
              <span aria-hidden="true">·</span>
              <span>Abrechnung nach BetrKV</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {appData.property.name}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {appData.property.street}, {appData.property.zip} {appData.property.city}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Gesamtfläche:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {formatNumber(appData.property.totalArea, 0)} m²
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Wohneinheiten:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {appData.units.length} WE
              </span>
            </div>

            <button
              onClick={onAddCost}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Kosten erfassen
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Gesamtkosten */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Gesamtkosten ({selectedYear})
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-700 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {formatCurrency(totalYearAmount)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>{yearCosts.length} Belegpositionen erfasst</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Durchschnitt je m² */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Kosten je m² / Monat
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {formatCurrency(costPerM2Month)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatCurrency(costPerM2)} pro m² im Gesamtjahr
            </div>
          </div>
        </div>

        {/* Metric 3: Abrechnungssaldo */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Mieter-Gesamtsaldo ({selectedYear})
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                totalBalance > 0
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-bold font-mono tabular-nums ${
                totalBalance > 0
                  ? 'text-rose-700 dark:text-rose-400'
                  : totalBalance < 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {totalBalance > 0
                ? `+ ${formatCurrency(totalBalance)}`
                : totalBalance < 0
                ? `- ${formatCurrency(Math.abs(totalBalance))}`
                : '0,00 €'}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {totalBalance > 0 ? 'Nachzahlung aller Mieter' : 'Guthaben aller Mieter'}
            </div>
          </div>
        </div>

        {/* Metric 4: Belegte Einheiten */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Aktive Mietverhältnisse
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {activeTenants.length} von {appData.units.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Bereit für PDF-Erstellung
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Multi-Year History & Cost Driver Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): Multi-Year Cost Progression (Verlauf über Jahre) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Kostenverlauf über die Jahre
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vergleich der Gesamtausgaben nach Kalenderjahren
              </p>
            </div>

            {/* Quick Year Pill selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {multiYearSummary.map((item) => (
                <button
                  key={item.year}
                  onClick={() => setSelectedYear(item.year)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    selectedYear === item.year
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.year}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Bar Chart */}
          <div className="pt-4 pb-2">
            <div className="space-y-4">
              {multiYearSummary.map((item) => {
                const barWidthPercent =
                  maxYearAmount > 0 ? (item.totalAmount / maxYearAmount) * 100 : 0;
                const isSelected = item.year === selectedYear;

                return (
                  <div key={item.year} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            isSelected
                              ? 'text-blue-700 dark:text-blue-400'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {item.year}
                        </span>
                        {item.deltaPercent !== null && (
                          <span
                            className={`inline-flex items-center text-[11px] ${
                              item.deltaPercent > 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : item.deltaPercent < 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {item.deltaPercent > 0 ? (
                              <ArrowUpRight className="w-3 h-3 inline mr-0.5" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 inline mr-0.5" />
                            )}
                            {item.deltaPercent > 0 ? '+' : ''}
                            {formatNumber(item.deltaPercent, 1)}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          Ø {formatCurrency(item.costPerM2Month)}/m²
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                          {formatCurrency(item.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isSelected
                            ? 'bg-blue-600 dark:bg-blue-500'
                            : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                        }`}
                        style={{ width: `${Math.max(barWidthPercent, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabular Multi-Year Matrix */}
          <div className="overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2 font-medium">Abrechnungsjahr</th>
                  <th className="py-2 font-medium text-right">Gesamtkosten</th>
                  <th className="py-2 font-medium text-right">Kosten / m²</th>
                  <th className="py-2 font-medium text-right">Ø m² / Monat</th>
                  <th className="py-2 font-medium text-right">Veränderung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {multiYearSummary.map((item) => (
                  <tr
                    key={item.year}
                    onClick={() => setSelectedYear(item.year)}
                    className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      item.year === selectedYear ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <td className="py-2.5 font-bold font-sans text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.year}
                      {item.year === selectedYear && (
                        <span className="text-[10px] text-blue-700 dark:text-blue-400 font-normal">
                          (aktiv)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatCurrency(item.totalAmount)}
                    </td>
                    <td className="py-2.5 text-right text-slate-600 dark:text-slate-300 tabular-nums">
                      {formatCurrency(item.costPerM2)}
                    </td>
                    <td className="py-2.5 text-right text-slate-600 dark:text-slate-300 tabular-nums">
                      {formatCurrency(item.costPerM2Month)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {item.deltaPercent !== null ? (
                        <span
                          className={
                            item.deltaPercent > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : item.deltaPercent < 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-500'
                          }
                        >
                          {item.deltaPercent > 0 ? '+' : ''}
                          {formatNumber(item.deltaPercent, 1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Breakdown & Quick Actions */}
        <div className="space-y-6">
          {/* Cost Drivers */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Kostenarten ({selectedYear})
              </h2>
              <button
                onClick={() => onNavigate('costs')}
                className="text-xs text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                Alle {yearCosts.length}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {sortedCategories.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                Für {selectedYear} sind noch keine Kosten erfasst.
              </div>
            ) : (
              <div className="space-y-3">
                {sortedCategories.slice(0, 5).map((cat) => (
                  <div key={cat.number} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[160px]">
                        § 2 Nr. {cat.number} {cat.name}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 text-right font-mono tabular-nums">
                      {formatNumber(cat.percentage, 1)}% der Gesamtkosten
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Navigation Card */}
          <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-xl p-6 text-white shadow-sm space-y-4">
            <div>
              <div className="text-xs text-blue-300 font-semibold uppercase tracking-wider">
                Abrechnung {selectedYear}
              </div>
              <h3 className="text-lg font-bold mt-1">Rechtssichere Mieter-PDFs</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Erstellen Sie mit einem Klick formelle DIN-5008 Abrechnungen für alle {activeTenants.length} Einheiten inklusive Vorauszahlungsabgleich und Zahlungsfrist.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => onNavigate('settlement')}
                className="w-full py-2.5 px-4 bg-white text-blue-950 font-semibold rounded-lg text-xs hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Abrechnungen öffnen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('costs')}
                className="w-full py-2.5 px-4 bg-blue-800/80 text-white font-medium rounded-lg text-xs hover:bg-blue-800 transition-colors flex items-center justify-center gap-1.5 border border-blue-700/60"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Kosten erfassen</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
