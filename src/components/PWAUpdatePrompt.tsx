import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export function PWAUpdatePrompt() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
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
      toast(isArabic ? "فيه تحديث جديد! 🎉" : "New version available! 🎉", {
        description: isArabic
          ? "حدّث التطبيق عشان تحصل على آخر المميزات."
          : "Tap to update to the latest version of Krolist.",
        duration: Infinity,
        action: {
          label: isArabic ? "تحديث" : "Update",
          onClick: () => updateServiceWorker(true),
        },
        cancel: {
          label: isArabic ? "لاحقاً" : "Later",
          onClick: () => {},
        },
      });
    }
  }, [needRefresh, updateServiceWorker, isArabic]);

  return null;
}
