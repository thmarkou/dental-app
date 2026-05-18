/**
 * On-device storage for patient document files (X-rays, scans).
 * Files live under the app document directory so they persist across sessions.
 */

import * as FileSystem from 'expo-file-system';
import {uuidv4} from '../../utils/uuid';

const ROOT_DIR = `${FileSystem.documentDirectory ?? ''}patient-documents/`;

const extensionFromUri = (uri: string): string => {
  const withoutQuery = uri.split('?')[0] ?? uri;
  const match = /\.([a-zA-Z0-9]+)$/.exec(withoutQuery);
  const ext = match?.[1]?.toLowerCase();
  if (ext && ext.length <= 5) {
    return ext;
  }
  return 'jpg';
};

export const ensurePatientDocumentsDir = async (
  patientId: string,
): Promise<string> => {
  const dir = `${ROOT_DIR}${patientId}/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, {intermediates: true});
  }
  return dir;
};

/**
 * Copy a picked/captured file into persistent app storage.
 */
export const copyDocumentToPatientStorage = async (
  sourceUri: string,
  patientId: string,
): Promise<string> => {
  const dir = await ensurePatientDocumentsDir(patientId);
  const ext = extensionFromUri(sourceUri);
  const dest = `${dir}${uuidv4()}.${ext}`;
  await FileSystem.copyAsync({from: sourceUri, to: dest});
  return dest;
};

export const deleteDocumentFile = async (fileUri: string): Promise<void> => {
  if (!fileUri.trim()) {
    return;
  }
  const info = await FileSystem.getInfoAsync(fileUri);
  if (info.exists) {
    await FileSystem.deleteAsync(fileUri, {idempotent: true});
  }
};
