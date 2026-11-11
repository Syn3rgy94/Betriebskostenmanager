import React, { useState } from 'react';
import {
  Gauge,
  Droplets,
  Flame,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  Building,
  Info,
} from 'lucide-react';
import { AppData, Meter, MeterReading, MeterType } from '../types';
import { formatNumber } from '../utils/calculator';
import { getMeterTypeLabel } from '../utils/calculator';

interface MetersViewProps {
  appData: AppData;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  onSaveMeter: (meter: Meter) => void;
  onDeleteMeter: (meterId: string) => void;
  onSaveReading: (reading: MeterReading) => void;
}

export const MetersView: React.FC<MetersViewProps> = ({
  appData,
  selectedYear,
  setSelectedYear,
  onSaveMeter,
  onDeleteMeter,
  onSaveReading,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUnit, setFilterUnit] = useState<string>('all');

  // Modal 1: Edit / Record Reading
  const [isReadingModalOpen, setIsReadingModalOpen] = useState<boolean>(false);
  const [selectedMeterForReading, setSelectedMeterForReading] = useState<Meter | null>(null);
  const [readingFormData, setReadingFormData] = useState<{
    id?: string;
    startReading: string;
    endReading: string;
    startDate: string;
    endDate: string;
  }>({
    startReading: '',
    endReading: '',
    startDate: `${selectedYear}-01-01`,
    endDate: `${selectedYear}-12-31`,
  });

  // Modal 2: Create / Edit Meter
  const [isMeterModalOpen, setIsMeterModalOpen] = useState<boolean>(false);
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
  const [meterFormData, setMeterFormData] = useState<{
    id?: string;
    unitId: string;
    type: MeterType;
    meterNumber: string;
    location: string;
    unitOfMeasurement: string;
    calibrationYear: string;
    notes: string;
  }>({
    unitId: appData.units[0]?.id || '',
    type: 'cold_water',
    meterNumber: '',
    location: '',
    unitOfMeasurement: 'm³',
    calibrationYear: '2022',
    notes: '',
  });

  const meters = appData.meters || [];
  const readings = appData.meterReadings || [];

  // Filter meters
  const filteredMeters = meters.filter((m) => {
    const matchesType = filterType === 'all' || m.type === filterType;
    const matchesUnit = filterUnit === 'all' || m.unitId === filterUnit;
    return matchesType && matchesUnit;
  });

  // Aggregate statistics for the year
  const coldWaterReadings = readings.filter(
    (r) =>
      r.year === selectedYear &&
      meters.find((m) => m.id === r.meterId)?.type === 'cold_water'
  );
  const totalColdWater = coldWaterReadings.reduce((sum, r) => sum + r.consumption, 0);

  const warmWaterReadings = readings.filter(
    (r) =>
      r.year === selectedYear &&
      meters.find((m) => m.id === r.meterId)?.type === 'warm_water'
  );
  const totalWarmWater = warmWaterReadings.reduce((sum, r) => sum + r.consumption, 0);

  // Reading handlers
  const handleOpenReadingModal = (meter: Meter) => {
    setSelectedMeterForReading(meter);
    const existingReading = readings.find(
      (r) => r.meterId === meter.id && r.year === selectedYear
    );

    if (existingReading) {
      setReadingFormData({
        id: existingReading.id,
        startReading: existingReading.startReading.toString(),
        endReading: existingReading.endReading.toString(),
        startDate: existingReading.startDate,
        endDate: existingReading.endDate,
      });
    } else {
      // Look for previous year's end reading as default start reading!
      const prevReading = readings.find(
        (r) => r.meterId === meter.id && r.year === selectedYear - 1
      );
      setReadingFormData({
        startReading: prevReading ? prevReading.endReading.toString() : '0',
        endReading: '',
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`,
      });
    }
    setIsReadingModalOpen(true);
  };

  const handleSaveReadingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeterForReading) return;

    const start = parseFloat(readingFormData.startReading.replace(',', '.'));
    const end = parseFloat(readingFormData.endReading.replace(',', '.'));

    if (isNaN(start) || isNaN(end) || end < start) {
      alert('Der Endstand muss größer oder gleich dem Anfangsstand sein.');
      return;
    }

    const consumption = Math.round((end - start) * 100) / 100;
    const newReading: MeterReading = {
      id: readingFormData.id || `reading-${Date.now()}`,
      meterId: selectedMeterForReading.id,
      year: selectedYear,
      startDate: readingFormData.startDate,
      endDate: readingFormData.endDate,
      startReading: start,
      endReading: end,
      consumption,
    };

    onSaveReading(newReading);
    setIsReadingModalOpen(false);
  };

  // Meter definition handlers
  const handleOpenAddMeter = () => {
    setEditingMeter(null);
    setMeterFormData({
      unitId: appData.units[0]?.id || '',
      type: 'cold_water',
      meterNumber: '',
      location: 'Badezimmer',
      unitOfMeasurement: 'm³',
      calibrationYear: '2023',
      notes: '',
    });
    setIsMeterModalOpen(true);
  };

  const handleOpenEditMeter = (meter: Meter) => {
    setEditingMeter(meter);
    setMeterFormData({
      id: meter.id,
      unitId: meter.unitId,
      type: meter.type,
      meterNumber: meter.meterNumber,
      location: meter.location || '',
      unitOfMeasurement: meter.unitOfMeasurement,
      calibrationYear: meter.calibrationYear?.toString() || '',
      notes: meter.notes || '',
    });
    setIsMeterModalOpen(true);
  };

  const handleSaveMeterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meterFormData.meterNumber.trim()) {
      alert('Bitte geben Sie eine Zählernummer ein.');
      return;
    }

    const meter: Meter = {
      id: meterFormData.id || `meter-${Date.now()}`,
      unitId: meterFormData.unitId,
      type: meterFormData.type,
      meterNumber: meterFormData.meterNumber.trim(),
      location: meterFormData.location.trim() || undefined,
      unitOfMeasurement: meterFormData.unitOfMeasurement.trim() || 'm³',
      calibrationYear: parseInt(meterFormData.calibrationYear, 10) || undefined,
      notes: meterFormData.notes.trim() || undefined,
    };

    onSaveMeter(meter);
    setIsMeterModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Aggregate Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Zählerstandsverwaltung</span>
              <span aria-hidden="true">·</span>
              <span>Wasser- & Wärmeverbrauch</span>
              <span aria-hidden="true">·</span>
              <span>Abrechnungsjahr {selectedYear}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
              Zählerstände & Verbräuche ({selectedYear})
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Erfassen Sie Stichtags-Zählerstände zum 01.01. und 31.12. zur verbrauchsgenauen Betriebskostenumlage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddMeter}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Neuen Zähler anlegen
            </button>
          </div>
        </div>

        {/* Aggregated KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Gesamtverbrauch Kaltwasser
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {formatNumber(totalColdWater, 1)} m³
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Gesamtverbrauch Warmwasser
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {formatNumber(totalWarmWater, 1)} m³
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Erfasste Zähler gesamt
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {meters.length} Zähler in {appData.units.length} Einheiten
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Filter nach Typ:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Alle Zählertypen</option>
            <option value="cold_water">Kaltwasser (m³)</option>
            <option value="warm_water">Warmwasser (m³)</option>
            <option value="heating">Heizung / Wärme</option>
            <option value="electricity">Strom</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Wohneinheit:</label>
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Alle Wohneinheiten</option>
            {appData.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.number} - {u.floor}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Meters & Readings Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredMeters.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Gauge className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Keine Zähler gefunden
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Legen Sie für Ihre Wohneinheiten die Kalt- und Warmwasserzähler an.
            </p>
            <button
              onClick={handleOpenAddMeter}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Ersten Zähler anlegen
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 font-semibold">Wohneinheit</th>
                  <th className="py-3 px-4 font-semibold">Zählertyp</th>
                  <th className="py-3 px-4 font-semibold">Zählernummer & Lage</th>
                  <th className="py-3 px-4 font-semibold text-right">Stand 01.01.{selectedYear}</th>
                  <th className="py-3 px-4 font-semibold text-right">Stand 31.12.{selectedYear}</th>
                  <th className="py-3 px-4 font-semibold text-right">Jahresverbrauch</th>
                  <th className="py-3 px-4 font-semibold text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMeters.map((meter) => {
                  const unit = appData.units.find((u) => u.id === meter.unitId);
                  const reading = readings.find(
                    (r) => r.meterId === meter.id && r.year === selectedYear
                  );

                  return (
                    <tr
                      key={meter.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        <div>{unit?.number || 'Unbekannt'}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {unit?.floor}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                            meter.type === 'cold_water'
                              ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300'
                              : meter.type === 'warm_water'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                          }`}
                        >
                          {meter.type === 'cold_water' && <Droplets className="w-3 h-3" />}
                          {meter.type === 'warm_water' && <Flame className="w-3 h-3" />}
                          {getMeterTypeLabel(meter.type)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {meter.meterNumber}
                        </div>
                        {meter.location && (
                          <div className="text-[10px] text-slate-400">{meter.location}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {reading ? (
                          `${formatNumber(reading.startReading, 1)} ${meter.unitOfMeasurement}`
                        ) : (
                          <span className="text-slate-400 italic">nicht erfasst</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {reading ? (
                          `${formatNumber(reading.endReading, 1)} ${meter.unitOfMeasurement}`
                        ) : (
                          <span className="text-slate-400 italic">nicht erfasst</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-700 dark:text-blue-400 tabular-nums text-sm">
                        {reading ? (
                          `${formatNumber(reading.consumption, 1)} ${meter.unitOfMeasurement}`
                        ) : (
                          <button
                            onClick={() => handleOpenReadingModal(meter)}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-normal font-sans"
                          >
                            + Stand eintragen
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenReadingModal(meter)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                            title="Zählerstand erfassen"
                          >
                            Ablesung
                          </button>
                          <button
                            onClick={() => handleOpenEditMeter(meter)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Zählerstammdaten bearbeiten"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Möchten Sie den Zähler "${meter.meterNumber}" wirklich löschen?`)) {
                                onDeleteMeter(meter.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            title="Zähler löschen"
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
        )}
      </div>

      {/* Modal: Record / Edit Reading */}
      {isReadingModalOpen && selectedMeterForReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Zählerstand erfassen ({selectedYear})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {getMeterTypeLabel(selectedMeterForReading.type)} · Zähler-Nr.{' '}
                  {selectedMeterForReading.meterNumber}
                </p>
              </div>
              <button
                onClick={() => setIsReadingModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReadingSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Anfangsstand ({selectedYear}) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z. B. 150,0"
                    value={readingFormData.startReading}
                    onChange={(e) =>
                      setReadingFormData({ ...readingFormData, startReading: e.target.value })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400">Stichtag: 01.01.{selectedYear}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Endstand ({selectedYear}) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z. B. 194,5"
                    value={readingFormData.endReading}
                    onChange={(e) =>
                      setReadingFormData({ ...readingFormData, endReading: e.target.value })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400">Stichtag: 31.12.{selectedYear}</span>
                </div>
              </div>

              {/* Live Preview of Consumption */}
              {(() => {
                const s = parseFloat(readingFormData.startReading.replace(',', '.'));
                const e = parseFloat(readingFormData.endReading.replace(',', '.'));
                if (!isNaN(s) && !isNaN(e) && e >= s) {
                  return (
                    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg p-3 text-xs text-blue-900 dark:text-blue-200 flex justify-between items-center">
                      <span>Ermittelter Jahresverbrauch:</span>
                      <strong className="text-sm font-mono tabular-nums">
                        {formatNumber(e - s, 1)} {selectedMeterForReading.unitOfMeasurement}
                      </strong>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReadingModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
                >
                  Zählerstand speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Meter */}
      {isMeterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingMeter ? 'Zählerstammdaten anpassen' : 'Neuen Zähler einrichten'}
              </h3>
              <button
                onClick={() => setIsMeterModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeterSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Zugeordnete Wohneinheit *
                </label>
                <select
                  required
                  value={meterFormData.unitId}
                  onChange={(e) => setMeterFormData({ ...meterFormData, unitId: e.target.value })}
                  className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {appData.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.number} - {u.floor} ({u.area} m²)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Zählertyp *
                  </label>
                  <select
                    value={meterFormData.type}
                    onChange={(e) =>
                      setMeterFormData({ ...meterFormData, type: e.target.value as MeterType })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="cold_water">Kaltwasser (m³)</option>
                    <option value="warm_water">Warmwasser (m³)</option>
                    <option value="heating">Heizung / Wärme</option>
                    <option value="electricity">Strom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Zählernummer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z. B. KW-01-99"
                    value={meterFormData.meterNumber}
                    onChange={(e) =>
                      setMeterFormData({ ...meterFormData, meterNumber: e.target.value })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Einbauort
                  </label>
                  <input
                    type="text"
                    placeholder="z. B. Bad unter Waschtisch"
                    value={meterFormData.location}
                    onChange={(e) =>
                      setMeterFormData({ ...meterFormData, location: e.target.value })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Eichjahr
                  </label>
                  <input
                    type="text"
                    placeholder="2022"
                    value={meterFormData.calibrationYear}
                    onChange={(e) =>
                      setMeterFormData({ ...meterFormData, calibrationYear: e.target.value })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMeterModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
                >
                  {editingMeter ? 'Speichern' : 'Zähler anlegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
