const LOCAL_API_DOMAIN = "http://localhost:5050";
const PRODUCTION_API_DOMAIN = "https://your-render-server.onrender.com";
// Prefer Vercel/Env configuration if provided
const ENV_API_DOMAIN = (import.meta as any)?.env?.VITE_API_DOMAIN as
  | string
  | undefined;

const resolveApiDomain = () => {
  // If provided via env (e.g., Vercel), always prefer it
  if (ENV_API_DOMAIN && typeof ENV_API_DOMAIN === "string" && ENV_API_DOMAIN.trim()) {
    return ENV_API_DOMAIN.trim();
  }

  if (typeof window === "undefined") {
    return PRODUCTION_API_DOMAIN;
  }

  const hostname = window.location.hostname;
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local");

  return isLocalhost ? LOCAL_API_DOMAIN : PRODUCTION_API_DOMAIN;
};

export const API_DOMAIN = resolveApiDomain();

export const createApiUrl = (path: string) => {
  // Guarantee the final URL contains exactly one slash between domain and path.
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_DOMAIN}${cleanPath}`;
};
