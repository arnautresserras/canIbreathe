import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PollenForecast,
  StationId,
  UserAllergyProfile,
  POLLEN_LEVEL_LABELS,
} from './pollenDataTypes';
import {
  parsePollenXML,
  filterByAllergens,
  getMaxLevel,
  buildDailySummary,
} from './pollenDataHelpers';
import { Platform } from 'react-native';

// ─── Constants ────────────────────────────────────────────────────────────────
const PIA_BASE_URL = 'https://aerobiologia.cat/api/v0/forecast';
const PIA_PROXY_URL = (process.env.EXPO_PUBLIC_PIA_PROXY_URL || '').replace(/\/$/, '');

function buildPiaUrl(stationId: StationId): string {
  const target = `${PIA_BASE_URL}/${stationId}/en/xml`;
  if (Platform.OS === 'web' && PIA_PROXY_URL) {
    return `${PIA_PROXY_URL}?url=${encodeURIComponent(target)}`;
  }
  return target;
}
const CACHE_KEY_PREFIX = 'pollen_cache_';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours — PIA updates weekly, no need to hammer it

// ─── Cache helpers ────────────────────────────────────────────────────────────
interface CacheEntry {
  forecast: PollenForecast;
  cachedAt: number; // epoch ms
}

async function readCache(stationId: StationId): Promise<PollenForecast | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${stationId}`);
    if (!raw) return null;

    const entry: CacheEntry = JSON.parse(raw);
    const age = Date.now() - entry.cachedAt;

    if (age > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${stationId}`);
      return null;
    }

    return entry.forecast;
  } catch {
    return null;
  }
}

async function writeCache(stationId: StationId, forecast: PollenForecast): Promise<void> {
  try {
    const entry: CacheEntry = { forecast, cachedAt: Date.now() };
    await AsyncStorage.setItem(
      `${CACHE_KEY_PREFIX}${stationId}`,
      JSON.stringify(entry)
    );
  } catch {
    // Non-fatal — app works fine without cache
    console.warn('[PollenService] Failed to write cache');
  }
}

// ─── Core fetch ───────────────────────────────────────────────────────────────
/**
 * Fetches the weekly pollen forecast from PIA for a given station.
 * Uses a 6-hour AsyncStorage cache to avoid redundant network calls.
 *
 * @param stationId  - One of the supported PIA station IDs
 * @param forceRefresh - Bypass cache and fetch fresh data
 */
export async function fetchPollenForecast(
  stationId: StationId,
  forceRefresh = false
): Promise<PollenForecast> {
  // 1. Try cache first
  if (!forceRefresh) {
    const cached = await readCache(stationId);
    if (cached) {
      return cached;
    }
  }

  // 2. Fetch from PIA
  const url = buildPiaUrl(stationId);

  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new Error(`Network error fetching pollen data: ${(e as Error).message}`);
  }

  if (!response.ok) {
    throw new Error(`PIA API returned HTTP ${response.status} for station "${stationId}"`);
  }

  const xml = await response.text();

  // 3. Parse XML → typed forecast
  const forecast = parsePollenXML(xml, stationId);

  // 4. Write to cache
  await writeCache(stationId, forecast);

  return forecast;
}

// ─── High-level helpers ───────────────────────────────────────────────────────

/**
 * Returns a filtered forecast containing only the taxons matching
 * the user's allergy profile.
 */
export async function fetchUserPollenReport(
  profile: UserAllergyProfile,
  forceRefresh = false
) {
  const forecast = await fetchPollenForecast(profile.station);
  const relevantTaxons = filterByAllergens(forecast, profile.allergens);
  const maxLevel = getMaxLevel(relevantTaxons);
  const summary = buildDailySummary(relevantTaxons);

  return {
    forecast,
    relevantTaxons,
    maxLevel,
    summary,
    shouldAlert: maxLevel >= profile.alertThreshold,
  };
}

/**
 * Clears all cached pollen data (useful for settings/debug screens)
 */
export async function clearPollenCache(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const pollenKeys = keys.filter((k) => k.startsWith(CACHE_KEY_PREFIX));
  await AsyncStorage.multiRemove(pollenKeys);
}
