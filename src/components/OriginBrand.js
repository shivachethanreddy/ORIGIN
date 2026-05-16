import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const DOT_PATTERN = [
  [0, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [0, 1, 1, 1, 0]
];

export function DottedLogo({ size = "md", animate = false }) {
  const dotClass = size === "lg" ? "h-2.5 w-2.5" : "h-1.5 w-1.5";
  const gapClass = size === "lg" ? "gap-2" : "gap-1.5";
  let index = 0;

  return (
    <motion.div layout className={`grid grid-cols-5 ${gapClass}`} aria-hidden="true">
      {DOT_PATTERN.flat().map((active, cellIndex) => {
        if (!active) {
          return <span key={cellIndex} className={dotClass} />;
        }

        const order = index;
        index += 1;

        return (
          <motion.span
            key={cellIndex}
            className={`${dotClass} rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.45)]`}
            initial={animate ? { opacity: 0, scale: 0 } : false}
            animate={animate ? { opacity: 1, scale: 1 } : false}
            transition={{
              duration: 0.32,
              delay: animate ? 0.05 + order * 0.055 : 0,
              ease: "easeOut"
            }}
          />
        );
      })}
    </motion.div>
  );
}

export function OriginSplash({ onFinish }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setExiting(true), 2400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050711]"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.55, ease: "easeInOut" }}
      onAnimationComplete={() => {
        if (exiting) onFinish();
      }}
    >
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <DottedLogo size="lg" animate />

        <motion.p
          className="text-sm font-semibold uppercase tracking-[0.42em] text-white/95 sm:text-base"
          initial={{ opacity: 0, y: 10, letterSpacing: "0.62em" }}
          animate={{ opacity: 1, y: 0, letterSpacing: "0.42em" }}
          transition={{ duration: 0.55, delay: 0.72, ease: "easeOut" }}
        >
          ORIGIN
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

export default function OriginBrand() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-8 flex items-center gap-3.5"
    >
      <DottedLogo />
      <span className="text-xs font-semibold uppercase tracking-[0.38em] text-white/90 sm:text-sm">
        ORIGIN
      </span>
    </motion.div>
  );
}
