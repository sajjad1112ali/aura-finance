import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}

export function AnimatedNumber({ value, format = (n) => n.toFixed(0), duration = 0.9 }: Props) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <span>{format(display)}</span>;
}
