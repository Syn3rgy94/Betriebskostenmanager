/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppData, CostEntry, LandlordProfile, Meter, MeterReading, PaperlessConfig, Property, Tenant, Unit } from './types';
import { INITIAL_APP_DATA } from './constants/initialData';
import { fetchAppData, persistAppData } from './services/api';
import { getAvailableYears } from './utils/calculator';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CostsView } from './components/CostsView';
import { MetersView } from './components/MetersView';
import { UnitsView } from './components/UnitsView';
import { SettlementView } from './components/SettlementView';
import { SettingsModal } from './components/SettingsModal';
import { BackupModal } from './components/BackupModal';
import { ShieldCheck, HardDrive, Building2 } from 'lucide-react';

export default function App() {
  const [appData, setAppData] = useState<AppData>(INITIAL_APP_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme_mode');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Modals
  const [isAddCostModalOpen, setIsAddCostModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  // Sync theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme_mode', 'light');
    }
  }, [darkMode]);

  // Initial load
  useEffect(() => {
    async function loadData() {
      try {
        const loaded = await fetchAppData();
        setAppData(loaded);
        const years = getAvailableYears(loaded);
        if (years.length > 0) {
          if (years.includes(2024)) {
            setSelectedYear(2024);
          } else {
            setSelectedYear(years[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load app data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const availableYears = getAvailableYears(appData);

  // Data Mutation Handlers
  const handleSaveCost = (cost: CostEntry) => {
    setAppData((prev) => {
      const existingIdx = prev.costs.findIndex((c) => c.id === cost.id);
      let updatedCosts: CostEntry[];
      if (existingIdx >= 0) {
        updatedCosts = [...prev.costs];
        updatedCosts[existingIdx] = cost;
      } else {
        updatedCosts = [cost, ...prev.costs];
      }
      const updatedData: AppData = { ...prev, costs: updatedCosts };
      persistAppData(updatedData);
      return updatedData;
    });
  };

  const handleDeleteCost = (costId: string) => {
    setAppData((prev) => {
      const updatedCosts = prev.costs.filter((c) => c.id !== costId);
      const updatedData: AppData = { ...prev, costs: updatedCosts };
      persistAppData(updatedData);
      return updatedData;
    });
  };

  // Meter Mutation Handlers
  const handleSaveMeter = (meter: Meter) => {
    setAppData((prev) => {
      const meters = prev.meters || [];
      const existingIdx = meters.findIndex((m) => m.id === meter.id);
      let updatedMeters: Meter[];
      if (existingIdx >= 0) {
        updatedMeters = [...meters];
        updatedMeters[existingIdx] = meter;
      } else {
        updatedMeters = [...meters, meter];
      }
      const updatedData: AppData = { ...prev, meters: updatedMeters };
      persistAppData(updatedData);
      return updatedData;
    });
  };

  const handleDeleteMeter = (meterId: string) => {
    setAppData((prev) => {
      const meters = prev.meters || [];
      const readings = prev.meterReadings || [];
      const updatedMeters = meters.filter((m) => m.id !== meterId);
      const updatedReadings = readings.filter((r) => r.meterId !== meterId);
      const updatedData: AppData = {
        ...prev,
        meters: updatedMeters,
        meterReadings: updatedReadings,
      };
      persistAppData(updatedData);
      return updatedData;
    });
  };

  const handleSaveReading = (reading: MeterReading) => {
    setAppData((prev) => {
      const readings = prev.meterReadings || [];
      const existingIdx = readings.findIndex((r) => r.id === reading.id);
      let updatedReadings: MeterReading[];
      if (existingIdx >= 0) {
        updatedReadings = [...readings];
        updatedReadings[existingIdx] = reading;
      } else {
        updatedReadings = [...readings, reading];
      }
      const updatedData: AppData = { ...prev, meterReadings: updatedReadings };
      persistAppData(updatedData);
      return updatedData;
    });
  };

  const handleSaveUnit = (unit: Unit) => {
    setAppData((prev) => {
      const existingIdx = prev.units.findIndex((u) => u.id === unit.id);
      let updatedUnits: Unit[];
      if (existingIdx >= 0) {
        updatedUnits = [...prev.units];
        updatedUnits[existingIdx] = unit;
      } else {
        updatedUnits = [...prev.units, unit];
      }

      const totalArea = updatedUnits.reduce((sum, u) => sum + u.area, 0);

      const updatedData: AppData = {
        ...prev,
        units: updatedUnits,
        property: {
          ...prev.property,
          totalArea,
        },
      };
      persistAppData(updatedData);
      return updatedData;
    });
  };

  const handleDeleteUnit = (unitId: string) => {
    setAppData((prev) => {
      const updatedUnits = prev.units.filter((u) => u.id !== unitId);
      const updatedTenants = prev.tenants.filter((t) => t.unitId !== unitId);
      const meters = prev.meters || [];
      const updatedMeters = meters.filter((m) => m.unitId !== unitId);
      const totalArea = updatedUnits.reduce((sum, u) => sum + u.area, 0);
      const updatedData: AppData = {
        ...prev,
        units: updatedUnits,
        tenants: updatedTenants,
        meters: updatedMeters,
        property: {
          ...prev.property,
          totalArea,
        },
      };
      persistAppData(updatedData);
      return updatedData;
    });
  };

  const handleSaveTenant = (tenant: Tenant) => {
    setAppData((prev) => {
      const existingIdx = prev.tenants.findIndex((t) => t.id === tenant.id);
      let updatedTenants: Tenant[];
      if (existingIdx >= 0) {
        updatedTenants = [...prev.tenants];
        updatedTenants[existingIdx] = tenant;
      } else {
        updatedTenants = [...prev.tenants, tenant];
      }
      const updatedData: AppData = { ...prev, tenants: updatedTenants };
      persistAppData(updatedData);
      return updatedData;
    });
  };

  const handleDeleteTenant = (tenantId: string) => {
    setAppData((prev) => {
      const updatedTenants = prev.tenants.filter((t) => t.id !== tenantId);
      const updatedData: AppData = { ...prev, tenants: updatedTenants };
      persistAppData(updatedData);
      return updatedData;
    });
  };

  // Direct prepayment adjustment (§ 560 BGB)
  const handleUpdateTenantPrepayment = (tenantId: string, newPrepayment: number) => {
    setAppData((prev) => {
      const updatedTenants = prev.tenants.map((t) => {
        if (t.id === tenantId) {
          return {
            ...t,
            monthlyPrepayment: newPrepayment,
            nextYearPrepayment: newPrepayment,
            prepaymentAdjustedFrom: `${selectedYear + 1}-01-01`,
          };
        }
        return t;
      });
      const updatedData: AppData = { ...prev, tenants: updatedTenants };
      persistAppData(updatedData);
      return updatedData;
    });
  };

  const handleSaveSettings = (
    updatedLandlord: LandlordProfile,
    updatedProperty: Property,
    updatedPaperless?: PaperlessConfig
  ) => {
    setAppData((prev) => {
      const updatedData: AppData = {
        ...prev,
        landlord: updatedLandlord,
        property: updatedProperty,
        paperless: updatedPaperless || prev.paperless,
      };
      persistAppData(updatedData);
      return updatedData;
    });
  };

  const handleRestore = (restoredData: AppData) => {
    setAppData(restoredData);
    persistAppData(restoredData);
    const years = getAvailableYears(restoredData);
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-medium">Lade Betriebskostendaten...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* 3-Zone Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        availableYears={availableYears}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        appData={appData}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            appData={appData}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            onNavigate={(tab) => setActiveTab(tab)}
            onAddCost={() => {
              setActiveTab('costs');
              setIsAddCostModalOpen(true);
            }}
          />
        )}

        {activeTab === 'costs' && (
          <CostsView
            appData={appData}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            availableYears={availableYears}
            onSaveCost={handleSaveCost}
            onDeleteCost={handleDeleteCost}
            isAddModalOpen={isAddCostModalOpen}
            setIsAddModalOpen={setIsAddCostModalOpen}
          />
        )}

        {activeTab === 'meters' && (
          <MetersView
            appData={appData}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            onSaveMeter={handleSaveMeter}
            onDeleteMeter={handleDeleteMeter}
            onSaveReading={handleSaveReading}
          />
        )}

        {activeTab === 'units' && (
          <UnitsView
            appData={appData}
            onSaveUnit={handleSaveUnit}
            onDeleteUnit={handleDeleteUnit}
            onSaveTenant={handleSaveTenant}
            onDeleteTenant={handleDeleteTenant}
          />
        )}

        {activeTab === 'settlement' && (
          <SettlementView
            appData={appData}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            availableYears={availableYears}
            onUpdateTenantPrepayment={handleUpdateTenantPrepayment}
          />
        )}
      </main>

      {/* Modals */}
      <SettingsModal
        appData={appData}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveSettings}
      />

      <BackupModal
        appData={appData}
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRestore={handleRestore}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400 no-print transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>BetriebskostenManager Pro</span>
            <span aria-hidden="true">·</span>
            <span>Konform nach § 2 BetrKV & § 556 BGB</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Lokaler Heimserver (Port 3000)</span>
            </div>
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              JSON-Export & Backup
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
