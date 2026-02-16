import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Check for updates every 60 seconds
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast("New version available! 🎉", {
        description: "Tap to update to the latest version of Krolist.",
        duration: Infinity,
        action: {
          label: "Update",
          onClick: () => updateServiceWorker(true),
        },
        cancel: {
          label: "Later",
          onClick: () => {},
        },
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}
