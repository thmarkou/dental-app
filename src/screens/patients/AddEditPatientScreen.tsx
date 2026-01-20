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
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [amka, setAmka] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState('');
  const [photoUri, setPhotoUri] = useState('');

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
        Alert.alert('Error', 'Patient not found');
        navigation.goBack();
        return;
      }

      // Populate form fields
      setFirstName(patient.firstName);
      setLastName(patient.lastName);
      // Format date as DD-MM-YYYY for display
      const dob = patient.dateOfBirth;
      const day = String(dob.getDate()).padStart(2, '0');
      const month = String(dob.getMonth() + 1).padStart(2, '0');
      const year = dob.getFullYear();
      setDateOfBirth(`${day}-${month}-${year}`);
      setGender(patient.gender || '');
      setAmka(patient.amka || '');
      setPhone(patient.phone);
      setEmail(patient.email || '');
      setOccupation(patient.occupation || '');
      setPhotoUri(patient.photoUri || '');

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
      Alert.alert('Error', 'Failed to load patient data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library access is needed to select a patient photo.');
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
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUri('');
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      // Validate DD-MM-YYYY format
      const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
      if (!dateRegex.test(dateOfBirth)) {
        newErrors.dateOfBirth = 'Date must be in DD-MM-YYYY format';
      } else {
        const [day, month, year] = dateOfBirth.split('-').map(Number);
        const dob = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        
        // Validate date is valid
        if (
          dob.getDate() !== day ||
          dob.getMonth() !== month - 1 ||
          dob.getFullYear() !== year
        ) {
          newErrors.dateOfBirth = 'Invalid date';
        } else if (dob > today) {
          newErrors.dateOfBirth = 'Date of birth cannot be in the future';
        }
      }
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    try {
      setSaving(true);

      // Parse DD-MM-YYYY format
      const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
      if (!dateRegex.test(dateOfBirth)) {
        Alert.alert('Validation Error', 'Date must be in DD-MM-YYYY format');
        return;
      }
      
      const [day, month, year] = dateOfBirth.split('-').map(Number);
      const dobDate = new Date(year, month - 1, day);
      
      // Validate date is valid
      if (
        isNaN(dobDate.getTime()) ||
        dobDate.getDate() !== day ||
        dobDate.getMonth() !== month - 1 ||
        dobDate.getFullYear() !== year
      ) {
        Alert.alert('Validation Error', 'Invalid date');
        return;
      }

      // Ensure gender is valid or undefined
      const genderValue = gender && 
        ['male', 'female', 'other'].includes(gender)
        ? (gender as 'male' | 'female' | 'other')
        : undefined;

      const patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dobDate,
        gender: genderValue,
        amka: amka.trim() || undefined,
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
        Alert.alert('Success', 'Patient created successfully', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        await updatePatient(patientId, patientData);
        Alert.alert('Success', 'Patient updated successfully', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      }
    } catch (error: any) {
      console.error('Error saving patient:', error);
      const errorMessage = error?.message || 
        `Failed to ${mode === 'add' ? 'create' : 'update'} patient. Please try again.`;
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading patient data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
                title={photoUri ? 'Change Photo' : 'Add Photo'}
                onPress={handlePickPhoto}
                variant="outline"
                style={styles.photoButton}
              />
              {photoUri ? (
                <TouchableOpacity onPress={handleRemovePhoto} style={styles.removePhotoButton}>
                  <Text style={styles.removePhotoText}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <Input
            label="First Name *"
            value={firstName}
            onChangeText={setFirstName}
            error={errors.firstName}
            placeholder="Enter first name"
          />

          <Input
            label="Last Name *"
            value={lastName}
            onChangeText={setLastName}
            error={errors.lastName}
            placeholder="Enter last name"
          />

          <Input
            label="Date of Birth *"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            error={errors.dateOfBirth}
            placeholder="DD-MM-YYYY"
          />

          <View style={styles.genderContainer}>
            <Text style={styles.label}>Gender</Text>
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
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="AMKA"
            value={amka}
            onChangeText={setAmka}
            placeholder="Enter AMKA"
            keyboardType="numeric"
          />

          <Input
            label="Phone *"
            value={phone}
            onChangeText={setPhone}
            error={errors.phone}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Occupation"
            value={occupation}
            onChangeText={setOccupation}
            placeholder="Enter occupation"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Address</Text>

          <Input
            label="Street"
            value={addressStreet}
            onChangeText={setAddressStreet}
            placeholder="Enter street address"
          />

          <Input
            label="City"
            value={addressCity}
            onChangeText={setAddressCity}
            placeholder="Enter city"
          />

          <Input
            label="Postal Code"
            value={addressPostalCode}
            onChangeText={setAddressPostalCode}
            placeholder="Enter postal code"
            keyboardType="numeric"
          />

          <Input
            label="Country"
            value={addressCountry}
            onChangeText={setAddressCountry}
            placeholder="Enter country"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>

          <Input
            label="Name"
            value={emergencyContactName}
            onChangeText={setEmergencyContactName}
            placeholder="Enter emergency contact name"
          />

          <Input
            label="Relationship"
            value={emergencyContactRelationship}
            onChangeText={setEmergencyContactRelationship}
            placeholder="e.g., Spouse, Parent, etc."
          />

          <Input
            label="Phone"
            value={emergencyContactPhone}
            onChangeText={setEmergencyContactPhone}
            placeholder="Enter emergency contact phone"
            keyboardType="phone-pad"
          />
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title={mode === 'add' ? 'Create Patient' : 'Update Patient'}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
});

export default AddEditPatientScreen;

