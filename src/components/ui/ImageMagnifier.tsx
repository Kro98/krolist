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
  const [position, setPosition] = useState({ x: 0, y: 0 });
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

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!enabled || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [enabled]);

  if (!enabled) return <>{children}</>;

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {children}

      {show && src && (
        <div
          className="fixed z-[100] pointer-events-none animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            left: `${(containerRef.current?.getBoundingClientRect().left ?? 0) + position.x + 16}px`,
            top: `${(containerRef.current?.getBoundingClientRect().top ?? 0) + position.y - 120}px`,
            transform: 'translate(0, -50%)',
          }}
        >
          <div className="w-64 h-64 rounded-full overflow-hidden shadow-2xl shadow-black/40 ring-2 ring-white/20 backdrop-blur-sm">
            <img
              src={src}
              alt={alt || "Magnified view"}
              className="w-full h-full object-contain bg-background/95 p-2"
              draggable={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
