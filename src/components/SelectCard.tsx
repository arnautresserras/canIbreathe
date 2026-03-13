import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  emoji?: string;
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}

export function SelectCard({ emoji, title, subtitle, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.row}>
        {emoji && (
          <Text style={styles.emoji}>{emoji}</Text>
        )}
        <View style={styles.text}>
          <Text style={[styles.title, selected && styles.titleSelected]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, selected && styles.subtitleSelected]}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={[styles.check, selected && styles.checkSelected]}>
          {selected && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F1F8E9',
  },
  cardPressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  titleSelected: {
    color: '#1B5E20',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  subtitleSelected: {
    color: '#558B2F',
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});