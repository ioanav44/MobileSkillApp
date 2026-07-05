import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const StreakCard = ({ streakData, schedule, motivationalMessage, onSetupPress, onChangePress, onOpenHistory }) => {
    // Dacă nu are schedule setat, arătăm banner de motivare

    if (!schedule) {
        return (
            <TouchableOpacity activeOpacity={0.85} onPress={onSetupPress}>
                <LinearGradient
                    colors={['#1e293b', '#334155']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.setupBanner}
                >
                    {/* Decorative element */}
                    <View style={styles.decorCircle} />
                    <View style={styles.decorCircle2} />

                    <View style={styles.setupContent}>
                        <View style={styles.setupIconContainer}>
                            <LinearGradient
                                colors={['#f59e0b', '#f97316']}
                                style={styles.setupIcon}
                            >
                                <Ionicons name="flame" size={28} color="white" />
                            </LinearGradient>
                        </View>
                        <View style={styles.setupTextContainer}>
                            <Text style={styles.setupTitle}>Setează ritmul de învățare!</Text>
                            <Text style={styles.setupSubtitle}>
                                Fii constant și urmărește-ți progresul zilnic, ca un adevărat pro.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.setupBtnContainer}>
                        <View style={styles.setupBtn}>
                            <Text style={styles.setupBtnText}>Alege programul</Text>
                            <Ionicons name="arrow-forward" size={16} color="#f59e0b" />
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    // Are schedule -> arătăm streak card
    const { current = 0, longest = 0, weekDays = [] } = streakData || {};
    const scrollViewRef = useRef(null);

    const frequencyLabels = {
        'daily': 'Zilnic',
        'every_2_days': 'La 2 zile',
        'every_3_days': 'La 3 zile',
        'weekly': 'Săptămânal'
    };

    const streakColor = current >= 7 ? ['#f59e0b', '#ef4444'] :
        current >= 3 ? ['#f59e0b', '#f97316'] :
            current >= 1 ? ['#fbbf24', '#f59e0b'] :
                ['#94a3b8', '#64748b'];

    return (
        <View style={styles.card}>
            {/* Header - Streak counter */}
            <View style={styles.header}>
                <TouchableOpacity activeOpacity={0.8} onPress={onChangePress} style={styles.streakLeft}>
                    <LinearGradient
                        colors={streakColor}
                        style={styles.flameContainer}
                    >
                        <Ionicons name="flame" size={24} color="white" />
                    </LinearGradient>
                    <View>
                        <Text style={styles.streakNumber}>{current}</Text>
                        <Text style={styles.streakLabel}>
                            {current === 1 ? 'zi activă' : 'zile active'}
                        </Text>
                    </View>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={onChangePress} style={styles.settingsBtn}>
                        <Ionicons name="settings-outline" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                </View>

            </View>

            {/* Record & Settings */}
            <View style={styles.statsRow}>
                <TouchableOpacity activeOpacity={0.7} onPress={onChangePress} style={[styles.statItem, { flex: 1, justifyContent: 'flex-start' }]}>
                    <Ionicons name="trophy-outline" size={14} color="#f59e0b" />
                    <Text style={styles.statText}>Record: {longest} zile</Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.6} onPress={onChangePress} style={styles.actionPill}>
                    <Ionicons name="options" size={12} color="#6366f1" />
                    <Text style={styles.actionPillText}>Ritm: {frequencyLabels[schedule?.frequency] || 'Zilnic'}</Text>
                    <Ionicons name="chevron-forward" size={12} color="#6366f1" />
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
                {/* Buton fix Istoric */}
                <TouchableOpacity 
                    style={[styles.dayColumn, { marginRight: 12 }]} 
                    activeOpacity={0.7} 
                    onPress={onOpenHistory}
                >
                    <View style={[styles.dayCircle, styles.historyCircle]}>
                        <Ionicons name="calendar-outline" size={16} color="#6366f1" />
                    </View>
                    <Text style={styles.historyLabel}>Istoric</Text>
                </TouchableOpacity>

                {/* Divider vertical */}
                <View style={{ width: 1, backgroundColor: '#f1f5f9', height: 40, marginTop: 2, marginRight: 12 }} />

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    ref={scrollViewRef}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
                    contentContainerStyle={styles.weekContainer}
                    style={{ flex: 1 }}
                >
                    {weekDays.map((day, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.dayColumn} 
                            activeOpacity={0.7} 
                            onPress={onOpenHistory}
                        >
                            <View style={[
                                styles.dayCircle,
                                day.completed && styles.dayCompleted,
                                day.isToday && !day.completed && styles.dayToday
                            ]}>
                                {day.completed ? (
                                    <Ionicons name="checkmark" size={14} color="white" />
                                ) : day.isToday ? (
                                    <View style={styles.todayDot} />
                                ) : (
                                    <Text style={styles.dateNumberLabel}>{day.dateLabel}</Text>
                                )}
                            </View>
                            <Text style={[
                                styles.dayLabel,
                                day.isToday && styles.dayLabelToday,
                                day.completed && styles.dayLabelCompleted
                            ]}>{day.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Motivational message */}
            {motivationalMessage && (
                <View style={styles.messageContainer}>
                    <Text style={styles.messageText}>{motivationalMessage}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // ===== Setup Banner (no schedule) =====
    setupBanner: {
        borderRadius: 28,
        padding: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    decorCircle: {
        position: 'absolute',
        right: -30,
        top: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
    },
    decorCircle2: {
        position: 'absolute',
        left: -20,
        bottom: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    setupContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    setupIconContainer: {
        shadowColor: '#f59e0b',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    setupIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    setupTextContainer: {
        flex: 1,
    },
    setupTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 4,
    },
    setupSubtitle: {
        color: '#94a3b8',
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
    },
    setupBtnContainer: {
        alignItems: 'flex-start',
    },
    setupBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    setupBtnText: {
        color: '#fbbf24',
        fontWeight: '800',
        fontSize: 14,
    },

    // ===== Streak Card (has schedule) =====
    card: {
        backgroundColor: 'white',
        borderRadius: 28,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    streakLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    flameContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakNumber: {
        fontSize: 26,
        fontWeight: '900',
        color: '#1e293b',
        lineHeight: 28,
    },
    streakLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    settingsBtn: {
        padding: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        marginBottom: 20,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#64748b',
    },
    actionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eef2ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: '#c7d2fe',
    },
    actionPillText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#6366f1',
    },
    weekContainer: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        gap: 12,
    },
    dayColumn: {
        alignItems: 'center',
        gap: 6,
    },
    dayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    dayCompleted: {
        backgroundColor: '#22c55e',
        borderColor: '#16a34a',
    },
    dayToday: {
        borderColor: '#6366f1',
        borderWidth: 2,
        backgroundColor: '#eef2ff',
    },
    todayDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6366f1',
    },
    dayLabel: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '700',
    },
    dayLabelToday: {
        color: '#6366f1',
    },
    dayLabelCompleted: {
        color: '#22c55e',
    },
    historyCircle: {
        backgroundColor: '#eef2ff',
        borderColor: '#c7d2fe',
        borderWidth: 1,
        borderStyle: 'dashed',
        shadowColor: '#6366f1',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    historyLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#6366f1',
    },
    dateNumberLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8',
    },
    messageContainer: {
        backgroundColor: '#fffbeb',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#fef3c7',
    },
    messageText: {
        fontSize: 13,
        color: '#92400e',
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default StreakCard;
