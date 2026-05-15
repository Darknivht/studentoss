# 01 — React Navigation Setup

```bash
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
```

## RootNavigator

```tsx
// src/navigation/RootNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/hooks/useAuth';
import MainTabs from './MainTabs';
import Auth from '@/screens/Auth';
import Onboarding from '@/screens/Onboarding';
import CoursePage from '@/screens/CoursePage';
import AITutor from '@/screens/AITutor';
import Chat from '@/screens/Chat';
import GroupChat from '@/screens/GroupChat';
import Flashcards from '@/screens/Flashcards';
import Quizzes from '@/screens/Quizzes';
import ExamPrep from '@/screens/ExamPrep';
import Focus from '@/screens/Focus';
import FocusSession from '@/screens/FocusSession';
import Achievements from '@/screens/Achievements';
import Profile from '@/screens/Profile';
import Upgrade from '@/screens/Upgrade';
import Safety from '@/screens/Safety';
import SmartNotes from '@/screens/SmartNotes';
import ResetPassword from '@/screens/ResetPassword';
import OAuthCallback from '@/screens/OAuthCallback';
import Privacy from '@/screens/Privacy';
import Terms from '@/screens/Terms';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, profile, loading } = useAuth();
  if (loading) return null; // splash held

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={Auth} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />
        <Stack.Screen name="OAuthCallback" component={OAuthCallback} />
        <Stack.Screen name="Privacy" component={Privacy} />
        <Stack.Screen name="Terms" component={Terms} />
      </Stack.Navigator>
    );
  }

  if (!profile?.grade_level) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={Onboarding} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="SmartNotes" component={SmartNotes} />
      <Stack.Screen name="CoursePage" component={CoursePage} />
      <Stack.Screen name="AITutor" component={AITutor} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Chat" component={Chat} />
      <Stack.Screen name="GroupChat" component={GroupChat} />
      <Stack.Screen name="Flashcards" component={Flashcards} />
      <Stack.Screen name="Quizzes" component={Quizzes} />
      <Stack.Screen name="ExamPrep" component={ExamPrep} />
      <Stack.Screen name="Focus" component={Focus} />
      <Stack.Screen name="FocusSession" component={FocusSession} />
      <Stack.Screen name="Achievements" component={Achievements} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Upgrade" component={Upgrade} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Safety" component={Safety} />
    </Stack.Navigator>
  );
}
```

## App.tsx

```tsx
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { linking } from './src/navigation/linking';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationContainer linking={linking}>
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

## Acceptance

- [ ] No-user → Auth shown
- [ ] User without `grade_level` → Onboarding shown
- [ ] Authed user with profile → MainTabs shown
- [ ] Push transitions are smooth
