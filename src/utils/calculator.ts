import {
  AllocationKey,
  AppData,
  CostEntry,
  Meter,
  MeterConsumptionItem,
  MeterReading,
  ReceiptItem,
  SettlementPosition,
  Tenant,
  TenantSettlement,
  Unit,
} from '../types';
import { getCategoryByNumber, getAllocationKeyLabel } from '../constants/betrkv';

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(val: number, decimals: number = 2): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

export function formatDateGerman(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

export function getMeterTypeLabel(type: string): string {
  switch (type) {
    case 'cold_water':
      return 'Kaltwasser';
    case 'warm_water':
      return 'Warmwasser';
    case 'heating':
      return 'Heizung / Wärme';
    case 'electricity':
      return 'Strom';
    default:
      return 'Zähler';
  }
}

export function calculateTenantSettlement(
  appData: AppData,
  tenant: Tenant,
  year: number,
  bufferPercentage: number = 5
): TenantSettlement | null {
  const unit = appData.units.find((u) => u.id === tenant.unitId);
  if (!unit) return null;

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const daysInYear = getDaysInYear(year);

  const leaseStartDate = new Date(tenant.leaseStart);
  const effectiveStart = leaseStartDate > yearStart ? leaseStartDate : yearStart;

  let effectiveEnd = yearEnd;
  if (tenant.leaseEnd) {
    const leaseEndDate = new Date(tenant.leaseEnd);
    if (leaseEndDate < yearEnd) {
      effectiveEnd = leaseEndDate;
    }
  }

  // Check if tenant was active during this year
  if (effectiveStart > yearEnd || effectiveEnd < yearStart || effectiveStart > effectiveEnd) {
    return null;
  }

  const diffTime = effectiveEnd.getTime() - effectiveStart.getTime();
  const daysActive = Math.min(daysInYear, Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1));
  const timeFactor = daysActive / daysInYear;

  // Filter costs for this year
  const yearCosts = appData.costs.filter((c) => c.year === year && c.propertyId === appData.property.id);

  // Property totals for keys
  const totalArea = appData.property.totalArea || appData.units.reduce((sum, u) => sum + u.area, 0);
  const totalPersons = appData.units.reduce((sum, u) => sum + (u.persons || 1), 0);
  const totalUnitsCount = appData.units.length;
  const totalMea = appData.property.totalMea || appData.units.reduce((sum, u) => sum + (u.mea || 0), 0) || 1000;

  // Meters and readings lookup
  const meters = appData.meters || [];
  const readings = appData.meterReadings || [];

  // Group or map costs to settlement positions
  const positions: SettlementPosition[] = [];

  for (const cost of yearCosts) {
    const catDef = getCategoryByNumber(cost.categoryNumber);
    let denominator = totalArea;
    let numerator = unit.area;

    if (cost.key === 'persons') {
      denominator = totalPersons;
      numerator = unit.persons;
    } else if (cost.key === 'units') {
      denominator = totalUnitsCount;
      numerator = 1;
    } else if (cost.key === 'mea') {
      denominator = totalMea;
      numerator = unit.mea;
    } else if (cost.key === 'direct') {
      denominator = 1;
      numerator = cost.directUnitId === unit.id ? 1 : 0;
    } else if (cost.key === 'consumption') {
      // Determine meter types applicable for this category
      let relevantTypes: string[] = ['cold_water'];
      if (cost.categoryNumber === 2) relevantTypes = ['cold_water'];
      else if (cost.categoryNumber === 5) relevantTypes = ['warm_water'];
      else if (cost.categoryNumber === 4 || cost.categoryNumber === 6) relevantTypes = ['heating', 'warm_water'];

      // Unit's meters and consumption
      const unitMeters = meters.filter((m) => m.unitId === unit.id && relevantTypes.includes(m.type));
      const unitMeterIds = unitMeters.map((m) => m.id);
      const unitConsumption = readings
        .filter((r) => r.year === year && unitMeterIds.includes(r.meterId))
        .reduce((sum, r) => sum + r.consumption, 0);

      // Total consumption across all units
      const allApplicableMeters = meters.filter((m) => relevantTypes.includes(m.type));
      const allMeterIds = allApplicableMeters.map((m) => m.id);
      const totalConsumption = readings
        .filter((r) => r.year === year && allMeterIds.includes(r.meterId))
        .reduce((sum, r) => sum + r.consumption, 0);

      denominator = totalConsumption > 0 ? totalConsumption : totalArea;
      numerator = totalConsumption > 0 ? unitConsumption : unit.area;
    }

    if (denominator <= 0) denominator = 1;

    const fullYearCost = (cost.amount * numerator) / denominator;
    const tenantCost = fullYearCost * timeFactor;

    positions.push({
      categoryNumber: cost.categoryNumber,
      categoryName: cost.customTitle ? `${catDef.name} (${cost.customTitle})` : catDef.name,
      totalCost: cost.amount,
      allocationKey: cost.key,
      keyLabel: getAllocationKeyLabel(cost.key),
      totalUnitsValue: denominator,
      tenantUnitsValue: numerator,
      factor: timeFactor,
      tenantCost: Math.round(tenantCost * 100) / 100,
      receiptNumber: cost.receiptNumber,
      details: cost.serviceProvider
        ? `${cost.serviceProvider}${cost.invoiceNumber ? ` (Rechn.-Nr. ${cost.invoiceNumber})` : ''}`
        : undefined,
    });
  }

  // Sort positions by BetrKV category number
  positions.sort((a, b) => a.categoryNumber - b.categoryNumber);

  const totalTenantCost = positions.reduce((sum, p) => sum + p.tenantCost, 0);

  // Prepayments calculation
  let prepayments = 0;
  if (tenant.customPrepayments && typeof tenant.customPrepayments[year] === 'number') {
    prepayments = tenant.customPrepayments[year];
  } else {
    const activeMonths = Math.round((daysActive / daysInYear) * 12 * 10) / 10;
    prepayments = Math.round(tenant.monthlyPrepayment * activeMonths * 100) / 100;
  }

  const balance = Math.round((totalTenantCost - prepayments) * 100) / 100;

  // Due date: 30 days from now
  const due = new Date();
  due.setDate(due.getDate() + (appData.landlord.paymentDueDays || 30));
  const paymentDueDate = due.toISOString().split('T')[0];

  // Compute recommended monthly prepayment for next year
  // Monthly actual cost plus optional safety buffer
  const monthlyCost = totalTenantCost / (daysActive > 0 ? (daysActive / daysInYear) * 12 : 12);
  const bufferedMonthly = monthlyCost * (1 + bufferPercentage / 100);
  const recommendedMonthlyPrepayment = Math.ceil(bufferedMonthly / 5) * 5; // rounded to next 5€
  const monthlyDifference = Math.round((recommendedMonthlyPrepayment - tenant.monthlyPrepayment) * 100) / 100;

  // Meter Consumptions for this unit
  const unitMeters = meters.filter((m) => m.unitId === unit.id);
  const meterConsumptions: MeterConsumptionItem[] = [];
  for (const m of unitMeters) {
    const r = readings.find((rd) => rd.meterId === m.id && rd.year === year);
    if (r) {
      meterConsumptions.push({
        meterNumber: m.meterNumber,
        typeLabel: getMeterTypeLabel(m.type),
        startReading: r.startReading,
        endReading: r.endReading,
        consumption: r.consumption,
        unit: m.unitOfMeasurement,
        location: m.location,
      });
    }
  }

  // Receipts list
  const receipts: ReceiptItem[] = yearCosts.map((c) => {
    const cat = getCategoryByNumber(c.categoryNumber);
    return {
      receiptNumber: c.receiptNumber || `BEL-${c.year}-${c.categoryNumber}`,
      categoryNumber: c.categoryNumber,
      categoryName: c.customTitle ? `${cat.name} (${c.customTitle})` : cat.name,
      amount: c.amount,
      provider: c.serviceProvider,
      invoiceNumber: c.invoiceNumber,
      date: c.invoiceDate,
      verified: c.verified,
    };
  });

  return {
    tenantId: tenant.id,
    tenantName: `${tenant.firstName} ${tenant.lastName}`,
    salutation: tenant.salutation,
    unitNumber: unit.number,
    unitFloor: unit.floor,
    unitArea: unit.area,
    unitPersons: unit.persons,
    year,
    billingPeriodStart: effectiveStart.toISOString().split('T')[0],
    billingPeriodEnd: effectiveEnd.toISOString().split('T')[0],
    daysActive,
    daysInYear,
    positions,
    totalTenantCost: Math.round(totalTenantCost * 100) / 100,
    prepayments,
    balance,
    paymentDueDate,
    recommendedMonthlyPrepayment,
    monthlyDifference,
    meterConsumptions,
    receipts,
    includeAdjustmentClause: monthlyDifference > 0,
  };
}

export function getAvailableYears(appData: AppData): number[] {
  const yearsSet = new Set<number>();
  appData.costs.forEach((c) => yearsSet.add(c.year));
  appData.tenants.forEach((t) => t.activeYears?.forEach((y) => yearsSet.add(y)));
  appData.meterReadings?.forEach((r) => yearsSet.add(r.year));
  const currentYear = new Date().getFullYear();
  yearsSet.add(currentYear);
  yearsSet.add(currentYear - 1);
  return Array.from(yearsSet).sort((a, b) => b - a); // descending
}

export function getMultiYearCostSummary(appData: AppData) {
  const years = getAvailableYears(appData).sort((a, b) => a - b);
  const propertyId = appData.property.id;

  return years.map((year, idx) => {
    const yearCosts = appData.costs.filter((c) => c.year === year && c.propertyId === propertyId);
    const totalAmount = yearCosts.reduce((sum, c) => sum + c.amount, 0);
    const costPerM2 = appData.property.totalArea > 0 ? totalAmount / appData.property.totalArea : 0;
    const costPerM2Month = costPerM2 / 12;

    const prevYearCost =
      idx > 0
        ? appData.costs
            .filter((c) => c.year === years[idx - 1] && c.propertyId === propertyId)
            .reduce((sum, c) => sum + c.amount, 0)
        : null;

    const deltaPercent =
      prevYearCost && prevYearCost > 0 ? ((totalAmount - prevYearCost) / prevYearCost) * 100 : null;

    return {
      year,
      totalAmount,
      costPerM2,
      costPerM2Month,
      itemCount: yearCosts.length,
      deltaPercent,
    };
  });
}
