import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../src/config';
import { useAuth } from '../../src/stores/useAuth';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function TrendsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [trends, setTrends] = useState([]);

    useEffect(() => {
        fetchTrends();
    }, [user]);

    const fetchTrends = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/market-trends`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setTrends(data);
            }
        } catch (error) {
            console.error("Eroare preluare trenduri:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalJobs = trends.reduce((acc, t) => acc + (t.jobCount || 0), 0);
    const avgSalary = trends.length > 0
        ? Math.round(trends.reduce((acc, t) => acc + ((t.avgSalaryMin || 0) + (t.avgSalaryMax || 0)) / 2, 0) / trends.length)
        : 0;
    const topGrowth = trends.length > 0
        ? trends.reduce((max, t) => (t.growthPercent || 0) > (max.growthPercent || 0) ? t : max, trends[0])
        : null;

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#f1f5f9' }} contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Amber Premium Overlapping Header */}
            <LinearGradient
                colors={['#9a3412', '#d97706']}
                style={{
                    paddingTop: 60,
                    paddingHorizontal: 20,
                    paddingBottom: trends.length > 0 ? 50 : 30,
                    borderBottomLeftRadius: 36,
                    borderBottomRightRadius: 36,
                    shadowColor: '#d97706',
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                    elevation: 10
                }}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#fed7aa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Piața IT România</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 28, fontWeight: '900', color: 'white' }}>Trenduri IT</Text>
                            <Text style={{ fontSize: 24 }}>🔥</Text>
                        </View>
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
                            borderColor: '#fbbf24'
                        }}
                    >
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: '#d97706', fontWeight: '900', fontSize: 16 }}>
                                {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={{ paddingHorizontal: 20, marginTop: trends.length > 0 ? -30 : 20 }}>

            {/* Overview Stats */}
            {trends.length > 0 && (
                <View style={styles.statsRow}>
                    <LinearGradient colors={['#eff6ff', '#dbeafe']} style={styles.statCard}>
                        <Ionicons name="briefcase-outline" size={22} color="#2563eb" />
                        <Text style={[styles.statValue, { color: '#2563eb' }]}>{totalJobs.toLocaleString()}</Text>
                        <Text style={styles.statLabel}>Joburi Active</Text>
                    </LinearGradient>
                    <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.statCard}>
                        <Ionicons name="cash-outline" size={22} color="#16a34a" />
                        <Text style={[styles.statValue, { color: '#16a34a' }]}>{avgSalary.toLocaleString()}</Text>
                        <Text style={styles.statLabel}>Medie RON</Text>
                    </LinearGradient>
                    <LinearGradient colors={['#fef3c7', '#fde68a']} style={styles.statCard}>
                        <Ionicons name="trending-up-outline" size={22} color="#d97706" />
                        <Text style={[styles.statValue, { color: '#d97706' }]}>+{topGrowth?.growthPercent || 0}%</Text>
                        <Text style={styles.statLabel}>Top Nișă</Text>
                    </LinearGradient>
                </View>
            )}

            <Text style={styles.sectionTitle}>Evoluția Domeniilor</Text>

            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>Se analizează piața...</Text>
                </View>
            ) : trends.length > 0 ? (
                trends.map((item, index) => (
                    <View key={item.id || index} style={styles.trendCard}>
                        {/* Rank badge */}
                        <LinearGradient
                            colors={['#1e293b', '#0f172a']}
                            style={[styles.rankBadge, { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }]}
                        >
                            <Text style={styles.rankText}>#{index + 1}</Text>
                        </LinearGradient>

                        {/* Card Header */}
                        <View style={styles.cardHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.domainName}>{item.domain}</Text>
                                <View style={styles.badgeRow}>
                                    <View style={[styles.demandBadge,
                                    item.demandLevel === 'High' ? styles.demandHigh : styles.demandMedium
                                    ]}>
                                        <View style={[styles.dot, {
                                            backgroundColor: item.demandLevel === 'High' ? '#dc2626' : '#f59e0b'
                                        }]} />
                                        <Text style={[styles.demandText, {
                                            color: item.demandLevel === 'High' ? '#dc2626' : '#b45309'
                                        }]}>
                                            {item.demandLevel === 'High' ? 'Cerere mare' : 'Cerere medie'}
                                        </Text>
                                    </View>
                                    {(item.growthPercent || 0) > 0 && (
                                        <View style={styles.growthBadge}>
                                            <Ionicons name="trending-up" size={12} color="#16a34a" />
                                            <Text style={styles.growthText}>+{item.growthPercent}%</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.jobCountBox}
                                onPress={() => {
                                    const categoryName = item.domain || item.category || 'it';
                                    const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
                                    Linking.openURL(`https://www.ejobs.ro/locuri-de-munca/${slug}`);
                                }}
                            >
                                <Text style={styles.jobCount}>{(item.jobCount || 0).toLocaleString()}</Text>
                                <Text style={styles.jobLabel}>joburi</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <Text style={{ fontSize: 9, color: '#3b82f6', fontWeight: 'bold' }}>Vezi </Text>
                                    <Ionicons name="open-outline" size={10} color="#3b82f6" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.skillTitle}>Skill-uri cheie:</Text>
                        <View style={styles.skillsRow}>
                            {(item.topSkills || 'React, Node.js, SQL').split(',').map((skill, i) => (
                                <View key={i} style={styles.skillChip}>
                                    <Text style={styles.skillChipText}>{skill.trim()}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Seniority Grid */}
                        <View style={styles.seniorityGrid}>
                            <View style={styles.seniorityCol}>
                                <Text style={styles.seniorityLabel}>Entry-Level</Text>
                                <Text style={styles.senioritySalary}>{(item.avgSalaryEntry || 4500).toLocaleString()} RON</Text>
                            </View>
                            <View style={[styles.seniorityCol, styles.seniorityBorder]}>
                                <Text style={styles.seniorityLabel}>Experienced</Text>
                                <Text style={styles.senioritySalary}>{(item.avgSalaryMid || 8000).toLocaleString()} RON</Text>
                            </View>
                            <View style={styles.seniorityCol}>
                                <Text style={styles.seniorityLabel}>Senior / Lead</Text>
                                <Text style={styles.senioritySalary}>{(item.avgSalarySenior || 15000).toLocaleString()} RON</Text>
                            </View>
                        </View>

                        <View style={styles.footerRow}>
                            <Text style={styles.sourceText}>{item.source}</Text>
                        </View>
                    </View>
                ))
            ) : (
                <View style={styles.loadingBox}>
                    <Ionicons name="alert-circle-outline" size={40} color="#94a3b8" />
                    <Text style={styles.loadingText}>Nu am putut prelua trendurile din România.</Text>
                    <TouchableOpacity onPress={fetchTrends} style={{ marginTop: 10 }}>
                        <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>Reîncearcă</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.disclaimer}>
                <Ionicons name="information-circle-outline" size={14} color="#9ca3af" />
                <Text style={styles.disclaimerText}>
                    Date actualizate automat prin JSearch API.
                </Text>
            </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 20, paddingTop: 60, paddingBottom: 120 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 28, fontWeight: '900', color: '#1e293b' },
    headerSubtitle: { fontSize: 13, color: '#6366f1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    headerAvatarBtn: { borderRadius: 22, shadowColor: '#6366f1', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    headerAvatarGradient: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerAvatarText: { color: 'white', fontWeight: '900', fontSize: 15 },

    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24, justifyContent: 'space-between' },
    statCard: { 
        flex: 1, 
        height: 110, 
        borderRadius: 24, 
        paddingVertical: 18, 
        paddingHorizontal: 8, 
        alignItems: 'center', 
        justifyContent: 'center',
        elevation: 3, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.06, 
        shadowRadius: 10,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    statValue: { fontSize: 17, fontWeight: '900', marginVertical: 4, letterSpacing: -0.5 },
    statLabel: { fontSize: 9, color: '#64748b', fontWeight: '800', textTransform: 'uppercase', textAlign: 'center' },

    sectionTitle: { fontSize: 22, fontWeight: '900', color: '#1e293b', marginBottom: 16, letterSpacing: -0.5 },

    loadingBox: { alignItems: 'center', padding: 50, gap: 15 },
    loadingText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },

    trendCard: {
        backgroundColor: 'white', borderRadius: 28, padding: 20, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04, shadowRadius: 15, elevation: 2,
        borderWidth: 1, borderColor: '#f1f5f9'
    },
    rankBadge: { position: 'absolute', top: -10, right: 20, backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
    rankText: { color: 'white', fontSize: 12, fontWeight: '900' },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    domainName: { fontSize: 19, fontWeight: '900', color: '#1e293b', marginBottom: 6, letterSpacing: -0.5 },

    badgeRow: { flexDirection: 'row', gap: 8 },
    demandBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    demandHigh: { backgroundColor: '#fef2f2' },
    demandMedium: { backgroundColor: '#fffbeb' },
    dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    demandText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },

    growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    growthText: { fontSize: 10, fontWeight: '900', color: '#16a34a' },

    jobCountBox: { alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
    jobCount: { fontSize: 20, fontWeight: '900', color: '#6366f1' },
    jobLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '800' },

    skillTitle: { fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    skillChip: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    skillChipText: { fontSize: 12, color: '#475569', fontWeight: '700' },

    seniorityGrid: {
        flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 20, padding: 18,
        borderWidth: 1, borderColor: '#f1f5f9'
    },
    seniorityCol: { flex: 1, alignItems: 'center', gap: 4 },
    seniorityBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#e2e8f0' },
    seniorityLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase' },
    senioritySalary: { fontSize: 13, fontWeight: '900', color: '#1e293b' },

    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    sourceText: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

    disclaimer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, gap: 8, paddingBottom: 40, opacity: 0.7 },
    disclaimerText: { fontSize: 11, color: '#94a3b8', textAlign: 'center', fontWeight: '500' },
});

