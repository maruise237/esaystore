import React, { useEffect, useRef, useState } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

const MAX_COLORS = 8;
const EASYSTOR_COLORS = ["#1e2924", "#263a30", "#36513a", "#6f954e"];

type GradientBlindsProps = {
  className?: string;
  gradientColors: string[];
  angle?: number;
  blindCount?: number;
  blindMinWidth?: number;
  mouseDampening?: number;
  spotlightRadius?: number;
  spotlightSoftness?: number;
  spotlightOpacity?: number;
  distortAmount?: number;
  dpr?: number;
};

/** Fond WebGL volontairement discret ; le hero conserve son fond evergreen en fallback. */
export function HeroGradientBlinds() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const canUseWebGL = "WebGLRenderingContext" in window;
    const update = () => setEnabled(canUseWebGL && !reducedMotion?.matches);

    update();
    reducedMotion?.addEventListener?.("change", update);
    return () => reducedMotion?.removeEventListener?.("change", update);
  }, []);

  if (!enabled) return null;

  return (
    <GradientBlinds
      aria-hidden
      blindCount={10}
      blindMinWidth={108}
      className="pointer-events-none absolute inset-0 z-[-1] opacity-55"
      dpr={typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)}
      distortAmount={0.045}
      gradientColors={EASYSTOR_COLORS}
      mouseDampening={0.2}
      spotlightOpacity={0.16}
      spotlightRadius={0.7}
      spotlightSoftness={1.35}
    />
  );
}

function GradientBlinds({
  className,
  dpr = 1,
  gradientColors,
  angle = 0,
  blindCount = 10,
  blindMinWidth = 108,
  mouseDampening = 0.2,
  spotlightRadius = 0.7,
  spotlightSoftness = 1.35,
  spotlightOpacity = 0.16,
  distortAmount = 0.045,
  "aria-hidden": ariaHidden,
}: GradientBlindsProps & { "aria-hidden"?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colorKey = gradientColors.join("|");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, antialias: false, dpr });
    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.style.cssText = "display:block;height:100%;width:100%;";
    container.appendChild(canvas);

    const vertex = `
      attribute vec2 position;
      attribute vec2 uv;
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
    `;
    const fragment = `
      precision mediump float;
      uniform vec3 iResolution;
      uniform vec2 iMouse;
      uniform float iTime;
      uniform float uAngle;
      uniform float uBlindCount;
      uniform float uSpotlightRadius;
      uniform float uSpotlightSoftness;
      uniform float uSpotlightOpacity;
      uniform float uDistort;
      uniform vec3 uColor0;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      varying vec2 vUv;
      vec2 rotate2D(vec2 p, float a) {
        float c = cos(a); float s = sin(a); return mat2(c, -s, s, c) * p;
      }
      vec3 gradient(float t) {
        if (t < 0.33) return mix(uColor0, uColor1, t / 0.33);
        if (t < 0.66) return mix(uColor1, uColor2, (t - 0.33) / 0.33);
        return mix(uColor2, uColor3, (t - 0.66) / 0.34);
      }
      void main() {
        float aspect = iResolution.x / iResolution.y;
        vec2 p = vUv * 2.0 - 1.0; p.x *= aspect;
        vec2 rotated = rotate2D(p, uAngle); rotated.x /= aspect;
        vec2 uv = rotated * 0.5 + 0.5;
        uv.x += sin(uv.y * 5.0 + iTime * 0.08) * 0.01 * uDistort;
        vec3 base = gradient(clamp(uv.x, 0.0, 1.0));
        float stripe = fract(uv.x * max(uBlindCount, 1.0));
        float relief = smoothstep(0.0, 0.62, stripe) * 0.07;
        vec2 cursor = iMouse / iResolution.xy;
        float distanceFromCursor = length(vUv - cursor);
        float spotlight = (1.0 - smoothstep(0.0, uSpotlightRadius, distanceFromCursor)) * uSpotlightOpacity;
        gl_FragColor = vec4(base + relief + vec3(spotlight), 1.0);
      }
    `;

    const colors = prepareColors(gradientColors);
    const uniforms = {
      iResolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight, 1] },
      iMouse: { value: [gl.drawingBufferWidth / 2, gl.drawingBufferHeight / 2] },
      iTime: { value: 0 },
      uAngle: { value: (angle * Math.PI) / 180 },
      uBlindCount: { value: blindCount },
      uSpotlightRadius: { value: spotlightRadius },
      uSpotlightSoftness: { value: spotlightSoftness },
      uSpotlightOpacity: { value: spotlightOpacity },
      uDistort: { value: distortAmount },
      uColor0: { value: colors[0] },
      uColor1: { value: colors[1] },
      uColor2: { value: colors[2] },
      uColor3: { value: colors[3] },
    };
    const program = new Program(gl, { fragment, uniforms, vertex });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    const pointerTarget = [...uniforms.iMouse.value] as [number, number];
    let frame = 0;
    let lastTime = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight, 1];
      uniforms.uBlindCount.value = Math.max(1, Math.min(blindCount, Math.floor(rect.width / blindMinWidth)));
    };
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerTarget[0] = (event.clientX - rect.left) * dpr;
      pointerTarget[1] = (rect.height - (event.clientY - rect.top)) * dpr;
    };
    const render = (time: number) => {
      frame = requestAnimationFrame(render);
      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      const easing = 1 - Math.exp(-delta / mouseDampening);
      uniforms.iMouse.value[0] += (pointerTarget[0] - uniforms.iMouse.value[0]) * easing;
      uniforms.iMouse.value[1] += (pointerTarget[1] - uniforms.iMouse.value[1]) * easing;
      uniforms.iTime.value = time * 0.001;
      renderer.render({ scene: mesh });
    };

    const observer = new ResizeObserver(resize);
    resize();
    observer.observe(container);
    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [angle, blindCount, blindMinWidth, colorKey, dpr, distortAmount, gradientColors, mouseDampening, spotlightOpacity, spotlightRadius, spotlightSoftness]);

  return <div aria-hidden={ariaHidden} className={className} data-gradient-blinds="easystor" ref={containerRef} />;
}

function prepareColors(colors: string[]) {
  const safeColors = colors.slice(0, MAX_COLORS);
  while (safeColors.length < 4) safeColors.push(safeColors.at(-1) ?? "#1e2924");
  return safeColors.slice(0, 4).map(hexToRgb);
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "").padEnd(6, "0");
  return [parseInt(clean.slice(0, 2), 16) / 255, parseInt(clean.slice(2, 4), 16) / 255, parseInt(clean.slice(4, 6), 16) / 255];
}
