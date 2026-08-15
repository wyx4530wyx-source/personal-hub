"use client";
import { motion } from "framer-motion";
export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return <motion.div className="scroll-reveal" initial={{ opacity: 1, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "35% 0px" }} transition={{ duration: .72, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}
