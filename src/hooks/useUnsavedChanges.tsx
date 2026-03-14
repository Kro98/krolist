import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

/**
 * Hook that warns users before navigating away when there are unsaved changes.
 * Uses beforeunload for browser-level navigation (refresh, close tab).
 * Note: In-app route blocking requires a data router; this hook gracefully
 * skips that and relies on beforeunload instead.
 */
export function useUnsavedChanges(isDirty: boolean) {
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // Block browser-level navigation (refresh, close tab, external URL)
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const UnsavedChangesDialog = useCallback(() => {
    if (!pendingPath) return null;

    return (
      <Drawer open onOpenChange={(open) => { if (!open) setPendingPath(null); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Unsaved Changes</DrawerTitle>
            <DrawerDescription>
              You have unsaved changes that will be lost if you leave this page. Are you sure you want to continue?
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button
              variant="destructive"
              onClick={() => {
                const path = pendingPath;
                setPendingPath(null);
                window.location.href = path;
              }}
            >
              Leave Page
            </Button>
            <Button variant="outline" onClick={() => setPendingPath(null)}>
              Stay on Page
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }, [pendingPath]);

  return { UnsavedChangesDialog };
}
