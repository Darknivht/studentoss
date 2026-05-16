# local-notifications — Local Notifications

## Use cases
- Pomodoro timer end
- Daily streak reminder at 8pm
- Daily question challenge at 7am
- Scheduled study session reminders

## API
```ts
await Notifications.scheduleNotificationAsync({
  content: { title: '🔥 Don't break your streak!', body: 'Study for 5 minutes today.' },
  trigger: { hour: 20, minute: 0, repeats: true },
});
```

## Cancel + reschedule
Track scheduled identifiers in MMKV so you can `cancelScheduledNotificationAsync(id)` when user disables.

## Channel setup (Android)
```ts
Notifications.setNotificationChannelAsync('study', {
  name: 'Study reminders',
  importance: Notifications.AndroidImportance.HIGH,
  sound: 'default',
  vibrationPattern: [0, 250, 250, 250],
});
```

## Quiet hours
Respect user's parental controls / quiet-hours config: skip scheduling between configured times.

## Acceptance
- [ ] All scheduled notifications fire at the right time
- [ ] Disabling in settings cancels them
- [ ] Quiet hours respected

