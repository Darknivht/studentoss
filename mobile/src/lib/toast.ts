// Thin wrapper so screens can `import { toast } from "@/lib/toast"` exactly
// like the web app uses sonner. Powered by `sonner-native` (RN port of sonner).
import { toast } from "sonner-native";

export { toast };
export default toast;
