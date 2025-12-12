# Quick Fix: Metro Connection Error

## Problem
"Disconnected from Metro" error appears in the app.

## Solution

1. **Stop Metro bundler** (if running):
   ```bash
   # Press Ctrl+C in the terminal where Metro is running
   # Or kill the process:
   pkill -f "expo start"
   ```

2. **Clear cache and restart**:
   ```bash
   npm start -- --clear
   ```

3. **In the simulator**, press `⌘R` (Cmd+R) to reload, or shake the device and select "Reload"

## Alternative: Use Development Build

If Metro keeps disconnecting, use a development build instead:

```bash
# For iOS
npx expo run:ios

# For Android  
npx expo run:android
```

This creates a standalone build that doesn't require Metro connection.

