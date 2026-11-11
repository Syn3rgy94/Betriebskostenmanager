import { Building2, FileText, Home, Layers, Settings, Moon, Sun, Download, Gauge } from 'lucide-react';
import { AppData } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  appData: AppData;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedYear,
  setSelectedYear,
  availableYears,
  darkMode,
  setDarkMode,
  appData,
  onOpenSettings,
  onOpenBackup,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 transition-colors no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Zone 1: Brand Wordmark (Strict single element) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-700 dark:bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <a
              href="#dashboard"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('dashboard');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
            >
              BetriebskostenManager
            </a>
          </div>

          {/* Zone 2: Navigation Links (single line, no wrapping, clean hover) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              Übersicht
            </button>
            <button
              onClick={() => setActiveTab('costs')}
              className={`flex items-center gap-2 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'costs'
                  ? 'text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              Betriebskosten (§ 2 BetrKV)
            </button>
            <button
              onClick={() => setActiveTab('meters')}
              className={`flex items-center gap-2 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'meters'
                  ? 'text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Gauge className="w-4 h-4" />
              Zähler & Verbräuche
            </button>
            <button
              onClick={() => setActiveTab('units')}
              className={`flex items-center gap-2 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'units'
                  ? 'text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Einheiten & Mieter
            </button>
            <button
              onClick={() => setActiveTab('settlement')}
              className={`flex items-center gap-2 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'settlement'
                  ? 'text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Abrechnungen ({selectedYear})
            </button>
          </nav>

          {/* Zone 3: Primary Action & Quick Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Year Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 hidden sm:inline">Jahr:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-slate-900 dark:text-slate-100 py-1 px-2.5 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                aria-label="Abrechnungsjahr auswählen"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Backup Button */}
            <button
              onClick={onOpenBackup}
              title="Daten-Backup & Export"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Backup und Export"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Landlord Settings */}
            <button
              onClick={onOpenSettings}
              title="Vermieter- & Objektdaten"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Stammdaten öffnen"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Heller Modus' : 'Dunkler Modus'}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Design umschalten"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => setActiveTab('settlement')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Abrechnung {selectedYear}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-1 px-2 ${activeTab === 'dashboard' ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab('costs')}
            className={`py-1 px-2 ${activeTab === 'costs' ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Kosten
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`py-1 px-2 ${activeTab === 'units' ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Einheiten
          </button>
          <button
            onClick={() => setActiveTab('settlement')}
            className={`py-1 px-2 ${activeTab === 'settlement' ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Abrechnung
          </button>
        </div>
      </div>
    </header>
  );
};
