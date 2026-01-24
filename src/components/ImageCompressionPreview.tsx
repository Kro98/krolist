import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, ZoomIn, ZoomOut } from "lucide-react";
import { compressImage, formatFileSize } from "@/lib/imageCompression";

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
  defaultSettings?: CompressionSettings;
}

const DEFAULT_SETTINGS: CompressionSettings = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 85,
};

export function ImageCompressionPreview({
  file,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  defaultSettings = DEFAULT_SETTINGS,
}: ImageCompressionPreviewProps) {
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [compressedPreview, setCompressedPreview] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [compressedDimensions, setCompressedDimensions] = useState({ width: 0, height: 0 });
  const [settings, setSettings] = useState<CompressionSettings>(defaultSettings);
  const [zoom, setZoom] = useState(false);

  // Reset when file changes
  useEffect(() => {
    if (file) {
      setOriginalSize(file.size);
      setSettings(defaultSettings);
      
      // Create original preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setOriginalPreview(dataUrl);
        
        // Get original dimensions
        const img = new Image();
        img.onload = () => {
          setOriginalDimensions({ width: img.width, height: img.height });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  }, [file, defaultSettings]);

  // Recompress when settings change
  useEffect(() => {
    if (file && open) {
      compressWithSettings();
    }
  }, [file, settings, open]);

  const compressWithSettings = async () => {
    if (!file) return;
    
    setIsCompressing(true);
    try {
      const blob = await compressImage(
        file,
        settings.maxWidth,
        settings.maxHeight,
        settings.quality / 100
      );
      
      setCompressedBlob(blob);
      setCompressedSize(blob.size);
      
      // Create compressed preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setCompressedPreview(dataUrl);
        
        // Get compressed dimensions
        const img = new Image();
        img.onload = () => {
          setCompressedDimensions({ width: img.width, height: img.height });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Compression error:', error);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleConfirm = () => {
    if (compressedBlob) {
      onConfirm(compressedBlob, { originalSize, compressedSize });
    }
  };

  const savedPercent = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0;
  const isLarger = compressedSize > originalSize;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Image Compression Preview
            {isCompressing && <Loader2 className="h-4 w-4 animate-spin" />}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Compression Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm">Max Width: {settings.maxWidth}px</Label>
              <Slider
                value={[settings.maxWidth]}
                onValueChange={([value]) => setSettings(s => ({ ...s, maxWidth: value }))}
                min={400}
                max={2000}
                step={100}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Max Height: {settings.maxHeight}px</Label>
              <Slider
                value={[settings.maxHeight]}
                onValueChange={([value]) => setSettings(s => ({ ...s, maxHeight: value }))}
                min={400}
                max={2000}
                step={100}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Quality: {settings.quality}%</Label>
              <Slider
                value={[settings.quality]}
                onValueChange={([value]) => setSettings(s => ({ ...s, quality: value }))}
                min={10}
                max={100}
                step={5}
              />
            </div>
          </div>

          {/* Side by Side Preview */}
          <div className="grid grid-cols-2 gap-4">
            {/* Original */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Original</Label>
                <Badge variant="outline" className="font-mono">
                  {formatFileSize(originalSize)}
                </Badge>
              </div>
              <div 
                className={`relative aspect-square bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/30 ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                onClick={() => setZoom(!zoom)}
              >
                {originalPreview ? (
                  <img
                    src={originalPreview}
                    alt="Original"
                    className={`w-full h-full transition-transform duration-200 ${zoom ? 'object-contain scale-150' : 'object-contain'}`}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {originalDimensions.width} × {originalDimensions.height}px
              </p>
            </div>

            {/* Compressed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Compressed</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {formatFileSize(compressedSize)}
                  </Badge>
                  {!isCompressing && (
                    <Badge 
                      variant={isLarger ? "destructive" : "default"}
                      className={isLarger ? "" : "bg-green-500"}
                    >
                      {isLarger ? `+${Math.abs(savedPercent)}%` : `-${savedPercent}%`}
                    </Badge>
                  )}
                </div>
              </div>
              <div 
                className={`relative aspect-square bg-muted rounded-lg overflow-hidden border-2 ${isLarger ? 'border-destructive/50' : 'border-green-500/50'} ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                onClick={() => setZoom(!zoom)}
              >
                {isCompressing ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : compressedPreview ? (
                  <img
                    src={compressedPreview}
                    alt="Compressed"
                    className={`w-full h-full transition-transform duration-200 ${zoom ? 'object-contain scale-150' : 'object-contain'}`}
                  />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {compressedDimensions.width} × {compressedDimensions.height}px
              </p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="flex items-center justify-center gap-6 p-3 bg-muted/30 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Size Reduction</p>
              <p className={`text-lg font-bold ${isLarger ? 'text-destructive' : 'text-green-500'}`}>
                {isLarger ? `+${Math.abs(savedPercent)}%` : `-${savedPercent}%`}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Saved</p>
              <p className="text-lg font-bold">
                {formatFileSize(Math.abs(originalSize - compressedSize))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Dimensions</p>
              <p className="text-lg font-bold">
                {compressedDimensions.width}×{compressedDimensions.height}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            💡 Click on images to zoom in/out. Adjust sliders to find the best balance between quality and file size.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isCompressing || !compressedBlob}>
            {isCompressing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Upload Compressed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
