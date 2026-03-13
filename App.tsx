import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchUserPollenReport } from './src/services/pollenData/pollenDataService';
import {
  POLLEN_LEVEL_COLORS,
  POLLEN_LEVEL_LABELS,
  PollenLevel,
  UserAllergyProfile,
} from './src/services/pollenData/pollenDataTypes';
import { PollenTaxonWithTrend, TREND_LABELS } from './src/services/pollenData/pollenDataHelpers';

// ─── Hardcoded test profile ───────────────────────────────────────────────────
// Later this will come from user settings
const TEST_PROFILE: UserAllergyProfile = {
  allergens: ['poaceae', 'parietaria', 'olea', 'platanus', 'cupressaceae'],
  station: 'bellaterra',
  alertThreshold: 2,
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function LevelBadge({ level }: { level: PollenLevel }) {
  return (
    <View style={[styles.badge, { backgroundColor: POLLEN_LEVEL_COLORS[level] }]}>
      <Text style={styles.badgeText}>{POLLEN_LEVEL_LABELS[level]}</Text>
    </View>
  );
}

function TaxonRow({ taxon }: { taxon: PollenTaxonWithTrend }) {
  return (
    <View style={styles.taxonRow}>
      <View style={styles.taxonLeft}>
        <Text style={styles.taxonName}>{taxon.name}</Text>
        <Text style={styles.taxonTrend}>{TREND_LABELS[taxon.trend]}</Text>
      </View>
      <LevelBadge level={taxon.currentLevel} />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function App() {
  const [report, setReport] = useState<Awaited<ReturnType<typeof fetchUserPollenReport>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadReport(forceRefresh = false) {
    try {
      setError(null);
      const data = await fetchUserPollenReport(TEST_PROFILE, forceRefresh);
      setReport(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadReport(); }, []);

  function onRefresh() {
    setRefreshing(true);
    loadReport(true);
  }

  // ── Loading state
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Fetching pollen data…</Text>
      </View>
    );
  }

  // ── Error state
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Could not load data</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  // ── Data state
  const { relevantTaxons, maxLevel, summary, forecast, shouldAlert } = report!;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌿 canIbreathe?</Text>
        <Text style={styles.headerSubtitle}>{forecast.station.name}</Text>
        <Text style={styles.headerDate}>
          Week {forecast.weekStart} → {forecast.weekEnd}
        </Text>
        <Text style={styles.headerFetched}>
          Updated: {new Date(forecast.fetchedAt).toLocaleTimeString()}
        </Text>
      </View>

      {/* Alert banner */}
      {shouldAlert && (
        <View style={[styles.alertBanner, { borderLeftColor: POLLEN_LEVEL_COLORS[maxLevel] }]}>
          <Text style={styles.alertText}>⚠️ High pollen alert for your allergens</Text>
        </View>
      )}

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionLabel}>TODAY'S SUMMARY</Text>
        <Text style={styles.summaryText}>{summary}</Text>
        <View style={styles.maxLevelRow}>
          <Text style={styles.maxLevelLabel}>Overall risk</Text>
          <LevelBadge level={maxLevel} />
        </View>
      </View>

      {/* Your allergens */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>YOUR ALLERGENS</Text>
        {relevantTaxons.length === 0 ? (
          <Text style={styles.emptyText}>No matching allergens found in this week's forecast.</Text>
        ) : (
          relevantTaxons.map((taxon) => <TaxonRow key={taxon.id} taxon={taxon} />)
        )}
      </View>

      {/* All taxons in forecast */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>ALL POLLENS THIS WEEK</Text>
        {forecast.taxons.map((taxon) => <TaxonRow key={taxon.id} taxon={taxon} />)}
      </View>

      <Text style={styles.attribution}>
        Data source: PIA – Punt d'Informació Aerobiològica (aerobiologia.cat) · CC BY-NC-SA 4.0
      </Text>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 15,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },

  // Header
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B5E20',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#444',
    marginTop: 2,
  },
  headerDate: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  headerFetched: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 2,
  },

  // Alert banner
  alertBanner: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  alertText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '600',
  },

  // Cards
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#aaa',
    letterSpacing: 1,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 12,
  },
  maxLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  maxLevelLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
  },

  // Taxon rows
  taxonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  taxonLeft: {
    flex: 1,
    marginRight: 8,
  },
  taxonName: {
    fontSize: 14,
    color: '#333',
  },
  taxonTrend: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 2,
  },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  // Attribution
  attribution: {
    fontSize: 10,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 8,
  },
});