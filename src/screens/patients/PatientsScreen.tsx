/**
 * Patients Screen
 * Patient list and management
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {Patient} from '../../types/patient';
import {getAllPatients, searchPatients, deletePatient} from '../../services/patient';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const PatientsScreen = () => {
  const navigation = useNavigation<any>();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);

  // Load patients
  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      let result: Patient[];
      
      if (searchQuery.trim()) {
        result = await searchPatients(searchQuery.trim(), 100);
        setSearchMode(true);
      } else {
        result = await getAllPatients(100);
        setSearchMode(false);
      }
      
      setPatients(result);
    } catch (error) {
      console.error('Error loading patients:', error);
      Alert.alert('Error', 'Failed to load patients. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  // Initial load
  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Refresh when screen gains focus (e.g., after adding a patient)
  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [loadPatients]),
  );

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPatients();
  }, [loadPatients]);

  // Handle search
  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  // Handle patient press
  const handlePatientPress = useCallback((patient: Patient) => {
    navigation.navigate('PatientDetail', {patientId: patient.id});
  }, [navigation]);

  // Handle add patient
  const handleAddPatient = useCallback(() => {
    navigation.navigate('AddEditPatient', {mode: 'add'});
  }, [navigation]);

  // Handle delete patient
  const handleDeletePatient = useCallback((patient: Patient) => {
    Alert.alert(
      'Delete Patient',
      `Are you sure you want to delete ${patient.firstName} ${patient.lastName}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePatient(patient.id);
              Alert.alert('Success', 'Patient deleted successfully');
              loadPatients();
            } catch (error) {
              console.error('Error deleting patient:', error);
              Alert.alert('Error', 'Failed to delete patient. Please try again.');
            }
          },
        },
      ],
    );
  }, [loadPatients]);

  // Format date of birth
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Calculate age
  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    return age;
  };

  // Render patient item
  const renderPatientItem = ({item}: {item: Patient}) => {
    const age = calculateAge(item.dateOfBirth);
    
    return (
      <TouchableOpacity
        onPress={() => handlePatientPress(item)}
        activeOpacity={0.7}>
        <Card style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <View style={styles.patientAvatar}>
              {item.photoUri ? (
                <Image source={{uri: item.photoUri}} style={styles.patientAvatarImage} />
              ) : (
                <MaterialIcons name="person" size={24} color="#8E8E93" />
              )}
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={styles.patientDetails}>
                {age} years old • {item.gender || 'N/A'} • {item.phone}
              </Text>
              {item.email && (
                <Text style={styles.patientEmail}>{item.email}</Text>
              )}
            </View>
            <View style={styles.patientActions}>
              <TouchableOpacity
                onPress={() => handleDeletePatient(item)}
                style={styles.deleteButton}>
                <MaterialIcons name="delete-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.patientFooter}>
            <Text style={styles.patientDate}>
              DOB: {formatDate(item.dateOfBirth)}
            </Text>
            {item.amka && (
              <Text style={styles.patientAmka}>AMKA: {item.amka}</Text>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyText}>Loading patients...</Text>
        </View>
      );
    }

    if (searchMode && searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>No patients found</Text>
          <Text style={styles.emptySubtext}>
            Try a different search term
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="people-outline" size={64} color="#CCCCCC" />
        <Text style={styles.emptyText}>No patients yet</Text>
        <Text style={styles.emptySubtext}>
          Add your first patient to get started
        </Text>
        <Button
          title="Add Patient"
          onPress={handleAddPatient}
          style={styles.addButtonEmpty}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons
            name="search"
            size={24}
            color="#8E8E93"
            style={styles.searchIcon}
          />
          <Input
            placeholder="Search patients by name, phone, email, or AMKA"
            value={searchQuery}
            onChangeText={handleSearch}
            style={styles.searchInput}
            containerStyle={styles.searchInputWrapper}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}>
              <MaterialIcons name="close" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Patient List */}
      <FlatList
        data={patients}
        renderItem={renderPatientItem}
        keyExtractor={item => item.id}
        contentContainerStyle={
          patients.length === 0 ? styles.emptyListContainer : styles.listContainer
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Add Button */}
      {patients.length > 0 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={handleAddPatient}
            activeOpacity={0.8}>
            <MaterialIcons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInputWrapper: {
    marginBottom: 0,
    flex: 1,
  },
  searchInput: {
    paddingLeft: 45,
    paddingRight: 40,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  patientCard: {
    marginBottom: 12,
    padding: 16,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  patientAvatarImage: {
    width: '100%',
    height: '100%',
  },
  patientInfo: {
    flex: 1,
    marginRight: 12,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  patientEmail: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 2,
  },
  patientActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 4,
  },
  patientFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  patientDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  patientAmka: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButtonEmpty: {
    marginTop: 8,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default PatientsScreen;
