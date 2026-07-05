import { Stack } from 'expo-router';
import { AuthProvider } from '../src/stores/useAuth';
import '../global.css';
import { LogBox } from 'react-native';

// Ignorăm avertismentele legate de push-ul nativ pe Expo Go (deoarece folosim doar notificări locale)
LogBox.ignoreLogs([
    'expo-notifications: Android Push notifications',
    'Android Push notifications (remote notifications)',
    'warnOfExpoGoPushUsage'
]);


export default function RootLayout() {
    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="register" />
                <Stack.Screen name="(tabs)" />
            </Stack>
        </AuthProvider>
    );
}

