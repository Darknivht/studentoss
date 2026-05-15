# 01-ui-primitives — UI Primitives

Button, Card, Input, Textarea, Dialog (use react-native-modal or @gorhom/bottom-sheet), Sheet (gorhom bottom-sheet), Tabs (custom + Moti), Select (use a bottom-sheet picker), Switch, Slider (@react-native-community/slider), Tooltip (skip on RN — show inline), Toast (sonner-native or burnt), Progress (View width %), Badge, Avatar (Image with rounded-full), Skeleton (Moti pulse), Accordion (custom with LayoutAnimation), DropdownMenu (action sheet), Checkbox, RadioGroup. Each gets a thin wrapper file in src/components/ui/ with the same export name as web.

## Implementation guidance

1. Mirror the export names from web `src/components/ui/*.tsx` and `src/components/**`.
2. Match props exactly so screen code that uses these components ports without changes.
3. Style with Nativewind classes mirroring web variants (cva-style).
4. Add haptics on press where it makes sense (buttons, switches, slider snap).
5. Test in light + dark mode.

## Acceptance
- [ ] Web component and RN component share the same prop API
- [ ] Visual diff <5%
