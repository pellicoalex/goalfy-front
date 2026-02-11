export function initTheme() {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem("theme");
  const systemDark =
    window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;

  const shouldDark = stored ? stored === "dark" : systemDark;
  document.documentElement.classList.toggle("dark", shouldDark);
}
