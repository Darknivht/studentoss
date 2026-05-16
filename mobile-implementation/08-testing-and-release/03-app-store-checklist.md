# app-store-checklist — App Store Checklist

## Pre-submission

- [ ] App Store Connect entry created
- [ ] Bundle ID: `com.studentoss.app`
- [ ] Name: **StudentOS** (32 chars max)
- [ ] Subtitle (30 chars)
- [ ] Promotional text (170 chars)
- [ ] Description (4000 chars)
- [ ] Keywords (100 chars, comma-sep)
- [ ] Screenshots: 6.7" (required), 5.5" (required), iPad Pro 12.9" (if iPad supported) — 3+ each
- [ ] App preview video (optional, recommended)
- [ ] Icon 1024×1024 (no transparency, no rounded corners — Apple rounds)
- [ ] Privacy policy URL
- [ ] Support URL

## Privacy nutrition labels
Declare every data type collected (email, name, content, usage, identifiers) + purpose. Be thorough — Apple audits.

## Entitlements requiring approval
- `com.apple.developer.family-controls` — FamilyControls for app blocking. Apply via developer portal, takes 1-3 weeks. Justify with a video demo and exact use-case description.

## Sign in with Apple
**Required** if you offer any other third-party sign-in (Google). Add `expo-apple-authentication` and implement.

## IAP
If charging on iOS, you MUST use StoreKit IAP. Paystack/Stripe is rejected for digital goods. Implement via `expo-in-app-purchases` or RevenueCat. Mirror Paystack pricing.

## TestFlight
Internal testing (up to 100 users without review) → External (requires light review). Use for beta.

## Review notes
Provide test account + steps in 'App Review Information'.

