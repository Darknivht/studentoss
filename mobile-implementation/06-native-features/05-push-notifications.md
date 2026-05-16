# push-notifications — Push Notifications

## Provider
`expo-notifications` with Expo Push Service (FCM under the hood for Android, APNs for iOS).

## Setup
1. `eas build:configure`
2. iOS: enable Push capability in EAS credentials
3. Android: FCM project + `google-services.json` configured via Expo

## Permission
```ts
import * as Notifications from 'expo-notifications';
const { status } = await Notifications.requestPermissionsAsync();
const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
// upsert token into supabase.from('push_tokens') keyed by user_id + device_id
```

## Sending
From edge functions, POST to `https://exp.host/--/api/v2/push/send` with `to`, `title`, `body`, `data`.

Triggers:
- Friend request received
- Group message received
- Achievement unlocked
- Daily question challenge
- Streak about to break (8pm local)
- Subscription expires soon

## Handling

```ts
Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  if (data.route) navigation.navigate(data.route, data.params);
});
```

## Categories with actions (iOS)
Reply inline to chat, mark notification as read, snooze streak reminder.

## Acceptance
- [ ] Tokens persisted per device
- [ ] Notifications deliver < 5s on both platforms
- [ ] Tapping notification deep-links to right screen
- [ ] Inline reply for chat works (iOS)

