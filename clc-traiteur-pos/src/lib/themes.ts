export type ThemeId =
  | "nuit" | "clair" | "ardoise" | "foret"
  | "ivoire" | "minuit" | "charbon" | "craie"
  | "aubergine" | "sable" | "glacier" | "carbone"
  | "creme" | "cosmos" | "bordeaux" | "zinc";

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
    borderAccent: string; // sera remplacé dynamiquement par l'accent
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    colorScheme: "dark" | "light";
  };
}

export const THEMES: ThemeConfig[] = [
  {
    id: "nuit",
    name: "Nuit",
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
    id: "clair",
    name: "Clair",
    isDark: false,
    preview: ["#F6F8FA", "#FFFFFF", "#F0F2F5"],
    vars: {
      surface: "#F6F8FA",
      surface1: "#FFFFFF",
      surface2: "#F0F2F5",
      surface3: "#E4E7EC",
      border: "rgba(0,0,0,0.08)",
      borderAccent: "rgba(232,150,12,0.4)",
      textPrimary: "#1A1E24",
      textSecondary: "#57606A",
      textMuted: "#8C959F",
      colorScheme: "light",
    },
  },
  {
    id: "ardoise",
    name: "Ardoise",
    isDark: true,
    preview: ["#0F1923", "#182535", "#1E2F42"],
    vars: {
      surface: "#0F1923",
      surface1: "#182535",
      surface2: "#1E2F42",
      surface3: "#263850",
      border: "rgba(99,143,191,0.1)",
      borderAccent: "rgba(232,150,12,0.3)",
      textPrimary: "#E8F0F8",
      textSecondary: "#7A9BBB",
      textMuted: "#4A6580",
      colorScheme: "dark",
    },
  },
  {
    id: "foret",
    name: "Forêt",
    isDark: true,
    preview: ["#0A1410", "#111F18", "#162A20"],
    vars: {
      surface: "#0A1410",
      surface1: "#111F18",
      surface2: "#162A20",
      surface3: "#1D3828",
      border: "rgba(63,185,80,0.08)",
      borderAccent: "rgba(232,150,12,0.3)",
      textPrimary: "#E6F4E8",
      textSecondary: "#6BAF7A",
      textMuted: "#3D7A4A",
      colorScheme: "dark",
    },
  },
  {
    id: "ivoire",
    name: "Ivoire",
    isDark: false,
    preview: ["#FAF8F2", "#FFFFF8", "#F2EFE5"],
    vars: {
      surface: "#FAF8F2",
      surface1: "#FFFFF8",
      surface2: "#F2EFE5",
      surface3: "#E8E4D8",
      border: "rgba(120,100,60,0.1)",
      borderAccent: "rgba(232,150,12,0.4)",
      textPrimary: "#2C2416",
      textSecondary: "#7A6A50",
      textMuted: "#A89A80",
      colorScheme: "light",
    },
  },
  {
    id: "minuit",
    name: "Minuit",
    isDark: true,
    preview: ["#050B18", "#091428", "#0D1E3A"],
    vars: {
      surface: "#050B18",
      surface1: "#091428",
      surface2: "#0D1E3A",
      surface3: "#12294F",
      border: "rgba(58,106,210,0.12)",
      borderAccent: "rgba(232,150,12,0.3)",
      textPrimary: "#E8EFF8",
      textSecondary: "#6B8AAF",
      textMuted: "#3D5A7A",
      colorScheme: "dark",
    },
  },
  {
    id: "charbon",
    name: "Charbon",
    isDark: true,
    preview: ["#141414", "#1E1E1E", "#282828"],
    vars: {
      surface: "#141414",
      surface1: "#1E1E1E",
      surface2: "#282828",
      surface3: "#333333",
      border: "rgba(255,255,255,0.07)",
      borderAccent: "rgba(232,150,12,0.3)",
      textPrimary: "#EFEFEF",
      textSecondary: "#999999",
      textMuted: "#555555",
      colorScheme: "dark",
    },
  },
  {
    id: "craie",
    name: "Craie",
    isDark: false,
    preview: ["#F5F3EF", "#FBFAF8", "#EEEAE3"],
    vars: {
      surface: "#F5F3EF",
      surface1: "#FBFAF8",
      surface2: "#EEEAE3",
      surface3: "#E2DDD4",
      border: "rgba(80,70,50,0.09)",
      borderAccent: "rgba(232,150,12,0.4)",
      textPrimary: "#2A2520",
      textSecondary: "#6E6358",
      textMuted: "#9E9080",
      colorScheme: "light",
    },
  },
  // ── 8 nouveaux thèmes ─────────────────────────────────────────────────
  {
    id: "aubergine",
    name: "Aubergine",
    isDark: true,
    preview: ["#1A0F1F", "#261530", "#31203F"],
    vars: {
      surface: "#1A0F1F",
      surface1: "#261530",
      surface2: "#31203F",
      surface3: "#3E2D50",
      border: "rgba(168,85,247,0.1)",
      borderAccent: "rgba(232,150,12,0.3)",
      textPrimary: "#F0E8F8",
      textSecondary: "#B48FD4",
      textMuted: "#7A5A9A",
      colorScheme: "dark",
    },
  },
  {
    id: "sable",
    name: "Sable",
    isDark: false,
    preview: ["#F2EDE4", "#FBF8F2", "#EAE3D6"],
    vars: {
      surface: "#F2EDE4",
      surface1: "#FBF8F2",
      surface2: "#EAE3D6",
      surface3: "#DDD5C4",
      border: "rgba(120,95,55,0.1)",
      borderAccent: "rgba(232,150,12,0.4)",
      textPrimary: "#28200F",
      textSecondary: "#7A6545",
      textMuted: "#A8916A",
      colorScheme: "light",
    },
  },
  {
    id: "glacier",
    name: "Glacier",
    isDark: false,
    preview: ["#EEF4FA", "#F8FBFF", "#E2EDF6"],
    vars: {
      surface: "#EEF4FA",
      surface1: "#F8FBFF",
      surface2: "#E2EDF6",
      surface3: "#D2E3F0",
      border: "rgba(30,100,180,0.09)",
      borderAccent: "rgba(232,150,12,0.4)",
      textPrimary: "#0F2035",
      textSecondary: "#406080",
      textMuted: "#7A9AB8",
      colorScheme: "light",
    },
  },
  {
    id: "carbone",
    name: "Carbone",
    isDark: true,
    preview: ["#0A0A0A", "#111111", "#1A1A1A"],
    vars: {
      surface: "#0A0A0A",
      surface1: "#111111",
      surface2: "#1A1A1A",
      surface3: "#242424",
      border: "rgba(255,255,255,0.05)",
      borderAccent: "rgba(232,150,12,0.3)",
      textPrimary: "#F5F5F5",
      textSecondary: "#8A8A8A",
      textMuted: "#4A4A4A",
      colorScheme: "dark",
    },
  },
  {
    id: "creme",
    name: "Crème",
    isDark: false,
    preview: ["#FDF9F0", "#FFFEF8", "#F5F0E4"],
    vars: {
      surface: "#FDF9F0",
      surface1: "#FFFEF8",
      surface2: "#F5F0E4",
      surface3: "#EDE6D4",
      border: "rgba(160,130,70,0.1)",
      borderAccent: "rgba(232,150,12,0.4)",
      textPrimary: "#251E0A",
      textSecondary: "#7A6A40",
      textMuted: "#B0A070",
      colorScheme: "light",
    },
  },
  {
    id: "cosmos",
    name: "Cosmos",
    isDark: true,
    preview: ["#07050F", "#0F0A1E", "#17122E"],
    vars: {
      surface: "#07050F",
      surface1: "#0F0A1E",
      surface2: "#17122E",
      surface3: "#20193E",
      border: "rgba(120,80,220,0.1)",
      borderAccent: "rgba(232,150,12,0.3)",
      textPrimary: "#EAE5FF",
      textSecondary: "#8070CC",
      textMuted: "#4A3A80",
      colorScheme: "dark",
    },
  },
  {
    id: "bordeaux",
    name: "Bordeaux",
    isDark: true,
    preview: ["#120508", "#1E0810", "#2A0C18"],
    vars: {
      surface: "#120508",
      surface1: "#1E0810",
      surface2: "#2A0C18",
      surface3: "#381224",
      border: "rgba(220,50,80,0.1)",
      borderAccent: "rgba(232,150,12,0.3)",
      textPrimary: "#F8E8EC",
      textSecondary: "#C07080",
      textMuted: "#7A3848",
      colorScheme: "dark",
    },
  },
  {
    id: "zinc",
    name: "Zinc",
    isDark: true,
    preview: ["#18181B", "#27272A", "#3F3F46"],
    vars: {
      surface: "#18181B",
      surface1: "#27272A",
      surface2: "#3F3F46",
      surface3: "#52525B",
      border: "rgba(255,255,255,0.07)",
      borderAccent: "rgba(232,150,12,0.3)",
      textPrimary: "#FAFAFA",
      textSecondary: "#A1A1AA",
      textMuted: "#71717A",
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

  // Surfaces
  root.style.setProperty("--surface", v.surface);
  root.style.setProperty("--surface-1", v.surface1);
  root.style.setProperty("--surface-2", v.surface2);
  root.style.setProperty("--surface-3", v.surface3);

  // Borders
  root.style.setProperty("--border", v.border);

  // Textes
  root.style.setProperty("--text-primary", v.textPrimary);
  root.style.setProperty("--text-secondary", v.textSecondary);
  root.style.setProperty("--text-muted", v.textMuted);

  // Color scheme (pour le scroll, les scrollbars, etc.)
  root.style.setProperty("color-scheme", v.colorScheme);

  // Appliquer la classe html pour les overrides Tailwind existants
  if (theme.isDark) {
    root.classList.remove("light");
  } else {
    root.classList.add("light");
  }

  // Appliquer la couleur d'accent (toutes les vars --amber)
  if (/^#[0-9a-fA-F]{6}$/.test(accentColor)) {
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);
    const clamp = (v: number) => Math.min(255, Math.max(0, v));
    const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
    const light = `#${toHex(r+14)}${toHex(g+12)}${toHex(b+12)}`;
    const dim   = `#${toHex(r-14)}${toHex(g-14)}${toHex(b-14)}`;

    root.style.setProperty("--amber", accentColor);
    root.style.setProperty("--amber-light", light);
    root.style.setProperty("--amber-dim", dim);
    root.style.setProperty("--border-accent", `rgba(${r},${g},${b},0.3)`);
    root.style.setProperty("--shadow-amber",
      `0 0 0 1px rgba(${r},${g},${b},0.2), 0 8px 32px rgba(${r},${g},${b},0.08)`
    );
  }
}
