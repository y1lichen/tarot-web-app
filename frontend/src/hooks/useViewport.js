import { useEffect, useState } from "react";
export function useViewport() {
  const [size, setSize] = useState(() => ({
    width: innerWidth,
    height: innerHeight,
  }));
  useEffect(() => {
    const resize = () => setSize({ width: innerWidth, height: innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  return size;
}
