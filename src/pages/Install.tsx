import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Smartphone, Monitor, Share, Plus, MoreVertical, Check, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const navigate = useNavigate();

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform("ios");
    } else if (/android/.test(ua)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-primary/20">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Already Installed!</h1>
            <p className="text-muted-foreground">
              StudentOS is already installed on your device. Open it from your home screen for the best experience.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Install StudentOS</h1>
        </div>

        {/* App Preview */}
        <Card className="border-primary/20 overflow-hidden">
          <CardContent className="pt-6 text-center space-y-4">
            <img
              src="/pwa-192x192.png"
              alt="StudentOS"
              className="w-20 h-20 rounded-2xl mx-auto shadow-lg"
            />
            <div>
              <h2 className="text-xl font-bold text-foreground">StudentOS</h2>
              <p className="text-sm text-muted-foreground">AI Study Companion</p>
            </div>
            <div className="flex justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Works Offline</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                <span>Fast & Light</span>
              </div>
              <div className="flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5" />
                <span>All Devices</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Install Button (Chrome/Edge/Android) */}
        {deferredPrompt && (
          <Button onClick={handleInstall} className="w-full h-12 text-base gap-2" size="lg">
            <Download className="w-5 h-5" />
            Install Now
          </Button>
        )}

        {/* Platform-specific instructions */}
        {platform === "ios" && (
          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Install on iPhone / iPad
              </h3>
              <div className="space-y-3">
                <Step number={1}>
                  Tap the <Share className="w-4 h-4 inline text-primary" /> <strong>Share</strong> button in Safari's toolbar
                </Step>
                <Step number={2}>
                  Scroll down and tap <strong>"Add to Home Screen"</strong> <Plus className="w-4 h-4 inline text-primary" />
                </Step>
                <Step number={3}>
                  Tap <strong>"Add"</strong> to confirm
                </Step>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: This must be done in Safari. Other browsers on iOS don't support installation.
              </p>
            </CardContent>
          </Card>
        )}

        {platform === "android" && !deferredPrompt && (
          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Install on Android
              </h3>
              <div className="space-y-3">
                <Step number={1}>
                  Tap the <MoreVertical className="w-4 h-4 inline text-primary" /> <strong>menu</strong> button in Chrome
                </Step>
                <Step number={2}>
                  Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>
                </Step>
                <Step number={3}>
                  Tap <strong>"Install"</strong> to confirm
                </Step>
              </div>
            </CardContent>
          </Card>
        )}

        {platform === "desktop" && !deferredPrompt && (
          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                Install on Desktop
              </h3>
              <div className="space-y-3">
                <Step number={1}>
                  In Chrome or Edge, look for the <Download className="w-4 h-4 inline text-primary" /> <strong>install icon</strong> in the address bar
                </Step>
                <Step number={2}>
                  Click <strong>"Install"</strong> in the popup
                </Step>
              </div>
              <p className="text-xs text-muted-foreground">
                Works best in Chrome, Edge, or Brave browsers.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        <Card className="border-border/50">
          <CardContent className="pt-6 space-y-3">
            <h3 className="font-semibold text-foreground">Why install?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                Launch instantly from your home screen
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                Works offline — study anywhere
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                Full-screen experience, no browser bar
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                Faster loading with cached resources
              </li>
            </ul>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => navigate("/")} className="w-full">
          Continue in Browser
        </Button>
      </div>
    </div>
  );
};

const Step = ({ number, children }: { number: number; children: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
      {number}
    </span>
    <p className="text-sm text-muted-foreground">{children}</p>
  </div>
);

export default Install;
