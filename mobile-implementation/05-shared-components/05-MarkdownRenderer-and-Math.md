# 05-MarkdownRenderer-and-Math — Markdown + Math

react-native-markdown-display with custom rule for fence \`\`\`math and inline $...$ / block $$...$$. Use react-native-math-view to render. Pre-process via parseAIResponse.ts (already copied) to normalize delimiters.

## Implementation guidance

1. Mirror the export names from web `src/components/ui/*.tsx` and `src/components/**`.
2. Match props exactly so screen code that uses these components ports without changes.
3. Style with Nativewind classes mirroring web variants (cva-style).
4. Add haptics on press where it makes sense (buttons, switches, slider snap).
5. Test in light + dark mode.

## Acceptance
- [ ] Web component and RN component share the same prop API
- [ ] Visual diff <5%
