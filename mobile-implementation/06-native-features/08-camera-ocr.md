# 08-camera-ocr — Camera & OCR

expo-camera for capture. Upload image to extract-pdf-text-ocr edge function (Tesseract or Google Vision). Used by BookScanner and OCRToLatex tools.

## Permissions to declare (app.config.ts)

See the relevant Android permissions in 00-foundation/02-project-init.md.

## Fallback

Always check `Platform.OS` and feature-detect. If unavailable, hide the UI or show a graceful "Available on Android" message. Never crash.

## Acceptance
- [ ] Permission flow runs first time
- [ ] Feature works on real device (not just emulator where applicable)
- [ ] Denial path is graceful
