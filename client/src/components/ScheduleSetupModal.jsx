import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const FREQUENCIES = [
    {
        id: 'daily',
        icon: 'flame-outline',
        title: 'Zilnic',
        subtitle: '5-10 min/zi',
        description: 'Cel mai eficient – construiești un obicei puternic',
        color: ['#ef4444', '#f97316'],
        iconColor: '#ef4444',
        recommended: true,
    },
    {
        id: 'every_2_days',
        icon: 'fitness-outline',
        title: 'La 2 zile',
        subtitle: '15-20 min/sesiune',
        description: 'Un ritm bun dacă ești ocupat',
        color: ['#f59e0b', '#eab308'],
        iconColor: '#f59e0b',
        recommended: false,
    },
    {
        id: 'every_3_days',
        icon: 'book-outline',
        title: 'La 3 zile',
        subtitle: '20-30 min/sesiune',
        description: 'Suficient pentru progres constant',
        color: ['#6366f1', '#818cf8'],
        iconColor: '#6366f1',
        recommended: false,
    },
    {
        id: 'weekly',
        icon: 'calendar-outline',
        title: 'Săptămânal',
        subtitle: '30+ min/sesiune',
        description: 'Sesiuni mai lungi, dar mai rare',
        color: ['#0ea5e9', '#38bdf8'],
        iconColor: '#0ea5e9',
        recommended: false,
    }
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const ScheduleSetupModal = ({ visible, onClose, onSave, currentSchedule }) => {
    const [selectedFrequency, setSelectedFrequency] = useState(currentSchedule?.frequency || 'daily');
    const [selectedHour, setSelectedHour] = useState(currentSchedule?.reminderHour ?? 19);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({
                frequency: selectedFrequency,
                reminderHour: selectedHour,
                reminderMinute: 0
            });
        } finally {
            setSaving(false);
        }
    };

    const formatHour = (h) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${displayHour}:00 ${period}`;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                            <View style={styles.headerIcon}>
                                <Ionicons name="flag-outline" size={36} color="#6366f1" />
                            </View>
                            <Text style={styles.title}>Setează Ritmul</Text>
                            <Text style={styles.subtitle}>
                                Constanța bate intensitatea. Alege un ritm potrivit pentru tine.
                            </Text>
                        </View>

                        {/* Frequency Options */}
                        <View style={styles.optionsContainer}>
                            {FREQUENCIES.map((freq) => {
                                const isSelected = selectedFrequency === freq.id;
                                return (
                                    <TouchableOpacity
                                        key={freq.id}
                                        activeOpacity={0.7}
                                        onPress={() => setSelectedFrequency(freq.id)}
                                        style={[
                                            styles.optionCard,
                                            isSelected && styles.optionCardSelected
                                        ]}
                                    >
                                        {isSelected && (
                                            <LinearGradient
                                                colors={freq.color}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.optionGradient}
                                            />
                                        )}
                                        <View style={styles.optionContent}>
                                            <View style={styles.optionLeft}>
                                                <View style={[styles.optionIconContainer, { backgroundColor: (selectedFrequency === freq.id) ? 'rgba(255,255,255,0.2)' : freq.color[0] + '15' }]}>
                                                <Ionicons name={freq.icon} size={22} color={(selectedFrequency === freq.id) ? '#4f46e5' : freq.iconColor} />
                                            </View>
                                                <View style={styles.optionTextContainer}>
                                                    <View style={styles.optionTitleRow}>
                                                        <Text style={[
                                                            styles.optionTitle,
                                                            isSelected && styles.optionTitleSelected
                                                        ]}>{freq.title}</Text>
                                                        {freq.recommended && (
                                                            <View style={styles.recommendedBadge}>
                                                                <Text style={styles.recommendedText}>Recomandat</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text style={[
                                                        styles.optionSubtitle,
                                                        isSelected && styles.optionSubtitleSelected
                                                    ]}>{freq.subtitle}</Text>
                                                    <Text style={[
                                                        styles.optionDescription,
                                                        isSelected && styles.optionDescriptionSelected
                                                    ]}>{freq.description}</Text>
                                                </View>
                                            </View>
                                            <View style={[
                                                styles.radioOuter,
                                                isSelected && styles.radioOuterSelected
                                            ]}>
                                                {isSelected && <View style={styles.radioInner} />}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Reminder Time */}
                        <View style={styles.reminderSection}>
                            <View style={styles.reminderHeader}>
                                <Ionicons name="alarm-outline" size={20} color="#6366f1" />
                                <Text style={styles.reminderTitle}>Ora de reminder</Text>
                            </View>
                            <Text style={styles.reminderSubtitle}>
                                Te vom notifica la ora aleasă să nu uiți de învățat
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.hoursContainer}
                            >
                                {HOURS.map((h) => {
                                    const isSelected = selectedHour === h;
                                    // Evidențiem orele populare
                                    const isPopular = [8, 9, 12, 18, 19, 20, 21].includes(h);
                                    return (
                                        <TouchableOpacity
                                            key={h}
                                            onPress={() => setSelectedHour(h)}
                                            style={[
                                                styles.hourChip,
                                                isSelected && styles.hourChipSelected,
                                                isPopular && !isSelected && styles.hourChipPopular
                                            ]}
                                        >
                                            <Text style={[
                                                styles.hourText,
                                                isSelected && styles.hourTextSelected,
                                                isPopular && !isSelected && styles.hourTextPopular
                                            ]}>{formatHour(h)}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={saving}
                            activeOpacity={0.85}
                            style={styles.saveContainer}
                        >
                            <LinearGradient
                                colors={['#818cf8', '#6366f1', '#4f46e5']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.saveBtn}
                            >
                                <Ionicons name="flame" size={22} color="white" />
                                <Text style={styles.saveBtnText}>
                                    {saving ? 'Se salvează...' : currentSchedule ? 'Actualizează Programul' : 'Activează Programul'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#f8fafc',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '92%',
        minHeight: '70%',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 20,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 28,
    },
    closeBtn: {
        position: 'absolute',
        right: 0,
        top: 0,
        padding: 4,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        zIndex: 10,
    },
    headerIcon: {
        marginBottom: 12,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#1e293b',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
        paddingHorizontal: 20,
    },

    // Options
    optionsContainer: {
        gap: 12,
        marginBottom: 28,
    },
    optionCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 18,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    optionCardSelected: {
        borderColor: '#6366f1',
        shadowColor: '#6366f1',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    optionGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.06,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
    },
    optionIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    optionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1e293b',
    },
    optionTitleSelected: {
        color: '#4f46e5',
    },
    optionSubtitle: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
    },
    optionSubtitleSelected: {
        color: '#6366f1',
    },
    optionDescription: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
        marginTop: 2,
    },
    optionDescriptionSelected: {
        color: '#818cf8',
    },
    recommendedBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    recommendedText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#16a34a',
        textTransform: 'uppercase',
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#d1d5db',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    radioOuterSelected: {
        borderColor: '#6366f1',
        borderWidth: 2,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#6366f1',
    },

    // Reminder
    reminderSection: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
    },
    reminderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    reminderTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1e293b',
    },
    reminderSubtitle: {
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 16,
        fontWeight: '500',
    },
    hoursContainer: {
        gap: 8,
        paddingVertical: 4,
    },
    hourChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    hourChipSelected: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
    },
    hourChipPopular: {
        backgroundColor: '#eef2ff',
        borderColor: '#c7d2fe',
    },
    hourText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
    },
    hourTextSelected: {
        color: 'white',
    },
    hourTextPopular: {
        color: '#6366f1',
    },

    // Save
    saveContainer: {
        shadowColor: '#6366f1',
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 20,
        borderRadius: 20,
    },
    saveBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
});

export default ScheduleSetupModal;
