/**
 * Expo push token registration (phase 4.2a).
 * Sending notifications still requires a backend or Expo Push API (phase 4.2b).
 */

import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import {isRemotePushFeatureEnabled} from '../../../config/env.config';

const STORAGE_KEY = 'expo_push_token';

export interface PushTokenStatus {
  registered: boolean;
  tokenPreview: string | null;
  reason: 'disabled' | 'web' | 'no_project_id' | 'permission_denied' | 'ok' | 'error';
  errorMessage?: string;
}

function resolveExpoProjectId(): string | null {
  const id = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof id !== 'string' || !id.trim() || id === 'your-project-id') {
    return null;
  }
  return id.trim();
}

export async function getStoredExpoPushToken(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw?.trim() ? raw : null;
}

export async function registerExpoPushTokenOnLaunch(): Promise<PushTokenStatus> {
  if (!isRemotePushFeatureEnabled()) {
    return {registered: false, tokenPreview: null, reason: 'disabled'};
  }
  if (Platform.OS === 'web') {
    return {registered: false, tokenPreview: null, reason: 'web'};
  }

  const projectId = resolveExpoProjectId();
  if (!projectId) {
    return {registered: false, tokenPreview: null, reason: 'no_project_id'};
  }

  try {
    const {status: existing} = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      final = req.status;
    }
    if (final !== 'granted') {
      return {registered: false, tokenPreview: null, reason: 'permission_denied'};
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({projectId})
    ).data;
    await AsyncStorage.setItem(STORAGE_KEY, token);
    const preview =
      token.length > 12 ? `…${token.slice(-12)}` : token;
    return {registered: true, tokenPreview: preview, reason: 'ok'};
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Push token registration failed';
    return {
      registered: false,
      tokenPreview: null,
      reason: 'error',
      errorMessage: msg,
    };
  }
}

export async function getPushTokenStatus(): Promise<PushTokenStatus> {
  if (!isRemotePushFeatureEnabled()) {
    return {registered: false, tokenPreview: null, reason: 'disabled'};
  }
  const stored = await getStoredExpoPushToken();
  if (stored) {
    const preview =
      stored.length > 12 ? `…${stored.slice(-12)}` : stored;
    return {registered: true, tokenPreview: preview, reason: 'ok'};
  }
  return registerExpoPushTokenOnLaunch();
}
