import { motion } from "framer-motion";
import GlassCard from "./GlassCard";
import GlowButton from "./GlowButton";

export function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <GlassCard className="p-5 text-center" hover={false}>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-white/70">{message}</p>
      {onRetry ? (
        <GlowButton className="mt-4" onClick={onRetry}>
          Try again
        </GlowButton>
      ) : null}
    </GlassCard>
  );
}

export function EmptyState({ title = "Nothing here yet", message }) {
  return (
    <GlassCard className="p-5 text-center" hover={false}>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-white/70">{message}</p>
    </GlassCard>
  );
}

export function InlineLoader({ text = "Loading..." }) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center text-sm text-white/80 backdrop-blur-xl"
    >
      {text}
    </motion.div>
  );
}
