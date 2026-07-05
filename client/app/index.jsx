import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../src/stores/useAuth';
import { API_URL } from '../src/config';
import CustomAlert from '../src/components/CustomAlert';

export default function LoginScreen() {
    const router = useRouter();
    const { setUser, setSelectedCareer } = useAuth();

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

    const handleLogin = async () => {
        if (!email || !password) {
            showAlert({ title: 'Eroare', message: 'Vă rugăm să completați toate câmpurile.', type: 'warning' });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                setUser({ ...data.user, token: data.token });
                setSelectedCareer(data.user.selectedCareerId || null);
                router.replace('/home');
            } else {
                showAlert({ title: 'Eroare Login', message: data.error || 'Datele de autentificare sunt incorecte.', type: 'danger' });
            }
        } catch (error) {
            showAlert({ title: 'Eroare Conexiune', message: 'Nu se poate contacta serverul. Verifică conexiunea la internet!', type: 'danger' });
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
            
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
                <View style={styles.mainContainer}>
                    
                    {/* Header Area */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Autentificare</Text>
                        <Text style={styles.headerSubtitle}>Bine ai venit!</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Autentificare</Text>
                        
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
                                    placeholder="••••••••"
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

                        <TouchableOpacity style={styles.forgotBtn}>
                            <Text style={styles.forgotText}>Ai uitat parola?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loading}
                            style={styles.loginBtnShadow}
                        >
                            <LinearGradient
                                colors={['#818cf8', '#6366f1']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.loginBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <View style={styles.loginBtnContent}>
                                        <Text style={styles.loginBtnText}>Conectare</Text>
                                        <Ionicons name="arrow-forward" size={18} color="white" />
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.registerLink}>
                            <Text style={styles.registerLinkText}>Nu ai cont? </Text>
                            <TouchableOpacity onPress={() => router.push('/register')}>
                                <Text style={styles.registerLinkAction}>Creează cont</Text>
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
                onConfirm={() => setAlertVisible(false)}
                onCancel={() => setAlertVisible(false)}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    mainContainer: { width: '100%', maxWidth: 400, alignSelf: 'center', zIndex: 1 },
    header: { alignItems: 'center', marginBottom: 32 },
    headerTitle: { fontSize: 36, fontWeight: '900', color: '#1e293b' },
    headerSubtitle: { color: '#6366f1', fontSize: 18, fontWeight: '700', marginTop: 2 },
    card: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 32, padding: 28, shadowColor: '#6366f1', shadowOpacity: 0.1, shadowRadius: 30, elevation: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.8)' },
    cardTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 24, textAlign: 'center' },
    inputGroup: { marginBottom: 20 },
    label: { color: '#475569', fontWeight: '700', marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1.5, borderColor: '#f1f5f9', paddingHorizontal: 16, height: 56 },
    input: { flex: 1, height: '100%', color: '#1e293b', fontWeight: '600' },
    forgotBtn: { alignSelf: 'flex-end', marginBottom: 28 },
    forgotText: { color: '#6366f1', fontWeight: '700', fontSize: 13 },
    loginBtnShadow: { shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
    loginBtn: { borderRadius: 18, height: 60, justifyContent: 'center', alignItems: 'center' },
    loginBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    loginBtnText: { color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
    registerLink: { marginTop: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    registerLinkText: { color: '#94a3b8', fontSize: 14 },
    registerLinkAction: { color: '#6366f1', fontWeight: '800', fontSize: 14 },
    shape1: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#eef2ff', zIndex: 0 },
    shape2: { position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: '#f5f3ff', zIndex: 0 },
    shape3: { position: 'absolute', top: '40%', left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: '#e0e7ff', opacity: 0.6, zIndex: 0 }
});
