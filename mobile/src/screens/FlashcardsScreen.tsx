import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FlashcardsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-6">
        <Text className="font-display text-3xl text-foreground mb-2">Flashcards</Text>
        <Text className="text-muted-foreground mb-6">
          Placeholder — build via mobile-implementation/12-message-log/INBOX.md
        </Text>
        <View className="rounded-2xl bg-card p-4 border border-border">
          <Text className="text-card-foreground">
            Connections spec: mobile-implementation/09-connections/*-Flashcards-connections.md
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
