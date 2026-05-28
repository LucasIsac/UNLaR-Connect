"use client";

import { useEffect } from "react";
import { ReactLenis, useLenis } from "lenis/react";

function LenisResizeObserver() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    // Trigger initial resize in case layout completed before mounting
    lenis.resize();

    // Observe body size changes (e.g. dynamic component loads, client-side renders)
    const resizeObserver = new ResizeObserver(() => {
      lenis.resize();
    });

    if (document.body) {
      resizeObserver.observe(document.body);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [lenis]);

  return null;
}

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        touchMultiplier: 2,
      }}
    >
      <LenisResizeObserver />
      {children}
    </ReactLenis>
  );
}
