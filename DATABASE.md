# Database Architecture - Dental Practice Management App

## Database Choice: SQLite

We are using **SQLite** for the following reasons:

### Why SQLite?

1. **Offline-First Architecture**: 
   - Full functionality without internet connection
   - Perfect for clinic tablets that may have unreliable connectivity
   - All data stored locally on device

2. **Performance**:
   - Fast read/write operations
   - Efficient for mobile devices
   - Low memory footprint

3. **Reliability**:
   - ACID compliant
   - Crash-resistant
   - No server required

4. **Compatibility**:
   - Native support on iOS and Android
   - Well-established React Native libraries
   - Easy to backup and migrate

## Implementation

### Primary Database Library

**react-native-quick-sqlite** - Modern, fast SQLite wrapper for React Native

**Why this library?**
- ✅ Fast performance (uses native SQLite)
- ✅ TypeScript support
- ✅ Active maintenance
- ✅ Simple API
- ✅ Works on both iOS and Android
- ✅ Supports transactions
- ✅ Prepared statements for security

### Alternative Libraries Considered

1. **react-native-sqlite-storage**: Older, but stable
2. **react-native-sqlite-2**: Good alternative
3. **WatermelonDB**: Advanced ORM-like solution (consider for future if sync becomes complex)

### Storage Strategy

1. **SQLite Database** (`dentalapp.db`):
   - All structured data (patients, appointments, treatments, invoices, etc.)
   - Stored in: `./data/dentalapp.db` (isolated path)

2. **AsyncStorage** (for preferences):
   - User settings
   - App configuration
   - Cache data
   - Stored with prefix: `@dentalapp:`

3. **File System** (for documents):
   - X-rays, photos, PDFs
   - Stored in: `./uploads/dentalapp/` (isolated path)

## Database Schema

### Core Tables

- `users` - User accounts and roles
- `patients` - Patient information
- `appointments` - Appointment scheduling
- `treatments` - Treatment records
- `treatment_plans` - Treatment plan definitions
- `invoices` - Financial invoices
- `receipts` - Payment receipts
- `payments` - Payment transactions
- `services` - Service catalog with pricing
- `inventory` - Inventory items
- `images` - Image/X-ray references
- `documents` - Document references
- `audit_logs` - Activity tracking

### Database Features

- **Migrations**: Version-controlled schema changes
- **Indexes**: Optimized queries for performance
- **Foreign Keys**: Data integrity
- **Transactions**: Atomic operations
- **Backup**: Regular database backups
- **Encryption**: Optional encryption at rest (for sensitive data)

## Sync Strategy (Future)

When online sync is needed:
- Queue-based sync (actions performed offline are queued)
- Conflict resolution
- Incremental sync
- Background sync when connection available

## Database Location

- **Development**: `./data/dentalapp.db`
- **Production**: Device-specific path (isolated from other apps)
  - iOS: App Documents directory
  - Android: App data directory

## Backup & Recovery

- Automatic daily backups
- Manual backup option
- Export to SQL dump
- Import from backup

