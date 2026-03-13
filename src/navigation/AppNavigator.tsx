import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { OnboardingNavigator } from './OnboardingNavigator';
import { UserAllergyProfile } from '../services/pollenData/pollenDataTypes';
import { loadProfile } from '../storage/profileStorage';
import MainScreen from '../screens/MainScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  const [profile, setProfile] = useState<UserAllergyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile().then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAF8' }}>
        <ActivityIndicator color="#2E7D32" />
      </View>
    );
  }

  // ── Onboarding not complete → show onboarding flow
  if (!profile?.onboardingComplete) {
    return (
      <NavigationContainer>
        <OnboardingNavigator
          onComplete={() => loadProfile().then(setProfile)}
        />
      </NavigationContainer>
    );
  }

  // ── Main app with tab navigation
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2E7D32',
          tabBarInactiveTintColor: '#aaa',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#F0F0F0',
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Today"
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🌿</Text> }}
        >
          {() => <MainScreen profile={profile} />}
        </Tab.Screen>

        <Tab.Screen
          name="Settings"
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text> }}
        >
          {() => (
            <SettingsScreen
              onSave={(updated) => setProfile(updated)}
              onResetOnboarding={() => {
                setProfile(null);
              }}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}