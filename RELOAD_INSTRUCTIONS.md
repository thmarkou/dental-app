# Reload Instructions for Development Build

## After Code Changes

When you make changes to the code, you need to reload the app:

### Option 1: Reload in Simulator
1. Press `⌘R` (Cmd+R) in the simulator
2. Or shake the device → Select "Reload"

### Option 2: Restart Metro Bundler
1. Stop Metro (Ctrl+C in terminal)
2. Run: `npm start`
3. Press `i` for iOS simulator

### Option 3: Full Rebuild (if native changes)
If you changed native code or dependencies:
```bash
npx expo run:ios
```

## Check Database Status

After reload, check the console:
- ✅ `Database initialized successfully` = Database is working!
- ✅ `Migration 19 completed` (or no migration line if already up to date)
- ⚠️ `Database initialization skipped` = Still using old build, need reload

**Simulator only (dev):** if migrations did not run, from project root:
```bash
node scripts/migrate-simulator-db.mjs
```

**Manual test checklist:** [MANUAL_TEST_CHECKLIST.md](./MANUAL_TEST_CHECKLIST.md)

## Common Issues

### Database Still Not Working After Reload

1. **Check if development build is running:**
   - The app should NOT say "Expo Go" at the bottom
   - It should be a standalone app

2. **Rebuild if needed:**
   ```bash
   npx expo run:ios
   ```

3. **Check Metro bundler:**
   - Make sure Metro is running
   - Check terminal for errors

4. **Clear cache:**
   ```bash
   npm start -- --clear
   ```

