import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface Colors {
  bg: string;
  surface: string;
  border: string;
  borderHover: string;
  amber: string;
  orange: string;
  grad: string;
  muted: string;
  text: string;
  textFaint: string;
  navBg: string;
}

export const DARK_C: Colors = {
  bg: "#08090e",
  surface: "#0f1118",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(245,158,11,0.28)",
  amber: "#f59e0b",
  orange: "#ea580c",
  grad: "linear-gradient(135deg,#f59e0b,#ea580c)",
  muted: "rgba(255,255,255,0.45)",
  text: "#ffffff",
  textFaint: "rgba(255,255,255,0.22)",
  navBg: "rgba(8,9,14,0.82)",
};

export const LIGHT_C: Colors = {
  bg: "#f0f2f7",
  surface: "#ffffff",
  border: "rgba(0,0,0,0.08)",
  borderHover: "rgba(217,119,6,0.35)",
  amber: "#d97706",
  orange: "#c2410c",
  grad: "linear-gradient(135deg,#d97706,#c2410c)",
  muted: "rgba(0,0,0,0.5)",
  text: "#0f1118",
  textFaint: "rgba(0,0,0,0.22)",
  navBg: "rgba(240,242,247,0.9)",
};

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  colors: Colors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
  colors: DARK_C,
  isDark: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const s = localStorage.getItem("spotter_theme");
      return s === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    localStorage.setItem("spotter_theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const colors = theme === "dark" ? DARK_C : LIGHT_C;

  return (
    <ThemeContext.Provider
      value={{ theme, toggle, colors, isDark: theme === "dark" }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
