# Fix "No Bundle URL Present" Error

## Το Πρόβλημα

Στο Xcode βλέπετε: **"No bundle URL present"**

Αυτό σημαίνει ότι το app δεν μπορεί να συνδεθεί με το Metro bundler.

## Λύσεις

### 1. Ελέγξτε ότι το Metro Bundler Τρέχει ✅

```bash
# Terminal: Start Metro
cd /Users/fanis/AIProjects/cursor/dentalapp
npx expo start --clear
```

Θα πρέπει να δείτε:
```
Metro waiting on exp://192.168.x.x:8081
```

### 2. Ελέγξτε ότι Είστε σε Debug Mode ✅

Στο Xcode:
1. **Edit Scheme** (click στο scheme selector)
2. **Run** → **Info** → **Build Configuration**
3. Επιλέξτε **Debug** (όχι Release)

### 3. Clean & Rebuild ✅

Στο Xcode:
1. **Product** → **Clean Build Folder** (⇧⌘K)
2. **Product** → **Build** (⌘B)
3. **Product** → **Run** (⌘R)

### 4. Ελέγξτε το Network

**Αν τρέχετε σε Real Device:**
- Device και Mac πρέπει να είναι στο **ίδιο WiFi network**
- Ελέγξτε firewall settings

**Αν τρέχετε σε Simulator:**
- Simulator συνδέεται αυτόματα στο localhost

### 5. Restart Metro Bundler

```bash
# Stop Metro
pkill -f "expo start"

# Start fresh
npx expo start --clear
```

## AppDelegate Configuration

Το `AppDelegate.mm` έχει ήδη το σωστό configuration:

```objc
- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}
```

## Quick Checklist

- [ ] Metro bundler τρέχει (`npm start`)
- [ ] Xcode σε **Debug** mode
- [ ] Clean Build Folder (⇧⌘K)
- [ ] Rebuild (⌘B)
- [ ] Run (⌘R)
- [ ] Device/Simulator στο ίδιο network (για real device)

## Αν Συνεχίζει το Πρόβλημα

1. **Ελέγξτε το Xcode Console:**
   - View → Navigators → Show Report Navigator
   - Δείτε για bundle URL errors

2. **Ελέγξτε το Metro Terminal:**
   - Βλέπετε requests όταν τρέχετε το app;
   - Αν όχι, το app δεν συνδέεται

3. **Try Manual URL:**
   ```bash
   # Get your Mac IP
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # In Xcode, Edit Scheme → Run → Arguments → Environment Variables
   # Add: REACT_NATIVE_PACKAGER_HOSTNAME = <your-ip>
   ```

## Debugging Tips

**Στο Xcode Console, θα πρέπει να δείτε:**
```
Loading bundle from: http://localhost:8081/index.bundle?platform=ios&dev=true
```

**Αν βλέπετε error:**
```
Unable to connect to Metro bundler
```
→ Metro bundler δεν τρέχει ή network issue

## Success Indicators

✅ **Όταν λειτουργεί:**
- App ανοίγει στο device/simulator
- Metro terminal δείχνει bundle requests
- Xcode console δείχνει "Loading bundle from..."
- App UI εμφανίζεται

❌ **Όταν δεν λειτουργεί:**
- "No bundle URL present" error
- Μαύρη οθόνη
- Metro terminal δεν δείχνει requests

