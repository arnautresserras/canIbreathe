import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { OnboardingNavigator } from './OnboardingNavigator';
import { UserAllergyProfile } from '../services/pollenData/pollenDataTypes';
import { loadProfile } from '../storage/profileStorage';
import { debugNotifications, scheduleDailyNotification } from '../services/notificationService';
import MainScreen from '../screens/MainScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<UserAllergyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileKey, setProfileKey] = useState(0);

  useEffect(() => {
    loadProfile().then((p) => {
      setProfile(p);
      setLoading(false);
      // Schedule on launch if onboarding is already complete
      if (p?.onboardingComplete) {
        scheduleDailyNotification(p, i18n.language);
      }
    });
  }, []);

  function handleSave(updated: UserAllergyProfile) {
    setProfile(updated);
    setProfileKey((k) => k + 1);
    // Reschedule with updated settings and current language
    scheduleDailyNotification(updated, i18n.language);
  }

  function handleReset() {
    setProfile(null);
    setProfileKey((k) => k + 1);
  }

  function handleOnboardingComplete() {
    loadProfile().then((p) => {
      setProfile(p);
      setProfileKey((k) => k + 1);
      if (p?.onboardingComplete) {
        scheduleDailyNotification(p, i18n.language);
      }
    });
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAF8' }}>
        <ActivityIndicator color="#2E7D32" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!profile?.onboardingComplete ? (
        <OnboardingNavigator onComplete={handleOnboardingComplete} />
      ) : (
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
            options={{
              tabBarLabel: t('nav.today'),
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🌿</Text>,
            }}
          >
            {() => <MainScreen key={profileKey} profile={profile} />}
          </Tab.Screen>

          <Tab.Screen
            name="Settings"
            options={{
              tabBarLabel: t('nav.settings'),
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
            }}
          >
            {() => (
              <SettingsScreen
                onSave={handleSave}
                onResetOnboarding={handleReset}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      )}
    </NavigationContainer>
  );
}