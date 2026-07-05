
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Modal cu 2 niveluri:
 * Nivel 1 (categoryData): Arată lista de skill-uri dintr-o categorie
 * Nivel 2 (selectedSkill): Arată descrierea unui skill individual + buton "Știu asta"
 */
export default function RoadmapDetailsModal({
    visible,
    onClose,
    categoryData,       // { title, subSteps: [{title, completed}] }
    skillDetail,        // { title, description, completed }
    skillLoading,
    onSkillPress,       // (skillName) => void - apelat când se apasă un skill
    onBackToCategory,   // () => void - apelat când se revine la categorie
    onMarkLearned,      // (skillName) => void - apelat când se bifează "Știu asta"
    onSaveCourse,       // (course) => void - apelat când se salvează un curs
    savedCoursesUrls    // array of saved course urls
}) {
    if (!visible) return null;

    // Nivel 2: Detalii skill individual
    if (skillDetail) {
        return (
            <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        {/* Header cu back */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onBackToCategory} style={styles.backBtn}>
                                <Ionicons name="arrow-back" size={20} color="#0f172a" />
                            </TouchableOpacity>
                            <Text style={styles.title} numberOfLines={2}>{skillDetail.title}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={22} color="#0f172a" />
                            </TouchableOpacity>
                        </View>

                        {skillLoading ? (
                            <View style={styles.loadingBox}>
                                <ActivityIndicator size="small" color="#3b82f6" />
                                <Text style={styles.loadingText}>Se încarcă...</Text>
                            </View>
                        ) : (
                            <ScrollView contentContainerStyle={styles.scrollContent}>
                                {/* Status badge */}
                                <View style={[styles.statusBadge, skillDetail.completed ? styles.statusDone : styles.statusPending]}>
                                    <Ionicons
                                        name={skillDetail.completed ? "checkmark-circle" : "ellipse-outline"}
                                        size={16}
                                        color={skillDetail.completed ? "#10b981" : "#f59e0b"}
                                    />
                                    <Text style={[styles.statusText, skillDetail.completed ? { color: '#10b981' } : { color: '#f59e0b' }]}>
                                        {skillDetail.completed ? "Competență dobândită" : "De învățat"}
                                    </Text>
                                </View>

                                {/* Descriere */}
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="information-circle-outline" size={16} color="#475569" />
                                    <Text style={styles.sectionTitle}>Descriere</Text>
                                </View>
                                <Text style={styles.description}>{skillDetail.description}</Text>

                                {/* Resurse gratuite */}
                                {skillDetail.freeResources && skillDetail.freeResources.length > 0 && (
                                    <View style={styles.resourceSection}>
                                        <Text style={styles.resourceSectionTitle}>Resurse gratuite</Text>
                                        {skillDetail.freeResources.map((res, i) => {
                                            const isSaved = savedCoursesUrls?.includes(res.url || res.link);
                                            return (
                                            <View key={i} style={[styles.resourceItem, { paddingRight: 8 }]}>
                                                <TouchableOpacity
                                                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                                                    onPress={() => res.url && Linking.openURL(res.url)}
                                                >
                                                    <View style={styles.resourceIcon}>
                                                        <Ionicons name={res.type === 'Video' ? 'play-circle-outline' : 'document-text-outline'} size={18} color="#3b82f6" />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.resourceLabel} numberOfLines={2}>{res.label}</Text>
                                                        {res.type && <Text style={styles.resourcePlatform}>{res.type}</Text>}
                                                    </View>
                                                </TouchableOpacity>
                                                <TouchableOpacity 
                                                    style={{ padding: 8 }} 
                                                    onPress={() => !isSaved && onSaveCourse && onSaveCourse({ ...res, platform: res.type || 'Resursă gratuită' })}
                                                >
                                                    <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: isSaved ? '#e0e7ff' : '#eef2ff', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={18} color={isSaved ? '#4338ca' : '#3b82f6'} />
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        )})}
                                    </View>
                                )}

                                {/* Cursuri premium */}
                                {skillDetail.premiumResources && skillDetail.premiumResources.length > 0 && (
                                    <View style={styles.resourceSection}>
                                        <Text style={styles.resourceSectionTitle}>Cursuri recomandate</Text>
                                        {skillDetail.premiumResources.map((res, i) => {
                                            const isSaved = savedCoursesUrls?.includes(res.url || res.link);
                                            return (
                                            <View key={i} style={[styles.resourceItem, { paddingRight: 8 }]}>
                                                <TouchableOpacity
                                                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                                                    onPress={() => res.url && Linking.openURL(res.url)}
                                                >
                                                    <View style={[styles.resourceIcon, { backgroundColor: '#fef3c7' }]}>
                                                        <Ionicons name="school-outline" size={18} color="#f59e0b" />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.resourceLabel} numberOfLines={2}>{res.label}</Text>
                                                        {res.platform && <Text style={styles.resourcePlatform}>{res.platform}</Text>}
                                                    </View>
                                                </TouchableOpacity>
                                                <TouchableOpacity 
                                                    style={{ padding: 8 }} 
                                                    onPress={() => !isSaved && onSaveCourse && onSaveCourse(res)}
                                                >
                                                    <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: isSaved ? '#e0e7ff' : '#eef2ff', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={18} color={isSaved ? '#4338ca' : '#6366f1'} />
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        )})}
                                    </View>
                                )}

                                {/* Buton "Știu asta" dacă nu e completat */}
                                {!skillDetail.completed && (
                                    <TouchableOpacity
                                        style={styles.markLearnedBtn}
                                        onPress={() => onMarkLearned && onMarkLearned(skillDetail.title)}
                                    >
                                        <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                                        <Text style={styles.markLearnedText}>Știu această competență</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        );
    }

    // Nivel 1: Lista de skill-uri din categorie
    if (categoryData) {
        const completedCount = categoryData.subSteps ? categoryData.subSteps.filter(s => s.completed).length : 0;
        const totalCount = categoryData.subSteps ? categoryData.subSteps.length : 0;

        return (
            <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.title} numberOfLines={2}>{categoryData.title}</Text>
                                <Text style={styles.subtitle}>{completedCount}/{totalCount} competențe dobândite</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={22} color="#0f172a" />
                            </TouchableOpacity>
                        </View>

                        {/* Progress bar */}
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }]} />
                        </View>

                        {/* Descriere Categorie - afișăm doar dacă e o descriere utilă (nu text generic) */}
                        {categoryData.description &&
                            categoryData.description.length > 40 &&
                            !categoryData.description.includes('Grup de competen') && (
                                <View style={styles.categoryDescBox}>
                                    <Text style={styles.categoryDescText}>{categoryData.description}</Text>
                                </View>
                            )}

                        {/* Lista de skills */}
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                            {categoryData.subSteps && categoryData.subSteps.map((skill, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.skillItem, skill.completed && styles.skillItemDone]}
                                    onPress={() => onSkillPress && onSkillPress(skill)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.skillIcon, skill.completed ? styles.skillIconDone : styles.skillIconPending]}>
                                        <Ionicons
                                            name={skill.completed ? "checkmark" : "code-slash-outline"}
                                            size={14}
                                            color={skill.completed ? "white" : "#3b82f6"}
                                        />
                                    </View>
                                    <Text style={[styles.skillText, skill.completed && styles.skillTextDone]}>
                                        {skill.title}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: 32,
        width: '100%',
        maxHeight: '80%',
        overflow: 'hidden',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 15,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backBtn: {
        padding: 4,
        marginRight: 10,
    },
    closeBtn: {
        padding: 4,
    },
    title: {
        fontSize: 19,
        fontWeight: '900',
        color: '#1e293b',
        flexShrink: 1,
        flexWrap: 'wrap',
        lineHeight: 26,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 4,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#f1f5f9',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#6366f1',
    },
    scrollContent: {
        padding: 24,
    },
    loadingBox: {
        padding: 60,
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
    },
    categoryDescBox: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    categoryDescText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        fontStyle: 'italic',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // Skill items in category list
    skillItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'white',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1,
    },
    skillItemDone: {
        backgroundColor: '#f0fdf4',
        borderColor: '#dcfce7',
    },
    skillIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    skillIconDone: {
        backgroundColor: '#10b981',
    },
    skillIconPending: {
        backgroundColor: '#eef2ff',
    },
    skillText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    skillTextDone: {
        color: '#065f46',
    },

    // Skill detail view
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    statusDone: {
        backgroundColor: '#d1fae5',
    },
    statusPending: {
        backgroundColor: '#fef3c7',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 16,
        color: '#475569',
        lineHeight: 26,
        marginBottom: 24,
    },
    markLearnedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10b981',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 18,
        gap: 10,
        marginTop: 10,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    markLearnedText: {
        color: 'white',
        fontWeight: '900',
        fontSize: 16,
    },

    // Resource styles
    resourceSection: {
        marginBottom: 24,
    },
    resourceSectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 14,
    },
    resourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 12,
    },
    resourceIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#eef2ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    resourceLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    resourcePlatform: {
        fontSize: 12,
        color: '#6366f1',
        fontWeight: '800',
        marginTop: 2,
    },
});
