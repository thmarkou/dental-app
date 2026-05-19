/**
 * Add/Edit Patient Screen
 * Form for adding or editing patient information
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {Patient} from '../../types/patient';
import {
  createPatient,
  getPatientById,
  updatePatient,
} from '../../services/patient';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {DatePickerField} from '../../components/common/DatePickerField';
import {el} from '../../i18n';

const genderLabel = (g: 'male' | 'female' | 'other') => {
  if (g === 'male') return el.patients.male;
  if (g === 'female') return el.patients.female;
  return el.patients.otherGender;
};

function defaultDateOfBirth(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  d.setHours(12, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const t = new Date();
  t.setHours(23, 59, 59, 999);
  return t;
}

const AddEditPatientScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {mode, patientId} = route.params;

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dobDate, setDobDate] = useState<Date>(() => defaultDateOfBirth());
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [amka, setAmka] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [afm, setAfm] = useState('');
  const [doy, setDoy] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [gdprConsentDate, setGdprConsentDate] = useState<Date | null>(null);

  // Address fields
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressPostalCode, setAddressPostalCode] = useState('');
  const [addressCountry, setAddressCountry] = useState('Greece');

  // Emergency contact fields
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] =
    useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Load patient data for edit mode
  useEffect(() => {
    if (mode === 'edit' && patientId) {
      loadPatient();
    }
  }, [mode, patientId]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      const patient = await getPatientById(patientId);
      if (!patient) {
        Alert.alert(el.common.error, el.patients.patientNotFound);
        navigation.goBack();
        return;
      }

      // Populate form fields
      setFirstName(patient.firstName);
      setLastName(patient.lastName);
      setDobDate(patient.dateOfBirth);
      setGender(patient.gender || '');
      setAmka(patient.amka || '');
      setPhone(patient.phone);
      setEmail(patient.email || '');
      setOccupation(patient.occupation || '');
      setPhotoUri(patient.photoUri || '');
      setAfm(patient.afm ?? '');
      setDoy(patient.doy ?? '');
      setGdprConsent(patient.gdprConsent === true);
      setGdprConsentDate(patient.gdprDate ?? null);

      if (patient.address) {
        setAddressStreet(patient.address.street);
        setAddressCity(patient.address.city);
        setAddressPostalCode(patient.address.postalCode);
        setAddressCountry(patient.address.country);
      }

      if (patient.emergencyContact) {
        setEmergencyContactName(patient.emergencyContact.name);
        setEmergencyContactRelationship(patient.emergencyContact.relationship);
        setEmergencyContactPhone(patient.emergencyContact.phone);
      }
    } catch (error) {
      console.error('Error loading patient:', error);
      Alert.alert(el.common.error, el.patients.loadPatientFailed);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(el.common.error, el.patients.photoPermission);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert(el.common.error, el.patients.photoPickFailed);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUri('');
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = el.patients.firstNameRequired;
    }

    if (!lastName.trim()) {
      newErrors.lastName = el.patients.lastNameRequired;
    }

    if (dobDate > endOfToday()) {
      newErrors.dateOfBirth = el.patients.dobFuture;
    }

    if (!phone.trim()) {
      newErrors.phone = el.patients.phoneRequired;
    } else if (!/^[0-9+\-\s()]+$/.test(phone)) {
      newErrors.phone = el.patients.phoneInvalid;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = el.patients.emailInvalid;
    }

    const afmTrim = afm.trim();
    if (afmTrim && !/^\d{9}$/.test(afmTrim)) {
      newErrors.afm = el.patients.afmInvalid;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert(el.appointments.validationErrorTitle, el.appointments.validationError);
      return;
    }

    try {
      setSaving(true);

      // Ensure gender is valid or undefined
      const genderValue = gender && 
        ['male', 'female', 'other'].includes(gender)
        ? (gender as 'male' | 'female' | 'other')
        : undefined;

      const patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: new Date(
          dobDate.getFullYear(),
          dobDate.getMonth(),
          dobDate.getDate(),
        ),
        gender: genderValue ?? 'other',
        amka: amka.trim() || undefined,
        afm: afm.trim() || undefined,
        doy: doy.trim() || undefined,
        gdprConsent,
        gdprDate: gdprConsent ? (gdprConsentDate ?? new Date()) : null,
        phone: phone.trim(),
        email: email.trim() || undefined,
        occupation: occupation.trim() || undefined,
        photoUri: photoUri.trim() || undefined,
        address:
          addressStreet.trim() || addressCity.trim()
            ? {
                street: addressStreet.trim(),
                city: addressCity.trim(),
                postalCode: addressPostalCode.trim(),
                country: addressCountry,
              }
            : undefined,
        emergencyContact:
          emergencyContactName.trim() || emergencyContactPhone.trim()
            ? {
                name: emergencyContactName.trim(),
                relationship: emergencyContactRelationship.trim(),
                phone: emergencyContactPhone.trim(),
              }
            : undefined,
      };

      if (mode === 'add') {
        await createPatient(patientData);
        Alert.alert(el.common.success, el.patients.createSuccess, [
          {text: el.common.ok, onPress: () => navigation.goBack()},
        ]);
      } else {
        await updatePatient(patientId, patientData);
        Alert.alert(el.common.success, el.patients.updateSuccess, [
          {text: el.common.ok, onPress: () => navigation.goBack()},
        ]);
      }
    } catch (error: unknown) {
      console.error('Error saving patient:', error);
      const errorMessage =
        error instanceof Error && error.message ? error.message : el.patients.saveFailed;
      Alert.alert(el.common.error, errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenSafeArea variant="content">
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{el.patients.formLoading}</Text>
      </View>
      </ScreenSafeArea>
    );
  }

  return (
    <ScreenSafeArea variant="content">
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <View style={styles.photoSection}>
            <View style={styles.photoContainer}>
              {photoUri ? (
                <Image source={{uri: photoUri}} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <MaterialIcons name="person" size={40} color="#8E8E93" />
                </View>
              )}
            </View>
            <View style={styles.photoActions}>
              <Button
                title={photoUri ? el.patients.changePhoto : el.patients.addPhoto}
                onPress={handlePickPhoto}
                variant="outline"
                style={styles.photoButton}
              />
              {photoUri ? (
                <TouchableOpacity onPress={handleRemovePhoto} style={styles.removePhotoButton}>
                  <Text style={styles.removePhotoText}>{el.patients.removePhoto}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <Text style={styles.sectionTitle}>{el.patients.personalInformation}</Text>

          <Input
            label={`${el.auth.firstName} *`}
            value={firstName}
            onChangeText={setFirstName}
            error={errors.firstName}
            placeholder={el.auth.enterFirstName}
          />

          <Input
            label={`${el.auth.lastName} *`}
            value={lastName}
            onChangeText={setLastName}
            error={errors.lastName}
            placeholder={el.auth.enterLastName}
          />

          <DatePickerField
            label={`${el.patients.dob} *`}
            value={dobDate}
            onChange={setDobDate}
            error={errors.dateOfBirth}
            maximumDate={endOfToday()}
            minimumDate={new Date(1900, 0, 1)}
          />

          <View style={styles.genderContainer}>
            <Text style={styles.label}>{el.patients.gender}</Text>
            <View style={styles.genderOptions}>
              {(['male', 'female', 'other'] as const).map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.genderOption,
                    gender === option && styles.genderOptionSelected,
                  ]}
                  onPress={() => setGender(option)}>
                  <Text
                    style={[
                      styles.genderOptionText,
                      gender === option && styles.genderOptionTextSelected,
                    ]}>
                    {genderLabel(option)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label={el.patients.amka}
            value={amka}
            onChangeText={setAmka}
            placeholder={el.patients.amka}
            keyboardType="numeric"
          />

          <Input
            label={`${el.patients.afm} (9 ψηφία)`}
            value={afm}
            onChangeText={(t) => setAfm(t.replace(/\D/g, '').slice(0, 9))}
            error={errors.afm}
            placeholder="123456789"
            keyboardType="number-pad"
            maxLength={9}
          />

          <Input
            label={el.patients.taxOffice}
            value={doy}
            onChangeText={setDoy}
            placeholder={el.patients.taxOfficePlaceholder}
            autoCapitalize="characters"
          />

          <Input
            label={`${el.patients.phone} *`}
            value={phone}
            onChangeText={setPhone}
            error={errors.phone}
            placeholder={el.patients.phone}
            keyboardType="phone-pad"
          />

          <Input
            label={el.patients.email}
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            placeholder={el.auth.enterEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label={el.patients.occupation}
            value={occupation}
            onChangeText={setOccupation}
            placeholder={el.patients.occupationPlaceholder}
          />

          <View style={styles.gdprRow}>
            <View style={styles.gdprTextCol}>
              <Text style={styles.label}>{el.patients.gdprConsent}</Text>
              <Text style={styles.gdprHint}>{el.patients.gdprFormHint}</Text>
            </View>
            <Switch
              value={gdprConsent}
              onValueChange={(v) => {
                setGdprConsent(v);
                if (v && gdprConsentDate == null) {
                  setGdprConsentDate(new Date());
                }
                if (!v) {
                  setGdprConsentDate(null);
                }
              }}
              trackColor={{false: '#cbd5e1', true: '#93c5fd'}}
              thumbColor={gdprConsent ? '#1d4ed8' : '#f1f5f9'}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{el.patients.address}</Text>

          <Input
            label={el.patients.street}
            value={addressStreet}
            onChangeText={setAddressStreet}
            placeholder="Enter street address"
          />

          <Input
            label={el.patients.city}
            value={addressCity}
            onChangeText={setAddressCity}
            placeholder="Enter city"
          />

          <Input
            label={el.patients.postalCode}
            value={addressPostalCode}
            onChangeText={setAddressPostalCode}
            placeholder="Enter postal code"
            keyboardType="numeric"
          />

          <Input
            label={el.patients.country}
            value={addressCountry}
            onChangeText={setAddressCountry}
            placeholder="Enter country"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{el.patients.emergencyContactSection}</Text>

          <Input
            label={el.patients.emergencyName}
            value={emergencyContactName}
            onChangeText={setEmergencyContactName}
            placeholder="Enter emergency contact name"
          />

          <Input
            label={el.patients.relationship}
            value={emergencyContactRelationship}
            onChangeText={setEmergencyContactRelationship}
            placeholder="e.g., Spouse, Parent, etc."
          />

          <Input
            label={el.patients.emergencyPhone}
            value={emergencyContactPhone}
            onChangeText={setEmergencyContactPhone}
            placeholder="Enter emergency contact phone"
            keyboardType="phone-pad"
          />
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title={mode === 'add' ? el.patients.createPatient : el.patients.updatePatient}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </ScreenSafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  card: {
    marginBottom: 16,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  photoActions: {
    alignItems: 'center',
  },
  photoButton: {
    minWidth: 140,
  },
  removePhotoButton: {
    marginTop: 8,
  },
  removePhotoText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000000',
  },
  genderContainer: {
    marginBottom: 15,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  genderOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#666666',
  },
  genderOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  gdprRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  gdprTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  gdprHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
    lineHeight: 18,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
});

export default AddEditPatientScreen;

