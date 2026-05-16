# play-store-checklist — Play Store Checklist

## Pre-submission

- [ ] App name: **StudentOS**
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars) — list every feature from `StudentOS.md`
- [ ] Screenshots: phone (min 2, recommend 8), 7-inch tablet, 10-inch tablet — use Figma/Screenshot Studio
- [ ] Feature graphic 1024×500
- [ ] Icon 512×512
- [ ] Privacy policy URL (publish at `/privacy` on your website)
- [ ] Data safety form: declare data collection (auth, content, usage)
- [ ] Content rating questionnaire
- [ ] Target audience: 13+ (or 16+ if EU)
- [ ] Ads declaration: Yes for free tier
- [ ] In-app purchases declared
- [ ] App access (test credentials for review)

## Permissions justifications

You must justify every sensitive permission in Play Console:
- `PACKAGE_USAGE_STATS` — Focus Mode app blocking
- `SYSTEM_ALERT_WINDOW` — Focus Mode overlay
- `BIND_ACCESSIBILITY_SERVICE` — Detect app launches for Focus Mode. **REQUIRES special declaration form** + video demo.
- `POST_NOTIFICATIONS` — Streak reminders, push
- `READ_EXTERNAL_STORAGE` / `READ_MEDIA_IMAGES` — Note uploads
- `RECORD_AUDIO` — Voice mode, audio notes
- `CAMERA` — Note scanning

## Accessibility service form
Most rejected apps fail here. You MUST:
1. Record a screen video showing exactly how the service is used
2. Explain that it's only used to detect foreground app for blocking, NOT for reading content
3. Upload demo APK

## Pre-launch report
EAS automatically runs Firebase Test Lab. Fix any crashes before submitting to production.

## Closed → Open → Production track
Start with internal testing → closed alpha → open beta → production. Don't skip.

