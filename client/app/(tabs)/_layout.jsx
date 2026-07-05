import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/stores/useAuth';
import AiBotModal from '../../src/components/AiBotModal';

export default function TabLayout() {
    const { isBotOpen, setIsBotOpen } = useAuth();

    return (
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: styles.tabBar,
                    tabBarActiveTintColor: '#2563eb',
                    tabBarInactiveTintColor: '#9ca3af',
                    tabBarLabelStyle: styles.tabBarLabel,
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'Acasă',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="roadmap"
                    options={{
                        title: 'Raport Învățare',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? 'school' : 'school-outline'} size={24} color={color} />
                        ),
                        tabBarLabel: ({ color }) => <Text style={[styles.tabBarLabel, { color, textAlign: 'center', width: 95 }]} numberOfLines={1}>Raport Învățare</Text>,
                    }}
                />

                <Tabs.Screen
                    name="trends"
                    options={{
                        title: 'Trenduri',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? 'analytics' : 'analytics-outline'} size={24} color={color} />
                        ),
                        tabBarLabel: ({ color }) => <Text style={[styles.tabBarLabel, { color, textAlign: 'center' }]}>Trenduri</Text>,
                    }}
                />

                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profil',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
                        ),
                    }}
                />
            </Tabs>

            {/* Floating Action Button (Widget de Ajutor) */}
            <TouchableOpacity
                onPress={() => setIsBotOpen(true)}
                style={styles.floatingButton}
                activeOpacity={0.9}
            >
                <View style={styles.helpTextContainer}>
                    <Text style={styles.helpText}>Asistent AI</Text>
                </View>
                <View style={styles.floatingButtonInner}>
                    <Ionicons name="chatbubble-ellipses-outline" size={30} color="white" />
                    <View style={styles.onlineBadge} />
                </View>
            </TouchableOpacity>

            <AiBotModal
                visible={isBotOpen}
                onClose={() => setIsBotOpen(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 20,
        left: 10,
        right: 10,
        elevation: 10,
        backgroundColor: 'white',
        borderRadius: 25,
        height: 70,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderTopWidth: 0,
        paddingBottom: 10,
        paddingTop: 10,
    },
    tabBarLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    floatingButton: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 999,
    },
    floatingButtonInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    helpTextContainer: {
        backgroundColor: 'white',
        paddingLeft: 15,
        paddingRight: 30,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: -20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: -1,
    },
    helpText: {
        color: '#1e40af',
        fontWeight: 'bold',
        fontSize: 12,
        marginRight: 15,
    },
    onlineBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: 'white',
    },
});
