import { useEffect } from "react";

export const ROUTE_TITLES: Record<string, string> = {
  "/": "Home — Soil Pollution Awareness",
  "/survey": "Survey — Farmer & Community Assessment",
  "/dashboard": "Dashboard — Analytics & Monitoring",
  "/experiment": "Experiment — Soil Transport Engine",
  "/map": "Map & Satellite — Contamination Heatmap",
  "/story": "Story — Field Case Studies & Evidence",
  "/sources": "Sources — Scientific Standards & Evidence",
};

export function getPageTitle(pathname: string, customTitle?: string): string {
  if (customTitle && customTitle.trim().length > 0) {
    return `${customTitle.trim()} | SoilTrace`;
  }

  const matched = ROUTE_TITLES[pathname];
  if (matched) {
    return `${matched} | SoilTrace`;
  }

  // Fallback for sub-routes or query params
  const segment = pathname.replace(/^\//, "").split("/")[0];
  if (segment) {
    const formatted = segment.charAt(0).toUpperCase() + segment.slice(1);
    return `${formatted} | SoilTrace`;
  }

  return "Home — Soil Pollution Awareness | SoilTrace";
}

export function useDocumentTitle(title?: string, pathname?: string) {
  useEffect(() => {
    const resolvedPath = pathname || (typeof window !== "undefined" ? window.location.pathname : "/");
    document.title = getPageTitle(resolvedPath, title);
  }, [title, pathname]);
}
