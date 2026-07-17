# Prompt templates

Copy → paste into `INBOX.md` → fill blanks → send.

---

## 1. Build a new screen
```
## Next request
Type: new-screen
Screen: <ScreenName>
Mentions: @screen:<ScreenName> @web:<ScreenName>
Priority styles: <e.g. gradient header, purple cards>
Skip for now: <optional sub-features to defer>
Native modules needed: <expo-camera, none, etc.>
Notes: <anything else>
```

## 2. Fix a broken screen
```
## Next request
Type: fix
Screen: <ScreenName>
Mentions: @mobile:<ScreenName> @screen:<ScreenName>
Bug: <what's wrong>
Repro: <steps>
Expected: <desired behavior>
```

## 3. Port a shared component
```
## Next request
Type: port-component
Component: <e.g. FeatureGateDialog>
Mentions: @src/components/<path>.tsx @mobile-implementation/05-shared-components/03-FeatureGateDialog.md
Used by screens: <list>
```

## 4. Wire a Supabase feature
```
## Next request
Type: wire-supabase
Feature: <e.g. realtime chat subscription>
Table(s): <messages, chats>
Mentions: @supabase @src/hooks/<relevant>.ts
Notes: <RLS / realtime / storage specifics>
```

## 5. Add a native module
```
## Next request
Type: native-module
Module: <e.g. expo-usage-stats>
Mentions: @mobile-implementation/06-native-features/03-usage-stats-tracking.md @mobile-implementation/11-native-modules/README.md
Used by: <Focus screen>
Platform: android-only
```

## 6. Polish styles / theming pass
```
## Next request
Type: styles
Scope: <single screen | shared component | global tokens>
Mentions: @mobile:<Screen> @design
Change: <exact visual change>
Reference: <screenshot path or web route to match>
```
