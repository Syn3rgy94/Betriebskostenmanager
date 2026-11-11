import { INITIAL_APP_DATA } from '../constants/initialData';
import { AppData } from '../types';

const STORAGE_KEY = 'betriebskosten_manager_db';

export async function fetchAppData(): Promise<AppData> {
  // 1. Try server endpoint first
  try {
    const res = await fetch('/api/data', {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.property && Array.isArray(data.units)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch {
    // Server not available, fall back to localStorage
  }

  // 2. Check localStorage
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.property && Array.isArray(parsed.units)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not parse localStorage data', err);
  }

  // 3. Fall back to initial seed data
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APP_DATA));
  return INITIAL_APP_DATA;
}

export async function persistAppData(data: AppData): Promise<void> {
  const updatedData: AppData = {
    ...data,
    lastUpdated: new Date().toISOString(),
  };

  // Always save in localStorage for instant responsiveness
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  } catch (e) {
    console.error('LocalStorage save error', e);
  }

  // Try saving to local server database
  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });
  } catch (err) {
    console.warn('Failed to persist to /api/data, local changes kept in browser', err);
  }
}

export function exportBackupJson(data: AppData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `betriebskosten_backup_${data.property.name.replace(/\s+/g, '_')}_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseAndValidateBackup(jsonString: string): AppData {
  const parsed = JSON.parse(jsonString);
  if (!parsed.property || !Array.isArray(parsed.units) || !Array.isArray(parsed.costs)) {
    throw new Error('Ungültiges Dateiformat: Erforderliche Felder (Liegenschaft, Einheiten, Kosten) fehlen.');
  }
  return {
    version: parsed.version || '1.0.0',
    lastUpdated: new Date().toISOString(),
    landlord: parsed.landlord || INITIAL_APP_DATA.landlord,
    property: parsed.property,
    units: parsed.units,
    tenants: parsed.tenants || [],
    costs: parsed.costs || [],
    meters: parsed.meters || [],
    meterReadings: parsed.meterReadings || [],
    paperless: parsed.paperless || INITIAL_APP_DATA.paperless,
  };
}
