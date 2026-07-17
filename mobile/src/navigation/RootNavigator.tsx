import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomTabs from "./BottomTabs";
import AuthScreen from "../screens/AuthScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import SmartNotesScreen from "../screens/SmartNotesScreen";
import CoursePageScreen from "../screens/CoursePageScreen";
import AITutorScreen from "../screens/AITutorScreen";
import FlashcardsScreen from "../screens/FlashcardsScreen";
import QuizzesScreen from "../screens/QuizzesScreen";
import ExamPrepScreen from "../screens/ExamPrepScreen";
import ChatScreen from "../screens/ChatScreen";
import GroupChatScreen from "../screens/GroupChatScreen";
import StoreScreen from "../screens/StoreScreen";
import CareerScreen from "../screens/CareerScreen";
import FocusSessionScreen from "../screens/FocusSessionScreen";
import SafetyScreen from "../screens/SafetyScreen";
import AchievementsScreen from "../screens/AchievementsScreen";
import UpgradeScreen from "../screens/UpgradeScreen";
import SettingsScreen from "../screens/SettingsScreen";
import PrivacyScreen from "../screens/PrivacyScreen";
import TermsScreen from "../screens/TermsScreen";
import NotFoundScreen from "../screens/NotFoundScreen";
import AdminResourcesScreen from "../screens/AdminResourcesScreen";

export type RootStackParamList = {
  Auth: undefined;
  ResetPassword: undefined;
  Onboarding: undefined;
  Tabs: undefined;
  SmartNotes: undefined;
  CoursePage: { courseId: string };
  AITutor: undefined;
  Flashcards: { deckId?: string };
  Quizzes: undefined;
  ExamPrep: undefined;
  Chat: { chatId?: string };
  GroupChat: { groupId: string };
  Store: undefined;
  Career: undefined;
  FocusSession: undefined;
  Safety: undefined;
  Achievements: undefined;
  Upgrade: undefined;
  Settings: undefined;
  Privacy: undefined;
  Terms: undefined;
  NotFound: undefined;
  AdminResources: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Tabs" component={BottomTabs} />
      <Stack.Screen name="SmartNotes" component={SmartNotesScreen} />
      <Stack.Screen name="CoursePage" component={CoursePageScreen} />
      <Stack.Screen name="AITutor" component={AITutorScreen} />
      <Stack.Screen name="Flashcards" component={FlashcardsScreen} />
      <Stack.Screen name="Quizzes" component={QuizzesScreen} />
      <Stack.Screen name="ExamPrep" component={ExamPrepScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
      <Stack.Screen name="Store" component={StoreScreen} />
      <Stack.Screen name="Career" component={CareerScreen} />
      <Stack.Screen name="FocusSession" component={FocusSessionScreen} />
      <Stack.Screen name="Safety" component={SafetyScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="Upgrade" component={UpgradeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} />
      <Stack.Screen name="AdminResources" component={AdminResourcesScreen} />
    </Stack.Navigator>
  );
}
