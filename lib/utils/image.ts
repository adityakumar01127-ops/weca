/**
 * Helper to ensure image URLs are served cleanly and reliably across all browsers.
 * Proxies remote CDN URLs through a same-origin endpoint to prevent Safari ITP/CORS issues.
 */
export function getSafeImageUrl(path: string | undefined | null): string {
  if (!path) return "/anom-1.jpg";

  // Already local, relative, or blob
  if (path.startsWith("/") || path.startsWith("blob:")) {
    return path;
  }

  // Data URLs can be rendered directly or proxied
  if (path.startsWith("data:")) {
    return path;
  }

  // Remote Supabase or CDN URLs: proxy through same-origin endpoint
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return `/api/image-proxy?url=${encodeURIComponent(path)}`;
  }

  return path;
}
