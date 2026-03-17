import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ImageMagnifierProps {
  src: string;
  alt?: string;
  className?: string;
  children: React.ReactNode;
  enabled?: boolean;
}

export function ImageMagnifier({ src, alt, className, children, enabled = true }: ImageMagnifierProps) {
  const [show, setShow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = useCallback(() => {
    if (!enabled) return;
    timeoutRef.current = setTimeout(() => setShow(true), 200);
  }, [enabled]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setShow(false);
  }, []);

  if (!enabled) return <>{children}</>;

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {show && src && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            width: '200%',
            height: '200%',
          }}
        >
          <img
            src={src}
            alt={alt || "Magnified view"}
            className="w-full h-full object-contain bg-background/95 backdrop-blur-sm shadow-2xl shadow-black/30 rounded-lg"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
