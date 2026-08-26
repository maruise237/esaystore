import React, { type ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";

type FadeContentProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "right" | "left";
};

/**
 * Révélation légère au défilement. L’API suit l’intention de Fade Content
 * de React Bits, tout en réutilisant Framer Motion déjà présent dans le bundle.
 */
export function FadeContent({ children, className, delay = 0, direction = "up" }: FadeContentProps) {
  const reduceMotion = useAccessibleReducedMotion();
  const canObserveViewport = typeof window !== "undefined" && "IntersectionObserver" in window;
  const revealOnScroll = !reduceMotion && canObserveViewport;
  const offset = direction === "left" ? -22 : direction === "right" ? 22 : 18;
  const hidden = direction === "up" ? { opacity: 0, y: offset, filter: "blur(5px)" } : { opacity: 0, x: offset, filter: "blur(5px)" };
  const visible = { opacity: 1, x: 0, y: 0, filter: "blur(0px)" };

  return (
    <motion.div
      className={className}
      data-motion="fade-content"
      initial={revealOnScroll ? hidden : false}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, amount: 0.22, margin: "0px 0px -44px 0px" }}
      whileInView={revealOnScroll ? visible : undefined}
    >
      {children}
    </motion.div>
  );
}

type HeroMotionProps = {
  children: ReactNode;
  className?: string;
};

/** Une seule entrée de scène pour la preuve produit du hero. */
export function HeroMotion({ children, className }: HeroMotionProps) {
  const reduceMotion = useAccessibleReducedMotion();

  return (
    <motion.div
      className={className}
      data-motion="hero-product-proof"
      initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.985, filter: "blur(7px)" }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
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
