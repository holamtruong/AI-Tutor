export const API_DOMAIN =
  import.meta.env.VITE_API_DOMAIN ?? "http://localhost:5283";

export const createApiUrl = (path: string) => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_DOMAIN}${cleanPath}`;
};
