import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { SelectCard } from '../components/SelectCard';
import {
  ALLERGENS,
  AllergenKey,
  DEFAULT_PROFILE,
  STATIONS,
  StationId,
  THRESHOLD_OPTIONS,
  UserAllergyProfile,
} from '../services/pollenData/pollenDataTypes';
import { saveProfile } from '../storage/profileStorage';
import { OnboardingStackParamList } from '../navigation/OnboardingNavigator';

type Nav = NativeStackNavigationProp<OnboardingStackParamList>;

const IS_WEB = Platform.OS === 'web';
const IS_IOS = Platform.OS === 'ios';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dateFromHourMinute(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// ─── 1. Welcome ───────────────────────────────────────────────────────────────
export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  return (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeContent}>
        <Text style={styles.welcomeEmoji}>🌿</Text>
        <Text style={styles.welcomeTitle}>{t('welcome.title')}</Text>
        <Text style={styles.welcomeSubtitle}>{t('welcome.subtitle')}</Text>
        <Text style={styles.welcomeDetail}>{t('welcome.detail')}</Text>
      </View>
      <View style={styles.welcomeFooter}>
        <View style={styles.startButton}>
          <Text
            style={styles.startLabel}
            onPress={() => navigation.navigate('Allergens', { draft: DEFAULT_PROFILE })}
          >
            {t('welcome.cta')}
          </Text>
        </View>
        <Text style={styles.welcomeAttrib}>{t('welcome.attribution')}</Text>
      </View>
    </View>
  );
}

// ─── 2. Allergens ─────────────────────────────────────────────────────────────
export function AllergenScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const route = (navigation as any).getState?.()?.routes?.slice(-1)[0];
  const draft: UserAllergyProfile = route?.params?.draft ?? DEFAULT_PROFILE;

  const [selected, setSelected] = useState<AllergenKey[]>(draft.allergens);

  function toggle(key: AllergenKey) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  return (
    <OnboardingLayout
      step={1}
      totalSteps={IS_WEB ? 2 : 3}
      title={t('onboarding.allergens.title')}
      subtitle={t('onboarding.allergens.subtitle')}
      onNext={() => navigation.navigate('Station', { draft: { ...draft, allergens: selected } })}
      nextDisabled={selected.length === 0}
      nextLabel={selected.length === 0 ? t('common.selectAtLeastOne') : t('common.continue')}
    >
      {ALLERGENS.map((allergen) => (
        <SelectCard
          key={allergen.key}
          emoji={allergen.emoji}
          title={t(`allergens.${allergen.key}.name`)}
          subtitle={t(`allergens.${allergen.key}.description`)}
          selected={selected.includes(allergen.key)}
          onPress={() => toggle(allergen.key)}
        />
      ))}
    </OnboardingLayout>
  );
}

// ─── 3. Station ───────────────────────────────────────────────────────────────
export function StationScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const route = (navigation as any).getState?.()?.routes?.slice(-1)[0];
  const draft: UserAllergyProfile = route?.params?.draft ?? DEFAULT_PROFILE;

  const [selected, setSelected] = useState<StationId>(draft.station);

  async function onNext() {
    const updatedDraft = { ...draft, station: selected };
    if (IS_WEB) {
      const finalProfile: UserAllergyProfile = {
        ...updatedDraft,
        notificationsEnabled: false,
        onboardingComplete: true,
      };
      await saveProfile(finalProfile);
      navigation.navigate('Summary', { profile: finalProfile });
    } else {
      navigation.navigate('Notifications', { draft: updatedDraft });
    }
  }

  return (
    <OnboardingLayout
      step={2}
      totalSteps={IS_WEB ? 2 : 3}
      title={t('onboarding.station.title')}
      subtitle={t('onboarding.station.subtitle')}
      onBack={() => navigation.goBack()}
      onNext={onNext}
      nextLabel={IS_WEB ? t('onboarding.notifications.finishSetup') : t('common.continue')}
    >
      {Object.values(STATIONS).map((station) => (
        <SelectCard
          key={station.id}
          emoji="📍"
          title={station.name}
          subtitle={t(`regions.${station.id}`)}
          selected={selected === station.id}
          onPress={() => setSelected(station.id)}
        />
      ))}
    </OnboardingLayout>
  );
}

// ─── 4. Notifications (native only) ──────────────────────────────────────────
export function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const route = (navigation as any).getState?.()?.routes?.slice(-1)[0];
  const draft: UserAllergyProfile = route?.params?.draft ?? DEFAULT_PROFILE;

  const [enabled, setEnabled] = useState(draft.notificationsEnabled);
  const [hour, setHour] = useState(draft.notificationHour);
  const [minute, setMinute] = useState(draft.notificationMinute);
  const [threshold, setThreshold] = useState(draft.alertThreshold);
  // Android only — controls whether the picker dialog is open
  const [showPicker, setShowPicker] = useState(false);

  function handleTimeChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (date) {
      setHour(date.getHours());
      setMinute(date.getMinutes());
    }
  }

  async function onNext() {
    const updatedDraft: UserAllergyProfile = {
      ...draft,
      notificationsEnabled: enabled,
      notificationHour: hour,
      notificationMinute: minute,
      alertThreshold: threshold,
      onboardingComplete: true,
    };
    await saveProfile(updatedDraft);
    navigation.navigate('Summary', { profile: updatedDraft });
  }

  return (
    <OnboardingLayout
      step={3}
      totalSteps={3}
      title={t('onboarding.notifications.title')}
      subtitle={t('onboarding.notifications.subtitle')}
      onBack={() => navigation.goBack()}
      onNext={onNext}
      nextLabel={t('onboarding.notifications.finishSetup')}
    >
      {/* Enable toggle */}
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{t('notifications.enabled')}</Text>
          <Text style={styles.rowSubtitle}>{t('notifications.subtitle')}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ true: '#2E7D32' }}
          thumbColor="#fff"
        />
      </View>

      {enabled && (
        <>
          <Text style={styles.sectionLabel}>{t('notifications.time')}</Text>

          {/* iOS — inline spinner */}
          {IS_IOS && (
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={dateFromHourMinute(hour, minute)}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                textColor="#1A1A1A"
              />
            </View>
          )}

          {/* Android — button that opens native clock dialog */}
          {Platform.OS === 'android' && (
            <>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowPicker(true)}
              >
                <Text style={styles.timeButtonLabel}>{formatTime(hour, minute)}</Text>
                <Text style={styles.timeButtonHint}>Toca per canviar</Text>
              </TouchableOpacity>
              {showPicker && (
                <DateTimePicker
                  value={dateFromHourMinute(hour, minute)}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </>
          )}

          <Text style={styles.sectionLabel}>{t('notifications.threshold')}</Text>
          {THRESHOLD_OPTIONS.map((opt) => (
            <SelectCard
              key={opt.level}
              title={t(`notifications.thresholds.${opt.level}`)}
              subtitle={t(`notifications.thresholdDescriptions.${opt.level}`)}
              selected={threshold === opt.level}
              onPress={() => setThreshold(opt.level)}
            />
          ))}
        </>
      )}
    </OnboardingLayout>
  );
}

// ─── 5. Summary ───────────────────────────────────────────────────────────────
export function SummaryScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const route = (navigation as any).getState?.()?.routes?.slice(-1)[0];
  const profile: UserAllergyProfile = route?.params?.profile ?? DEFAULT_PROFILE;

  const station = STATIONS[profile.station];

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryEmoji}>✅</Text>
        <Text style={styles.summaryTitle}>{t('onboarding.summary.title')}</Text>

        <View style={styles.summaryCard}>
          <SummaryRow
            label={t('onboarding.summary.tracking')}
            value={t('onboarding.summary.trackingValue', { count: profile.allergens.length })}
          />
          <SummaryRow
            label={t('onboarding.summary.station')}
            value={`${station.name} · ${t(`regions.${station.id}`)}`}
          />
          {!IS_WEB && (
            <>
              <SummaryRow
                label={t('onboarding.summary.alerts')}
                value={
                  profile.notificationsEnabled
                    ? t('onboarding.summary.alertsDailyAt', {
                        time: formatTime(profile.notificationHour, profile.notificationMinute),
                      })
                    : t('onboarding.summary.alertsOff')
                }
              />
              {profile.notificationsEnabled && (
                <SummaryRow
                  label={t('onboarding.summary.notifyAt')}
                  value={t(`notifications.thresholds.${profile.alertThreshold}`)}
                />
              )}
            </>
          )}
        </View>
      </View>

      <View style={styles.welcomeFooter}>
        <View style={styles.startButton}>
          <Text style={styles.startLabel} onPress={() => navigation.navigate('Done')}>
            {t('onboarding.summary.startTracking')}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryRowLabel}>{label}</Text>
      <Text style={styles.summaryRowValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  welcomeContainer: {
    flex: 1, backgroundColor: '#FAFAF8', paddingHorizontal: 24,
    paddingTop: 80, paddingBottom: 40, justifyContent: 'space-between',
  },
  welcomeContent: { flex: 1, justifyContent: 'center' },
  welcomeEmoji: { fontSize: 64, marginBottom: 24 },
  welcomeTitle: { fontSize: 38, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
  welcomeSubtitle: { fontSize: 18, color: '#555', lineHeight: 28, marginBottom: 12 },
  welcomeDetail: { fontSize: 14, color: '#aaa' },
  welcomeFooter: { gap: 16 },
  startButton: {
    backgroundColor: '#2E7D32', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', overflow: 'hidden',
  },
  startLabel: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', padding: 16 },
  welcomeAttrib: { fontSize: 11, color: '#ccc', textAlign: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, borderWidth: 1.5, borderColor: '#E8E8E8', padding: 16, marginBottom: 20,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  rowSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#aaa',
    letterSpacing: 1, marginBottom: 10, marginTop: 4,
  },
  pickerWrapper: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E8E8E8', marginBottom: 20, overflow: 'hidden',
  },
  timeButton: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E8E8E8',
    padding: 16, marginBottom: 20, alignItems: 'center',
  },
  timeButtonLabel: { fontSize: 32, fontWeight: '700', color: '#1A1A1A' },
  timeButtonHint: { fontSize: 12, color: '#aaa', marginTop: 4 },
  summaryContainer: {
    flex: 1, backgroundColor: '#FAFAF8', paddingHorizontal: 24,
    paddingTop: 80, paddingBottom: 40, justifyContent: 'space-between',
  },
  summaryContent: { flex: 1, justifyContent: 'center' },
  summaryEmoji: { fontSize: 56, marginBottom: 20 },
  summaryTitle: { fontSize: 32, fontWeight: '800', color: '#1A1A1A', marginBottom: 28 },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1.5, borderColor: '#E8E8E8', overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0',
  },
  summaryRowLabel: { fontSize: 14, color: '#888' },
  summaryRowValue: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', maxWidth: '60%', textAlign: 'right' },
});