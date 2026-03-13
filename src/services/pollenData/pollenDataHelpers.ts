import { XMLParser } from 'fast-xml-parser';
import {
  AllergenKey,
  PollenForecast,
  PollenLevel,
  PollenTaxon,
  StationId,
  STATIONS,
} from './pollenDataTypes';

// ─── XML Parser ───────────────────────────────────────────────────────────────
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

// ─── Level mapping ────────────────────────────────────────────────────────────
function parseLevel(raw: string | number | undefined): PollenLevel {
  const n = Number(raw);
  if (isNaN(n) || n < 0 || n > 4) return 0;
  return n as PollenLevel;
}

// ─── Forecast trend ───────────────────────────────────────────────────────────
export type ForecastTrend = 'increase' | 'decrease' | 'stable' | 'exceptional' | 'unknown';

function parseTrend(raw: string | undefined): ForecastTrend {
  switch (raw) {
    case 'A':  return 'increase';
    case 'D':  return 'decrease';
    case '=':  return 'stable';
    case '!':  return 'exceptional';
    default:   return 'unknown';
  }
}

export const TREND_LABELS: Record<ForecastTrend, string> = {
  increase:    '↑ Rising',
  decrease:    '↓ Falling',
  stable:      '→ Stable',
  exceptional: '⚠ Exceptional',
  unknown:     '– Unknown',
};

// ─── Complete PIA code → AllergenKey map ─────────────────────────────────────
// Based on observed taxons across multiple weeks of Bellaterra data.
const CODE_TO_ALLERGEN: Record<string, AllergenKey> = {
  GRAM: 'poaceae',
  CRUC: 'cruciferae',
  URTI: 'parietaria',
  PLAT: 'platanus',
  CUPR: 'cupressaceae',
  QTOT: 'quercus',
  ALNU: 'alnus',
  FRAX: 'fraxinus',
  ULMU: 'ulmus',
  CORY: 'corylus',
  ACER: 'acer',
  PIST: 'pistacia',
  MERC: 'mercurialis',
  MORA: 'moraceae',
  PINU: 'pinus',
  PLAN: 'plantago',
  POPU: 'populus',
  SALI: 'salix',
  ALTE: 'alternaria',
  CLAD: 'cladosporium',
  OLEA: 'olea',
};

// ─── Extended taxon with trend ────────────────────────────────────────────────
export interface PollenTaxonWithTrend extends PollenTaxon {
  trend: ForecastTrend;
}

// ─── Core XML parser ──────────────────────────────────────────────────────────
export function parsePollenXML(xml: string, stationId: StationId): PollenForecast {
  let parsed: any;

  try {
    parsed = xmlParser.parse(xml);
  } catch (e) {
    throw new Error(`Failed to parse PIA XML: ${(e as Error).message}`);
  }

  const root = parsed?.reports;
  if (!root) throw new Error('Unexpected XML structure: could not find <reports> root node');

  const report = root.report;
  if (!report) throw new Error('Unexpected XML structure: could not find <report> node');

  const weekStart: string = report?.date?.start ?? '';
  const weekEnd: string   = report?.date?.end ?? '';

  const pollenDefs   = root?.taxons?.pollens  ?? {};
  const sporeDefs    = root?.taxons?.spores   ?? {};
  const currentPollens  = report?.current?.pollens  ?? {};
  const currentSpores   = report?.current?.spores   ?? {};
  const forecastPollens = report?.forecast?.pollens ?? {};
  const forecastSpores  = report?.forecast?.spores  ?? {};

  const taxons: PollenTaxonWithTrend[] = [];

  function processDefs(
    defs: Record<string, any>,
    currentData: Record<string, any>,
    forecastData: Record<string, any>
  ) {
    for (const code of Object.keys(defs)) {
      if (code.startsWith('@_')) continue;

      const defEntry = defs[code];
      const name: string =
        typeof defEntry === 'string'
          ? defEntry
          : defEntry?.['#text'] ?? defEntry?.['@_en'] ?? code;

      // Explicitly check for undefined rather than falsy,
      // so level 0 taxons are included correctly
      const rawLevel = currentData[code];
      const currentLevel = rawLevel !== undefined ? parseLevel(rawLevel) : 0;
      const trend = parseTrend(String(forecastData[code] ?? ''));
      const id = CODE_TO_ALLERGEN[code] ?? code.toLowerCase();
      if (!CODE_TO_ALLERGEN[code]) console.warn(`[PollenParser] Unmapped code: '${code}' → id: '${id}'`);

      taxons.push({
        id,
        name,
        currentLevel,
        trend,
        forecast: [],
        forecastDates: [],
      });
    }
  }

  processDefs(pollenDefs, currentPollens, forecastPollens);
  processDefs(sporeDefs,  currentSpores,  forecastSpores);

  return {
    station:   STATIONS[stationId],
    fetchedAt: new Date().toISOString(),
    weekStart,
    weekEnd,
    taxons,
  };
}

// ─── Filter helpers ───────────────────────────────────────────────────────────
export function filterByAllergens(
  forecast: PollenForecast,
  allergens: AllergenKey[]
): PollenTaxonWithTrend[] {
  const all = forecast.taxons as PollenTaxonWithTrend[];
  if (allergens.length === 0) return all;
  return all.filter((t) => allergens.includes(t.id as AllergenKey));
}

export function getMaxLevel(taxons: PollenTaxon[]): PollenLevel {
  if (taxons.length === 0) return 0;
  return Math.max(...taxons.map((t) => t.currentLevel)) as PollenLevel;
}

export function buildDailySummary(taxons: PollenTaxonWithTrend[]): string {
  const active = taxons.filter((t) => t.currentLevel > 0);
  if (active.length === 0) return '';
  return active
    .sort((a, b) => b.currentLevel - a.currentLevel)
    .map((t) => `${t.name}: ${t.currentLevel}`)
    .join(' · ');
}