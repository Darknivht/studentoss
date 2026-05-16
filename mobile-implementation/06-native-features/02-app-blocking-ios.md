# app-blocking-ios — iOS App Blocking

## Mechanism
iOS does **not** allow blocking apps via overlay (sandboxing). Use Apple's `FamilyControls` framework.

## Capabilities required
- `com.apple.developer.family-controls` entitlement (Apple must approve)
- Screen Time API (`FamilyControls`, `ManagedSettings`, `DeviceActivity` frameworks)

## Flow
1. Request authorization: `AuthorizationCenter.shared.requestAuthorization(for: .individual)`
2. Show `FamilyActivityPicker` (a SwiftUI sheet) — user selects apps to block.
3. Apply `ManagedSettingsStore().shield.applications = selection.applicationTokens`
4. Use `DeviceActivityCenter` to schedule the block window.

## Expo config plugin
Add entitlement + framework links to Xcode project via `withEntitlementsPlist` + `withXcodeProject`.

```ts
config = withEntitlementsPlist(config, (cfg) => {
  cfg.modResults['com.apple.developer.family-controls'] = true;
  return cfg;
});
```

## Native module (Swift)
`FocusModeModule.swift` bridges:
- `requestAuthorization(): Promise<bool>`
- `presentFamilyPicker(): Promise<Selection>` (presents SwiftUI sheet)
- `startBlocking(selection): Promise<void>`
- `stopBlocking(): Promise<void>`

The picker returns opaque tokens — store them in Keychain via `expo-secure-store` so iOS keeps app identities private (you never see bundle IDs).

## Limitations vs Android
- Cannot list installed apps
- Cannot show custom overlay
- User must select via Apple's picker each time (or save selection)
- Requires user to be on iOS 16+

## Acceptance
- [ ] Authorization prompt shown
- [ ] Picker presents and saves selection
- [ ] Selected apps blocked during session
- [ ] Works on iOS 16, 17, 18

