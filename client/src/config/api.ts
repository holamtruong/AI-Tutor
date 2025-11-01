const LOCAL_API_DOMAIN = "http://localhost:5050";
const PRODUCTION_API_DOMAIN = "https://your-render-server.onrender.com";

const resolveApiDomain = () => {
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
