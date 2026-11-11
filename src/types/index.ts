export type AllocationKey = 'm2' | 'persons' | 'units' | 'mea' | 'direct' | 'consumption';

export type MeterType = 'cold_water' | 'warm_water' | 'heating' | 'electricity' | 'other';

export interface Meter {
  id: string;
  unitId: string;
  type: MeterType;
  meterNumber: string; // e.g. "KW-2019-882"
  location?: string; // e.g. "Bad", "Küche", "Heizungsraum"
  unitOfMeasurement: string; // "m³", "kWh", "Einheiten"
  calibrationYear?: number; // Eichjahr
  initialReading?: number;
  notes?: string;
}

export interface MeterReading {
  id: string;
  meterId: string;
  year: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startReading: number;
  endReading: number;
  consumption: number; // endReading - startReading
}

export interface Property {
  id: string;
  name: string;
  street: string;
  zip: string;
  city: string;
  totalArea: number; // in m²
  totalMea?: number; // Miteigentumsanteile z.B. 1000
  notes?: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  number: string; // e.g. "WE 01"
  floor: string; // e.g. "Erdgeschoss links"
  area: number; // in m²
  persons: number; // Anzahl Personen für personengebundene Umlage
  mea: number; // Miteigentumsanteile
  description?: string;
}

export interface Tenant {
  id: string;
  unitId: string;
  salutation: string; // 'Herr', 'Frau', 'Familie', etc.
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  leaseStart: string; // YYYY-MM-DD
  leaseEnd?: string; // YYYY-MM-DD (optional for active tenancy)
  monthlyPrepayment: number; // Monatliche Betriebskostenvorauszahlung in €
  activeYears: number[]; // e.g. [2022, 2023, 2024, 2025]
  customPrepayments?: Record<number, number>; // Jahr -> Summe tatsächlicher Vorauszahlungen falls abweichend
  nextYearPrepayment?: number; // Anpassung für das Folgejahr nach § 560 BGB
  prepaymentAdjustedFrom?: string; // Gültig ab Datum z.B. 2025-01-01
}

export interface BetrkvCategoryDef {
  number: number; // 1 to 17
  code: string;
  name: string;
  legalText: string;
  defaultKey: AllocationKey;
  description: string;
}

export interface CostEntry {
  id: string;
  propertyId: string;
  year: number;
  categoryNumber: number; // 1-17
  customTitle?: string; // Für Nr. 17 oder Details
  amount: number; // in Euro
  key: AllocationKey;
  invoiceDate?: string; // YYYY-MM-DD
  invoiceNumber?: string;
  serviceProvider?: string;
  directUnitId?: string; // Falls key === 'direct'
  receiptNumber?: string; // e.g. "BEL-2024-001"
  verified?: boolean; // Beleg geprüft
  documentFolder?: string; // z. B. "Ordner Finanzen 2024, Fach 2"
  paperlessDocId?: number; // Paperless-ngx Dokumenten-ID
  paperlessAsn?: number; // Paperless-ngx Archive Serial Number
  paperlessTitle?: string; // Originaldokumententitel
  notes?: string;
}

export interface LandlordProfile {
  name: string;
  company?: string;
  street: string;
  zip: string;
  city: string;
  phone?: string;
  email?: string;
  iban: string;
  bic: string;
  bankName: string;
  paymentDueDays: number; // z.B. 30 Tage
}

export interface SettlementPosition {
  categoryNumber: number;
  categoryName: string;
  totalCost: number;
  allocationKey: AllocationKey;
  keyLabel: string;
  totalUnitsValue: number;
  tenantUnitsValue: number;
  factor: number; // Zeitfaktor z.B. 365/365 oder Monatsanteil
  tenantCost: number;
  receiptNumber?: string;
  paperlessDocId?: number;
  details?: string;
}

export interface MeterConsumptionItem {
  meterNumber: string;
  typeLabel: string;
  startReading: number;
  endReading: number;
  consumption: number;
  unit: string;
  location?: string;
}

export interface ReceiptItem {
  receiptNumber: string;
  categoryNumber: number;
  categoryName: string;
  amount: number;
  provider?: string;
  invoiceNumber?: string;
  date?: string;
  verified?: boolean;
  paperlessDocId?: number;
}

export interface TenantSettlement {
  tenantId: string;
  tenantName: string;
  salutation: string;
  unitNumber: string;
  unitFloor: string;
  unitArea: number;
  unitPersons: number;
  year: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  daysActive: number;
  daysInYear: number;
  positions: SettlementPosition[];
  totalTenantCost: number;
  prepayments: number;
  balance: number; // positive = Nachzahlung, negative = Guthaben
  paymentDueDate: string;
  // Features
  recommendedMonthlyPrepayment: number;
  monthlyDifference: number;
  meterConsumptions: MeterConsumptionItem[];
  receipts: ReceiptItem[];
  includeAdjustmentClause?: boolean;
  paperlessDocId?: number;
  paperlessUploadStatus?: 'idle' | 'uploading' | 'uploaded' | 'error';
}

export interface PaperlessConfig {
  enabled: boolean;
  serverUrl: string; // e.g. "http://192.168.178.50:8000"
  apiToken: string;
  defaultTags: string[]; // e.g. ["Betriebskosten", "Liegenschaft"]
}

export interface PaperlessDocument {
  id: number;
  title: string;
  asn?: number;
  created: string;
  modified: string;
  correspondent?: number | string;
  tags?: (number | string)[];
  originalFileName?: string;
}

export interface AppData {
  version: string;
  lastUpdated: string;
  landlord: LandlordProfile;
  property: Property;
  units: Unit[];
  tenants: Tenant[];
  costs: CostEntry[];
  meters: Meter[];
  meterReadings: MeterReading[];
  paperless?: PaperlessConfig;
}
