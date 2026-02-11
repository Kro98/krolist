import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { compressImage } from "@/lib/imageCompression";

interface CompressionSettings {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

interface ImageCompressionPreviewProps {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (compressedBlob: Blob, stats: { originalSize: number; compressedSize: number }) => void;
  onCancel: () => void;
  defaultSettings?: Partial<CompressionSettings>;
}

export function ImageCompressionPreview({
  file,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  defaultSettings,
}: ImageCompressionPreviewProps) {
  const [quality, setQuality] = useState(defaultSettings?.quality ?? 0.8);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressing, setCompressing] = useState(false);

  const maxWidth = defaultSettings?.maxWidth ?? 1200;
  const maxHeight = defaultSettings?.maxHeight ?? 1200;

  const generatePreview = useCallback(async () => {
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(file, maxWidth, maxHeight, quality);
      setCompressedSize(compressed.size);
      const url = URL.createObjectURL(compressed);
      setPreview(url);
    } catch {
      // fallback
    } finally {
      setCompressing(false);
    }
  }, [file, quality, maxWidth, maxHeight]);

  useEffect(() => {
    if (open && file) generatePreview();
  }, [open, file, generatePreview]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleConfirm = async () => {
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(file, maxWidth, maxHeight, quality);
      onConfirm(compressed, {
        originalSize: file.size,
        compressedSize: compressed.size,
      });
    } finally {
      setCompressing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compress Image</DialogTitle>
        </DialogHeader>

        {preview && (
          <img src={preview} alt="Preview" className="w-full max-h-64 object-contain rounded border" />
        )}

        <div className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Original: {file ? formatSize(file.size) : '-'}</span>
            <span>Compressed: {formatSize(compressedSize)}</span>
          </div>

          <div>
            <Label className="text-sm">Quality: {Math.round(quality * 100)}%</Label>
            <Slider
              value={[quality * 100]}
              onValueChange={([v]) => setQuality(v / 100)}
              min={10}
              max={100}
              step={5}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={compressing}>
            {compressing ? "Compressing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
