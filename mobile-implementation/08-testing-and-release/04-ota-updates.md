# ota-updates — OTA Updates

## Tool
`expo-updates` + EAS Update.

## Setup
```bash
eas update:configure
```

Adds `expo.updates` to app.config + initializes runtime versioning.

## Channels
- `production` → Play Store / App Store builds read from this branch
- `staging` → internal builds
- `development` → dev client

## Publishing
```
eas update --branch production --message "Fix flashcard flip"
```

## What CAN be OTA-updated
- JS code
- Bundled assets (images, JSON)

## What CANNOT be OTA-updated
- Native modules (changes require new build)
- `app.config.ts` permissions changes
- Plugin changes
- expo-modules-core upgrades

## Runtime version
Set `runtimeVersion.policy: 'appVersion'` so OTA only applies to compatible binaries. Bump app version when you add native code.

## Rollback
```
eas update --branch production --message "Revert to prior" --republish --group <id>
```

## Update strategy in app
```ts
import * as Updates from 'expo-updates';
useEffect(() => {
  Updates.checkForUpdateAsync().then(async (r) => {
    if (r.isAvailable) { await Updates.fetchUpdateAsync(); promptUserToReload(); }
  });
}, []);
```

Don't force reload — prompt user politely; reload on next foreground.

