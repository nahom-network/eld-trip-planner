import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../stores/themeStore";

export default function ThemeToggle({
  className = "",
}: {
  className?: string;
}) {
  const { isDark, toggle, colors } = useTheme();

  return (
    <motion.button
      onClick={toggle}
      className={`relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden shrink-0 ${className}`}
      style={{
        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
        border: `1px solid ${colors.border}`,
        cursor: "pointer",
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "moon" : "sun"}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {isDark ? (
            <Moon className="w-4 h-4" style={{ color: colors.amber }} />
          ) : (
            <Sun className="w-4 h-4" style={{ color: colors.amber }} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
