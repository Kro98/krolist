import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const [rect, setRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = useCallback(() => {
    if (!enabled || !containerRef.current) return;
    timeoutRef.current = setTimeout(() => {
      if (containerRef.current) {
        setRect(containerRef.current.getBoundingClientRect());
        setShow(true);
      }
    }, 200);
  }, [enabled]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setShow(false);
  }, []);

  if (!enabled) return <div className={className}>{children}</div>;

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {show && src && rect && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            left: rect.left + rect.width / 2,
            top: rect.top + rect.height / 2,
            width: rect.width * 2,
            height: rect.height * 2,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <img
            src={src}
            alt={alt || "Magnified view"}
            className="w-full h-full object-contain bg-background/95 backdrop-blur-sm shadow-2xl shadow-black/30 rounded-lg"
            draggable={false}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
