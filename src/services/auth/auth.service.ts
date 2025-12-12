/**
 * Authentication Service
 * Handles user authentication and authorization
 */

import {query, executeQuery} from '../database';
import {v4 as uuidv4} from 'uuid';
import bcrypt from 'bcryptjs';
import {User, UserRole} from '../../types';

// For React Native, we'll use a simpler approach
// bcryptjs might need react-native-bcrypt or similar
// For now, we'll use a simple hash (replace with proper bcrypt in production)

/**
 * Hash password (simple implementation - replace with bcrypt in production)
 */
const hashPassword = async (password: string): Promise<string> => {
  // TODO: Implement proper bcrypt hashing
  // For now, simple hash (NOT SECURE - replace in production)
  return password; // Placeholder
};

/**
 * Verify password
 */
const verifyPassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  // TODO: Implement proper bcrypt verification
  // For now, simple comparison (NOT SECURE - replace in production)
  return password === hash; // Placeholder
};

/**
 * Create a new user
 */
export const createUser = async (
  username: string,
  email: string,
  password: string,
  role: UserRole,
  firstName: string,
  lastName: string,
  phone?: string,
): Promise<User> => {
  // Check if username or email already exists
  const existingUser = query(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [username, email],
  );

  if (existingUser.length > 0) {
    throw new Error('Username or email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const userId = uuidv4();
  const now = new Date().toISOString();

  executeQuery(
    `INSERT INTO users (id, username, email, password_hash, role, first_name, last_name, phone, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, username, email, passwordHash, role, firstName, lastName, phone || null, 1, now, now],
  );

  return {
    id: userId,
    username,
    email,
    role,
    firstName,
    lastName,
    phone,
  };
};

/**
 * Authenticate user
 */
export const authenticateUser = async (
  username: string,
  password: string,
): Promise<User> => {
  // Find user
  const users = query(
    'SELECT * FROM users WHERE username = ? AND is_active = 1',
    [username],
  );

  if (users.length === 0) {
    throw new Error('Invalid username or password');
  }

  const user = users[0];

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid username or password');
  }

  // Update last login
  executeQuery(
    'UPDATE users SET last_login = ?, updated_at = ? WHERE id = ?',
    [new Date().toISOString(), new Date().toISOString(), user.id],
  );

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role as UserRole,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
  };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  const users = query('SELECT * FROM users WHERE id = ? AND is_active = 1', [
    userId,
  ]);

  if (users.length === 0) {
    return null;
  }

  const user = users[0];
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role as UserRole,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
  };
};

/**
 * Update user password
 */
export const updateUserPassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> => {
  // Get user
  const users = query('SELECT password_hash FROM users WHERE id = ?', [userId]);
  if (users.length === 0) {
    throw new Error('User not found');
  }

  // Verify old password
  const isValid = await verifyPassword(oldPassword, users[0].password_hash);
  if (!isValid) {
    throw new Error('Invalid current password');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  executeQuery(
    'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
    [newPasswordHash, new Date().toISOString(), userId],
  );
};

/**
 * Check if user has permission
 */
export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  // Define permissions per role
  const rolePermissions: Record<UserRole, string[]> = {
    admin: ['*'], // All permissions
    dentist: [
      'patients.*',
      'appointments.*',
      'treatments.*',
      'treatment_plans.*',
      'financial.view',
      'reports.*',
    ],
    assistant: [
      'patients.view',
      'appointments.*',
      'treatments.create',
      'treatments.view',
      'inventory.*',
    ],
    receptionist: [
      'patients.create',
      'patients.view',
      'patients.update_contact',
      'appointments.*',
      'financial.*',
      'inventory.view',
    ],
  };

  const permissions = rolePermissions[userRole] || [];
  
  // Check for wildcard permission
  if (permissions.includes('*')) {
    return true;
  }

  // Check exact permission
  if (permissions.includes(permission)) {
    return true;
  }

  // Check wildcard permissions (e.g., 'patients.*' matches 'patients.view')
  const permissionPrefix = permission.split('.')[0];
  return permissions.some(p => p === `${permissionPrefix}.*`);
};

