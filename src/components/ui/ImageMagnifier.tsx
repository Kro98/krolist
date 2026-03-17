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
  const [position, setPosition] = useState<{ top: number; left: number; side: 'right' | 'left' }>({ top: 0, left: 0, side: 'right' });
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = useCallback(() => {
    if (!enabled || !containerRef.current) return;
    timeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const popupSize = 320;
      const gap = 12;

      // Show popup to the right if space, otherwise left
      const spaceRight = viewportWidth - rect.right;
      const side = spaceRight >= popupSize + gap ? 'right' : 'left';
      const left = side === 'right' ? rect.right + gap : rect.left - popupSize - gap;
      const top = Math.max(8, rect.top + rect.height / 2 - popupSize / 2);

      setPosition({ top, left, side });
      setShow(true);
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

      {show && src && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            left: position.left,
            top: position.top,
            width: 320,
            height: 320,
          }}
        >
          <img
            src={src}
            alt={alt || "Full size preview"}
            className="w-full h-full object-contain bg-background shadow-2xl shadow-black/30 rounded-xl border border-border/50"
            draggable={false}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
