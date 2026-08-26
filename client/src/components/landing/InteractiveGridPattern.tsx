import React, { useId, useState, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

type GridCell = { x: number; y: number } | null;

interface InteractiveGridPatternProps {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Motif SVG décoratif inspiré du composant Interactive Grid Pattern.
 * La grille ne capte les interactions que dans les zones vides du hero,
 * tandis que le contenu et les CTA conservent leur comportement normal.
 */
export function InteractiveGridPattern({ className, width = 28, height = 28 }: InteractiveGridPatternProps) {
  const patternId = useId().replace(/:/g, "");
  const [activeCell, setActiveCell] = useState<GridCell>(null);

  const updateCell = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "touch") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    setActiveCell({
      x: Math.floor((event.clientX - bounds.left) / width) * width,
      y: Math.floor((event.clientY - bounds.top) / height) * height,
    });
  };

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-auto absolute inset-0 z-0 size-full text-[#b8d68a] opacity-80 [mask-image:radial-gradient(560px_circle_at_center,black,transparent)]",
        className,
      )}
      data-interactive-grid="easystor"
      height="100%"
      onPointerLeave={() => setActiveCell(null)}
      onPointerMove={updateCell}
      role="presentation"
      width="100%"
    >
      <defs>
        <pattern height={height} id={patternId} patternUnits="userSpaceOnUse" width={width}>
          <path d={`M ${width} 0 L 0 0 0 ${height}`} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
        </pattern>
      </defs>
      <rect fill={`url(#${patternId})`} height="100%" width="100%" />
      <rect
        className="motion-reduce:transition-none"
        data-interactive-grid-active="easystor"
        fill="currentColor"
        fillOpacity={activeCell ? "0.23" : "0"}
        height={height - 2}
        opacity={activeCell ? "1" : "0"}
        rx="3"
        style={{ transition: "opacity 150ms ease-out, fill-opacity 150ms ease-out" }}
        width={width - 2}
        x={activeCell?.x ?? 0}
        y={activeCell?.y ?? 0}
      />
    </svg>
  );
}
