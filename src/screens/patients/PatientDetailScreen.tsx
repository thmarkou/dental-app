/**
 * Patient Detail Screen
 * View and manage patient information
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {Patient} from '../../types/patient';
import {getPatientById, deletePatient} from '../../services/patient';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const PatientDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {patientId} = route.params;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  // Refresh when screen gains focus (e.g., after editing)
  useFocusEffect(
    React.useCallback(() => {
      loadPatient();
    }, [patientId]),
  );

  const loadPatient = async () => {
    try {
      setLoading(true);
      const patientData = await getPatientById(patientId);
      if (!patientData) {
        Alert.alert('Error', 'Patient not found', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
        return;
      }
      setPatient(patientData);
    } catch (error) {
      console.error('Error loading patient:', error);
      Alert.alert('Error', 'Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('AddEditPatient', {mode: 'edit', patientId});
  };

  const handleDelete = () => {
    if (!patient) return;

    Alert.alert(
      'Delete Patient',
      `Are you sure you want to delete ${patient.firstName} ${patient.lastName}? This action cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePatient(patientId);
              Alert.alert('Success', 'Patient deleted successfully', [
                {text: 'OK', onPress: () => navigation.goBack()},
              ]);
            } catch (error) {
              console.error('Error deleting patient:', error);
              Alert.alert('Error', 'Failed to delete patient. Please try again.');
            }
          },
        },
      ],
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading patient data...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="error-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Patient not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </View>
    );
  }

  const age = calculateAge(patient.dateOfBirth);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              {patient.photoUri ? (
                <Image source={{uri: patient.photoUri}} style={styles.avatarImage} />
              ) : (
                <MaterialIcons name="person" size={48} color="#007AFF" />
              )}
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.patientName}>
                {patient.firstName} {patient.lastName}
              </Text>
              <Text style={styles.patientDetails}>
                {age} years old • {patient.gender || 'N/A'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Personal Information */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Birth</Text>
            <Text style={styles.infoValue}>{formatDate(patient.dateOfBirth)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>
              {patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'N/A'}
            </Text>
          </View>

          {patient.amka && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>AMKA</Text>
              <Text style={styles.infoValue}>{patient.amka}</Text>
            </View>
          )}

          {patient.occupation && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Occupation</Text>
              <Text style={styles.infoValue}>{patient.occupation}</Text>
            </View>
          )}
        </Card>

        {/* Contact Information */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color="#007AFF" />
            <Text style={[styles.infoValue, styles.contactValue]}>
              {patient.phone}
            </Text>
          </View>

          {patient.email && (
            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={20} color="#007AFF" />
              <Text style={[styles.infoValue, styles.contactValue]}>
                {patient.email}
              </Text>
            </View>
          )}

          {patient.address && (
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={20} color="#007AFF" />
              <View style={styles.addressContainer}>
                <Text style={[styles.infoValue, styles.contactValue]}>
                  {patient.address.street}
                </Text>
                <Text style={[styles.infoValue, styles.contactValue]}>
                  {patient.address.city}, {patient.address.postalCode}
                </Text>
                <Text style={[styles.infoValue, styles.contactValue]}>
                  {patient.address.country}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Emergency Contact */}
        {patient.emergencyContact && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>
                {patient.emergencyContact.name}
              </Text>
            </View>

            {patient.emergencyContact.relationship && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Relationship</Text>
                <Text style={styles.infoValue}>
                  {patient.emergencyContact.relationship}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={20} color="#007AFF" />
              <Text style={[styles.infoValue, styles.contactValue]}>
                {patient.emergencyContact.phone}
              </Text>
            </View>
          </Card>
        )}

        {/* Metadata */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Record Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>
              {formatDate(patient.createdAt)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>
              {formatDate(patient.updatedAt)}
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Edit Patient"
            onPress={handleEdit}
            variant="primary"
            style={styles.editButton}
          />
          <Button
            title="Delete Patient"
            onPress={handleDelete}
            variant="danger"
            style={styles.deleteButton}
          />
        </View>
      </ScrollView>
    </View>
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
  errorText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
  },
  backButton: {
    marginTop: 24,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  headerInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 16,
    color: '#666666',
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    width: 120,
    marginRight: 12,
  },
  infoValue: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  contactValue: {
    marginLeft: 8,
  },
  addressContainer: {
    flex: 1,
    marginLeft: 8,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
    gap: 12,
  },
  editButton: {
    marginBottom: 0,
  },
  deleteButton: {
    marginBottom: 0,
  },
});

export default PatientDetailScreen;

