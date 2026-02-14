import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost if you leave this page. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingPath(null)}>
              Stay on Page
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const path = pendingPath;
                setPendingPath(null);
                window.location.href = path;
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }, [pendingPath]);

  return { UnsavedChangesDialog };
}
