import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

function AnimatedHeroStats() {
  const [statIndex, setStatIndex] = useState(0);
  const stats = useMemo(
    () => ["90x Faster", "3-in-1 Platform", "$22B Market", "AI-Powered", "Self-Learning"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (statIndex === stats.length - 1) {
        setStatIndex(0);
      } else {
        setStatIndex(statIndex + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [statIndex, stats]);

  return (
    <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
      &nbsp;
      {stats.map((stat, index) => (
        <motion.span
          key={index}
          className="absolute font-semibold"
          initial={{ opacity: 0, y: "-100" }}
          transition={{ type: "spring", stiffness: 50 }}
          animate={
            statIndex === index
              ? {
                  y: 0,
                  opacity: 1,
                }
              : {
                  y: statIndex > index ? -150 : 150,
                  opacity: 0,
                }
          }
        >
          {stat}
        </motion.span>
      ))}
    </span>
  );
}

export { AnimatedHeroStats };
