"use client";

import { useEffect, useRef, useState } from "react";

export function useIsMobile(breakpoint = 920) {
  const [mobile, setMobile] = useState(false);
  const mqlRef = useRef<MediaQueryList | null>(null);
  useEffect(() => {
    mqlRef.current = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setMobile(mqlRef.current.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mqlRef.current.addEventListener("change", handler);
    return () => mqlRef.current?.removeEventListener("change", handler);
  }, [breakpoint]);
  return mobile;
}
