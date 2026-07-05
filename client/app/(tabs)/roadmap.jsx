import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Easing } from 'react-native';
import { useAuth } from '../../src/stores/useAuth';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../../src/config';
import RoadmapVisual from '../../src/components/RoadmapVisual';
import RoadmapDetailsModal from '../../src/components/RoadmapDetailsModal';

export default function RoadmapScreen() {
    const { user } = useAuth();
    const router = useRouter();

    const [roadmapData, setRoadmapData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [localSavedCourses, setLocalSavedCourses] = useState([]);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const fillAnim = useRef(new Animated.Value(68)).current;
    const waveAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (roadmapData?.percentMatch) {
            const targetY = 68 - (68 * (roadmapData.percentMatch / 100));
            Animated.spring(fillAnim, {
                toValue: targetY,
                friction: 6,
                tension: 40,
                delay: 200,
                useNativeDriver: true
            }).start();
        }
    }, [roadmapData, fillAnim]);

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

    const fetchRoadmap = useCallback(async () => {
        if (!user?.selectedCareerId || !user?.token) return;

        setLoading(true);
        try {
            const resRoadmap = await fetch(`${API_URL}/api/careers/gap-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ careerId: user.selectedCareerId })
            });

            if (resRoadmap.ok) {
                const rData = await resRoadmap.json();
                setRoadmapData(rData);
            }
        } catch (error) {
            console.error("Eroare preluare roadmap:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.selectedCareerId, user?.token]);

    useFocusEffect(
        useCallback(() => {
            fetchRoadmap();
        }, [fetchRoadmap])
    );

    const handleNodePress = (node) => {
        setSelectedCategory(node);
        setSelectedSkill(null);
        setModalVisible(true);
    };

    const handleSkillPress = async (skill) => {
        setDetailsLoading(true);
        setSelectedSkill({ ...skill, description: 'Se încarcă...' });
        try {
            const res = await fetch(`${API_URL}/api/careers/roadmap-item-details?title=${encodeURIComponent(String(skill.title))}&careerName=${encodeURIComponent(String(roadmapData?.careerName || ''))}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setSelectedSkill({
                    ...skill,
                    description: String(data.description || ''),
                    freeResources: data.freeResources || [],
                    premiumResources: data.premiumResources || []
                });
            }
        } catch (error) {
            console.error("Error fetching roadmap details:", error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleMarkLearned = async (skillTitle) => {
        try {
            const res = await fetch(`${API_URL}/api/cv/add-skill`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ skillName: skillTitle, level: 'Beginner' })
            });

            if (res.ok) {
                fetchRoadmap();
                setSelectedSkill(prev => prev ? ({ ...prev, completed: true }) : null);
                if (selectedCategory) {
                    setSelectedCategory(prev => prev ? ({
                        ...prev,
                        subSteps: prev.subSteps.map(s => s.title === skillTitle ? { ...s, completed: true } : s)
                    }) : null);
                }
            }
        } catch (e) {
            console.error("Eroare marcare skill invatat:", e);
        }
    };

    const handleSaveCourse = async (course) => {
        const courseUrl = course.url || course.link;
        if (!courseUrl || localSavedCourses.includes(courseUrl)) return;
        setLocalSavedCourses(prev => [...prev, String(courseUrl)]);
        try {
            const res = await fetch(`${API_URL}/api/careers/save-course`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    title: String(course.label || course.title || "Resursă"),
                    platform: String(course.platform || course.type || 'Online'),
                    link: String(courseUrl || "N/A")
                })
            });
            if (!res.ok) {
                setLocalSavedCourses(prev => prev.filter(url => url !== courseUrl));
            }
        } catch (e) {
            console.error("Eroare la salvarea cursului:", e);
            setLocalSavedCourses(prev => prev.filter(url => url !== courseUrl));
        }
    };

    if (!user?.selectedCareerId) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                    <Ionicons name="map-outline" size={60} color="#94a3b8" />
                </View>
                <Text style={styles.emptyTitle}>Niciun parcurs selectat</Text>
                <Text style={styles.emptySubtitle}>
                    Mergi pe pagina Home pentru a analiza CV-ul și a alege o carieră care ți se potrivește.
                </Text>
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/home')}>
                    <Text style={styles.actionBtnText}>Alege Obiectivul</Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <ScrollView 
                style={{ flex: 1, backgroundColor: '#f1f5f9' }} 
                contentContainerStyle={{ paddingBottom: 120 }} 
                showsVerticalScrollIndicator={false}
            >
                <LinearGradient
                    colors={['#064e3b', '#047857']}
                    style={{
                        paddingTop: 60,
                        paddingHorizontal: 20,
                        paddingBottom: roadmapData ? 50 : 30,
                        borderBottomLeftRadius: 36,
                        borderBottomRightRadius: 36,
                    }}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Planul tău</Text>
                            <Text style={{ fontSize: 28, fontWeight: '900', color: 'white' }}>Raport Învățare</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={{ borderRadius: 24, borderWidth: 2, borderColor: '#10b981' }}>
                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: '#047857', fontWeight: '900', fontSize: 16 }}>
                                    {String(user?.firstName?.[0] || '')}{String(user?.lastName?.[0] || '')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <View style={{ paddingHorizontal: 20, marginTop: roadmapData ? -30 : 20 }}>
                    {loading && !roadmapData ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#10b981" />
                            <Text style={{ marginTop: 12, color: '#94a3b8', fontWeight: '600' }}>Se generează parcursul...</Text>
                        </View>
                    ) : (
                        <View>
                            {roadmapData && (
                                <View style={styles.summaryCard}>
                                    <View style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: '#10b981', opacity: 0.1 }} />
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.summaryBadge}>Cariera Ta</Text>
                                            <Text style={styles.summaryCareerTitle}>{String(roadmapData.careerName || '')}</Text>
                                        </View>
                                        <View style={styles.progressCircle}>
                                            <Animated.View style={[styles.progressFill, { transform: [{ translateY: fillAnim }] }]}>
                                                <LinearGradient colors={['rgba(16, 185, 129, 0.2)', 'rgba(52, 211, 153, 0.45)']} style={{ flex: 1 }} />
                                            </Animated.View>
                                            <Text style={styles.progressText}>{String(roadmapData.percentMatch || 0)}{'%'}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.progressBarBg}>
                                        <LinearGradient
                                            colors={['#818cf8', '#6366f1']}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={{ width: `${roadmapData.percentMatch || 0}%`, height: '100%', borderRadius: 6 }}
                                        />
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                        <Text style={styles.progressSubText}>Pregătire curentă</Text>
                                        <Text style={styles.matchScoreText}>{String(roadmapData.percentMatch || 0)}{'% scor potrivire'}</Text>
                                    </View>
                                </View>
                            )}

                            <View style={styles.roadmapCard}>
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.roadmapCardTitle}>Timeline Învățare</Text>
                                        <Text style={styles.roadmapCardSubtitle}>Urmează pașii de mai jos pentru succes</Text>
                                    </View>
                                    <Ionicons name="options-outline" size={20} color="#64748b" />
                                </View>

                                <RoadmapVisual
                                    steps={roadmapData?.roadmapSteps || []}
                                    onCategoryPress={handleNodePress}
                                />

                                <View style={styles.footer}>
                                    <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.footerGradient}>
                                        <View style={styles.footerIconBox}>
                                            <Ionicons name="bulb" size={18} color="#f59e0b" />
                                        </View>
                                        <Text style={styles.footerText}>Fiecare pas îți aduce resurse noi și cursuri selectate special pentru nivelul tău.</Text>
                                    </LinearGradient>
                                </View>
                            </View>
                        </View>
                    )}
                    <View style={{ height: 24 }} />
                </View>
            </ScrollView>

            <RoadmapDetailsModal
                visible={modalVisible}
                onClose={() => { setModalVisible(false); setSelectedCategory(null); setSelectedSkill(null); }}
                categoryData={selectedCategory}
                skillDetail={selectedSkill}
                skillLoading={detailsLoading}
                onSkillPress={handleSkillPress}
                onBackToCategory={() => setSelectedSkill(null)}
                onMarkLearned={handleMarkLearned}
                onSaveCourse={handleSaveCourse}
                savedCoursesUrls={localSavedCourses}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { height: 300, justifyContent: 'center', alignItems: 'center' },
    summaryCard: { backgroundColor: '#1e293b', borderRadius: 32, padding: 24, marginBottom: 24, overflow: 'hidden', elevation: 10 },
    summaryBadge: { color: '#34d399', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
    summaryCareerTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginTop: 4 },
    progressCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#10b981', overflow: 'hidden' },
    progressFill: { position: 'absolute', top: 0, left: 0, right: 0, height: 68 },
    progressText: { color: 'white', fontWeight: '900', fontSize: 18, zIndex: 10 },
    progressBarBg: { height: 12, backgroundColor: '#334155', borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#475569' },
    progressSubText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
    matchScoreText: { color: '#818cf8', fontSize: 12, fontWeight: '800' },
    roadmapCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, elevation: 5 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    roadmapCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    roadmapCardSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    footer: { marginTop: 24 },
    footerGradient: { flexDirection: 'row', padding: 16, borderRadius: 20, gap: 12, width: '100%' },
    footerIconBox: { backgroundColor: 'white', width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    footerText: { fontSize: 11, color: '#64748b', flex: 1, lineHeight: 16 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#f8fafc' },
    emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
    emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 12, lineHeight: 20, marginBottom: 30 },
    actionBtn: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }
});
