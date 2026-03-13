import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserAllergyProfile, DEFAULT_PROFILE } from '../services/pollenData/pollenDataTypes';

const PROFILE_KEY = 'user_allergy_profile';

export async function loadProfile(): Promise<UserAllergyProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    // Merge with defaults so new fields added in future updates are handled
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveProfile(profile: UserAllergyProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('[profileStorage] Failed to save profile:', e);
  }
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_KEY);
}