import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SelectCard } from '../components/SelectCard';
import { setLanguage, SupportedLanguage, SUPPORTED_LANGUAGES } from '../i18n/i18n';
import {
  ALLERGENS,
  AllergenKey,
  STATIONS,
  StationId,
  THRESHOLD_OPTIONS,
  UserAllergyProfile,
} from '../services/pollenData/pollenDataTypes';
import { clearProfile, loadProfile, saveProfile } from '../storage/profileStorage';

interface Props {
  onSave: (profile: UserAllergyProfile) => void;
  onResetOnboarding: () => void;
}

const IS_WEB = Platform.OS === 'web';
const IS_IOS = Platform.OS === 'ios';

function dateFromHourMinute(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export default function SettingsScreen({ onSave, onResetOnboarding }: Props) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  const [profile, setProfile] = useState<UserAllergyProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  function update(patch: Partial<UserAllergyProfile>) {
    setProfile((prev) => prev ? { ...prev, ...patch } : prev);
    setDirty(true);
  }

  function toggleAllergen(key: AllergenKey) {
    if (!profile) return;
    const allergens = profile.allergens.includes(key)
      ? profile.allergens.filter((a) => a !== key)
      : [...profile.allergens, key];
    update({ allergens });
  }

  function handleTimeChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (date) {
      update({ notificationHour: date.getHours(), notificationMinute: date.getMinutes() });
    }
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    await saveProfile(profile);
    setSaving(false);
    setDirty(false);
    onSave(profile);
  }

  async function handleLanguageChange(lang: SupportedLanguage) {
    await setLanguage(lang);
  }

  async function handleResetOnboarding() {
    if (IS_WEB) {
      const confirmed = window.confirm(
        `${t('settings.account.resetTitle')}\n\n${t('settings.account.resetMessage')}`
      );
      if (confirmed) {
        await clearProfile();
        onResetOnboarding();
      }
    } else {
      Alert.alert(
        t('settings.account.resetTitle'),
        t('settings.account.resetMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.reset'),
            style: 'destructive',
            onPress: async () => {
              await clearProfile();
              onResetOnboarding();
            },
          },
        ]
      );
    }
  }

  if (!profile) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        {dirty && (
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveLabel}>
              {saving ? t('common.saving') : t('common.save')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Language ── */}
        <Text style={styles.sectionLabel}>{t('settings.language.label')}</Text>
        <View style={styles.languageRow}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageChip,
                i18n.language === lang && styles.languageChipSelected,
              ]}
              onPress={() => handleLanguageChange(lang)}
            >
              <Text
                style={[
                  styles.languageChipLabel,
                  i18n.language === lang && styles.languageChipLabelSelected,
                ]}
              >
                {t(`languages.${lang}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Allergens ── */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t('settings.allergens.label')}
        </Text>
        <Text style={styles.sectionHint}>{t('settings.allergens.hint')}</Text>
        {ALLERGENS.map((allergen) => (
          <SelectCard
            key={allergen.key}
            emoji={allergen.emoji}
            title={t(`allergens.${allergen.key}.name`)}
            subtitle={t(`allergens.${allergen.key}.description`)}
            selected={profile.allergens.includes(allergen.key)}
            onPress={() => toggleAllergen(allergen.key)}
          />
        ))}

        {/* ── Station ── */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t('settings.station.label')}
        </Text>
        <Text style={styles.sectionHint}>{t('settings.station.hint')}</Text>
        {Object.values(STATIONS).map((station) => (
          <SelectCard
            key={station.id}
            emoji="📍"
            title={station.name}
            subtitle={t(`regions.${station.id}`)}
            selected={profile.station === station.id}
            onPress={() => update({ station: station.id as StationId })}
          />
        ))}

        {/* ── Notifications (native only) ── */}
        {!IS_WEB && (
          <>
            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
              {t('settings.notifications.label')}
            </Text>

            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{t('settings.notifications.dailyAlerts')}</Text>
                <Text style={styles.rowSubtitle}>{t('settings.notifications.morningBriefing')}</Text>
              </View>
              <Switch
                value={profile.notificationsEnabled}
                onValueChange={(v) => update({ notificationsEnabled: v })}
                trackColor={{ true: '#2E7D32' }}
                thumbColor="#fff"
              />
            </View>

            {profile.notificationsEnabled && (
              <>
                <Text style={styles.subSectionLabel}>{t('settings.notifications.time')}</Text>

                {/* iOS — inline spinner */}
                {IS_IOS && (
                  <View style={styles.pickerWrapper}>
                    <DateTimePicker
                      value={dateFromHourMinute(profile.notificationHour, profile.notificationMinute)}
                      mode="time"
                      display="spinner"
                      onChange={handleTimeChange}
                      textColor="#1A1A1A"
                    />
                  </View>
                )}

                {/* Android — tappable button that opens clock dialog */}
                {Platform.OS === 'android' && (
                  <>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowPicker(true)}
                    >
                      <Text style={styles.timeButtonLabel}>
                        {formatTime(profile.notificationHour, profile.notificationMinute)}
                      </Text>
                      <Text style={styles.timeButtonHint}>{t('settings.notifications.tapToChange')}</Text>
                    </TouchableOpacity>
                    {showPicker && (
                      <DateTimePicker
                        value={dateFromHourMinute(profile.notificationHour, profile.notificationMinute)}
                        mode="time"
                        display="default"
                        onChange={handleTimeChange}
                      />
                    )}
                  </>
                )}

                <Text style={styles.subSectionLabel}>{t('settings.notifications.alertWhen')}</Text>
                {THRESHOLD_OPTIONS.map((opt) => (
                  <SelectCard
                    key={opt.level}
                    title={t(`notifications.thresholds.${opt.level}`)}
                    subtitle={t(`notifications.thresholdDescriptions.${opt.level}`)}
                    selected={profile.alertThreshold === opt.level}
                    onPress={() => update({ alertThreshold: opt.level })}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* ── Account ── */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t('settings.account.label')}
        </Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleResetOnboarding}>
          <Text style={styles.dangerLabel}>{t('settings.account.resetOnboarding')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  saveButton: { backgroundColor: '#2E7D32', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  saveButtonDisabled: { backgroundColor: '#B0BEC5' },
  saveLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll: { flex: 1 },
  content: { padding: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#aaa', letterSpacing: 1, marginBottom: 8 },
  sectionLabelSpaced: { marginTop: 28 },
  sectionHint: { fontSize: 13, color: '#999', marginBottom: 12 },
  subSectionLabel: { fontSize: 11, fontWeight: '700', color: '#aaa', letterSpacing: 1, marginBottom: 10, marginTop: 20 },
  languageRow: { flexDirection: 'row', gap: 10 },
  languageChip: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E0E0E0',
  },
  languageChipSelected: { backgroundColor: '#F1F8E9', borderColor: '#2E7D32' },
  languageChipLabel: { fontSize: 14, fontWeight: '600', color: '#888' },
  languageChipLabelSelected: { color: '#1B5E20' },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, borderWidth: 1.5, borderColor: '#E8E8E8', padding: 16, marginBottom: 4,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  rowSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
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
  dangerButton: {
    borderWidth: 1.5, borderColor: '#FFCDD2', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', backgroundColor: '#FFF8F8',
  },
  dangerLabel: { color: '#C62828', fontWeight: '600', fontSize: 14 },
});