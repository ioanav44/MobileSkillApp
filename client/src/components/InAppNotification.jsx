import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, DeviceEventEmitter, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const showNotification = (title, message) => {
    DeviceEventEmitter.emit('showInAppNotification', { title, message });
};

export default function InAppNotification() {
    const [notification, setNotification] = useState(null);
    const translateY = useRef(new Animated.Value(-150)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const hideTimeout = useRef(null);

    useEffect(() => {
        const listener = DeviceEventEmitter.addListener('showInAppNotification', (data) => {
            // Clear previous timeout if multiple notifications come fast
            if (hideTimeout.current) clearTimeout(hideTimeout.current);

            setNotification(data);

            // Animate In
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    bounciness: 12,
                    speed: 12,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();

            // Auto-hide after 4 seconds
            hideTimeout.current = setTimeout(() => {
                hideNotification();
            }, 4000);
        });

        return () => listener.remove();
    }, [translateY, opacity]);

    const hideNotification = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -150,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            setNotification(null);
        });
    };

    if (!notification) return null;

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
            <TouchableOpacity activeOpacity={0.9} onPress={hideNotification} style={styles.card}>
                <View style={styles.iconContainer}>
                    <Ionicons name="notifications" size={22} color="#818cf8" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
                    <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        right: 20,
        zIndex: 9999,
        elevation: 9999,
    },
    card: {
        backgroundColor: '#1e293b', // Dark modern look
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    iconContainer: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    icon: {
        fontSize: 22,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: 'white',
        fontWeight: '800',
        fontSize: 16,
        marginBottom: 4,
    },
    message: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 18,
    }
});
