import { XMLParser } from 'fast-xml-parser';
import {
  PollenLevel,
  PollenTaxon,
  PollenForecast,
  StationId,
  STATIONS,
  AllergenKey,
} from './pollenDataTypes';

// ─── XML Parser config ────────────────────────────────────────────────────────
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
 
// ─── Forecast trend mapping ───────────────────────────────────────────────────
// PIA forecast uses letters, not numbers: A = increase, D = decrease, = = stable, ! = exceptional
export type ForecastTrend = 'increase' | 'decrease' | 'stable' | 'exceptional' | 'unknown';
 
function parseTrend(raw: string | undefined): ForecastTrend {
  switch (raw) {
    case 'A': return 'increase';
    case 'D': return 'decrease';
    case '=': return 'stable';
    case '!': return 'exceptional';
    default:  return 'unknown';
  }
}
 
export const TREND_LABELS: Record<ForecastTrend, string> = {
  increase:    '↑ Rising',
  decrease:    '↓ Falling',
  stable:      '→ Stable',
  exceptional: '⚠ Exceptional',
  unknown:     '– Unknown',
};
 
// ─── Taxon code → AllergenKey map ─────────────────────────────────────────────
// Maps PIA's short codes (URTI, GRAM, etc.) to our internal AllergenKey
const CODE_TO_ALLERGEN: Record<string, AllergenKey> = {
  URTI: 'parietaria',   // Wall Pellitory / Urticaceae
  GRAM: 'poaceae',      // Gramineae / Grasses
  OLEA: 'olea',
  CUPR: 'cupressaceae',
  PLAT: 'platanus',
  PLAN: 'plantago',
  ALTE: 'alternaria',
  // Add more mappings as needed
};
 
// ─── Updated PollenTaxon to include forecast trend ────────────────────────────
export interface PollenTaxonWithTrend extends PollenTaxon {
  trend: ForecastTrend;
}
 
// ─── Core XML parser ──────────────────────────────────────────────────────────
/**
 * Actual PIA XML structure:
 *
 * <reports>
 *   <taxons>
 *     <pollens>
 *       <URTI en="Wall Pellitory">Urticaceae</URTI>
 *       <GRAM en="Gramineae">Gramineae (Poaceae)</GRAM>
 *       ...
 *     </pollens>
 *     <spores>
 *       <ALTE en="Alternaria">Alternaria</ALTE>
 *       ...
 *     </spores>
 *   </taxons>
 *   <report>
 *     <station><name>Bellaterra</name>...</station>
 *     <date><start>2026-03-09</start><end>2026-03-15</end></date>
 *     <current>
 *       <pollens><URTI>3</URTI><GRAM>1</GRAM>...</pollens>
 *       <spores><ALTE>1</ALTE>...</spores>
 *     </current>
 *     <forecast>
 *       <pollens><URTI>=</URTI><GRAM>=</GRAM>...</pollens>
 *       <spores><ALTE>=</ALTE>...</spores>
 *     </forecast>
 *   </report>
 * </reports>
 */
export function parsePollenXML(xml: string, stationId: StationId): PollenForecast {
  let parsed: any;
 
  try {
    parsed = xmlParser.parse(xml);
  } catch (e) {
    throw new Error(`Failed to parse PIA XML: ${(e as Error).message}`);
  }
 
  const root = parsed?.reports;
  if (!root) {
    throw new Error(`Unexpected XML structure: could not find <reports> root node`);
  }
 
  const report = root.report;
  if (!report) {
    throw new Error(`Unexpected XML structure: could not find <report> node`);
  }
 
  // ── Dates
  const weekStart: string = report?.date?.start ?? '';
  const weekEnd: string   = report?.date?.end ?? '';
 
  // ── Taxon definitions (code → display name)
  const taxonDefs = root?.taxons ?? {};
  const pollenDefs = taxonDefs?.pollens ?? {};
  const sporeDefs  = taxonDefs?.spores  ?? {};
 
  // ── Current levels
  const currentPollens  = report?.current?.pollens  ?? {};
  const currentSpores   = report?.current?.spores   ?? {};
 
  // ── Forecast trends
  const forecastPollens = report?.forecast?.pollens ?? {};
  const forecastSpores  = report?.forecast?.spores  ?? {};
 
  // ── Build taxon list from definitions
  const taxons: PollenTaxonWithTrend[] = [];
 
  function processDefs(
    defs: Record<string, any>,
    currentData: Record<string, any>,
    forecastData: Record<string, any>
  ) {
    for (const code of Object.keys(defs)) {
      // Skip XML attribute keys
      if (code.startsWith('@_')) continue;
 
      const defEntry = defs[code];
      // Display name: the text content of the tag, e.g. "Gramineae (Poaceae)"
      const name: string =
        typeof defEntry === 'string'
          ? defEntry
          : defEntry?.['#text'] ?? defEntry?.['@_en'] ?? code;
 
      const currentLevel = parseLevel(currentData[code]);
      const trend        = parseTrend(String(forecastData[code] ?? ''));
      const id           = CODE_TO_ALLERGEN[code] ?? code.toLowerCase();
 
      taxons.push({
        id,
        name,
        currentLevel,
        trend,
        // Keep these for PollenTaxon interface compatibility
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
 
export function buildDailySummary(
  taxons: PollenTaxonWithTrend[],
  levelLabels: Record<PollenLevel, string>
): string {
  const active = taxons.filter((t) => t.currentLevel > 0);
  if (active.length === 0) return 'No significant pollen detected today.';
 
  return active
    .sort((a, b) => b.currentLevel - a.currentLevel)
    .map((t) => `${t.name}: ${levelLabels[t.currentLevel]}`)
    .join(' · ');
}