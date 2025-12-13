/**
 * Settings Screen
 * App settings and user management
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useAuthStore} from '../../store/auth.store';
import {useLanguageStore, Language} from '../../store/language.store';

const SettingsScreen = () => {
  const {t} = useTranslation();
  const {logout, user} = useAuthStore();
  const {language, setLanguage} = useLanguageStore();

  const handleLogout = () => {
    Alert.alert(t('common.logout'), t('settings.confirmLogout'), [
      {text: t('common.cancel'), style: 'cancel'},
      {
        text: t('common.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.profile')}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('settings.name')}:</Text>
          <Text style={styles.value}>
            {user?.firstName} {user?.lastName}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('settings.email')}:</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>{t('settings.role')}:</Text>
          <Text style={styles.value}>{user?.role}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.languageRow}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              language === 'en' && styles.languageButtonActive,
            ]}
            onPress={() => handleLanguageChange('en')}>
            <Text
              style={[
                styles.languageButtonText,
                language === 'en' && styles.languageButtonTextActive,
              ]}>
              {t('settings.english')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.languageButton,
              language === 'el' && styles.languageButtonActive,
            ]}
            onPress={() => handleLanguageChange('el')}>
            <Text
              style={[
                styles.languageButtonText,
                language === 'el' && styles.languageButtonTextActive,
              ]}>
              {t('settings.greek')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>{t('common.logout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#000000',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666666',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  languageButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dddddd',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  languageButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  languageButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  languageButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default SettingsScreen;

