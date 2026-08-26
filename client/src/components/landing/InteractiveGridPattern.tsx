import React, { useId, useState, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

type GridCell = { x: number; y: number } | null;

interface InteractiveGridPatternProps {
  className?: string;
  width?: number;
  height?: number;
  squares?: [number, number];
  squaresClassName?: string;
}

/**
 * Motif SVG décoratif inspiré du composant Interactive Grid Pattern.
 * La grille ne capte les interactions que dans les zones vides du hero,
 * tandis que le contenu et les CTA conservent leur comportement normal.
 */
export function InteractiveGridPattern({
  className,
  width = 20,
  height = 20,
  squares = [80, 80],
  squaresClassName,
}: InteractiveGridPatternProps) {
  const patternId = useId().replace(/:/g, "");
  const [activeCell, setActiveCell] = useState<GridCell>(null);

  const updateCell = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "touch") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const x = Math.floor((event.clientX - bounds.left) / width) * width;
    const y = Math.floor((event.clientY - bounds.top) / height) * height;

    if (x >= width * squares[0] || y >= height * squares[1]) return;
    setActiveCell({ x, y });
  };

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-auto absolute inset-0 z-0 size-full text-[#b8d68a] opacity-80 [mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
        className,
      )}
      data-interactive-grid="easystor"
      data-grid-squares={`${squares[0]}x${squares[1]}`}
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
        className={cn(
          "fill-[#d1e980]/[0.28] transition-[fill,opacity] duration-150 ease-out motion-reduce:transition-none",
          activeCell ? "opacity-100" : "opacity-0",
          squaresClassName,
        )}
        data-interactive-grid-active="easystor"
        height={height - 2}
        rx="3"
        width={width - 2}
        x={activeCell?.x ?? 0}
        y={activeCell?.y ?? 0}
      />
    </svg>
  );
}
