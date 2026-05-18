# DocumentViewers — DocumentViewers (PDF, DOCX, etc.)

> **Web source:** `src/components/documents/PDFViewer.tsx`, `DOCXViewer.tsx`, `DocumentViewer.tsx`
> **RN target:** same paths

## Strategy: native first, WebView fallback

### PDF

Use `react-native-pdf` (mature, native rendering). Props: `source={{uri}}`, `enablePaging`, `onLoadComplete`, `onPageChanged`.
Add custom controls overlay: page indicator, zoom buttons, share, download.

```tsx
<Pdf source={{ uri }} onPageChanged={(p, total) => setPage(p)} style={{flex:1}} />
```

### DOCX

No good native lib. Strategy:
1. Call edge function `extract-pdf-text` variant that converts DOCX → HTML
2. Render via `react-native-render-html` or WebView

### PPTX

Convert to PDF via edge function (LibreOffice headless on a function) then render with PDF viewer.

### XLSX

Use `xlsx` package (pure JS works in RN) → render as `FlatList` of rows with horizontal scroll for columns.

### Markdown / TXT

Use MarkdownRenderer.

### Images

`expo-image` with pinch-zoom via `react-native-image-zoom-viewer`.

### Audio

`expo-av` `Sound` with custom playback UI (play/pause, scrubber, speed 0.5×–2×).

## Common viewer chrome

Header: file name, share, more menu (download, open externally).
Bottom: page indicator (PDF) or playback bar (audio).
Pinch-zoom for PDF & images. Swipe down to dismiss in modal mode.

## Acceptance
- [ ] All formats viewable
- [ ] Pinch-zoom works
- [ ] Share sheet integration via `expo-sharing`
- [ ] No crashes on large files (paginate)

<!-- STYLES_APPENDIX -->

## Styles & className mapping (NativeWind v4)

These are the **exact Tailwind class strings** used by the web counterpart(s). NativeWind v4 understands the same grammar — copy them straight into your RN component's `className=` and only swap the web-only utilities listed in `_APPENDIX/C-css-to-style-map.md` (e.g. `hover:*`, `backdrop-blur-*`, `transition-*` for non-Reanimated transitions).


### From `src/components/documents/DocumentViewer.tsx`

```text
flex items-center justify-center p-8
w-8 h-8 animate-spin text-primary
ml-2 text-muted-foreground
w-12 h-12 mb-2
text-sm

### From `src/components/documents/PDFViewer.tsx`

```text
text-destructive mb-4
gap-2
w-4 h-4
flex items-center justify-between p-2 bg-muted rounded-t-lg border border-border
flex items-center gap-2
h-8 w-8
text-sm font-medium
text-sm font-medium min-w-[50px] text-center
overflow-auto border border-t-0 border-border rounded-b-lg bg-background max-h-[60vh]
mx-auto block

### From `src/components/documents/DOCXViewer.tsx`

```text
docx-container p-4
```

### Conversion checklist

- Keep colour utilities (`bg-primary`, `text-foreground`, `border-border/50`) — defined in `01-design-system/01-colors-tokens.md`.
- Keep spacing, sizing, radius, flex, grid (when supported by NativeWind).
- Replace `hover:*` → use `Pressable`'s `pressed` state or Reanimated.
- Replace `backdrop-blur-*` → `expo-blur` `<BlurView>`.
- Replace `transition-*` / `animate-*` → Moti / Reanimated.
- Replace `cursor-*`, `select-*`, `pointer-events-*` → not needed on RN.
- Replace `grid grid-cols-N gap-X` → `<View className="flex-row flex-wrap gap-X">` or `FlashList numColumns={N}`.
