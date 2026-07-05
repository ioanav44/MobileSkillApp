import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

// ============================================================
// Sistem de Notificări Native (Local Notifications)
// Permite afișarea de notificări push chiar și când aplicația este
// închisă sau în fundal, fără a necesita servere externe.
// ============================================================

// Configurare comportament notificări când aplicația este activă (în foreground)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const NOTIFICATION_MESSAGES = {
    reminder: [
        { title: "⭐ E ora ta de învățare!", body: "Ce skill vrei să deblochezi azi? Fiecare zi petrecută învățând te aduce mai aproape de jobul ideal! " },
        { title: "⭐ Focus time!", body: "Hai să continuăm drumul spre cariera ta de vis! ⭐" },
        { title: "⭐ Momentul perfect!", body: "Fiecare zi petrecută învățând te aduce mai aproape de jobul ideal! Deschide aplicația! 🌟" },
        { title: "⭐ Ready to grow?", body: "Fiecare sesiune te aduce mai aproape de obiectiv! ⭐" },
    ],
    streakWarning: [
        { title: "⭐ Progresul tău este în pericol!", body: "Fiecare zi petrecută învățând te aduce mai aproape de jobul ideal. Nu-ți pierde progresul! ⭐" },
        { title: "⭐ Nu pierde progresul!", body: "Ai muncit atât de mult. Continuă sesiunea de studiu de astăzi! ⭐" },
    ],
    milestone: {
        7: { title: "🌟 O săptămână!", body: "7 zile consecutive de învățare — excepțional! 🌟" },
        14: { title: "🌟 2 săptămâni!", body: "14 zile! Obiceiul tău este complet format. Continuă! ⭐" },
        30: { title: "🌟 O lună întreagă!", body: "30 de zile consecutive! Dedicarea ta este remarcabilă! 🌟" },
    }
};

const getRandomMessage = (category) => {
    const messages = NOTIFICATION_MESSAGES[category];
    if (!messages || !Array.isArray(messages)) return null;
    return messages[Math.floor(Math.random() * messages.length)];
};

export const useNotifications = (user, scheduleData) => {
    const [permissionGranted, setPermissionGranted] = useState(false);

    // Înregistrare canal de notificări Android & solicitare permisiuni
    useEffect(() => {
        const registerForNotifications = async () => {
            if (Platform.OS === 'web') return;

            try {
                // Verificare permisiuni curente
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                // Dacă nu avem permisiune, solicităm
                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus === 'granted') {
                    setPermissionGranted(true);
                } else {
                    setPermissionGranted(false);
                    return;
                }

                // Configurare canal specific pentru Android (necesar pentru prioritizare și sunet)
                if (Platform.OS === 'android') {
                    await Notifications.setNotificationChannelAsync('careermentor-reminders', {
                        name: 'Remindere Studiu CareerMentor',
                        importance: Notifications.AndroidImportance.MAX,
                        vibrationPattern: [0, 250, 250, 250],
                        lightColor: '#6366f1',
                    });
                }
            } catch (e) {
                console.error("Eroare la configurarea notificărilor native:", e);
            }
        };

        registerForNotifications();
    }, []);

    // Trimite o notificare instantă locală (Native Push)
    const sendNativePush = async (title, body) => {
        if (Platform.OS === 'web') {
            console.log(`[Notification WEB] ${title}: ${body}`);
            return;
        }

        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: true,
                    android: {
                        channelId: 'careermentor-reminders',
                    }
                },
                trigger: null, // Trimitere imediată
            });
        } catch (e) {
            console.error("Eroare trimitere push nativ:", e);
        }
    };

    // Funcție declanșată automat la conectare (după 5 secunde) pentru demo
    const sendLoginPushNotification = useCallback(async () => {
        if (Platform.OS === 'web') {
            console.log("Notificare login programată (Platformă Web)");
            return;
        }

        try {
            // Programăm notificarea fizică locală să se declanșeze peste 5 secunde
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "👋 Bine ai revenit pe CareerMentor!",
                    body: "Fiecare zi petrecută învățând te aduce mai aproape de jobul ideal! Continuă studiul activ! ⭐",
                    sound: true,
                    android: {
                        channelId: 'careermentor-reminders',
                    }
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: 5,
                },
            });
            console.log("Notificare login programată cu succes peste 5 secunde.");
        } catch (e) {
            console.error("Eroare programare login push:", e);
        }
    }, []);




    // Funcție pentru planificarea reminderului zilnic/consecvent bazat pe programul ales
    const scheduleLearningReminder = useCallback(async (hour, frequency) => {
        if (Platform.OS === 'web') return;

        try {
            // Curățăm toate notificările programate anterior pentru a nu crea duplicate
            await Notifications.cancelAllScheduledNotificationsAsync();

            const msg = getRandomMessage('reminder') || { title: "⏰ E timpul de învățare!", body: "Deschide aplicația și completează activitatea de azi!" };

            if (frequency === 'daily' || frequency === 'every_2_days' || frequency === 'every_3_days') {
                // Programăm reminderul zilnic (sau conform frecvenței selectate) la ora dorită
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: msg.title,
                        body: msg.body,
                        sound: true,
                        android: {
                            channelId: 'careermentor-reminders',
                        }
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DAILY,
                        hour: hour,
                        minute: 0,
                    },
                });
                console.log(`Programat reminder zilnic nativ la ora: ${hour}:00`);
            } else if (frequency === 'weekly') {
                // Programare săptămânală (în fiecare zi de Luni la ora dorită)
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: msg.title,
                        body: msg.body,
                        sound: true,
                        android: {
                            channelId: 'careermentor-reminders',
                        }
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                        weekday: 2, // Luni (1 = Duminică, 2 = Luni, etc.)
                        hour: hour,
                        minute: 0,
                    },
                });
                console.log(`Programat reminder săptămânal nativ luni la ora: ${hour}:00`);
            }
        } catch (e) {
            console.error("Eroare la planificarea reminderului nativ:", e);
        }
    }, []);

    const sendStreakMilestoneNotification = useCallback(async (streak) => {
        const milestone = NOTIFICATION_MESSAGES.milestone[streak];
        if (milestone) {
            await sendNativePush(milestone.title, milestone.body);
        }
    }, []);

    const sendStreakWarningNotification = useCallback(async () => {
        const msg = getRandomMessage('streakWarning');
        if (msg) {
            await sendNativePush(msg.title, msg.body);
        }
    }, []);

    // Sincronizare automată când se schimbă programul din baza de date
    useEffect(() => {
        if (scheduleData && scheduleData.isActive && scheduleData.reminderHour !== undefined) {
            scheduleLearningReminder(scheduleData.reminderHour, scheduleData.frequency);
        }
    }, [scheduleData, scheduleLearningReminder]);

    return {
        permissionGranted,
        sendStreakMilestoneNotification,
        sendStreakWarningNotification,
        sendLoginPushNotification,
        scheduleLearningReminder
    };
};

export default useNotifications;
