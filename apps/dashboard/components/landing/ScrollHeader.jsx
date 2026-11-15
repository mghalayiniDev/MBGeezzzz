"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fixed header that marks itself `data-scrolled="true"` once the page scrolls, so the navbar
 * inside can switch from transparent (over the hero) to solid (group-data variants).
 * Uses an IntersectionObserver on a tiny marker at the top of the page instead of a scroll
 * listener, so nothing runs while scrolling.
 */
export function ScrollHeader({ children }) {
  const markerRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return undefined;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(marker);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Scrolling past this 16px marker switches the navbar to its solid style */}
      <div ref={markerRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-4" />
      <header data-scrolled={scrolled ? "true" : "false"} className="group fixed inset-x-0 top-0 z-50">
        {children}
      </header>
    </>
  );
}
