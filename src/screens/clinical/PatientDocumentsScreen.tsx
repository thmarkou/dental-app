/**
 * Patient documents & X-rays — list and upload from gallery or camera.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  Image,
  useWindowDimensions,
} from 'react-native';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {getPatientById} from '../../services/patient';
import {
  addPatientDocument,
  deletePatientDocument,
  getPatientDocuments,
  type PatientDocumentRow,
  type PatientDocumentType,
} from '../../services/clinical/document.service';
import {copyDocumentToPatientStorage} from '../../services/clinical/documentStorage.service';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';

const TYPE_LABELS: Record<PatientDocumentType, string> = {
  xray: 'X-ray / Ακτινογραφία',
  consent: 'Consent / Συγκατάθεση',
  other: 'Other / Άλλο',
};

const formatWhen = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const PatientDocumentsScreen: React.FC = () => {
  const route = useRoute();
  const {patientId} = route.params as {patientId: string};
  const {width} = useWindowDimensions();
  const pad = width >= 900 ? 24 : 16;

  const [patientName, setPatientName] = useState('');
  const [gdprOk, setGdprOk] = useState(true);
  const [documents, setDocuments] = useState<PatientDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const patient = await getPatientById(patientId);
      if (patient) {
        setPatientName(`${patient.firstName} ${patient.lastName}`);
        setGdprOk(patient.gdprConsent === true && patient.gdprDate != null);
      } else {
        setPatientName('');
        setGdprOk(false);
      }
      const docs = await getPatientDocuments(patientId);
      setDocuments(docs);
    } catch (e) {
      console.error(e);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const persistUpload = async (
    sourceUri: string,
    documentType: PatientDocumentType,
  ) => {
    setUploading(true);
    try {
      const storedUri = await copyDocumentToPatientStorage(sourceUri, patientId);
      const defaultTitle =
        documentType === 'xray'
          ? `X-ray ${new Date().toLocaleDateString('en-GB')}`
          : documentType === 'consent'
            ? `Consent ${new Date().toLocaleDateString('en-GB')}`
            : `Document ${new Date().toLocaleDateString('en-GB')}`;
      await addPatientDocument({
        patientId,
        documentType,
        fileUri: storedUri,
        title: defaultTitle,
      });
      await load();
    } catch (e) {
      console.error(e);
      Alert.alert(
        'Upload failed',
        e instanceof Error ? e.message : 'Could not save the document.',
      );
    } finally {
      setUploading(false);
    }
  };

  const pickFromLibrary = async (documentType: PatientDocumentType) => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Photo library access is needed to attach documents.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await persistUpload(result.assets[0].uri, documentType);
    }
  };

  const pickFromCamera = async (documentType: PatientDocumentType) => {
    const {status} = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Camera access is needed to capture documents.',
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await persistUpload(result.assets[0].uri, documentType);
    }
  };

  const onAddDocument = () => {
    Alert.alert(
      'Add document',
      'Choose document type, then source.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: TYPE_LABELS.xray,
          onPress: () => chooseSource('xray'),
        },
        {
          text: TYPE_LABELS.consent,
          onPress: () => chooseSource('consent'),
        },
        {
          text: TYPE_LABELS.other,
          onPress: () => chooseSource('other'),
        },
      ],
    );
  };

  const chooseSource = (documentType: PatientDocumentType) => {
    Alert.alert('Source', undefined, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Photo library',
        onPress: () => void pickFromLibrary(documentType),
      },
      {
        text: 'Camera',
        onPress: () => void pickFromCamera(documentType),
      },
    ]);
  };

  const onDelete = (doc: PatientDocumentRow) => {
    Alert.alert(
      'Delete document',
      `Remove "${doc.title ?? TYPE_LABELS[doc.documentType]}"? This cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(doc.id);
              await deletePatientDocument(doc.id);
              await load();
            } catch (e) {
              console.error(e);
              Alert.alert(
                'Error',
                e instanceof Error ? e.message : 'Could not delete document.',
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <ScreenSafeArea variant="content">
        <View className="flex-1 items-center justify-center bg-slate-50">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-3 text-slate-600">Loading documents…</Text>
        </View>
      </ScreenSafeArea>
    );
  }

  return (
    <ScreenSafeArea variant="content">
      <ScrollView
        className="flex-1 bg-slate-50"
        contentContainerStyle={{padding: pad, paddingBottom: 32}}>
        <Text className="text-lg font-semibold text-slate-900">
          {patientName || 'Patient'} — Documents & X-rays
        </Text>
        <Text className="mt-1 text-sm text-slate-600">
          Attach X-rays, consent scans, and other files. Stored on this device only.
        </Text>

        {!gdprOk ? (
          <View className="mt-4 flex-row gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <MaterialIcons name="warning-amber" size={22} color="#b45309" />
            <Text className="flex-1 text-sm text-amber-900">
              GDPR consent is not on file. Record consent on the patient profile before
              storing sensitive clinical images when possible.
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={onAddDocument}
          disabled={uploading}
          className="mt-5 flex-row items-center justify-center rounded-xl bg-slate-900 py-3.5 active:bg-slate-800 disabled:opacity-50">
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="add-photo-alternate" size={22} color="#fff" />
              <Text className="ml-2 text-base font-semibold text-white">
                Add document
              </Text>
            </>
          )}
        </Pressable>

        {documents.length === 0 ? (
          <View className="mt-8 items-center rounded-xl border border-dashed border-slate-200 bg-white py-12 px-4">
            <MaterialIcons name="folder-open" size={48} color="#94a3b8" />
            <Text className="mt-3 text-center text-base font-medium text-slate-700">
              No documents yet
            </Text>
            <Text className="mt-1 text-center text-sm text-slate-500">
              Tap Add document to upload an X-ray or scan from the library or camera.
            </Text>
          </View>
        ) : (
          <View className="mt-6 gap-3">
            {documents.map((doc) => (
              <View
                key={doc.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <View className="flex-row">
                  <Image
                    source={{uri: doc.fileUri}}
                    className="h-24 w-24 bg-slate-100"
                    resizeMode="cover"
                  />
                  <View className="flex-1 p-3">
                    <Text className="text-xs font-medium uppercase text-slate-500">
                      {TYPE_LABELS[doc.documentType]}
                    </Text>
                    <Text className="mt-0.5 text-base font-semibold text-slate-900" numberOfLines={2}>
                      {doc.title ?? 'Untitled'}
                    </Text>
                    <Text className="mt-1 text-xs text-slate-500">
                      {formatWhen(doc.createdAt)}
                    </Text>
                    {doc.notes ? (
                      <Text className="mt-1 text-xs text-slate-600" numberOfLines={2}>
                        {doc.notes}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => onDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="items-center justify-center px-3 active:bg-red-50 disabled:opacity-40"
                    accessibilityLabel="Delete document">
                    {deletingId === doc.id ? (
                      <ActivityIndicator size="small" color="#dc2626" />
                    ) : (
                      <MaterialIcons name="delete-outline" size={24} color="#dc2626" />
                    )}
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenSafeArea>
  );
};

export default PatientDocumentsScreen;
