// ─── Pollen Level Scale ───────────────────────────────────────────────────────
// PIA uses a 0–4 scale for pollen levels
export type PollenLevel = 0 | 1 | 2 | 3 | 4;

export const POLLEN_LEVEL_LABELS: Record<PollenLevel, string> = {
  0: 'None',
  1: 'Low',
  2: 'Moderate',
  3: 'High',
  4: 'Very High',
};

export const POLLEN_LEVEL_COLORS: Record<PollenLevel, string> = {
  0: '#9E9E9E', // grey
  1: '#4CAF50', // green
  2: '#FFC107', // amber
  3: '#FF5722', // deep orange
  4: '#B71C1C', // dark red
};

// ─── Taxon (individual pollen type) ──────────────────────────────────────────
export interface PollenTaxon {
  id: string;           // e.g. "poaceae"
  name: string;         // e.g. "Poaceae (grasses)"
  currentLevel: PollenLevel;
  forecast: PollenLevel[]; // array of levels for each forecast day
  forecastDates: string[]; // ISO date strings matching forecast array
}

// ─── Station ──────────────────────────────────────────────────────────────────
export type StationId =
  | 'barcelona'
  | 'bellaterra'
  | 'girona'
  | 'lleida'
  | 'manresa'
  | 'roquetes'
  | 'tarragona'
  | 'vielha';

export interface StationInfo {
  id: StationId;
  name: string;
  lat: number;
  lng: number;
}

export const STATIONS: Record<StationId, StationInfo> = {
  bellaterra: { id: 'bellaterra', name: 'Bellaterra (UAB)', lat: 41.5012, lng: 2.1095 },
  barcelona:  { id: 'barcelona',  name: 'Barcelona',        lat: 41.3874, lng: 2.1686 },
  girona:     { id: 'girona',     name: 'Girona',            lat: 41.9794, lng: 2.8214 },
  lleida:     { id: 'lleida',     name: 'Lleida',            lat: 41.6176, lng: 0.6200 },
  manresa:    { id: 'manresa',    name: 'Manresa',           lat: 41.7286, lng: 1.8264 },
  roquetes:   { id: 'roquetes',   name: 'Roquetes',          lat: 40.8167, lng: 0.4952 },
  tarragona:  { id: 'tarragona',  name: 'Tarragona',         lat: 41.1189, lng: 1.2445 },
  vielha:     { id: 'vielha',     name: 'Vielha',            lat: 42.7025, lng: 0.7958 },
};

// ─── Forecast Response ────────────────────────────────────────────────────────
export interface PollenForecast {
  station: StationInfo;
  fetchedAt: string;       // ISO timestamp of when data was fetched
  weekStart: string;       // ISO date
  weekEnd: string;         // ISO date
  taxons: PollenTaxon[];
}

// ─── User Allergy Profile ─────────────────────────────────────────────────────
// Common allergen keys used across PIA taxon IDs
export type AllergenKey =
  | 'poaceae'      // Grasses
  | 'olea'         // Olive tree
  | 'parietaria'   // Parietaria (wall pellitory) - very common in Catalonia
  | 'platanus'     // Plane tree
  | 'cupressaceae' // Cypress / junipers
  | 'betula'       // Birch
  | 'quercus'      // Oak
  | 'urtica'       // Nettle
  | 'artemisia'    // Mugwort
  | 'plantago'     // Plantain
  | 'alternaria';  // Alternaria (fungal spore)

export const ALLERGEN_DISPLAY_NAMES: Record<AllergenKey, string> = {
  poaceae:      'Grasses',
  olea:         'Olive tree',
  parietaria:   'Parietaria',
  platanus:     'Plane tree',
  cupressaceae: 'Cypress / Juniper',
  betula:       'Birch',
  quercus:      'Oak',
  urtica:       'Nettle',
  artemisia:    'Mugwort',
  plantago:     'Plantain',
  alternaria:   'Alternaria (fungal)',
};

export interface UserAllergyProfile {
  allergens: AllergenKey[];   // which pollens the user is sensitive to
  station: StationId;         // preferred monitoring station
  alertThreshold: PollenLevel; // notify when any allergen hits this level or above
}