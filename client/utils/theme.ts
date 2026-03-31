// Theme utility — light mode only

export type Theme = "light";

export function getTheme(): Theme {
  return "light";
}

export function getThemeLabel(): "Light" {
  return "Light";
}

export function initTheme(): Theme {
  const root = document.documentElement;
  root.classList.remove("dark-theme");
  root.classList.add("light-theme");
  root.setAttribute("data-theme", "light");
  return "light";
}

if (typeof window !== "undefined") {
  initTheme();
}
