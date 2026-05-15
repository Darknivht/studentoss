# 04-AnnouncementBanner — AnnouncementBanner

Fetch active rows from announcements table. Variants: info(blue), warning(amber), promo(gradient). Dismissible with MMKV remembering dismissed IDs.

## Implementation guidance

1. Mirror the export names from web `src/components/ui/*.tsx` and `src/components/**`.
2. Match props exactly so screen code that uses these components ports without changes.
3. Style with Nativewind classes mirroring web variants (cva-style).
4. Add haptics on press where it makes sense (buttons, switches, slider snap).
5. Test in light + dark mode.

## Acceptance
- [ ] Web component and RN component share the same prop API
- [ ] Visual diff <5%
