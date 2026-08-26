import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

type GradientBarsProps = {
  bars?: number;
  colors?: string[];
};

/**
 * Adaptation compacte de Gradient Bars : une texture de fond, jamais une
 * animation décorative prioritaire. Le hero evergreen reste son fallback.
 */
export function GradientBars({
  bars = 9,
  colors = ["rgba(149, 181, 100, 0.2)", "rgba(68, 98, 70, 0.08)", "transparent"],
}: GradientBarsProps) {
  const reduceMotion = useAccessibleReducedMotion();
  const gradientStyle = `linear-gradient(to top, ${colors.join(", ")})`;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[-1] overflow-hidden" data-motion="gradient-bars">
      <div className="flex size-full" data-animated={!reduceMotion || undefined}>
        {Array.from({ length: bars }).map((_, index) => {
          const position = bars > 1 ? index / (bars - 1) : 0.5;
          const distanceFromCenter = Math.abs(position - 0.5);
          const restingScale = 0.4 + 0.46 * Math.pow(distanceFromCenter * 2, 1.12);

          return (
            <motion.div
              animate={reduceMotion ? undefined : { opacity: [0.55, 0.72, 0.55], scaleY: [restingScale, restingScale + 0.075, restingScale] }}
              aria-hidden="true"
              className="h-full flex-1 origin-bottom"
              data-gradient-bar="easystor"
              key={`gradient-bar-${index}`}
              style={{ background: gradientStyle, opacity: 0.55, transform: `scaleY(${restingScale})` }}
              transition={{ delay: index * 0.16, duration: 5.4, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
            />
          );
        })}
      </div>
    </div>
  );
}

function useAccessibleReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(() => {
    return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  });

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;

    const updatePreference = () => setReduceMotion(query.matches);
    updatePreference();
    query.addEventListener?.("change", updatePreference);
    return () => query.removeEventListener?.("change", updatePreference);
  }, []);

  return reduceMotion;
}
