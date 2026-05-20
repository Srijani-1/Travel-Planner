import { Sun, Moon, Heart } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "../contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`relative w-20 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 border-0 flex items-center ${
        theme === "light"
          ? "bg-gradient-to-r from-amber-400 to-orange-500"
          : theme === "pink"
          ? "bg-gradient-to-r from-pink-400 to-rose-500"
          : "bg-gradient-to-r from-slate-700 to-slate-900"
      }`}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
        animate={{
          x: theme === "dark" ? 48 : theme === "pink" ? 24 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      >
        {theme === "light" && <Sun className="h-3.5 w-3.5 text-amber-500 fill-amber-100" />}
        {theme === "pink" && <Heart className="h-3.5 w-3.5 text-pink-500 fill-pink-500" />}
        {theme === "dark" && <Moon className="h-3.5 w-3.5 text-slate-700 fill-slate-700" />}
      </motion.div>
    </motion.button>
  );
}
