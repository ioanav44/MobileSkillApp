import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function CustomAlert({ 
    visible, 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = 'Am înțeles', 
    cancelText = 'Anulează',
    showCancel = false,
    type = 'info' // 'info', 'warning', 'danger'
}) {
    const getIconColor = () => {
        if (type === 'danger') return '#ef4444';
        if (type === 'warning') return '#f59e0b';
        return '#6366f1';
    };

    const getIconName = () => {
        if (type === 'danger') return 'trash-outline';
        if (type === 'warning') return 'alert-triangle-outline';
        return 'information-circle-outline';
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.alertBox}>
                    <TouchableOpacity onPress={onCancel} style={styles.closeIcon}>
                        <Ionicons name="close" size={24} color="#94a3b8" />
                    </TouchableOpacity>

                    <View style={[styles.iconCircle, { backgroundColor: `${getIconColor()}15` }]}>
                        <Ionicons name={getIconName()} size={32} color={getIconColor()} />
                    </View>
                    
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonRow}>
                        {showCancel && (
                            <TouchableOpacity 
                                onPress={onCancel} 
                                style={styles.cancelBtn}
                            >
                                <Text style={styles.cancelText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity 
                            onPress={onConfirm} 
                            style={styles.confirmBtnContainer}
                        >
                            <LinearGradient
                                colors={type === 'danger' ? ['#ef4444', '#dc2626'] : ['#818cf8', '#6366f1']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.confirmBtn}
                            >
                                <Text style={styles.confirmText}>{confirmText}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    alertBox: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 32,
        padding: 30,
        paddingTop: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        position: 'relative',
    },
    closeIcon: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
        zIndex: 10,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
    },
    cancelText: {
        color: '#64748b',
        fontWeight: '700',
        fontSize: 15,
    },
    confirmBtnContainer: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#ef4444', 
        shadowOpacity: 0.2, 
        shadowRadius: 10,
    },
    confirmBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 15,
    },
});
