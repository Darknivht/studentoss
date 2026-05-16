# monitoring — Monitoring & Crash Reporting

## Tools
- **Sentry** for crashes + perf (free tier generous)
- **PostHog** or **Mixpanel** for product analytics
- **Supabase logs** for backend
- **EAS Insights** for build/update adoption

## Sentry setup
```bash
npx @sentry/wizard@latest -i reactNative
```
Wraps `App.tsx` with `Sentry.wrap(App)`. Adds sourcemaps upload to EAS build hooks.

Tag every error with user id (without PII): `Sentry.setUser({ id: userId })`.

## Analytics events to track
- `app_open`, `screen_view`
- `note_created`, `quiz_taken`, `flashcard_reviewed`, `study_session_completed`
- `feature_gate_shown`, `upgrade_clicked`, `subscription_started`
- `focus_session_started`, `focus_session_ended`
- `ai_tutor_message_sent`
- `notification_received`, `notification_opened`

## Performance budgets
- Cold start < 2.5s
- Screen transition < 200ms
- API call p95 < 1.5s
- JS frame rate ≥ 58fps during scroll

Track via Sentry Performance transactions.

## Privacy
- Strip user-typed content from error reports (Sentry `beforeSend`)
- Allow user to opt out of analytics in Settings

## Acceptance
- [ ] Sentry catches forced crash test
- [ ] Sourcemaps map JS stack to TS files
- [ ] Analytics events visible in dashboard
- [ ] Opt-out works

