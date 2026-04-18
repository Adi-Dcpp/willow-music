import { motion } from "framer-motion";

export default function AnimatedSection({ children, delay = 0, className = "" }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, ease: "easeInOut", delay }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
