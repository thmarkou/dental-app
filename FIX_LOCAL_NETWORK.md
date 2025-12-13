# Fix "Local Network Prohibited" Error

## Το Πρόβλημα

Το app δεν μπορεί να συνδεθεί στο Metro bundler:
```
Error Domain=NSURLErrorDomain Code=-1009 "The Internet connection appears to be offline."
Local network prohibited
```

## Λύση

### 1. Προσθήκη Local Network Permission ✅

Προστέθηκε στο `Info.plist`:
```xml
<key>NSLocalNetworkUsageDescription</key>
<string>This app needs access to local network to connect to Metro bundler for development.</string>
```

### 2. Επαλήθευση NSAppTransportSecurity ✅

Το `Info.plist` έχει ήδη:
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsLocalNetworking</key>
  <true/>
</dict>
```

### 3. Rebuild στο Xcode

Μετά την αλλαγή στο `Info.plist`:
1. **Product** → **Clean Build Folder** (⇧⌘K)
2. **Product** → **Build** (⌘B)
3. **Product** → **Run** (⌘R)

### 4. Ελέγξτε Network Permissions

**Στο iOS Device:**
- Settings → Privacy & Security → Local Network
- Βεβαιωθείτε ότι το app έχει permission

**Στο Simulator:**
- Δεν χρειάζεται permission (συνδέεται αυτόματα)

## Ελέγχος Metro Bundler

```bash
# Ελέγξτε ότι το Metro τρέχει
curl http://192.168.100.44:8081/status

# Θα πρέπει να δείτε: packager-status:running
```

## Αν Συνεχίζει το Πρόβλημα

### 1. Ελέγξτε Network Connection

**Real Device:**
- Device και Mac πρέπει να είναι στο **ίδιο WiFi network**
- Ελέγξτε firewall settings στο Mac

**Simulator:**
- Simulator συνδέεται στο localhost (127.0.0.1)
- Δεν χρειάζεται network permission

### 2. Try localhost Instead

Αν τρέχετε σε Simulator, μπορείτε να αλλάξετε το AppDelegate να χρησιμοποιεί localhost:

```objc
// In AppDelegate.mm, για Simulator:
#if TARGET_IPHONE_SIMULATOR
  return [NSURL URLWithString:@"http://localhost:8081/index.bundle?platform=ios&dev=true"];
#else
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#endif
```

### 3. Check Firewall

**Mac System Settings:**
- System Settings → Network → Firewall
- Allow connections for Node/Metro

### 4. Manual IP Configuration

Στο Xcode:
1. **Edit Scheme** → **Run** → **Arguments**
2. **Environment Variables:**
   - `REACT_NATIVE_PACKAGER_HOSTNAME` = `192.168.100.44` (Mac IP)

## Success Indicators

✅ **Όταν λειτουργεί:**
- Metro terminal δείχνει bundle requests
- Xcode console: "Loading bundle from http://..."
- App UI εμφανίζεται

❌ **Όταν δεν λειτουργεί:**
- "Local network prohibited" error
- "No bundle URL present"
- Metro terminal δεν δείχνει requests

## Quick Fix Checklist

- [x] `NSLocalNetworkUsageDescription` στο Info.plist
- [x] `NSAllowsLocalNetworking` = true
- [ ] Clean Build Folder
- [ ] Rebuild
- [ ] Check device network permissions (Settings → Privacy → Local Network)
- [ ] Device και Mac στο ίδιο WiFi

