# eas-build — EAS Build

## Setup
1. `npm i -g eas-cli`
2. `eas login`
3. `eas build:configure` → creates `eas.json`

## Profiles

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal", "android": { "gradleCommand": ":app:assembleDebug" }},
    "preview":     { "distribution": "internal", "android": { "buildType": "apk" }},
    "production":  { "autoIncrement": true, "android": { "buildType": "app-bundle" }}
  },
  "submit": { "production": { "android": { "serviceAccountKeyPath": "./pc-api.json", "track": "internal" }}}
}
```

## Credentials
- iOS: `eas credentials` → upload distribution cert + provisioning profile (or let EAS manage)
- Android: `eas credentials` → upload keystore (BACK IT UP — losing it locks you out of the Play Store listing forever)

## Native dependencies
Any time you add a library with native code, rebuild dev client: `eas build --profile development --platform all`.

## Environment variables
`eas.json` `env` block per profile. Secrets via `eas secret:create`.

## Common commands

```
eas build --profile preview --platform android      # APK to test on device
eas build --profile production --platform all       # Store-ready bundles
eas submit --platform android --latest              # Upload to Play Console
eas update --branch production --message "fix XYZ"  # OTA JS update
```

## Acceptance
- [ ] Preview APK installs and runs on physical Android device
- [ ] Production bundle uploads to Play internal track
- [ ] iOS TestFlight build distributes to test users

