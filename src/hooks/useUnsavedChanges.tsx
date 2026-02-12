import { useEffect, useCallback } from "react";
import { useBlocker } from "react-router-dom";
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
 * Handles both in-app navigation (react-router) and browser navigation (beforeunload).
 *
 * Returns a `UnsavedChangesDialog` component that must be rendered in the tree.
 */
export function useUnsavedChanges(isDirty: boolean) {
  // Block in-app navigation via react-router
  const blocker = useBlocker(isDirty);

  // Block browser-level navigation (refresh, close tab, external URL)
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Legacy browsers need returnValue set
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const UnsavedChangesDialog = useCallback(() => {
    if (blocker.state !== "blocked") return null;

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
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Stay on Page
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => blocker.proceed?.()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }, [blocker]);

  return { UnsavedChangesDialog };
}
