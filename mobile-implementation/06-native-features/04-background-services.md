# background-services — Background Services & Tasks

## Use cases
- Daily streak reminder check
- Lofi audio playback
- Focus session foreground service
- Offline sync drain
- Push notification handlers
- Usage stats sync

## Tools
- **`expo-background-fetch`** + **`expo-task-manager`** — periodic short tasks (iOS limits ~15min apart, Android more flexible)
- **`expo-background-task`** (new API)
- **`expo-av` staysActiveInBackground** — audio
- **Foreground service** (Android, custom native) for focus mode

## Setup

```ts
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const STREAK_TASK = 'streak-check';

TaskManager.defineTask(STREAK_TASK, async () => {
  await checkAndNotifyStreak();
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

await BackgroundFetch.registerTaskAsync(STREAK_TASK, {
  minimumInterval: 60 * 60 * 8, // 8h
  stopOnTerminate: false,
  startOnBoot: true,
});
```

## Offline sync drain on connectivity restore
Listen via `@react-native-community/netinfo`:
```ts
NetInfo.addEventListener(state => {
  if (state.isConnected && state.isInternetReachable) drainOfflineQueue();
});
```

## Audio in background
```ts
await Audio.setAudioModeAsync({
  staysActiveInBackground: true,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
});
```

## Acceptance
- [ ] Streak reminder fires when overdue
- [ ] Lofi continues playing when screen off
- [ ] Focus foreground service survives swipe-away (Android)

