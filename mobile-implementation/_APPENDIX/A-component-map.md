# A — Component Map (Web → RN)

| Web | RN equivalent |
|---|---|
| `<div>` | `<View>` |
| `<span>`, `<p>`, `<h1..h6>` | `<Text>` (with font-display class for headings) |
| `<button>` | `<Pressable>` (or our `<Button>`) |
| scrollable `<div>` | `<ScrollView>` |
| list `<div>.map(...)` | `<FlatList>` (better perf) |
| `<input>` | `<TextInput>` (or our `<Input>`) |
| `<textarea>` | `<TextInput multiline>` |
| `<select>` | bottom sheet picker |
| `<img>` | `<Image>` from `expo-image` |
| `<a href>` | `Linking.openURL` |
| `<form>` | no equivalent — handle submit on button press |
| `<svg>` | `react-native-svg` |
| Dialog/Modal | `react-native-modal` |
| Sheet | `@gorhom/bottom-sheet` |
| Tooltip | inline hint or skip |
| BlurView (`backdrop-blur`) | `expo-blur` `<BlurView>` |
