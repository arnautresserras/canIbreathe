// ─── Pollen Level Scale ───────────────────────────────────────────────────────
export type PollenLevel = 0 | 1 | 2 | 3 | 4;

export const POLLEN_LEVEL_LABELS: Record<PollenLevel, string> = {
  0: 'None',
  1: 'Low',
  2: 'Moderate',
  3: 'High',
  4: 'Very High',
};

export const POLLEN_LEVEL_COLORS: Record<PollenLevel, string> = {
  0: '#9E9E9E',
  1: '#4CAF50',
  2: '#FFC107',
  3: '#FF5722',
  4: '#B71C1C',
};

// ─── Taxon ────────────────────────────────────────────────────────────────────
export interface PollenTaxon {
  id: string;
  name: string;
  currentLevel: PollenLevel;
  forecast: PollenLevel[];
  forecastDates: string[];
}

// ─── Stations ─────────────────────────────────────────────────────────────────
export type StationId =
  | 'barcelona'
  | 'bellaterra'
  | 'girona'
  | 'lleida'
  | 'manresa'
  | 'roquetes'
  | 'tarragona'
  | 'vielha'
  | 'balears';

export interface StationInfo {
  id: StationId;
  name: string;
  lat: number;
  lng: number;
  region: string;
}

export const STATIONS: Record<StationId, StationInfo> = {
  bellaterra: { id: 'bellaterra', name: 'Bellaterra', lat: 41.5012, lng: 2.1095, region: 'Vallès Occidental' },
  barcelona:  { id: 'barcelona',  name: 'Barcelona',  lat: 41.3874, lng: 2.1686, region: 'Barcelonès' },
  girona:     { id: 'girona',     name: 'Girona',     lat: 41.9794, lng: 2.8214, region: 'Gironès' },
  lleida:     { id: 'lleida',     name: 'Lleida',     lat: 41.6176, lng: 0.6200, region: 'Segrià' },
  manresa:    { id: 'manresa',    name: 'Manresa',    lat: 41.7286, lng: 1.8264, region: 'Bages' },
  roquetes:   { id: 'roquetes',   name: 'Roquetes',   lat: 40.8167, lng: 0.4952, region: 'Baix Ebre' },
  tarragona:  { id: 'tarragona',  name: 'Tarragona',  lat: 41.1189, lng: 1.2445, region: 'Tarragonès' },
  vielha:     { id: 'vielha',     name: 'Vielha',     lat: 42.7025, lng: 0.7958, region: "Val d'Aran" },
  balears:    { id: 'balears',    name: 'Palma',      lat: 39.5696, lng: 2.6502, region: 'Illes Balears' },
};

// ─── Forecast ─────────────────────────────────────────────────────────────────
export interface PollenForecast {
  station: StationInfo;
  fetchedAt: string;
  weekStart: string;
  weekEnd: string;
  taxons: PollenTaxon[];
}

// ─── Allergens ────────────────────────────────────────────────────────────────
// Based on PIA taxons. OLEA is included for user selection — it appears
// seasonally (May–June) and will show "No data" when not in the weekly forecast.
export type AllergenKey =
  | 'poaceae'       // GRAM
  | 'parietaria'    // URTI
  | 'olea'          // OLEA — seasonal
  | 'cruciferae'    // CRUC
  | 'platanus'      // PLAT
  | 'cupressaceae'  // CUPR
  | 'quercus'       // QTOT
  | 'alnus'         // ALNU
  | 'fraxinus'      // FRAX
  | 'ulmus'         // ULMU
  | 'corylus'       // CORY
  | 'acer'          // ACER
  | 'pistacia'      // PIST
  | 'mercurialis'   // MERC
  | 'moraceae'      // MORA
  | 'pinus'         // PINU
  | 'plantago'      // PLAN
  | 'populus'       // POPU
  | 'salix'         // SALI
  | 'alternaria'    // ALTE
  | 'cladosporium'; // CLAD

export interface AllergenInfo {
  key: AllergenKey;
  emoji: string;
}

// Emoji and key only — names and descriptions come from i18n
export const ALLERGENS: AllergenInfo[] = [
  { key: 'poaceae',      emoji: '🌾' },
  { key: 'parietaria',   emoji: '🌿' },
  { key: 'olea',         emoji: '🫒' },
  { key: 'cruciferae',   emoji: '🌼' },
  { key: 'platanus',     emoji: '🌳' },
  { key: 'cupressaceae', emoji: '🌲' },
  { key: 'quercus',      emoji: '🌰' },
  { key: 'alnus',        emoji: '🍂' },
  { key: 'fraxinus',     emoji: '🌱' },
  { key: 'ulmus',        emoji: '🍃' },
  { key: 'corylus',      emoji: '🫘' },
  { key: 'acer',         emoji: '🍁' },
  { key: 'pistacia',     emoji: '🌺' },
  { key: 'mercurialis',  emoji: '🌼' },
  { key: 'moraceae',     emoji: '🫐' },
  { key: 'pinus',        emoji: '🌴' },
  { key: 'plantago',     emoji: '🌻' },
  { key: 'populus',      emoji: '🏔️' },
  { key: 'salix',        emoji: '🌊' },
  { key: 'alternaria',   emoji: '🍄' },
  { key: 'cladosporium', emoji: '🔬' },
];

// ─── Threshold options ────────────────────────────────────────────────────────
export interface ThresholdOption {
  level: PollenLevel;
}

export const THRESHOLD_OPTIONS: ThresholdOption[] = [
  { level: 1 },
  { level: 2 },
  { level: 3 },
  { level: 4 },
];

// ─── Notification time options ────────────────────────────────────────────────
export interface TimeOption {
  hour: number;
  minute: number;
  label: string;
}

export const NOTIFICATION_TIMES: TimeOption[] = [
  { hour: 5,  minute: 0,  label: '5:00 AM' },
  { hour: 5,  minute: 30, label: '5:30 AM' },
  { hour: 6,  minute: 0,  label: '6:00 AM' },
  { hour: 6,  minute: 30, label: '6:30 AM' },
  { hour: 7,  minute: 0,  label: '7:00 AM' },
  { hour: 7,  minute: 30, label: '7:30 AM' },
  { hour: 8,  minute: 0,  label: '8:00 AM' },
  { hour: 8,  minute: 30, label: '8:30 AM' },
  { hour: 9,  minute: 0,  label: '9:00 AM' },
  { hour: 9,  minute: 30, label: '9:30 AM' },
  { hour: 10, minute: 0,  label: '10:00 AM' },
];

// ─── User Profile ─────────────────────────────────────────────────────────────
export interface UserAllergyProfile {
  allergens: AllergenKey[];
  station: StationId;
  alertThreshold: PollenLevel;
  notificationsEnabled: boolean;
  notificationHour: number;
  notificationMinute: number;
  onboardingComplete: boolean;
}

export const DEFAULT_PROFILE: UserAllergyProfile = {
  allergens: [],
  station: 'bellaterra',
  alertThreshold: 2,
  notificationsEnabled: true,
  notificationHour: 7,
  notificationMinute: 0,
  onboardingComplete: false,
};