import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import {
  AllergenScreen,
  NotificationsScreen,
  StationScreen,
  SummaryScreen,
  WelcomeScreen,
} from '../screens/OnboardingScreen';
import { UserAllergyProfile } from '../services/pollenData/pollenDataTypes';

export type OnboardingStackParamList = {
  Welcome: undefined;
  Allergens: { draft: UserAllergyProfile };
  Station: { draft: UserAllergyProfile };
  Notifications: { draft: UserAllergyProfile };
  Summary: { profile: UserAllergyProfile };
  Done: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const IS_WEB = Platform.OS === 'web';

export function OnboardingNavigator({ onComplete }: { onComplete: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Allergens" component={AllergenScreen} />
      <Stack.Screen name="Station" component={StationScreen} />
      {!IS_WEB && (
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      )}
      <Stack.Screen name="Summary" component={SummaryScreen} />
      <Stack.Screen
        name="Done"
        component={() => {
          onComplete();
          return null;
        }}
      />
    </Stack.Navigator>
  );
}