import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function App(): JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Kore Repuestos</Text>
        <Text style={styles.subtitle}>Sprint 0 — entorno móvil listo.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: '#0369a1' },
  subtitle: { marginTop: 8, fontSize: 14, color: '#475569' },
});
