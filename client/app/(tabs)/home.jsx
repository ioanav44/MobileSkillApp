import { useState, useEffect, Fragment, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking, Platform, KeyboardAvoidingView, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import HistoryCalendarModal from '../../src/components/HistoryCalendarModal';

import { useAuth } from '../../src/stores/useAuth';
import { API_URL } from '../../src/config';
import CustomAlert from '../../src/components/CustomAlert';
import StreakCard from '../../src/components/StreakCard';
import ScheduleSetupModal from '../../src/components/ScheduleSetupModal';
import { useNotifications } from '../../src/hooks/useNotifications';

export default function HomeScreen() {
    const router = useRouter();
    const { user, setUser, selectedCareer, setSelectedCareer, setIsBotOpen } = useAuth();

    const [cvText, setCvText] = useState('');
    const [hasSentLoginPush, setHasSentLoginPush] = useState(false);

    // Notifications hook
    const { sendLoginPushNotification, sendStreakMilestoneNotification } = useNotifications(user, scheduleData);

    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [skills, setSkills] = useState([]);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [isChangingCareer, setIsChangingCareer] = useState(false);
    const [allCareers, setAllCareers] = useState([]);

    const [newSkill, setNewSkill] = useState('');
    const [addingSkill, setAddingSkill] = useState(false);

    const [analysisResult, setAnalysisResult] = useState(null);
    const fillAnim = useRef(new Animated.Value(70)).current;
    const waveAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (analysisResult?.percentMatch) {
            const targetY = 70 - (70 * (analysisResult.percentMatch / 100));
            Animated.spring(fillAnim, {
                toValue: targetY,
                friction: 6,
                tension: 40,
                delay: 300,
                useNativeDriver: true
            }).start();
        }
    }, [analysisResult, fillAnim]);

    useEffect(() => {
        Animated.loop(
            Animated.timing(waveAnim, {
                toValue: 1,
                duration: 2500,
                easing: Easing.linear,
                useNativeDriver: true
            })
        ).start();
    }, [waveAnim]);

    const spin = waveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    // Learning Schedule State
    const [scheduleData, setScheduleData] = useState(null);
    const [streakData, setStreakData] = useState(null);
    const [motivationalMessage, setMotivationalMessage] = useState('');
    const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
    const [historyCalendarVisible, setHistoryCalendarVisible] = useState(false);
    const [hasPromptedNotifications, setHasPromptedNotifications] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info',
        confirmText: 'Confirmă',
        showCancel: false
    });

    const showAlert = (config) => {
        setAlertConfig({
            ...config,
            onConfirm: config.onConfirm || (() => setAlertVisible(false))
        });
        setAlertVisible(true);
    };

    // Fetch schedule/streak data
    const fetchScheduleData = async () => {
        try {
            const res = await fetch(`${API_URL}/api/schedule`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setScheduleData(data.schedule);
                setStreakData(data.streak);
                setMotivationalMessage(data.motivationalMessage);

                // Dacă utilizatorul nu are program setat și nu a fost încă întrebat în această sesiune
                if (!data.schedule && !hasPromptedNotifications) {
                    setHasPromptedNotifications(true);
                    setTimeout(() => {
                        showAlert({
                            title: 'Activezi notificările? 🔔',
                            message: 'Pentru a-ți forma un obicei de studiu constant și a te asigura că nu pierzi streak-ul de învățare, activează reminderele zilnice.',
                            showCancel: true,
                            confirmText: 'Activează',
                            cancelText: 'Mai târziu',
                            onConfirm: () => {
                                setAlertVisible(false);
                                setScheduleModalVisible(true);
                            }
                        });
                    }, 1200); // Mică întârziere premium după încărcare
                }
            }
        } catch (e) {
            console.error('Eroare fetch schedule:', e);
        }
    };


    const handleSaveSchedule = async (scheduleConfig) => {
        try {
            const res = await fetch(`${API_URL}/api/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(scheduleConfig)
            });
            const data = await res.json();
            if (res.ok) {
                setScheduleModalVisible(false);
                fetchScheduleData();
                showAlert({
                    title: 'Program Activat!',
                    message: 'Programul tău de învățare a fost setat. Vei primi notificări la ora aleasă!',
                    type: 'success'
                });
            }
        } catch (e) {
            showAlert({ title: 'Eroare', message: 'Nu am putut salva programul.', type: 'error' });
        }
    };

    // Trimite o notificare push nativă la 5 secunde după logare (bun venit)
    useEffect(() => {
        if (user && !hasSentLoginPush) {
            setHasSentLoginPush(true);
            sendLoginPushNotification();
        }
    }, [user, hasSentLoginPush]);


    useFocusEffect(
        useCallback(() => {
            if (!user) {
                router.replace('/');
            } else {
                fetchCareers();
                fetchUserSkills();
                fetchScheduleData();
                // Dacă avem o carieră selectată, re-facem analiza pentru a prinde eventualele schimbări de nivel din Profil
                if (user?.selectedCareerId || selectedCareer) {
                    const cId = user?.selectedCareerId || selectedCareer;
                    refreshAnalysis(cId);
                }
            }
        }, [user, selectedCareer])
    );

    const refreshAnalysis = async (cId) => {
        try {
            const response = await fetch(`${API_URL}/api/careers/gap-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ careerId: cId })
            });
            const data = await response.json();
            if (response.ok) {
                setAnalysisResult(data);
            }
        } catch (error) {
            console.error("Eroare refresh analysis:", error);
        }
    };

    const fetchUserSkills = async () => {
        try {
            const res = await fetch(`${API_URL}/api/cv/my-skills`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (res.ok && data.skills && data.skills.length > 0) {
                const skillNames = data.skills.map(s => s.name);
                setSkills(skillNames);
                setHasAnalyzed(true);

                // RESTAURARE CARIERĂ DIN PROFIL (Dacă există în baza de date)
                if (user?.selectedCareerId && !selectedCareer) {
                    handleSelectCareer(user.selectedCareerId);
                } else if (selectedCareer) {
                    handleSelectCareer(selectedCareer);
                }
            } else if (res.ok && (!data.skills || data.skills.length === 0)) {
                // Nu există skill-uri (CV șters sau cont nou) → resetăm la starea inițială
                setSkills([]);
                setHasAnalyzed(false);
                setSelectedFile(null);
                setCvText('');
                setAnalysisResult(null);
            }
        } catch (e) {
            console.error("Eroare preluare skills:", e);
        }
    };

    const fetchCareers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/careers`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await response.json();
            if (response.ok) setAllCareers(data);
        } catch (error) {
            console.error("Eroare preluare cariere:", error);
        }
    };

    const handleSelectDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true
            });

            if (!result.canceled) {
                const file = result.assets[0];
                setSelectedFile(file);
            }
        } catch (err) {
            console.error(err);
            showAlert({ title: 'Eroare', message: 'Nu s-a putut selecta fișierul.', type: 'error' });
        }
    };

    const handleAnalizeaza = async () => {
        if (!cvText.trim() && !selectedFile) {
            showAlert({ title: 'Atenție', message: 'Introdu textul CV-ului sau încarcă un fișier PDF.', type: 'warning' });
            return;
        }

        setLoading(true);
        setSkills([]);
        setHasAnalyzed(false);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
            const formData = new FormData();
            if (selectedFile) {
                console.log("Trimitere FISIER:", selectedFile.name, "(Mobile/Web Check)");
                if (Platform.OS === 'web') {
                    const rawFile = selectedFile.file;
                    if (rawFile) {
                        formData.append('cvFile', rawFile, selectedFile.name);
                    } else {
                        const resp = await fetch(selectedFile.uri);
                        const blob = await resp.blob();
                        formData.append('cvFile', blob, selectedFile.name);
                    }
                } else {
                    // Pe Mobile, folosim direct obiectul compatibil cu FormData
                    formData.append('cvFile', {
                        uri: selectedFile.uri,
                        name: selectedFile.name,
                        type: 'application/pdf',
                    });
                }
            } else if (cvText.trim().length > 0) {
                console.log("Trimitere TEXT manual");
                formData.append('cvText', cvText);
            }

            console.log("URL de conectare:", `${API_URL}/api/cv/upload`);

            const response = await fetch(`${API_URL}/api/cv/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.token}`,
                },
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Verificăm dacă răspunsul este JSON înainte de a parsa
            const contentType = response.headers.get("content-type");
            if (!response.ok) {
                let errorData = { error: 'Eroare necunoscută' };
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    errorData = await response.json();
                }
                throw new Error(errorData.error || `Serverul a răspuns cu status ${response.status}`);
            }

            const responseData = await response.json();
            console.log("Răspuns server primit succes.");

            // Backend returnează un array de obiecte {name, level} în cheia 'skills'
            const skillsNames = (responseData.skills || []).map(s => typeof s === 'string' ? s : s.name);
            setSkills(skillsNames);
            setHasAnalyzed(true);

        } catch (error) {
            console.log("INFO UPLOAD:", error.message);
            let msg = 'Eroare la upload.';
            if (error.name === 'AbortError') msg = 'Analiza a durat prea mult (timeout).';
            else if (error.message.includes('Network')) msg = 'Nu se poate contacta serverul.';
            else msg = error.message;

            showAlert({ title: 'Eroare Analiză', message: msg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCareer = async (careerId) => {
        if (loading) return;
        setLoading(true);
        setSelectedCareer(careerId);
        setAnalysisResult(null);

        // SALVARE ÎN BAZA DE DATE
        try {
            const res = await fetch(`${API_URL}/api/auth/update-career`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ careerId })
            });
            if (res.ok) {
                // Actualizăm și obiectul user local pentru a reflecta schimbarea instantaneu în tab-ul de profil
                setUser({ ...user, selectedCareerId: careerId });
            }
        } catch (e) {
            console.error("Nu am putut salva cariera în DB");
        }

        try {
            const response = await fetch(`${API_URL}/api/careers/gap-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ careerId })
            });
            const data = await response.json();
            if (response.ok) {
                setAnalysisResult(data);
                setIsChangingCareer(false); // Ascunde lista dupa selectie
            }
        } catch (error) {
            console.error("Eroare gap analysis:", error);
        } finally {
            setLoading(false);
        }
    };
    // Revenire la lista de skills din categorie
    const handleBackToCategory = () => {
        setSkillDetail(null);
    };



    const handleAddCustomSkill = async (skillParam) => {
        const skillName = typeof skillParam === 'string' ? skillParam : newSkill;
        if (!skillName.trim()) return;
        setAddingSkill(true);
        try {
            const response = await fetch(`${API_URL}/api/cv/add-skill`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ skillName: skillName, level: 'Intermediate' })
            });

            const data = await response.json();
            if (response.ok) {
                setNewSkill('');
                // Re-analizează dacă avem o carieră selectată
                if (selectedCareer) handleSelectCareer(selectedCareer);
                else showAlert({ title: 'Succes', message: `Am adăugat ${data.skill.name} la portofoliul tău.`, type: 'success' });
            } else {
                showAlert({ title: 'Eroare', message: data.error || 'Nu s-a putut adăuga competența.', type: 'error' });
            }
        } catch (error) {
            showAlert({ title: 'Eroare', message: 'Eroare de conexiune.', type: 'error' });
        } finally {
            setAddingSkill(false);
        }
    };








    if (!user) return null;

    return (
        <Fragment>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={{ flex: 1, backgroundColor: '#f1f5f9' }}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Modern Overlapping Header */}
                    <LinearGradient 
                        colors={['#312e81', '#4338ca']} 
                        style={{ 
                            paddingTop: 60, 
                            paddingHorizontal: 20, 
                            paddingBottom: hasAnalyzed ? 50 : 30, 
                            borderBottomLeftRadius: 36, 
                            borderBottomRightRadius: 36,
                            shadowColor: '#4338ca',
                            shadowOpacity: 0.4,
                            shadowRadius: 20,
                            elevation: 10
                        }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Călătoria Ta Tech</Text>
                                <Text style={{ fontSize: 28, fontWeight: '900', color: 'white' }}>Salut, {user?.firstName}!</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/profile')}
                                style={{
                                    borderRadius: 24,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.3,
                                    shadowRadius: 10,
                                    elevation: 6,
                                    borderWidth: 2,
                                    borderColor: '#6366f1'
                                }}
                            >
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ color: '#4338ca', fontWeight: '900', fontSize: 16 }}>
                                        {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    <View style={{ paddingHorizontal: 20, marginTop: hasAnalyzed ? -30 : 20 }}>

                        {/* CV Input Section */}
                        {!hasAnalyzed && (
                            <View style={{ backgroundColor: 'white', borderRadius: 32, padding: 28, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 4 }}>
                                <Text style={{ fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 10 }}>Analiză Profil</Text>
                                <Text style={{ color: '#64748b', fontSize: 15, marginBottom: 24, lineHeight: 22 }}>Analizează-ți experiența și descoperă competențele necesare pentru a evolua către cariera dorită.</Text>

                                <TouchableOpacity
                                    onPress={handleSelectDocument}
                                    style={{
                                        backgroundColor: '#f5f7ff',
                                        borderStyle: 'dashed',
                                        borderWidth: 2,
                                        borderColor: '#c7d2fe',
                                        borderRadius: 24,
                                        paddingVertical: 40,
                                        marginBottom: 24,
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <View style={{ backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 15, shadowColor: '#6366f1', shadowOpacity: 0.1, shadowRadius: 10 }}>
                                        <Ionicons
                                            name={selectedFile ? "checkmark-circle" : "cloud-upload-outline"}
                                            size={32}
                                            color="#6366f1"
                                        />
                                    </View>
                                    <Text style={{ color: '#1e293b', fontWeight: '700', fontSize: 16, textAlign: 'center' }}>
                                        {selectedFile ? 'Fișier selectat!' : 'Încarcă CV-ul tău'}
                                    </Text>
                                    <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
                                        {selectedFile ? selectedFile.name : 'Doar format PDF'}
                                    </Text>
                                </TouchableOpacity>

                                <TextInput
                                    style={{ backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', padding: 20, minHeight: 120, textAlignVertical: 'top', color: '#1e293b', fontSize: 15 }}
                                    placeholder="Sau lipește aici experiența ta..."
                                    multiline
                                    value={cvText}
                                    onChangeText={setCvText}
                                    placeholderTextColor="#94a3b8"
                                />

                                <TouchableOpacity
                                    onPress={handleAnalizeaza}
                                    disabled={loading}
                                    style={{ marginTop: 24, borderRadius: 20, shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}
                                >
                                    <LinearGradient
                                        colors={['#818cf8', '#6366f1', '#4f46e5']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{ paddingVertical: 20, alignItems: 'center', borderRadius: 20 }}
                                    >
                                        {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '800', fontSize: 18, letterSpacing: 0.5 }}>Analizează</Text>}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Streak / Schedule Card - always visible after analysis */}
                        {hasAnalyzed && (
                            <StreakCard
                                streakData={streakData}
                                schedule={scheduleData}
                                motivationalMessage={motivationalMessage}
                                onSetupPress={() => setScheduleModalVisible(true)}
                                onChangePress={() => setScheduleModalVisible(true)}
                                onOpenHistory={() => setHistoryCalendarVisible(true)}
                            />
                        )}

                        {/* Analysis Results & Dashboard */}
                        {hasAnalyzed && (
                            <View style={{ marginTop: 24, gap: 24 }}>
                                {/* Target Selector - Show only if changing or no target selected */}
                                {(!selectedCareer || isChangingCareer) && (
                                    <View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
                                            <Text style={{ fontSize: 20, fontWeight: '800', color: '#1e293b' }}>
                                                {selectedCareer ? 'Schimbă Obiectivul' : 'Alege Obiectivul'}
                                            </Text>
                                            {selectedCareer && (
                                                <TouchableOpacity onPress={() => setIsChangingCareer(false)} style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#bcf0da' }}>
                                                    <Text style={{ color: '#16a34a', fontWeight: '800', fontSize: 13 }}>Salvează</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        {selectedCareer && isChangingCareer && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, marginBottom: 16 }}>
                                                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                                                <Text style={{ color: '#16a34a', fontSize: 13, fontWeight: '800' }}>Ai ales deja un obiectiv</Text>
                                            </View>
                                        )}
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                                            {allCareers.map(c => (
                                                <TouchableOpacity
                                                    key={c.id}
                                                    onPress={() => handleSelectCareer(c.id)}
                                                    style={{
                                                        backgroundColor: selectedCareer === c.id ? null : 'white',
                                                        borderRadius: 20, marginRight: 12,
                                                        borderWidth: selectedCareer === c.id ? 0 : 1, borderColor: '#e2e8f0',
                                                        shadowColor: selectedCareer === c.id ? '#6366f1' : '#000',
                                                        shadowOpacity: selectedCareer === c.id ? 0.2 : 0,
                                                        shadowRadius: 10, elevation: selectedCareer === c.id ? 4 : 0
                                                    }}
                                                >
                                                    {selectedCareer === c.id ? (
                                                        <LinearGradient colors={['#818cf8', '#6366f1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 22, paddingVertical: 14, borderRadius: 20 }}>
                                                            <Text style={{ color: 'white', fontWeight: '800' }}>{c.name}</Text>
                                                        </LinearGradient>
                                                    ) : (
                                                        <View style={{ paddingHorizontal: 22, paddingVertical: 14 }}>
                                                            <Text style={{ color: '#64748b', fontWeight: '700' }}>{c.name}</Text>
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}

                                {/* Analysis Dashboard */}
                                {analysisResult && (
                                    <View style={{ gap: 20 }}>
                                        <View style={{ backgroundColor: 'white', borderRadius: 32, padding: 24, shadowColor: '#6366f1', shadowOpacity: 0.1, shadowRadius: 25, elevation: 6 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                                                <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#c7d2fe', overflow: 'hidden' }}>
                                                    <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 70, transform: [{ translateY: fillAnim }] }}>
                                                        <LinearGradient
                                                            colors={['rgba(99, 102, 241, 0.2)', 'rgba(99, 102, 241, 0.45)']}
                                                            style={{ flex: 1 }}
                                                        />
                                                    </Animated.View>
                                                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#4f46e5', zIndex: 2 }}>{analysisResult.percentMatch || 0}%</Text>
                                                </View>
                                                <View style={{ flex: 1, gap: 4 }}>
                                                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#1e293b' }}>Analiză Profil</Text>
                                                    <Text style={{ color: '#1e293b', fontSize: 14, fontWeight: '800', marginBottom: 8 }}>
                                                        Cariera: <Text style={{ color: '#6366f1' }}>{analysisResult.careerName}</Text>
                                                    </Text>

                                                    {!isChangingCareer && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                            <TouchableOpacity onPress={() => setIsChangingCareer(true)} style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}>
                                                                <Text style={{ color: '#475569', fontWeight: '800', fontSize: 12 }}>Schimbă</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>



                                            {/* Skills Insight Section */}
                                            <View style={{ marginTop: 24, gap: 20 }}>
                                                {/* My Expertise - Modern Pills */}
                                                {analysisResult.matchingSkills && analysisResult.matchingSkills.length > 0 && (
                                                    <View>
                                                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Atuurile tale principale</Text>
                                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                                            {analysisResult.matchingSkills.slice(0, 6).map((s, i) => (
                                                                <View key={i} style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: '#bcf0da' }}>
                                                                    <Text style={{ fontSize: 12, color: '#166534', fontWeight: '800' }}>{s}</Text>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    </View>
                                                )}

                                                {/* Next Target - Entire card is interactive */}
                                                {analysisResult.missingSkills && analysisResult.missingSkills.length > 0 && (
                                                    <TouchableOpacity
                                                        activeOpacity={0.7}
                                                        onPress={() => {
                                                            showAlert({
                                                                title: "Începe să înveți",
                                                                message: `Ai început deja să studiezi ${analysisResult.missingSkills[0]}? Adaugă-l imediat în profil pentru a-ți urmări progresul.`,
                                                                showCancel: true,
                                                                confirmText: "Da, am început",
                                                                onConfirm: () => {
                                                                    setAlertVisible(false);
                                                                    handleAddCustomSkill(analysisResult.missingSkills[0]);
                                                                }
                                                            });
                                                        }}
                                                        style={{ backgroundColor: '#f8fafc', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' }}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                                            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Ionicons name="book" size={18} color="#6366f1" />
                                                            </View>
                                                            <Text style={{ fontSize: 14, fontWeight: '800', color: '#1e293b' }}>Următoarea lecție</Text>
                                                        </View>

                                                        <View style={{ backgroundColor: 'white', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 }}>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{ fontSize: 15, fontWeight: '900', color: '#1e293b' }}>{analysisResult.missingSkills[0]}</Text>
                                                                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Skill critic pentru a debloca nivelul următor.</Text>
                                                            </View>
                                                            <View style={{ backgroundColor: '#1e293b', width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                                                <Ionicons name="add" size={24} color="white" />
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                confirmText={alertConfig.confirmText}
                showCancel={alertConfig.showCancel}
                onConfirm={alertConfig.onConfirm || (() => setAlertVisible(false))}
                onCancel={() => setAlertVisible(false)}
            />
            <ScheduleSetupModal
                visible={scheduleModalVisible}
                onClose={() => setScheduleModalVisible(false)}
                onSave={handleSaveSchedule}
                currentSchedule={scheduleData}
            />
            <HistoryCalendarModal
                visible={historyCalendarVisible}
                onClose={() => setHistoryCalendarVisible(false)}
                allActivityDates={streakData?.allActivityDates || []}
            />
        </Fragment>
    );
}
