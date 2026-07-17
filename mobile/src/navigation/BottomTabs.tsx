import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, BookOpen, Users, User, Target } from "lucide-react-native";
import DashboardScreen from "../screens/DashboardScreen";
import StudyScreen from "../screens/StudyScreen";
import SocialScreen from "../screens/SocialScreen";
import FocusScreen from "../screens/FocusScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PlanScreen from "../screens/PlanScreen";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "hsl(262 83% 58%)",
        tabBarInactiveTintColor: "hsl(240 4% 46%)",
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 8,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size }) => {
          const Icon =
            route.name === "Dashboard"
              ? Home
              : route.name === "Study"
              ? BookOpen
              : route.name === "Social"
              ? Users
              : route.name === "Focus"
              ? Target
              : User;
          return <Icon color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Study" component={StudyScreen} />
      <Tab.Screen name="Plan" component={PlanScreen} />
      <Tab.Screen name="Social" component={SocialScreen} />
      <Tab.Screen name="Focus" component={FocusScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
