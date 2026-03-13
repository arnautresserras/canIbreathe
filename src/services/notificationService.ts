import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { fetchUserPollenReport } from './pollenData/pollenDataService';
import { UserAllergyProfile, POLLEN_LEVEL_COLORS } from './pollenData/pollenDataTypes';

// ─── Constants ────────────────────────────────────────────────────────────────
const NOTIFICATION_ID_KEY = 'daily_pollen_notification';
const IS_WEB = Platform.OS === 'web';

// ─── Handler (show notification even when app is foregrounded) ────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ─── Permissions ──────────────────────────────────────────────────────────────
export async function requestNotificationPermissions(): Promise<boolean> {
  if (IS_WEB) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Level → emoji helper ─────────────────────────────────────────────────────
function levelEmoji(level: number): string {
  switch (level) {
    case 0: return '🟢';
    case 1: return '🟡';
    case 2: return '🟠';
    case 3: return '🔴';
    case 4: return '🔴';
    default: return '⚪';
  }
}

function levelLabel(level: number, lang: string): string {
  const labels: Record<string, string[]> = {
    en: ['None', 'Low', 'Moderate', 'High', 'Very High'],
    ca: ['Cap', 'Baix', 'Moderat', 'Alt', 'Molt alt'],
    es: ['Ninguno', 'Bajo', 'Moderado', 'Alto', 'Muy alto'],
  };
  return (labels[lang] ?? labels.en)[level] ?? 'Unknown';
}

// ─── Build notification content from live pollen data ────────────────────────
async function buildNotificationContent(
  profile: UserAllergyProfile,
  lang: string
): Promise<{ title: string; body: string }> {
  const appName = lang === 'ca' ? 'Puc respirar?' : 'Can I breathe?';

  try {
    const { relevantTaxons, maxLevel } = await fetchUserPollenReport(profile);

    const emoji = levelEmoji(maxLevel);
    const label = levelLabel(maxLevel, lang);

    const activeTaxons = relevantTaxons
      .filter((t) => t.currentLevel > 0)
      .sort((a, b) => b.currentLevel - a.currentLevel)
      .slice(0, 3); // top 3 to keep the message short

    const taxonLabels: Record<string, Record<string, string>> = {
      poaceae:      { en: 'Grasses',     ca: 'Gramínies',   es: 'Gramíneas' },
      parietaria:   { en: 'Pellitory',   ca: 'Parietària',  es: 'Parietaria' },
      olea:         { en: 'Olive',       ca: 'Olivera',     es: 'Olivo' },
      platanus:     { en: 'Plane tree',  ca: "Plàtan",      es: 'Plátano' },
      cupressaceae: { en: 'Cypress',     ca: 'Xiprer',      es: 'Ciprés' },
      alternaria:   { en: 'Alternaria',  ca: 'Alternaria',  es: 'Alternaria' },
      cladosporium: { en: 'Cladosporium',ca: 'Cladosporium',es: 'Cladosporium' },
      alnus:        { en: 'Alder',       ca: 'Vern',        es: 'Aliso' },
      fraxinus:     { en: 'Ash',         ca: 'Freixe',      es: 'Fresno' },
      pinus:        { en: 'Pine',        ca: 'Pi',          es: 'Pino' },
      quercus:      { en: 'Oak',         ca: 'Roure',       es: 'Roble' },
      plantago:     { en: 'Plantain',    ca: 'Plantatge',   es: 'Llantén' },
      corylus:      { en: 'Hazel',       ca: 'Avellaner',   es: 'Avellano' },
      ulmus:        { en: 'Elm',         ca: 'Om',          es: 'Olmo' },
      acer:         { en: 'Maple',       ca: 'Auró',        es: 'Arce' },
      pistacia:     { en: 'Mastic',      ca: 'Llentiscle',  es: 'Lentisco' },
      mercurialis:  { en: 'Mercury',     ca: 'Mercurial',   es: 'Mercurial' },
      moraceae:     { en: 'Moraceae',    ca: 'Moràcies',    es: 'Moráceas' },
      populus:      { en: 'Poplar',      ca: 'Àlber',       es: 'Álamo' },
      salix:        { en: 'Willow',      ca: 'Salze',       es: 'Sauce' },
      cruciferae:   { en: 'Cruciferae',  ca: 'Crucíferes',  es: 'Crucíferas' },
    };

    if (activeTaxons.length === 0) {
      const noActive: Record<string, string> = {
        en: 'All your allergens are at none today.',
        ca: 'Tots els teus al·lèrgens estan a zero avui.',
        es: 'Todos tus alérgenos están en zero hoy.',
      };
      return { title: `${emoji} ${appName} — ${label}`, body: noActive[lang] ?? noActive.en };
    }

    const parts = activeTaxons.map((t) => {
      const name = taxonLabels[t.id]?.[lang] ?? t.id;
      return `${name}: ${levelLabel(t.currentLevel, lang)}`;
    });

    return {
      title: `${emoji} ${appName} — ${label}`,
      body: parts.join(' · '),
    };
  } catch {
    // Fallback to generic message if fetch fails
    const fallback: Record<string, string> = {
      en: 'Open the app to check today\'s pollen levels.',
      ca: "Obre l'app per veure els nivells de pol·len d'avui.",
      es: 'Abre la app para ver los niveles de polen de hoy.',
    };
    return {
      title: appName,
      body: fallback[lang] ?? fallback.en,
    };
  }
}

// ─── Main schedule function ───────────────────────────────────────────────────
export async function scheduleDailyNotification(
  profile: UserAllergyProfile,
  lang: string
): Promise<void> {
  if (IS_WEB) return;
  if (!profile.notificationsEnabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const { title, body } = await buildNotificationContent(profile, lang);

  // Cancel any existing scheduled notification before rescheduling
  await Notifications.cancelAllScheduledNotificationsAsync();

  // DEBUG — remove after testing
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Scheduled:', JSON.stringify(scheduled, null, 2));

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID_KEY,
    content: { title, body, sound: false },
    trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 24 * 60 * 60, // 24 hours
        repeats: true,
    },
    });

  console.log(`[Notifications] Scheduled daily at ${profile.notificationHour}:${String(profile.notificationMinute).padStart(2, '0')} — "${title}"`);
}