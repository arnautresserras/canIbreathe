import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PollenTaxonWithTrend } from '../services/pollenData/pollenDataHelpers';
import { fetchUserPollenReport } from '../services/pollenData/pollenDataService';
import {
  ALLERGENS,
  AllergenKey,
  POLLEN_LEVEL_COLORS,
  PollenLevel,
  UserAllergyProfile,
} from '../services/pollenData/pollenDataTypes';
import InfoModal from './InfoModal';

// Emoji lookup by allergen key
const ALLERGEN_EMOJI: Record<string, string> = Object.fromEntries(
  ALLERGENS.map((a) => [a.key, a.emoji])
);

interface Props {
  profile: UserAllergyProfile;
}

function LevelBadge({ level }: { level: PollenLevel }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.badge, { backgroundColor: POLLEN_LEVEL_COLORS[level] }]}>
      <Text style={styles.badgeText}>{t(`levels.${level}`)}</Text>
    </View>
  );
}

function NoDataBadge() {
  const { t } = useTranslation();
  return (
    <View style={styles.noDataBadge}>
      <Text style={styles.noDataBadgeText}>{t('main.noData')}</Text>
    </View>
  );
}

function TaxonRow({ taxon }: { taxon: PollenTaxonWithTrend }) {
  const { t } = useTranslation();
  const translatedName = t(`allergens.${taxon.id}.name`, { defaultValue: '' });
  const displayName = translatedName || taxon.name;
  const emoji = ALLERGEN_EMOJI[taxon.id];

  return (
    <View style={styles.taxonRow}>
      {emoji ? <Text style={styles.taxonEmoji}>{emoji}</Text> : null}
      <View style={styles.taxonLeft}>
        <Text style={styles.taxonName}>{displayName}</Text>
        <Text style={styles.taxonTrend}>{t(`trends.${taxon.trend}`)}</Text>
      </View>
      <LevelBadge level={taxon.currentLevel} />
    </View>
  );
}

function MissingAllergenRow({ allergenKey }: { allergenKey: AllergenKey }) {
  const { t } = useTranslation();
  const name = t(`allergens.${allergenKey}.name`, { defaultValue: allergenKey });
  const emoji = ALLERGEN_EMOJI[allergenKey];

  return (
    <View style={styles.taxonRow}>
      {emoji ? <Text style={styles.taxonEmoji}>{emoji}</Text> : null}
      <View style={styles.taxonLeft}>
        <Text style={styles.taxonName}>{name}</Text>
        <Text style={styles.taxonTrend}>{t('main.noDataHint')}</Text>
      </View>
      <NoDataBadge />
    </View>
  );
}

export default function MainScreen({ profile }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [report, setReport] = useState<Awaited<ReturnType<typeof fetchUserPollenReport>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  async function loadReport(forceRefresh = false) {
    try {
      setError(null);
      const data = await fetchUserPollenReport(profile, forceRefresh);
      setReport(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadReport(); }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>{t('main.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>{t('main.errorTitle')}</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => { setLoading(true); loadReport(); }}
        >
          <Text style={styles.retryLabel}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { relevantTaxons, maxLevel, forecast, shouldAlert } = report!;

  const taxonByAllergen = new Map<string, PollenTaxonWithTrend>(
    relevantTaxons.map((t) => [t.id, t])
  );

  return (
    <>
      <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadReport(true); }}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>{t('main.appName')}</Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setInfoVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.infoIcon}>
                <Text style={styles.infoIconText}>i</Text>
                <Text style={styles.infoIconLabel}>{t('info.title')}</Text>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>
            {forecast.station.name} · {t(`regions.${forecast.station.id}`)}
          </Text>
          <Text style={styles.headerDate}>
            {t('main.week', { start: forecast.weekStart, end: forecast.weekEnd })}
          </Text>
          <Text style={styles.headerFetched}>
            {t('main.updated', { time: new Date(forecast.fetchedAt).toLocaleTimeString() })}
          </Text>
        </View>

        {/* Alert banner */}
        {shouldAlert && (
          <View style={[styles.alertBanner, { borderLeftColor: POLLEN_LEVEL_COLORS[maxLevel] }]}>
            <Text style={styles.alertText}>{t('main.alert')}</Text>
          </View>
        )}

        {/* Your allergens card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionLabel}>{t('main.yourAllergens')}</Text>
            <LevelBadge level={maxLevel} />
          </View>
          {profile.allergens.length === 0 ? (
            <Text style={styles.emptyText}>{t('main.noMatchingAllergens')}</Text>
          ) : (
            profile.allergens.map((allergenKey) => {
              const taxon = taxonByAllergen.get(allergenKey);
              return taxon
                ? <TaxonRow key={allergenKey} taxon={taxon} />
                : <MissingAllergenRow key={allergenKey} allergenKey={allergenKey} />;
            })
          )}
        </View>

        {/* All pollens this week */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('main.allPollens')}</Text>
          {forecast.taxons.map((taxon) => (
            <TaxonRow key={taxon.id} taxon={taxon as PollenTaxonWithTrend} />
          ))}
        </View>

        <Text style={styles.attribution}>{t('main.attribution')}</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F5F5F5' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 15 },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  errorMessage: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#2E7D32', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryLabel: { color: '#fff', fontWeight: '600' },
  header: { marginBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#1B5E20' },
  infoButton: { padding: 4 },
  infoIcon: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E8F5E9', flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoIconText: { fontSize: 13, fontWeight: '700', color: '#1B5E20' },
  infoIconLabel: { fontSize: 12, fontWeight: '600', color: '#1B5E20' },
  headerSubtitle: { fontSize: 16, color: '#444', marginTop: 2 },
  headerDate: { fontSize: 13, color: '#888', marginTop: 4 },
  headerFetched: { fontSize: 11, color: '#bbb', marginTop: 2 },
  alertBanner: { backgroundColor: '#FFF3E0', borderLeftWidth: 4, borderRadius: 8, padding: 12, marginBottom: 16 },
  alertText: { fontSize: 14, color: '#E65100', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#aaa', letterSpacing: 1 },
  emptyText: { fontSize: 14, color: '#aaa', fontStyle: 'italic' },
  taxonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  taxonEmoji: { fontSize: 22, marginRight: 10 },
  taxonLeft: { flex: 1, marginRight: 8 },
  taxonName: { fontSize: 14, color: '#333' },
  taxonTrend: { fontSize: 11, color: '#aaa', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  noDataBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  noDataBadgeText: { fontSize: 12, fontWeight: '600', color: '#aaa' },
  attribution: { fontSize: 10, color: '#ccc', textAlign: 'center', marginTop: 8 },
});