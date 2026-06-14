export type ThemeId =
  | "obsidian" | "neige" | "dune"
  | "oceane" | "minuit" | "foret"
  | "cendre" | "aurore";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  isDark: boolean;
  preview: string[]; // 3 couleurs pour l'aperçu visuel
  vars: {
    surface: string;
    surface1: string;
    surface2: string;
    surface3: string;
    border: string;
    borderAccent: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    colorScheme: "dark" | "light";
  };
}

export const THEMES: ThemeConfig[] = [
  {
    id: "obsidian",
    name: "Obsidian",
    isDark: true,
    preview: ["#0D1117", "#161B22", "#1C2128"],
    vars: {
      surface: "#0D1117",
      surface1: "#161B22",
      surface2: "#1C2128",
      surface3: "#252B34",
      border: "rgba(255,255,255,0.06)",
      borderAccent: "rgba(232,150,12,0.3)",
      textPrimary: "#F0F6FC",
      textSecondary: "#8B949E",
      textMuted: "#484F58",
      colorScheme: "dark",
    },
  },
  {
    id: "neige",
    name: "Neige",
    isDark: false,
    preview: ["#F6F8FA", "#FFFFFF", "#EAEEF2"],
    vars: {
      surface: "#F6F8FA",
      surface1: "#FFFFFF",
      surface2: "#EAEEF2",
      surface3: "#D8DEE4",
      border: "rgba(0,0,0,0.08)",
      borderAccent: "rgba(232,150,12,0.4)",
      textPrimary: "#1C2128",
      textSecondary: "#57606A",
      textMuted: "#8C959F",
      colorScheme: "light",
    },
  },
  {
    id: "dune",
    name: "Dune",
    isDark: false,
    preview: ["#FAF5EB", "#FFFDF5", "#F0E8D0"],
    vars: {
      surface: "#FAF5EB",
      surface1: "#FFFDF5",
      surface2: "#F0E8D0",
      surface3: "#E4D8B8",
      border: "rgba(140,100,40,0.12)",
      borderAccent: "rgba(232,150,12,0.4)",
      textPrimary: "#2A1F08",
      textSecondary: "#7A6030",
      textMuted: "#B09050",
      colorScheme: "light",
    },
  },
  {
    id: "oceane",
    name: "Océane",
    isDark: true,
    preview: ["#071828", "#0D2540", "#143358"],
    vars: {
      surface: "#071828",
      surface1: "#0D2540",
      surface2: "#143358",
      surface3: "#1C4472",
      border: "rgba(56,140,220,0.12)",
      borderAccent: "rgba(232,150,12,0.3)",
      textPrimary: "#E0F0FF",
      textSecondary: "#5A98CC",
      textMuted: "#2E5E8A",
      colorScheme: "dark",
    },
  },
  {
    id: "minuit",
    name: "Minuit",
    isDark: true,
    preview: ["#07050F", "#110A20", "#1A1035"],
    vars: {
      surface: "#07050F",
      surface1: "#110A20",
      surface2: "#1A1035",
      surface3: "#24184A",
      border: "rgba(130,80,230,0.12)",
      borderAccent: "rgba(232,150,12,0.3)",
      textPrimary: "#EDE5FF",
      textSecondary: "#8060CC",
      textMuted: "#4A3080",
      colorScheme: "dark",
    },
  },
  {
    id: "foret",
    name: "Forêt",
    isDark: true,
    preview: ["#081510", "#0F2018", "#163028"],
    vars: {
      surface: "#081510",
      surface1: "#0F2018",
      surface2: "#163028",
      surface3: "#1E4035",
      border: "rgba(40,160,80,0.1)",
      borderAccent: "rgba(232,150,12,0.3)",
      textPrimary: "#E0F8E8",
      textSecondary: "#50A868",
      textMuted: "#286840",
      colorScheme: "dark",
    },
  },
  {
    id: "cendre",
    name: "Cendre",
    isDark: true,
    preview: ["#17171A", "#222226", "#2E2E34"],
    vars: {
      surface: "#17171A",
      surface1: "#222226",
      surface2: "#2E2E34",
      surface3: "#3C3C44",
      border: "rgba(200,200,220,0.07)",
      borderAccent: "rgba(232,150,12,0.3)",
      textPrimary: "#F2F2F5",
      textSecondary: "#9090A0",
      textMuted: "#505060",
      colorScheme: "dark",
    },
  },
  {
    id: "aurore",
    name: "Aurore",
    isDark: true,
    preview: ["#150A08", "#221008", "#330C08"],
    vars: {
      surface: "#150A08",
      surface1: "#221008",
      surface2: "#330C08",
      surface3: "#481008",
      border: "rgba(220,60,40,0.12)",
      borderAccent: "rgba(232,150,12,0.3)",
      textPrimary: "#FFF0EC",
      textSecondary: "#CC6050",
      textMuted: "#803030",
      colorScheme: "dark",
    },
  },
];

export function applyTheme(themeId: ThemeId, accentColor: string) {
  if (typeof document === "undefined") return;
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  const v = theme.vars;

  root.style.setProperty("--surface", v.surface);
  root.style.setProperty("--surface-1", v.surface1);
  root.style.setProperty("--surface-2", v.surface2);
  root.style.setProperty("--surface-3", v.surface3);
  root.style.setProperty("--border", v.border);
  root.style.setProperty("--text-primary", v.textPrimary);
  root.style.setProperty("--text-secondary", v.textSecondary);
  root.style.setProperty("--text-muted", v.textMuted);
  root.style.setProperty("color-scheme", v.colorScheme);

  if (theme.isDark) {
    root.classList.remove("light");
  } else {
    root.classList.add("light");
  }

  if (/^#[0-9a-fA-F]{6}$/.test(accentColor)) {
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);
    const clamp = (v: number) => Math.min(255, Math.max(0, v));
    const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
    const light = `#${toHex(r + 14)}${toHex(g + 12)}${toHex(b + 12)}`;
    const dim   = `#${toHex(r - 14)}${toHex(g - 14)}${toHex(b - 14)}`;
    root.style.setProperty("--amber", accentColor);
    root.style.setProperty("--amber-light", light);
    root.style.setProperty("--amber-dim", dim);
    root.style.setProperty("--border-accent", `rgba(${r},${g},${b},0.3)`);
    root.style.setProperty("--shadow-amber",
      `0 0 0 1px rgba(${r},${g},${b},0.2), 0 8px 32px rgba(${r},${g},${b},0.08)`);
  }
}
