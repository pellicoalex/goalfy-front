import myEnv from "@/lib/env";

export function backendAssetUrl(path?: string | null) {
  if (!path) return undefined;

  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base = myEnv.backendUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
