
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

/**
 * Roadmap simplificat: afișează doar categoriile ca butoane.
 * La click se deschide popup-ul cu skill-urile din interior.
 */
export default function RoadmapVisual({ steps, onCategoryPress }) {
    // Animație de puls pentru nodul activ
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.4, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
            ])
        ).start();
    }, [pulseAnim]);

    if (!steps || steps.length === 0) return null;

    return (
        <View style={styles.container}>
            {/* Background Decorative Line */}
            <View style={styles.trunkBackground} />

            {steps.map((step, index) => {
                const completedCount = step.subSteps ? step.subSteps.filter(s => s.completed).length : 0;
                const totalCount = step.subSteps ? step.subSteps.length : 0;
                const allDone = totalCount > 0 && completedCount === totalCount;
                const matchPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                const isLast = index === steps.length - 1;
                const isActive = matchPct > 0 && !allDone;

                // Sugestive icons based on title
                const getCategoryIcon = (title) => {
                    const t = title.toLowerCase();
                    if (allDone) return "medal-outline";
                    if (t.includes('fundamentals') || t.includes('baze') || t.includes('introducere')) return "layers-outline";
                    if (t.includes('frontend') || t.includes('ui') || t.includes('ux') || t.includes('web')) return "browsers-outline";
                    if (t.includes('backend') || t.includes('api')) return "code-slash-outline";
                    if (t.includes('database') || t.includes('baze de date') || t.includes('sql') || t.includes('mongodb') || t.includes('server')) return "server-outline";
                    if (t.includes('javascript') || t.includes('js') || t.includes('typescript') || t.includes('ts')) return "logo-javascript";
                    if (t.includes('react') || t.includes('angular') || t.includes('vue') || t.includes('next')) return "logo-react";
                    if (t.includes('node') || t.includes('python') || t.includes('java') || t.includes('c++')) return "terminal-outline";
                    if (t.includes('mobile') || t.includes('android') || t.includes('ios') || t.includes('react native')) return "phone-portrait-outline";
                    if (t.includes('git') || t.includes('version') || t.includes('vcs')) return "git-branch-outline";
                    if (t.includes('security') || t.includes('siguranță') || t.includes('auth')) return "shield-checkmark-outline";
                    if (t.includes('testing') || t.includes('teste') || t.includes('qa') || t.includes('cypress') || t.includes('jest')) return "flask-outline";
                    if (t.includes('deploy') || t.includes('cloud') || t.includes('devops') || t.includes('aws') || t.includes('docker')) return "cloud-upload-outline";
                    if (t.includes('css') || t.includes('sass') || t.includes('tailwind')) return "brush-outline";
                    if (t.includes('html')) return "code-outline";

                    return isActive ? "terminal-outline" : "book-outline";
                };

                // Dynamic color based on score
                let statusColor = '#94a3b8'; // gray
                let statusBg = '#f8fafc';
                if (allDone) {
                    statusColor = '#10b981'; // green
                    statusBg = '#f0fdf4';
                } else if (matchPct > 60) {
                    statusColor = '#6366f1'; // indigo
                    statusBg = '#eef2ff';
                } else if (matchPct > 30) {
                    statusColor = '#f59e0b'; // orange
                    statusBg = '#fffbeb';
                } else if (matchPct > 0) {
                    statusColor = '#ef4444'; // red
                    statusBg = '#fef2f2';
                }

                return (
                    <TouchableOpacity
                        key={index}
                        style={styles.stepWrapper}
                        onPress={() => onCategoryPress(step)}
                        activeOpacity={0.9}
                    >
                        {/* Timeline Side */}
                        <View style={styles.timelineSide}>
                            {/* Connector Line */}
                            {!isLast && <View style={[styles.line, { backgroundColor: allDone ? '#10b981' : isActive ? statusColor : '#f1f5f9' }]} />}

                            {/* Step Indicator with Pulse Animation for Active Node */}
                            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                {isActive && (
                                    <Animated.View style={[
                                        styles.dot,
                                        { position: 'absolute', backgroundColor: statusColor, opacity: 0.25, transform: [{ scale: pulseAnim }], elevation: 0 }
                                    ]} />
                                )}
                                <LinearGradient
                                    colors={allDone ? ['#10b981', '#059669'] : matchPct > 0 ? [statusColor, statusColor] : ['#f1f5f9', '#e2e8f0']}
                                    style={styles.dot}
                                >
                                    {allDone ? (
                                        <Ionicons name="checkmark" size={14} color="white" />
                                    ) : (
                                        <Text style={[styles.stepNumber, matchPct > 0 ? { color: 'white' } : { color: '#94a3b8' }]}>{index + 1}</Text>
                                    )}
                                </LinearGradient>
                            </View>
                        </View>

                        {/* Content Card */}
                        <View style={styles.cardContainer}>
                            <View style={[styles.card, isActive && { borderColor: statusColor, borderWidth: 1.5, shadowOpacity: 0.1 }, allDone && styles.cardDone]}>
                                {/* Header */}
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconBox, { backgroundColor: statusBg }]}>
                                        <Ionicons
                                            name={getCategoryIcon(step.title)}
                                            size={22}
                                            color={statusColor}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.stepTitle, allDone && styles.textDone]}>
                                            {step.title}
                                        </Text>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                            <View style={[styles.badge, { backgroundColor: statusBg, marginLeft: 0 }]}>
                                                <Text style={[styles.badgeText, { color: statusColor }]}>
                                                    {allDone ? '100%' : `${matchPct}%`}
                                                </Text>
                                            </View>
                                            <Text style={[styles.stepSubtitle, { color: statusColor, flex: 1 }]} numberOfLines={1}>
                                                {allDone ? 'CAPITOL FINALIZAT' : isActive ? 'ÎN CURS' : 'URMEAZĂ'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Progress Visual */}
                                <View style={styles.progressArea}>
                                    <View style={styles.progressBarBg}>
                                        <LinearGradient
                                            colors={allDone ? ['#10b981', '#34d399'] : [statusColor, statusColor + '99']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={[styles.progressBarFill, { width: `${matchPct}%` || '0%' }]}
                                        />
                                    </View>
                                    <View style={styles.progressInfo}>
                                        <Text style={styles.countText}>{completedCount} / {totalCount} capitole</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Text style={{ fontSize: 11, fontWeight: '800', color: statusColor }}>{allDone ? 'REVEDE' : 'DESCHIDE'}</Text>
                                            <Ionicons name="chevron-forward" size={12} color={statusColor} />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 10,
    },
    trunkBackground: {
        position: 'absolute',
        top: 20,
        bottom: 20,
        left: 32,
        width: 4,
        backgroundColor: '#f1f5f9',
        borderRadius: 2,
    },
    stepWrapper: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    timelineSide: {
        width: 64,
        alignItems: 'center',
        paddingTop: 10,
    },
    dot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
    },
    stepNumber: {
        fontSize: 13,
        fontWeight: '900',
    },
    line: {
        position: 'absolute',
        top: 42,
        bottom: -32,
        left: 31,
        width: 2,
        zIndex: 1,
    },
    cardContainer: {
        flex: 1,
        paddingRight: 4,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
    },
    cardActive: {
        backgroundColor: '#fff',
        shadowOpacity: 0.1,
        elevation: 5,
    },
    cardDone: {
        backgroundColor: '#fcfdfd',
        borderColor: '#e2e8f0',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Poziționare sus pentru a lăsa textul să curgă
        gap: 14,
        marginBottom: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1e293b',
        lineHeight: 22,
        flex: 1, // Permite textului să ocupe tot spațiul
    },
    stepSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 2,
    },
    textDone: {
        color: '#64748b',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        marginLeft: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '900'
    },
    progressArea: {
        marginTop: 4,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
    },
    countText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '700',
    },
});
