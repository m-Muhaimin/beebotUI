import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PulseAnimationProps {
  children: ReactNode;
  className?: string;
}

export default function PulseAnimation({ children, className = "" }: PulseAnimationProps) {
  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
}