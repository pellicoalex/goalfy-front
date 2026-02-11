const PRELOADER_KEY = "goalfy.preloader.shown.v1";

export function shouldShowPreloaderOnce(): boolean {
  try {
    return localStorage.getItem(PRELOADER_KEY) !== "1";
  } catch {
    return true;
  }
}

export function markPreloaderShown() {
  try {
    localStorage.setItem(PRELOADER_KEY, "1");
  } catch {}
}
