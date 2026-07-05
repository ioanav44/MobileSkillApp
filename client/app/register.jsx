import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../src/config';
import CustomAlert from '../src/components/CustomAlert';

export default function RegisterScreen() {
    const router = useRouter();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'info',
        confirmText: 'Am înțeles'
    });

    const showAlert = (config) => {
        setAlertConfig({
            ...config,
            onConfirm: config.onConfirm || (() => setAlertVisible(false))
        });
        setAlertVisible(true);
    };

    const handleRegister = async () => {
        if (!firstName || !lastName || !email || !password) {
            showAlert({ title: 'Eroare', message: 'Vă rugăm să completați toate câmpurile.', type: 'warning' });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, password })
            });

            const data = await response.json();
            if (response.ok) {
                showAlert({
                    title: 'Succes!',
                    message: 'Contul tău a fost creat. Te poți autentifica.',
                    type: 'info',
                    onConfirm: () => {
                        setAlertVisible(false);
                        router.back();
                    }
                });
            } else {
                showAlert({ title: 'Eroare', message: data.error || 'Nu am putut crea contul.', type: 'danger' });
            }
        } catch (error) {
            showAlert({ title: 'Eroare', message: 'Eroare de conexiune la server.', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, backgroundColor: '#fdfdff' }}
        >
            {/* Abstract Background Shapes */}
            <View style={styles.shape1} />
            <View style={styles.shape2} />
            <View style={styles.shape3} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.mainContainer}>
                    
                    {/* Header Area */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Cont Nou</Text>
                        <Text style={styles.subtitle}>Începe călătoria ta tech astăzi</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.nameRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Prenume</Text>
                                <View style={styles.inputWrapperCompact}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Maria"
                                        placeholderTextColor="#94a3b8"
                                        value={firstName}
                                        onChangeText={setFirstName}
                                    />
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Nume</Text>
                                <View style={styles.inputWrapperCompact}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Pop"
                                        placeholderTextColor="#94a3b8"
                                        value={lastName}
                                        onChangeText={setLastName}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color="#6366f1" style={{ marginRight: 12 }} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="nume@exemplu.com"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Parolă</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color="#6366f1" style={{ marginRight: 12 }} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Minim 6 caractere"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleRegister}
                            disabled={loading}
                            style={styles.btnShadow}
                        >
                            <LinearGradient
                                colors={['#818cf8', '#6366f1']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.btnText}>Înregistrare</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.loginLink}>
                            <Text style={styles.loginLinkText}>Ai deja cont? </Text>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.loginLinkAction}>Loghează-te</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
            <CustomAlert 
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                confirmText={alertConfig.confirmText}
                onConfirm={alertConfig.onConfirm}
                onCancel={() => setAlertVisible(false)}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 50 },
    mainContainer: { width: '100%', maxWidth: 450, alignSelf: 'center', zIndex: 1 },
    header: { alignItems: 'center', marginBottom: 30 },
    title: { fontSize: 26, fontWeight: '900', color: '#1e293b', marginTop: 16 },
    subtitle: { color: '#64748b', fontSize: 15, marginTop: 4 },
    card: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 32, padding: 24, shadowColor: '#6366f1', shadowOpacity: 0.1, shadowRadius: 30, elevation: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.8)' },
    nameRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    inputGroup: { marginBottom: 20 },
    label: { color: '#475569', fontWeight: '700', marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1.5, borderColor: '#f1f5f9', paddingHorizontal: 16, height: 56 },
    inputWrapperCompact: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1.5, borderColor: '#f1f5f9', paddingHorizontal: 16, height: 50 },
    input: { flex: 1, height: '100%', color: '#1e293b', fontWeight: '600' },
    btnShadow: { shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 15, elevation: 8, marginTop: 12 },
    submitBtn: { borderRadius: 18, height: 60, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
    loginLink: { marginTop: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    loginLinkText: { color: '#94a3b8', fontSize: 14 },
    loginLinkAction: { color: '#6366f1', fontWeight: '800', fontSize: 14 },
    shape1: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#eef2ff', zIndex: 0 },
    shape2: { position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: '#f5f3ff', zIndex: 0 },
    shape3: { position: 'absolute', top: '40%', left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: '#e0e7ff', opacity: 0.6, zIndex: 0 }
});
