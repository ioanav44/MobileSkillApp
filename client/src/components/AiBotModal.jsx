import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';
import { useAuth } from '../stores/useAuth';

export default function AiBotModal({ visible, onClose }) {
    const { user, selectedCareer } = useAuth();
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [loadingAi, setLoadingAi] = useState(false);

    const handleSendChat = async () => {
        if (!chatInput.trim()) return;

        const newUserMessage = { role: 'user', content: chatInput };
        const updatedMessages = [...chatMessages, newUserMessage];

        setChatMessages(updatedMessages);
        setChatInput('');
        setLoadingAi(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
            const response = await fetch(`${API_URL}/api/careers/ai-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                signal: controller.signal,
                body: JSON.stringify({
                    careerId: selectedCareer || 'general',
                    messages: updatedMessages
                })
            });

            clearTimeout(timeoutId);
            const data = await response.json();
            if (response.ok) {
                setChatMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
            } else {
                setChatMessages(prev => [...prev, { role: 'ai', content: `${data.error || 'Serviciu indisponibil momentan.'}` }]);
            }
        } catch (error) {
            const msg = error.name === 'AbortError' ? "Analiza a durat prea mult." : "Eroare de conexiune la server.";
            setChatMessages(prev => [...prev, { role: 'ai', content: msg }]);
        } finally {
            setLoadingAi(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <View style={styles.headerInfo}>
                            <View style={styles.botIcon}>
                                <Ionicons name="apps-outline" size={24} color="white" />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>Asistent AI</Text>
                                <Text style={styles.headerSubtitle}>Asistent disponibil online</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.chatArea}
                        contentContainerStyle={styles.chatContent}
                    >
                        {chatMessages.length === 0 && (
                            <View style={styles.welcomeContainer}>
                                <Ionicons name="chatbubbles-outline" size={60} color="#e5e7eb" />
                                <Text style={styles.welcomeText}>Cu ce te pot ajuta astăzi în legătură cu cariera ta?</Text>
                            </View>
                        )}
                        {chatMessages.map((m, i) => (
                            <View key={i} style={[
                                styles.messageBubble,
                                m.role === 'user' ? styles.userBubble : styles.aiBubble
                            ]}>
                                <Text style={[
                                    styles.messageText,
                                    m.role === 'user' ? styles.userText : styles.aiText
                                ]}>{m.content}</Text>
                            </View>
                        ))}
                        {loadingAi && (
                            <View style={styles.loadingBubble}>
                                <ActivityIndicator size="small" color="#2563eb" />
                                <Text style={styles.loadingText}>Asistentul procesează...</Text>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Scrie o întrebare..."
                            placeholderTextColor="#9ca3af"
                            value={chatInput}
                            onChangeText={setChatInput}
                            multiline
                        />
                        <TouchableOpacity
                            onPress={handleSendChat}
                            disabled={loadingAi || !chatInput.trim()}
                            style={[styles.sendButton, (!chatInput.trim() || loadingAi) && styles.sendButtonDisabled]}
                        >
                            <Ionicons name="send" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    botIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '600',
    },
    closeButton: {
        padding: 5,
    },
    chatArea: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    chatContent: {
        padding: 20,
    },
    welcomeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    welcomeText: {
        textAlign: 'center',
        color: '#9ca3af',
        marginTop: 15,
        fontSize: 16,
        paddingHorizontal: 30,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 12,
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#2563eb',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    userText: {
        color: 'white',
    },
    aiText: {
        color: '#1f2937',
    },
    loadingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        marginBottom: 12,
    },
    loadingText: {
        marginLeft: 8,
        color: '#6b7280',
        fontSize: 13,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    input: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 15,
        color: '#1f2937',
    },
    sendButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    sendButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
});
