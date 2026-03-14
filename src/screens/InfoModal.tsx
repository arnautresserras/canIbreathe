import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALLERGENS, POLLEN_LEVEL_COLORS, PollenLevel } from '../services/pollenData/pollenDataTypes';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const LEVELS: PollenLevel[] = [0, 1, 2, 3, 4];

function AccordionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setOpen((o) => !o)}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

export default function InfoModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('info.title')}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeLabel}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Pollen levels ── */}
          <AccordionSection title={t('info.levelsTitle')}>
            {LEVELS.map((level) => (
              <View key={level} style={styles.levelRow}>
                <View style={[styles.levelDot, { backgroundColor: POLLEN_LEVEL_COLORS[level] }]} />
                <View style={styles.levelText}>
                  <Text style={styles.levelName}>{t(`levels.${level}`)}</Text>
                  <Text style={styles.levelDesc}>{t(`info.levelDesc.${level}`)}</Text>
                </View>
              </View>
            ))}
          </AccordionSection>

          {/* ── Allergens ── */}
          <AccordionSection title={t('info.allergensTitle')}>
            {ALLERGENS.map((allergen) => (
              <View key={allergen.key} style={styles.allergenRow}>
                <Text style={styles.allergenEmoji}>{allergen.emoji}</Text>
                <View style={styles.allergenText}>
                  <Text style={styles.allergenName}>{t(`allergens.${allergen.key}.name`)}</Text>
                  <Text style={styles.allergenDesc}>{t(`allergens.${allergen.key}.description`)}</Text>
                </View>
              </View>
            ))}
          </AccordionSection>

          {/* ── Data source ── */}
          <AccordionSection title={t('info.sourceTitle')}>
            <Text style={styles.sourceText}>{t('info.sourceBody')}</Text>
            <Text style={styles.sourceAttrib}>{t('main.attribution')}</Text>
          </AccordionSection>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  closeButton: { paddingHorizontal: 4, paddingVertical: 4 },
  closeLabel: { fontSize: 15, color: '#2E7D32', fontWeight: '600' },
  scroll: { flex: 1 },
  content: { padding: 16 },

  // Accordion
  section: {
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  chevron: { fontSize: 11, color: '#aaa' },
  sectionBody: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F0F0F0',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
  },

  // Levels
  levelRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0',
  },
  levelDot: { width: 14, height: 14, borderRadius: 7, marginTop: 3, marginRight: 12 },
  levelText: { flex: 1 },
  levelName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  levelDesc: { fontSize: 12, color: '#888', marginTop: 2, lineHeight: 18 },

  // Allergens
  allergenRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0',
  },
  allergenEmoji: { fontSize: 22, marginRight: 12, marginTop: 1 },
  allergenText: { flex: 1 },
  allergenName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  allergenDesc: { fontSize: 12, color: '#888', marginTop: 2, lineHeight: 18 },

  // Source
  sourceText: { fontSize: 14, color: '#555', lineHeight: 22, paddingVertical: 10 },
  sourceAttrib: { fontSize: 11, color: '#bbb', paddingBottom: 8 },
});