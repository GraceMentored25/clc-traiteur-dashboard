"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export default function ThemeApplier() {
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "light") {
      html.classList.add("light");
    } else {
      html.classList.remove("light");
    }
  }, [theme]);

  return null;
}
