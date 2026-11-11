import { AllocationKey, BetrkvCategoryDef } from '../types';

export const ALLOCATION_KEYS: { id: AllocationKey; label: string; unit: string; description: string }[] = [
  {
    id: 'm2',
    label: 'Wohnfläche (m²)',
    unit: 'm²',
    description: 'Verteilung nach Quadratmeter Wohnfläche im Verhältnis zur Gesamtfläche',
  },
  {
    id: 'persons',
    label: 'Personenzahl',
    unit: 'Pers.',
    description: 'Verteilung nach gemeldeten Personen bzw. Personenmonaten',
  },
  {
    id: 'units',
    label: 'Wohneinheiten (pauschal)',
    unit: 'WE',
    description: 'Gleichmäßige Verteilung zu gleichen Teilen je Wohneinheit',
  },
  {
    id: 'mea',
    label: 'Miteigentumsanteile (MEA)',
    unit: 'MEA',
    description: 'Verteilung nach Tausendsteln / Miteigentumsanteilen gemäß Teilungserklärung',
  },
  {
    id: 'consumption',
    label: 'Verbrauch (Zähler)',
    unit: 'm³ / kWh',
    description: 'Verteilung nach individueller Zählerablesung (z. B. Wasser- oder Wärmezähler)',
  },
  {
    id: 'direct',
    label: 'Direkte Zuordnung',
    unit: 'Einheit',
    description: '100% Kostenbelastung einer spezifischen Mieteinheit',
  },
];

export const BETRKV_CATEGORIES: BetrkvCategoryDef[] = [
  {
    number: 1,
    code: 'grundsteuer',
    name: 'Grundsteuer',
    legalText: 'Laufende öffentliche Lasten des Grundstücks (§ 2 Nr. 1 BetrKV)',
    defaultKey: 'm2',
    description: 'Hierzu gehört namentlich die Grundsteuer, jedoch keine einmaligen Erschließungsbeiträge.',
  },
  {
    number: 2,
    code: 'wasser',
    name: 'Wasserversorgung',
    legalText: 'Kosten der Wasserversorgung (§ 2 Nr. 2 BetrKV)',
    defaultKey: 'm2',
    description: 'Kosten des Wasserverbrauchs, Grundgebühren, Zählermiete, Eichung und Wartung von Wasserzählern.',
  },
  {
    number: 3,
    code: 'entwaesserung',
    name: 'Entwässerung & Kanal',
    legalText: 'Kosten der Entwässerung (§ 2 Nr. 3 BetrKV)',
    defaultKey: 'm2',
    description: 'Gebühren für Kanalnutzung, Schmutzwasserbeseitigung und Niederschlagswasser / Oberflächenentwässerung.',
  },
  {
    number: 4,
    code: 'heizung',
    name: 'Heizungsanlage',
    legalText: 'Kosten des Betriebs der zentralen Heizungsanlage (§ 2 Nr. 4 BetrKV)',
    defaultKey: 'm2',
    description: 'Brennstoffkosten (Gas, Öl, Fernwärme, Pellets), Betriebsstrom, Wartung, Abgasmessung.',
  },
  {
    number: 5,
    code: 'warmwasser',
    name: 'Warmwasserversorgung',
    legalText: 'Kosten des Betriebs der zentralen Warmwasseranlage (§ 2 Nr. 5 BetrKV)',
    defaultKey: 'm2',
    description: 'Kosten der Wassererwärmung und Pflege der Warmwasserbereitungsgeräte.',
  },
  {
    number: 6,
    code: 'verbundene_anlagen',
    name: 'Verbundene Heizung & Warmwasser',
    legalText: 'Kosten verbundener Anlagen (§ 2 Nr. 6 BetrKV)',
    defaultKey: 'm2',
    description: 'Gemeinsame Kosten von Heizungs- und Warmwasseranlagen bei zentraler kombinierter Erwärmung.',
  },
  {
    number: 7,
    code: 'aufzug',
    name: 'Personen- / Lastenaufzug',
    legalText: 'Kosten des Betriebs des Personen- oder Lastenaufzugs (§ 2 Nr. 7 BetrKV)',
    defaultKey: 'm2',
    description: 'Betriebsstrom, regelmäßige Wartung und Überwachung durch den TÜV bzw. zugelassene Überwachungsstelle.',
  },
  {
    number: 8,
    code: 'muell_strassenreinigung',
    name: 'Straßenreinigung & Müllbeseitigung',
    legalText: 'Kosten der Straßenreinigung und Müllbeseitigung (§ 2 Nr. 8 BetrKV)',
    defaultKey: 'persons',
    description: 'Städtische Müllgebühren (Restmüll, Bio, Papier), Sperrmüllabfuhr sowie Gebühren für die Straßenreinigung.',
  },
  {
    number: 9,
    code: 'gebaeudereinigung',
    name: 'Gebäudereinigung & Ungezieferbekämpfung',
    legalText: 'Kosten der Gebäudereinigung (§ 2 Nr. 9 BetrKV)',
    defaultKey: 'm2',
    description: 'Reinigung gemeinschaftlich genutzter Gebäudeteile (Treppenhaus, Flure, Waschküche) sowie Ungezieferbekämpfung.',
  },
  {
    number: 10,
    code: 'gartenpflege',
    name: 'Gartenpflege',
    legalText: 'Kosten der Gartenpflege (§ 2 Nr. 10 BetrKV)',
    defaultKey: 'm2',
    description: 'Pflege der gärtnerisch angelegten Flächen, Rasenmähen, Heckenschnitt, Erneuerung von Pflanzen und Gehölzen.',
  },
  {
    number: 11,
    code: 'beleuchtung',
    name: 'Allgemeinbeleuchtung',
    legalText: 'Kosten der Beleuchtung (§ 2 Nr. 11 BetrKV)',
    defaultKey: 'm2',
    description: 'Stromkosten für die Außenbeleuchtung sowie für Treppenhaus, Kellergänge und sonstige Gemeinschaftsräume.',
  },
  {
    number: 12,
    code: 'schornstein',
    name: 'Schornsteinreinigung',
    legalText: 'Kosten der Schornsteinreinigung (§ 2 Nr. 12 BetrKV)',
    defaultKey: 'm2',
    description: 'Kehrgebühren des bevollmächtigten Bezirksschornsteinfegers, sofern nicht bereits in Heizkosten enthalten.',
  },
  {
    number: 13,
    code: 'versicherungen',
    name: 'Sach- & Haftpflichtversicherung',
    legalText: 'Kosten der Sach- und Haftpflichtversicherung (§ 2 Nr. 13 BetrKV)',
    defaultKey: 'm2',
    description: 'Wohngebäudeversicherung (Feuer, Sturm, Leitungswasser, Elementarschäden), Glasversicherung, Gebäude-Haftpflicht.',
  },
  {
    number: 14,
    code: 'hauswart',
    name: 'Hauswart / Hausmeister',
    legalText: 'Kosten für den Hauswart (§ 2 Nr. 14 BetrKV)',
    defaultKey: 'm2',
    description: 'Vergütung für ordnungsgemäße Hauswarttätigkeit (bereinigt um Instandhaltungs- und Verwaltungstätigkeiten).',
  },
  {
    number: 15,
    code: 'antenne_kabel',
    name: 'Gemeinschaftsantenne / Breitbandkabel',
    legalText: 'Kosten des Betriebs der Gemeinschafts-Antenne (§ 2 Nr. 15 BetrKV)',
    defaultKey: 'units',
    description: 'Wartung und Betriebsstrom der Gemeinschaftsantenne bzw. Kabelanschluss (unter Berücksichtigung TKG-Novelle).',
  },
  {
    number: 16,
    code: 'waeschepflege',
    name: 'Einrichtungen zur Wäschepflege',
    legalText: 'Kosten der Wäschepflege (§ 2 Nr. 16 BetrKV)',
    defaultKey: 'units',
    description: 'Wartung, Pflege und Bereitstellung gemeinschaftlicher Waschmaschinen, Trockner oder Trockenräume.',
  },
  {
    number: 17,
    code: 'sonstige',
    name: 'Sonstige Betriebskosten',
    legalText: 'Sonstige Betriebskosten (§ 2 Nr. 17 BetrKV)',
    defaultKey: 'm2',
    description: 'Konkret im Mietvertrag benannte Nebenkosten wie Wartung von Rauchwarnmeldern, Legionellenprüfung, Dachrinnenreinigung.',
  },
];

export function getCategoryByNumber(num: number): BetrkvCategoryDef {
  const found = BETRKV_CATEGORIES.find((c) => c.number === num);
  if (found) return found;
  return {
    number: num,
    code: `sonstige_${num}`,
    name: `Sonstige Kosten #${num}`,
    legalText: `Sonstige Betriebskosten nach § 2 Nr. 17 BetrKV`,
    defaultKey: 'm2',
    description: 'Im Mietvertrag ausdrücklich vereinbarte Betriebskostenart.',
  };
}

export function getAllocationKeyLabel(key: AllocationKey): string {
  const found = ALLOCATION_KEYS.find((k) => k.id === key);
  return found ? found.label : key;
}

export function getAllocationKeyUnit(key: AllocationKey): string {
  const found = ALLOCATION_KEYS.find((k) => k.id === key);
  return found ? found.unit : '';
}
