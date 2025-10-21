import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface AdBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllowAds: () => void;
  onBlockAds: () => void;
}

export function AdBlockDialog({ open, onOpenChange, onAllowAds, onBlockAds }: AdBlockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-black border-0 text-white p-8">
        <VisuallyHidden>
          <DialogTitle>Ad Block Detected</DialogTitle>
        </VisuallyHidden>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 rounded-full h-12 w-12 bg-primary hover:bg-primary/90 text-black"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="space-y-8 pt-4">
          <h2 className="text-4xl md:text-5xl font-bold text-primary">
            Hi there :)
          </h2>

          <p className="text-xl md:text-2xl leading-relaxed">
            Turning off ad block for Krolist can help us greatly, as it is one of the ways for you to support our project and allow us to make more cool features.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <Button
              variant="default"
              size="lg"
              className="bg-primary hover:bg-primary/90 text-black font-semibold h-auto py-6 text-lg"
              onClick={onBlockAds}
            >
              Keep adblock ON for this website
            </Button>

            <Button
              variant="default"
              size="lg"
              className="bg-primary hover:bg-primary/90 text-black font-semibold h-auto py-6 text-lg"
              onClick={onAllowAds}
            >
              Turn off adblock for this website
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
